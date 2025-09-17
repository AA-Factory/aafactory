import yaml
import cv2
import numpy as np
from pathlib import Path

class ImageProcessor:
    def __init__(self, yaml_path):
        with open(yaml_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.images_info = []
        self.reference_size = None
        self._load_images()

    def _load_images(self):
        for img_config in self.config['images']:
            img = cv2.imread(img_config['path'])
            if img is None:
                raise ValueError(f"Cannot load image: {img_config['path']}")
            
            info = {
                'image': img,
                'duration': float(img_config.get('duration', 1.0)),
                'translation': img_config.get('translation', [0, 0]),
                'scale': float(img_config.get('scale', 1.0))
            }
            self.images_info.append(info)
            
            if self.reference_size is None:
                self.reference_size = (img.shape[1], img.shape[0])

    def _translate_image(self, img, translation):
        """Perform only translation"""
        height, width = img.shape[:2]
        
        # Calculate translation amount (pixels)
        tx = int(width * translation[0] / 100)
        ty = int(height * translation[1] / 100)
        
        # Create translation matrix
        M = np.float32([[1, 0, tx], [0, 1, ty]])
        
        # Apply translation while maintaining original dimensions
        translated = cv2.warpAffine(img, M, (width, height))
        
        return translated

    def _crop_black_borders(self, img):
        """Crop out black borders from the image"""
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Threshold to identify non-black areas
        _, thresh = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
        
        # Find bounding box of non-black pixels
        coords = cv2.findNonZero(thresh)
        if coords is None:
            return img
        
        x, y, w, h = cv2.boundingRect(coords)
        
        # Crop the image to the bounding box
        return img[y:y+h, x:x+w]

    def _scale_image(self, img, scale, target_size):
        """Scale the image"""
        if scale <= 1:
            return cv2.resize(img, target_size)
            
        # First scale up
        height, width = img.shape[:2]
        scaled_width = int(width * scale)
        scaled_height = int(height * scale)
        scaled = cv2.resize(img, (scaled_width, scaled_height))
        
        # Center-crop to target dimensions
        start_x = (scaled_width - target_size[0]) // 2
        start_y = (scaled_height - target_size[1]) // 2
        cropped = scaled[start_y:start_y+target_size[1], 
                        start_x:start_x+target_size[0]]
        
        return cropped

    def _transform_image(self, img, translation, scale):
        """Apply transformations in sequence: translation → cropping → scaling"""
        original_size = (img.shape[1], img.shape[0])
        
        # 1. Translation
        translated = self._translate_image(img, translation)
        
        # 2. Black border cropping
        cropped = self._crop_black_borders(translated)
        
        # 3. Scale back to original dimensions
        transformed = self._scale_image(cropped, scale, original_size)
        
        return transformed

    def create_video(self, output_path, fps=25):
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, self.reference_size)
        
        try:
            for info in self.images_info:
                # Transform image
                transformed = self._transform_image(
                    info['image'],
                    info['translation'],
                    info['scale']
                )
                
                # Resize to reference dimensions if needed
                if transformed.shape[:2] != (self.reference_size[1], self.reference_size[0]):
                    transformed = cv2.resize(transformed, self.reference_size)
                
                # Write video frames
                n_frames = int(info['duration'] * fps)
                for _ in range(n_frames):
                    out.write(transformed)
                    
        finally:
            out.release()
        
        # Enhance video quality
        self._improve_video_quality(output_path)

    def _improve_video_quality(self, video_path):
        import subprocess
        temp_path = video_path + '.temp.mp4'
        
        cmd = [
            'ffmpeg', '-i', video_path,
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-crf', '18',
            '-y',
            temp_path
        ]
        
        subprocess.run(cmd)
        
        import os
        os.replace(temp_path, video_path)

def main():
    processor = ImageProcessor('tools/i2v_config.yaml')
    processor.create_video('convertd_video.mp4', fps=25)

if __name__ == '__main__':
    main()

