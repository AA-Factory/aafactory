# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.
import argparse
import logging
import os
os.environ["no_proxy"] = "localhost,127.0.0.1,::1"
import sys
import json
import warnings
from datetime import datetime

import gradio as gr
warnings.filterwarnings('ignore')

import random

import torch
import torch.distributed as dist
from PIL import Image
import subprocess

import wan
from wan.configs import SIZE_CONFIGS, SUPPORTED_SIZES, WAN_CONFIGS
from wan.utils.utils import cache_image, cache_video, str2bool
from wan.utils.multitalk_utils import save_video_ffmpeg
from kokoro import KPipeline
from transformers import Wav2Vec2FeatureExtractor
from src.audio_analysis.wav2vec2 import Wav2Vec2Model

import librosa
import pyloudnorm as pyln
import numpy as np
from einops import rearrange
import soundfile as sf
import re

def _validate_args(args):
    # Basic check
    assert args.ckpt_dir is not None, "Please specify the checkpoint directory."
    assert args.task in WAN_CONFIGS, f"Unsupport task: {args.task}"

    # The default sampling steps are 40 for image-to-video tasks and 50 for text-to-video tasks.
    if args.sample_steps is None:
        args.sample_steps = 40

    if args.sample_shift is None:
        if args.size == 'infinitetalk-480':
            args.sample_shift = 7
        elif args.size == 'infinitetalk-720':
            args.sample_shift = 11
        else:
            raise NotImplementedError(f'Not supported size')

    args.base_seed = args.base_seed if args.base_seed >= 0 else random.randint(
        0, 99999999)
    # Size check
    assert args.size in SUPPORTED_SIZES[
        args.
        task], f"Unsupport size {args.size} for task {args.task}, supported sizes are: {', '.join(SUPPORTED_SIZES[args.task])}"


