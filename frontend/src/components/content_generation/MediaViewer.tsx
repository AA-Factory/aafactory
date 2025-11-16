import React, { useState } from 'react';
import {
  FiImage,
  FiPlayCircle,
  FiMusic,
  FiRotateCw,
  FiRotateCcw,
} from 'react-icons/fi';
import { MediaActionButton } from './MediaActionButton';

export type MediaType = 'image' | 'video' | 'audio';

export interface MediaViewerProps {
  type: MediaType;
  src?: string;
  alt?: string;
  fileName?: string;
  downloadName?: string;
  showDownload?: boolean;
  emptyMessage?: string;
  aspectRatio?: 'video' | 'image' | 'audio' | 'auto';
  actions?: React.ReactNode;
  maxWidth?: string;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  type,
  src,
  alt = 'Media content',
  fileName,
  downloadName,
  showDownload = true,
  emptyMessage,
  aspectRatio = 'auto',
  actions,
  maxWidth = 'max-w-full',
}) => {
  const [rotation, setRotation] = useState(0);

  const rotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetEdits = () => {
    setRotation(0);
  };

  const rotateAndDownload = () => {
    const img = new Image();
    img.src = src || '';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate new canvas size based on rotation
      const radians = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));

      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;

      if (ctx) {
        // Move to center, rotate, then draw
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rotated-image-${rotation}deg.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    };
  };

  const getDefaultEmptyMessage = () => {
    switch (type) {
      case 'image':
        return 'No image selected';
      case 'video':
        return 'No video selected';
      case 'audio':
        return 'No audio selected';
    }
  };

  const getEmptyIcon = () => {
    const iconClass = 'w-16 h-16 mb-4';
    switch (type) {
      case 'image':
        return <FiImage className={iconClass} />;
      case 'video':
        return <FiPlayCircle className={iconClass} />;
      case 'audio':
        return <FiMusic className={iconClass} />;
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'video':
        return 'aspect-video';
      case 'image':
        return 'aspect-square';
      case 'audio':
        return 'aspect-[2/.0]';
      case 'auto':
        return '';
    }
  };

  const getDefaultDownloadName = () => {
    if (downloadName) return downloadName;
    const timestamp = Date.now();
    const extension =
      type === 'audio' ? 'mp3' : type === 'video' ? 'mp4' : 'png';
    return `generated-${type}-${timestamp}.${extension}`;
  };

  const renderMediaContent = () => {
    if (!src) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-34 text-gray-400">
          {getEmptyIcon()}
          <span className="text-lg">
            {emptyMessage || getDefaultEmptyMessage()}
          </span>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full p-3">
        {type === 'image' && (
          <>
            <img
              src={src}
              alt={alt}
              className="w-full h-full rounded-xl object-contain bg-black transition-transform duration-200 m-auto"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            {src && (
              <div className="absolute top-2 right-2 flex space-x-1 z-10">
                {rotation !== 0 && (
                  <button
                    onClick={resetEdits}
                    className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-2 py-1 rounded-lg text-xs transition-all"
                    title="Reset"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={rotateLeft}
                  className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg transition-all"
                  title="Rotate left"
                >
                  <FiRotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={rotateRight}
                  className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg transition-all"
                  title="Rotate right"
                >
                  <FiRotateCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
        {type === 'video' && (
          <video
            src={src}
            controls
            className="w-full h-full rounded-xl object-contain bg-black"
          />
        )}
        {type === 'audio' && (
          <audio src={src} controls className="w-full h-25 max-w-md" />
        )}
        {(showDownload || actions) && (
          <div className="flex justify-center space-x-2 mt-5">
            {showDownload && type === 'image' && (
              <MediaActionButton
                onClick={rotateAndDownload}
                download={getDefaultDownloadName()}
                variant="primary"
              >
                Download
              </MediaActionButton>
            )}
            {type === 'video' && (
              <MediaActionButton
                href={src}
                download={getDefaultDownloadName()}
                variant="primary"
              >
                Download
              </MediaActionButton>
            )}
            {type === 'audio' && (
              <MediaActionButton
                href={src}
                download={getDefaultDownloadName()}
                variant="primary"
              >
                Download
              </MediaActionButton>
            )}
            {actions}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-full ${maxWidth} ${getAspectRatioClass()} bg-black rounded-xl shadow-lg flex items-center justify-center relative`}
    >
      {fileName && (
        <span className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
          {fileName}
        </span>
      )}
      {renderMediaContent()}
    </div>
  );
};
