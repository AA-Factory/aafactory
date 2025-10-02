from pathlib import Path
import argparse
import logging
from infinite_talk.InfiniteTalk.generate_infinitetalk import generate
from infinite_talk.processing.config import default_args, config_overrides


MODULE_PATH = Path(__file__).parent


def run_audio_to_video(config: str = "low_vram") -> bytes:
    """
    Runs the audio-to-video generation process with configurable settings.
    Args:
        config (str): Configuration preset to use. Options include:
                      "low_vram", "lora", "high_quality", "medium_quality", "quantize_model".
                      Default is "low_vram".
    Returns:
        bytes: The generated video data as bytes.
    """        
    # Apply config overrides
    final_args = default_args.copy()
    if config not in config_overrides:
        raise ValueError(f"Unknown config: {config}. Valid configs are: {list(config_overrides.keys())}")
    final_args.update(config_overrides[config])
    
    # Convert to Namespace
    args = argparse.Namespace(**final_args)
    logging.info(f"Running infinite talk generation with config: {config}")
    
    return generate(args)