def _parse_args():
    parser = argparse.ArgumentParser(
        description="Generate a image or video from a text prompt or image using Wan"
    )
    parser.add_argument(
        "--task",
        type=str,
        default="infinitetalk-14B",
        choices=list(WAN_CONFIGS.keys()),
        help="The task to run.")
    parser.add_argument(
        "--size",
        type=str,
        default="infinitetalk-480",
        choices=list(SIZE_CONFIGS.keys()),
        help="The buckget size of the generated video. The aspect ratio of the output video will follow that of the input image."
    )
    parser.add_argument(
        "--frame_num",
        type=int,
        default=81,
        help="How many frames to be generated in one clip. The number should be 4n+1"
    )
    parser.add_argument(
        "--ckpt_dir",
        type=str,
        default='./weights/Wan2.1-I2V-14B-480P',
        help="The path to the Wan checkpoint directory.")
    parser.add_argument(
        "--quant_dir",
        type=str,
        default=None,
        help="The path to the Wan quant checkpoint directory.")
    parser.add_argument(
        "--infinitetalk_dir",
        type=str,
        default='weights/InfiniteTalk/single/infinitetalk.safetensors',
        help="The path to the InfiniteTalk checkpoint directory.")
    parser.add_argument(
        "--wav2vec_dir",
        type=str,
        default='./weights/chinese-wav2vec2-base',
        help="The path to the wav2vec checkpoint directory.")
    parser.add_argument(
        "--dit_path",
        type=str,
        default=None,
        help="The path to the Wan checkpoint directory.")
    parser.add_argument(
        "--lora_dir",
        type=str,
        nargs='+',
        default=None,
        help="The path to the LoRA checkpoint directory.")
    parser.add_argument(
        "--lora_scale",
        type=float,
        nargs='+',
        default=[1.2],
        help="Controls how much to influence the outputs with the LoRA parameters. Accepts multiple float values."
    )
    parser.add_argument(
        "--offload_model",
        type=str2bool,
        default=None,
        help="Whether to offload the model to CPU after each model forward, reducing GPU memory usage."
    )
    parser.add_argument(
        "--ulysses_size",
        type=int,
        default=1,
        help="The size of the ulysses parallelism in DiT.")
    parser.add_argument(
        "--ring_size",
        type=int,
        default=1,
        help="The size of the ring attention parallelism in DiT.")
    parser.add_argument(
        "--t5_fsdp",
        action="store_true",
        default=False,
        help="Whether to use FSDP for T5.")
    parser.add_argument(
        "--t5_cpu",
        action="store_true",
        default=False,
        help="Whether to place T5 model on CPU.")
    parser.add_argument(
        "--dit_fsdp",
        action="store_true",
        default=False,
        help="Whether to use FSDP for DiT.")
    parser.add_argument(
        "--save_file",
        type=str,
        default=None,
        help="The file to save the generated image or video to.")
    parser.add_argument(
        "--audio_save_dir",
        type=str,
        default='save_audio/gradio',
        help="The path to save the audio embedding.")
    parser.add_argument(
        "--base_seed",
        type=int,
        default=42,
        help="The seed to use for generating the image or video.")
    parser.add_argument(
        "--input_json",
        type=str,
        default='examples.json',
        help="[meta file] The condition path to generate the video.")
    parser.add_argument(
        "--motion_frame",
        type=int,
        default=9,
        help="Driven frame length used in the mode of long video genration.")
    parser.add_argument(
        "--mode",
        type=str,
        default="streaming",
        choices=['clip', 'streaming'],
        help="clip: generate one video chunk, streaming: long video generation")
    parser.add_argument(
        "--sample_steps", type=int, default=None, help="The sampling steps.")
    parser.add_argument(
        "--sample_shift",
        type=float,
        default=None,
        help="Sampling shift factor for flow matching schedulers.")
    parser.add_argument(
        "--sample_text_guide_scale",
        type=float,
        default=5.0,
        help="Classifier free guidance scale for text control.")
    parser.add_argument(
        "--sample_audio_guide_scale",
        type=float,
        default=4.0,
        help="Classifier free guidance scale for audio control.")
    parser.add_argument(
        "--num_persistent_param_in_dit",
        type=int,
        default=None,
        required=False,
        help="Maximum parameter quantity retained in video memory, small number to reduce VRAM required",
    )
    parser.add_argument(
        "--use_teacache",
        action="store_true",
        default=False,
        help="Enable teacache for video generation."
    )
    parser.add_argument(
        "--teacache_thresh",
        type=float,
        default=0.2,
        help="Threshold for teacache."
    )
    parser.add_argument(
        "--use_apg",
        action="store_true",
        default=False,
        help="Enable adaptive projected guidance for video generation (APG)."
    )
    parser.add_argument(
        "--apg_momentum",
        type=float,
        default=-0.75,
        help="Momentum used in adaptive projected guidance (APG)."
    )
    parser.add_argument(
        "--apg_norm_threshold",
        type=float,
        default=55,
        help="Norm threshold used in adaptive projected guidance (APG)."
    )
    parser.add_argument(
        "--color_correction_strength",
        type=float,
        default=1.0,
        help="strength for color correction [0.0 -- 1.0]."
    )

    parser.add_argument(
        "--quant",
        type=str,
        default=None,
        help="Quantization type, must be 'int8' or 'fp8'."
    )
    args = parser.parse_args()
    _validate_args(args)
    return args


def custom_init(device, wav2vec):    
    audio_encoder = Wav2Vec2Model.from_pretrained(wav2vec, local_files_only=True).to(device)
    audio_encoder.feature_extractor._freeze_parameters()
    wav2vec_feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(wav2vec, local_files_only=True)
    return wav2vec_feature_extractor, audio_encoder

def loudness_norm(audio_array, sr=16000, lufs=-23):
    meter = pyln.Meter(sr)
    loudness = meter.integrated_loudness(audio_array)
    if abs(loudness) > 100:
        return audio_array
    normalized_audio = pyln.normalize.loudness(audio_array, loudness, lufs)
    return normalized_audio

