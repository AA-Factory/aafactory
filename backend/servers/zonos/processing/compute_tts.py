import io
import torch
import torchaudio
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
from zonos.utils import DEFAULT_DEVICE as device
import base64
from pathlib import Path

MODULE_PATH = Path(__file__).parent

def run_text_to_speech(prompt: str, voice_bytes: str,  language: str) -> bytes:
    """
    Run text-to-speech processing.

    Args:
        voice_sample (str): A sample of the voice to mimic.
        text (str): The text to convert to speech.
        language (dict): Language settings for the TTS.

    Returns:
        str: a base64-encoded string.
    """
    # Simulate processing time
    # model = Zonos.from_pretrained("Zyphra/Zonos-v0.1-hybrid", device=device)
    model = Zonos.from_pretrained("Zyphra/Zonos-v0.1-transformer", device=device)

    voice_sample_bytes = base64.b64decode(voice_bytes)
    voice_sample_buffer = io.BytesIO(voice_sample_bytes)
    wav, sampling_rate = torchaudio.load(voice_sample_buffer)
    speaker = model.make_speaker_embedding(wav, sampling_rate)

    cond_dict = make_cond_dict(text=prompt, speaker=speaker, language=language)
    conditioning = model.prepare_conditioning(cond_dict)

    codes = model.generate(conditioning)

    wavs = model.autoencoder.decode(codes).cpu()
    # Save model output directly as WAV using model's sample rate (assumed 22050 Hz)
    output = wavs[0]
    if output.ndim == 1:
        output = output.unsqueeze(0)
    buffer = io.BytesIO()
    torchaudio.save(buffer, output, model.autoencoder.sampling_rate, format="wav")
    buffer.seek(0)
    audio_data = buffer.read()
    return base64.b64encode(audio_data)