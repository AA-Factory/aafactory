from scenedetect import SceneManager, open_video, ContentDetector, AdaptiveDetector, ThresholdDetector
from moviepy.editor import *
import copy,os,time,datetime

def build_manager():
    scene_manager = SceneManager()
    scene_manager.add_detector(ContentDetector())
    scene_manager.add_detector(AdaptiveDetector())
    scene_manager.add_detector(ThresholdDetector())
    return scene_manager

def seg_video(video_path, scene_list, output_dir):
    output_fp_list = []
    with VideoFileClip(video_path) as video: 
        for (start_time,end_time) in scene_list:
            if end_time-start_time > 0.5:
                start_time = start_time + 0.05
                end_time = end_time - 0.05
                video_clip = video.subclip(start_time, end_time)
                vid = video_path.split('/')[-1].rstrip('.mp4').split('___')[0]
                output_fp = os.path.join(output_dir, f'{vid}_{str(start_time)}_{str(end_time)}.mp4')
                video_clip.write_videofile(output_fp)
                output_fp_list.append(output_fp)
        video.close()
    return output_fp_list

def shot_detect(video_path, output_dir):
    
    os.makedirs(output_dir, exist_ok=True)
    print(f'start process {video_path}')
    start_time = time.time()
    attribs = {}
    attribs['filepath'] = video_path
    try:
        video = open_video(video_path)
        scene_manager = build_manager()
        scene_manager.detect_scenes(video,show_progress=False)
        stamps = scene_manager.get_scene_list()
        scene_list = []
        for stamp in stamps:
            start, end = stamp    
            scene_list.append((start.get_seconds(), end.get_seconds()))  
                    
        attribs['shot_stamps'] = scene_list
        output_fp_list = seg_video(video_path, scene_list, output_dir)            
            
    except Exception as e:
        print([e, video_path])
    
    

    print(f"process {video_path} Done with {time.time()-start_time:.2f} seconds used.")
    return scene_list, output_fp_list