def audio_prepare_multi(left_path, right_path, audio_type, sample_rate=16000):
    if not (left_path=='None' or right_path=='None'):
        human_speech_array1 = audio_prepare_single(left_path)
        human_speech_array2 = audio_prepare_single(right_path)
    elif left_path=='None':
        human_speech_array2 = audio_prepare_single(right_path)
        human_speech_array1 = np.zeros(human_speech_array2.shape[0])
    elif right_path=='None':
        human_speech_array1 = audio_prepare_single(left_path)
        human_speech_array2 = np.zeros(human_speech_array1.shape[0])

    if audio_type=='para':
        new_human_speech1 = human_speech_array1
        new_human_speech2 = human_speech_array2
    elif audio_type=='add':
        new_human_speech1 = np.concatenate([human_speech_array1[: human_speech_array1.shape[0]], np.zeros(human_speech_array2.shape[0])]) 
        new_human_speech2 = np.concatenate([np.zeros(human_speech_array1.shape[0]), human_speech_array2[:human_speech_array2.shape[0]]])
    sum_human_speechs = new_human_speech1 + new_human_speech2
    return new_human_speech1, new_human_speech2, sum_human_speechs

def _init_logging(rank):
    # logging
    if rank == 0:
        # set format
        logging.basicConfig(
            level=logging.INFO,
            format="[%(asctime)s] %(levelname)s: %(message)s",
            handlers=[logging.StreamHandler(stream=sys.stdout)])
    else:
        logging.basicConfig(level=logging.ERROR)

def get_embedding(speech_array, wav2vec_feature_extractor, audio_encoder, sr=16000, device='cpu'):
    audio_duration = len(speech_array) / sr
    video_length = audio_duration * 25 # Assume the video fps is 25

    # wav2vec_feature_extractor
    audio_feature = np.squeeze(
        wav2vec_feature_extractor(speech_array, sampling_rate=sr).input_values
    )
    audio_feature = torch.from_numpy(audio_feature).float().to(device=device)
    audio_feature = audio_feature.unsqueeze(0)

    # audio encoder
    with torch.no_grad():
        embeddings = audio_encoder(audio_feature, seq_len=int(video_length), output_hidden_states=True)

    if len(embeddings) == 0:
        print("Fail to extract audio embedding")
        return None

    audio_emb = torch.stack(embeddings.hidden_states[1:], dim=1).squeeze(0)
    audio_emb = rearrange(audio_emb, "b s d -> s b d")

    audio_emb = audio_emb.cpu().detach()
    return audio_emb

def extract_audio_from_video(filename, sample_rate):
    raw_audio_path = filename.split('/')[-1].split('.')[0]+'.wav'
    ffmpeg_command = [
        "ffmpeg",
        "-y",
        "-i",
        str(filename),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "2",
        str(raw_audio_path),
    ]
    subprocess.run(ffmpeg_command, check=True)
    human_speech_array, sr = librosa.load(raw_audio_path, sr=sample_rate)
    human_speech_array = loudness_norm(human_speech_array, sr)
    os.remove(raw_audio_path)

    return human_speech_array

def audio_prepare_single(audio_path, sample_rate=16000):
    ext = os.path.splitext(audio_path)[1].lower()
    if ext in ['.mp4', '.mov', '.avi', '.mkv']:
        human_speech_array = extract_audio_from_video(audio_path, sample_rate)
        return human_speech_array
    else:
        human_speech_array, sr = librosa.load(audio_path, sr=sample_rate)
        human_speech_array = loudness_norm(human_speech_array, sr)
        return human_speech_array

def process_tts_single(text, save_dir, voice1):    
    s1_sentences = []

    pipeline = KPipeline(lang_code='a', repo_id='weights/Kokoro-82M')

    voice_tensor = torch.load(voice1, weights_only=True)
    generator = pipeline(
        text, voice=voice_tensor, # <= change voice here
        speed=1, split_pattern=r'\n+'
    )
    audios = []
    for i, (gs, ps, audio) in enumerate(generator):
        audios.append(audio)
    audios = torch.concat(audios, dim=0)
    s1_sentences.append(audios)
    s1_sentences = torch.concat(s1_sentences, dim=0)
    save_path1 =f'{save_dir}/s1.wav'
    sf.write(save_path1, s1_sentences, 24000) # save each audio file
    s1, _ = librosa.load(save_path1, sr=16000)
    return s1, save_path1
    
   

def process_tts_multi(text, save_dir, voice1, voice2):
    pattern = r'\(s(\d+)\)\s*(.*?)(?=\s*\(s\d+\)|$)'
    matches = re.findall(pattern, text, re.DOTALL)
    
    s1_sentences = []
    s2_sentences = []

    pipeline = KPipeline(lang_code='a', repo_id='weights/Kokoro-82M')
    for idx, (speaker, content) in enumerate(matches):
        if speaker == '1':
            voice_tensor = torch.load(voice1, weights_only=True)
            generator = pipeline(
                content, voice=voice_tensor, # <= change voice here
                speed=1, split_pattern=r'\n+'
            )
            audios = []
            for i, (gs, ps, audio) in enumerate(generator):
                audios.append(audio)
            audios = torch.concat(audios, dim=0)
            s1_sentences.append(audios)
            s2_sentences.append(torch.zeros_like(audios))
        elif speaker == '2':
            voice_tensor = torch.load(voice2, weights_only=True)
            generator = pipeline(
                content, voice=voice_tensor, # <= change voice here
                speed=1, split_pattern=r'\n+'
            )
            audios = []
            for i, (gs, ps, audio) in enumerate(generator):
                audios.append(audio)
            audios = torch.concat(audios, dim=0)
            s2_sentences.append(audios)
            s1_sentences.append(torch.zeros_like(audios))
    
    s1_sentences = torch.concat(s1_sentences, dim=0)
    s2_sentences = torch.concat(s2_sentences, dim=0)
    sum_sentences = s1_sentences + s2_sentences
    save_path1 =f'{save_dir}/s1.wav'
    save_path2 =f'{save_dir}/s2.wav'
    save_path_sum = f'{save_dir}/sum.wav'
    sf.write(save_path1, s1_sentences, 24000) # save each audio file
    sf.write(save_path2, s2_sentences, 24000)
    sf.write(save_path_sum, sum_sentences, 24000)

    s1, _ = librosa.load(save_path1, sr=16000)
    s2, _ = librosa.load(save_path2, sr=16000)
    # sum, _ = librosa.load(save_path_sum, sr=16000)
    return s1, s2, save_path_sum

def run_graio_demo(args):
    rank = int(os.getenv("RANK", 0))
    world_size = int(os.getenv("WORLD_SIZE", 1))
    local_rank = int(os.getenv("LOCAL_RANK", 0))
    device = local_rank
    _init_logging(rank)

    if args.offload_model is None:
        args.offload_model = False if world_size > 1 else True
        logging.info(
            f"offload_model is not specified, set to {args.offload_model}.")
    if world_size > 1:
        torch.cuda.set_device(local_rank)
        dist.init_process_group(
            backend="nccl",
            init_method="env://",
            rank=rank,
            world_size=world_size)
    else:
        assert not (
            args.t5_fsdp or args.dit_fsdp
        ), f"t5_fsdp and dit_fsdp are not supported in non-distributed environments."
        assert not (
            args.ulysses_size > 1 or args.ring_size > 1
        ), f"context parallel are not supported in non-distributed environments."

    if args.ulysses_size > 1 or args.ring_size > 1:
        assert args.ulysses_size * args.ring_size == world_size, f"The number of ulysses_size and ring_size should be equal to the world size."
        from xfuser.core.distributed import (
            init_distributed_environment,
            initialize_model_parallel,
        )
        init_distributed_environment(
            rank=dist.get_rank(), world_size=dist.get_world_size())

        initialize_model_parallel(
            sequence_parallel_degree=dist.get_world_size(),
            ring_degree=args.ring_size,
            ulysses_degree=args.ulysses_size,
        )

   
    cfg = WAN_CONFIGS[args.task]
    if args.ulysses_size > 1:
        assert cfg.num_heads % args.ulysses_size == 0, f"`{cfg.num_heads=}` cannot be divided evenly by `{args.ulysses_size=}`."

    logging.info(f"Generation job args: {args}")
    logging.info(f"Generation model config: {cfg}")

    if dist.is_initialized():
        base_seed = [args.base_seed] if rank == 0 else [None]
        dist.broadcast_object_list(base_seed, src=0)
        args.base_seed = base_seed[0]

    assert args.task == "infinitetalk-14B", 'You should choose multitalk in args.task.'
    

    
    wav2vec_feature_extractor, audio_encoder= custom_init('cpu', args.wav2vec_dir)
    os.makedirs(args.audio_save_dir,exist_ok=True)


    logging.info("Creating MultiTalk pipeline.")
    wan_i2v = wan.InfiniteTalkPipeline(
        config=cfg,
        checkpoint_dir=args.ckpt_dir,
        quant_dir=args.quant_dir,
        device_id=device,
        rank=rank,
        t5_fsdp=args.t5_fsdp,
        dit_fsdp=args.dit_fsdp, 
        use_usp=(args.ulysses_size > 1 or args.ring_size > 1),  
        t5_cpu=args.t5_cpu,
        lora_dir=args.lora_dir,
        lora_scales=args.lora_scale,
        quant=args.quant,
        dit_path=args.dit_path,
        infinitetalk_dir=args.infinitetalk_dir
    )

    if args.num_persistent_param_in_dit is not None:
        wan_i2v.vram_management = True
        wan_i2v.enable_vram_management(
            num_persistent_param_in_dit=args.num_persistent_param_in_dit
        )


    
    def generate_video(img2vid_image, vid2vid_vid, task_mode, img2vid_prompt, n_prompt, img2vid_audio_1, img2vid_audio_2,
                    sd_steps, seed, text_guide_scale, audio_guide_scale, mode_selector, tts_text, resolution_select, human1_voice, human2_voice):
        input_data = {}
        input_data["prompt"] = img2vid_prompt
        if task_mode=='VideoDubbing':
            input_data["cond_video"] = vid2vid_vid
        else:
            input_data["cond_video"] = img2vid_image
        person = {}
        if mode_selector == "Single Person(Local File)":
            person['person1'] = img2vid_audio_1
        elif mode_selector == "Single Person(TTS)":
            tts_audio = {}
            tts_audio['text'] = tts_text
            tts_audio['human1_voice'] = human1_voice
            input_data["tts_audio"] = tts_audio
        elif mode_selector == "Multi Person(Local File, audio add)":
            person['person1'] = img2vid_audio_1
            person['person2'] = img2vid_audio_2
            input_data["audio_type"] = 'add'
        elif mode_selector == "Multi Person(Local File, audio parallel)":
            person['person1'] = img2vid_audio_1
            person['person2'] = img2vid_audio_2
            input_data["audio_type"] = 'para'
        else:
            tts_audio = {}
            tts_audio['text'] = tts_text
            tts_audio['human1_voice'] = human1_voice
            tts_audio['human2_voice'] = human2_voice
            input_data["tts_audio"] = tts_audio
            
        input_data["cond_audio"] = person

        if 'Local File' in mode_selector:
            if len(input_data['cond_audio'])==2:
                new_human_speech1, new_human_speech2, sum_human_speechs = audio_prepare_multi(input_data['cond_audio']['person1'], input_data['cond_audio']['person2'], input_data['audio_type'])
                audio_embedding_1 = get_embedding(new_human_speech1, wav2vec_feature_extractor, audio_encoder)
                audio_embedding_2 = get_embedding(new_human_speech2, wav2vec_feature_extractor, audio_encoder)
                emb1_path = os.path.join(args.audio_save_dir, '1.pt')
                emb2_path = os.path.join(args.audio_save_dir, '2.pt')
                sum_audio = os.path.join(args.audio_save_dir, 'sum.wav')
                sf.write(sum_audio, sum_human_speechs, 16000)
                torch.save(audio_embedding_1, emb1_path)
                torch.save(audio_embedding_2, emb2_path)
                input_data['cond_audio']['person1'] = emb1_path
                input_data['cond_audio']['person2'] = emb2_path
                input_data['video_audio'] = sum_audio
            elif len(input_data['cond_audio'])==1:
                human_speech = audio_prepare_single(input_data['cond_audio']['person1'])
                audio_embedding = get_embedding(human_speech, wav2vec_feature_extractor, audio_encoder)
                emb_path = os.path.join(args.audio_save_dir, '1.pt')
                sum_audio = os.path.join(args.audio_save_dir, 'sum.wav')
                sf.write(sum_audio, human_speech, 16000)
                torch.save(audio_embedding, emb_path)
                input_data['cond_audio']['person1'] = emb_path
                input_data['video_audio'] = sum_audio
        elif 'TTS' in mode_selector:
            if 'human2_voice' not in input_data['tts_audio'].keys():
                new_human_speech1, sum_audio = process_tts_single(input_data['tts_audio']['text'], args.audio_save_dir, input_data['tts_audio']['human1_voice'])
                audio_embedding_1 = get_embedding(new_human_speech1, wav2vec_feature_extractor, audio_encoder)
                emb1_path = os.path.join(args.audio_save_dir, '1.pt')
                torch.save(audio_embedding_1, emb1_path)
                input_data['cond_audio']['person1'] = emb1_path
                input_data['video_audio'] = sum_audio
            else:
                new_human_speech1, new_human_speech2, sum_audio = process_tts_multi(input_data['tts_audio']['text'], args.audio_save_dir, input_data['tts_audio']['human1_voice'], input_data['tts_audio']['human2_voice'])
                audio_embedding_1 = get_embedding(new_human_speech1, wav2vec_feature_extractor, audio_encoder)
                audio_embedding_2 = get_embedding(new_human_speech2, wav2vec_feature_extractor, audio_encoder)
                emb1_path = os.path.join(args.audio_save_dir, '1.pt')
                emb2_path = os.path.join(args.audio_save_dir, '2.pt')
                torch.save(audio_embedding_1, emb1_path)
                torch.save(audio_embedding_2, emb2_path)
                input_data['cond_audio']['person1'] = emb1_path
                input_data['cond_audio']['person2'] = emb2_path
                input_data['video_audio'] = sum_audio


        # if len(input_data['cond_audio'])==2:
        #     new_human_speech1, new_human_speech2, sum_human_speechs = audio_prepare_multi(input_data['cond_audio']['person1'], input_data['cond_audio']['person2'], input_data['audio_type'])
        #     audio_embedding_1 = get_embedding(new_human_speech1, wav2vec_feature_extractor, audio_encoder)
        #     audio_embedding_2 = get_embedding(new_human_speech2, wav2vec_feature_extractor, audio_encoder)
        #     emb1_path = os.path.join(args.audio_save_dir, '1.pt')
        #     emb2_path = os.path.join(args.audio_save_dir, '2.pt')
        #     sum_audio = os.path.join(args.audio_save_dir, 'sum.wav')
        #     sf.write(sum_audio, sum_human_speechs, 16000)
        #     torch.save(audio_embedding_1, emb1_path)
        #     torch.save(audio_embedding_2, emb2_path)
        #     input_data['cond_audio']['person1'] = emb1_path
        #     input_data['cond_audio']['person2'] = emb2_path
        #     input_data['video_audio'] = sum_audio
        # elif len(input_data['cond_audio'])==1:
        #     human_speech = audio_prepare_single(input_data['cond_audio']['person1'])
        #     audio_embedding = get_embedding(human_speech, wav2vec_feature_extractor, audio_encoder)
        #     emb_path = os.path.join(args.audio_save_dir, '1.pt')
        #     sum_audio = os.path.join(args.audio_save_dir, 'sum.wav')
        #     sf.write(sum_audio, human_speech, 16000)
        #     torch.save(audio_embedding, emb_path)
        #     input_data['cond_audio']['person1'] = emb_path
        #     input_data['video_audio'] = sum_audio

        logging.info("Generating video ...")
        video = wan_i2v.generate_infinitetalk(
            input_data,
            size_buckget=resolution_select,
            motion_frame=args.motion_frame,
            frame_num=args.frame_num,
            shift=args.sample_shift,
            sampling_steps=sd_steps,
            text_guide_scale=text_guide_scale,
            audio_guide_scale=audio_guide_scale,
            seed=seed,
            n_prompt=n_prompt,
            offload_model=args.offload_model,
            max_frames_num=args.frame_num if args.mode == 'clip' else 1000,
            color_correction_strength = args.color_correction_strength,
            extra_args=args,
            )
        

        if args.save_file is None:
            formatted_time = datetime.now().strftime("%Y%m%d_%H%M%S")
            formatted_prompt = input_data['prompt'].replace(" ", "_").replace("/",
                                                                        "_")[:50]
            args.save_file = f"{args.task}_{args.size.replace('*','x') if sys.platform=='win32' else args.size}_{args.ulysses_size}_{args.ring_size}_{formatted_prompt}_{formatted_time}"
        
        logging.info(f"Saving generated video to {args.save_file}.mp4")
        save_video_ffmpeg(video, args.save_file, [input_data['video_audio']], high_quality_save=False)
        logging.info("Finished.")

        return args.save_file + '.mp4'

    def toggle_audio_mode(mode):
        if 'TTS' in mode:
            return [
                gr.Audio(visible=False, interactive=False),
                gr.Audio(visible=False, interactive=False),
                gr.Textbox(visible=True, interactive=True)
            ]
        elif 'Single' in mode:
            return [
                gr.Audio(visible=True, interactive=True),
                gr.Audio(visible=False, interactive=False),
                gr.Textbox(visible=False, interactive=False)
            ]
        else:
            return [
                gr.Audio(visible=True, interactive=True),
                gr.Audio(visible=True, interactive=True),
                gr.Textbox(visible=False, interactive=False)
            ]
    
    def show_upload(mode):
        if mode == "SingleImageDriven":
            return gr.update(visible=True), gr.update(visible=False)
        else:
            return gr.update(visible=False), gr.update(visible=True)
            
        
    with gr.Blocks() as demo:

        gr.Markdown("""
                    <div style="text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 20px;">
                        MeiGen-InfiniteTalk
                    </div>
                    <div style="text-align: center; font-size: 16px; font-weight: normal; margin-bottom: 20px;">
                        InfiniteTalk: Audio-driven Video Generation for Spare-Frame Video Dubbing.
                    </div>
                    <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                        <a href=''><img src='https://img.shields.io/badge/Project-Page-blue'></a>
                        <a href=''><img src='https://img.shields.io/badge/%F0%9F%A4%97%20HuggingFace-Model-yellow'></a>
                        <a href=''><img src='https://img.shields.io/badge/Paper-Arxiv-red'></a>
                    </div>


                    """)

        with gr.Row():
            with gr.Column(scale=1):
                task_mode = gr.Radio(
                    choices=["SingleImageDriven", "VideoDubbing"],
                    label="Choose SingleImageDriven task or VideoDubbing task",
                    value="VideoDubbing"
                )
                vid2vid_vid = gr.Video(
                    label="Upload Input Video", 
                    visible=True)
                img2vid_image = gr.Image(
                    type="filepath",
                    label="Upload Input Image",
                    elem_id="image_upload",
                    visible=False
                )
                img2vid_prompt = gr.Textbox(
                    label="Prompt",
                    placeholder="Describe the video you want to generate",
                )
                task_mode.change(
                    fn=show_upload,
                    inputs=task_mode,
                    outputs=[img2vid_image, vid2vid_vid]
                )
                
                
                with gr.Accordion("Audio Options", open=True):
                    mode_selector = gr.Radio(
                        choices=["Single Person(Local File)", "Single Person(TTS)", "Multi Person(Local File, audio add)", "Multi Person(Local File, audio parallel)", "Multi Person(TTS)"],
                        label="Select person and audio mode.",
                        value="Single Person(Local File)"
                    )
                    resolution_select = gr.Radio(
                        choices=["infinitetalk-480", "infinitetalk-720"],
                        label="Select resolution.",
                        value="infinitetalk-480"
                    )
                    img2vid_audio_1 = gr.Audio(label="Conditioning Audio for speaker 1", type="filepath", visible=True)
                    img2vid_audio_2 = gr.Audio(label="Conditioning Audio for speaker 2", type="filepath", visible=False)
                    tts_text = gr.Textbox(
                        label="Text for TTS",
                        placeholder="Refer to the format in the examples",
                        visible=False,
                        interactive=False
                    )
                    mode_selector.change(
                        fn=toggle_audio_mode,
                        inputs=mode_selector,
                        outputs=[img2vid_audio_1, img2vid_audio_2, tts_text]
                    )

                with gr.Accordion("Advanced Options", open=False):
                    with gr.Row():
                        sd_steps = gr.Slider(
                            label="Diffusion steps",
                            minimum=1,
                            maximum=1000,
                            value=8,
                            step=1)
                        seed = gr.Slider(
                            label="Seed",
                            minimum=-1,
                            maximum=2147483647,
                            step=1,
                            value=42)
                    with gr.Row():
                        text_guide_scale = gr.Slider(
                            label="Text Guide scale",
                            minimum=0,
                            maximum=20,
                            value=1.0,
                            step=1)
                        audio_guide_scale = gr.Slider(
                            label="Audio Guide scale",
                            minimum=0,
                            maximum=20,
                            value=2.0,
                            step=1)
                    with gr.Row():
                        human1_voice = gr.Textbox(
                            label="Voice for the left person",
                            value="weights/Kokoro-82M/voices/am_adam.pt",
                        )
                        human2_voice = gr.Textbox(
                            label="Voice for right person",
                            value="weights/Kokoro-82M/voices/af_heart.pt"
                        )
                    # with gr.Row():
                    n_prompt = gr.Textbox(
                        label="Negative Prompt",
                        placeholder="Describe the negative prompt you want to add",
                        value="bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards"
                    )

                run_i2v_button = gr.Button("Generate Video")

            with gr.Column(scale=2):
                result_gallery = gr.Video(
                    label='Generated Video', interactive=False, height=600, )
                
                gr.Examples(
                    examples = [
                        ['SingleImageDriven', 'examples/single/ref_image.png', None, "A woman is passionately singing into a professional microphone in a recording studio. She wears large black headphones and a dark cardigan over a gray top. Her long, wavy brown hair frames her face as she looks slightly upwards, her mouth open mid-song. The studio is equipped with various audio equipment, including a mixing console and a keyboard, with soundproofing panels on the walls. The lighting is warm and focused on her, creating a professional and intimate atmosphere. A close-up shot captures her expressive performance.", "Single Person(Local File)", "examples/single/1.wav", None, None],
                        ['VideoDubbing', None, 'examples/single/ref_video.mp4', "A man is talking", "Single Person(Local File)", "examples/single/1.wav", None, None],

                    ],
                    inputs = [task_mode, img2vid_image, vid2vid_vid, img2vid_prompt, mode_selector, img2vid_audio_1, img2vid_audio_2, tts_text],
                )


        run_i2v_button.click(
            fn=generate_video,
            inputs=[img2vid_image, vid2vid_vid, task_mode, img2vid_prompt, n_prompt, img2vid_audio_1, img2vid_audio_2,sd_steps, seed, text_guide_scale, audio_guide_scale, mode_selector, tts_text, resolution_select, human1_voice, human2_voice],
            outputs=[result_gallery],
        )
    demo.launch(server_name="0.0.0.0", debug=True, server_port=8418)

        


if __name__ == "__main__":
    args = _parse_args()
    run_graio_demo(args)
    
