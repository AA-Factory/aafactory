import React, { useMemo } from 'react';
import { FiImage, FiPlayCircle, FiMusic } from 'react-icons/fi';
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
  const defaultDownloadName = useMemo(() => {
    if (downloadName) return downloadName;
    const timestamp = Date.now();
    const extension =
      type === 'audio' ? 'mp3' : type === 'video' ? 'mp4' : 'png';
    return `generated-${type}-${timestamp}.${extension}`;
  }, [downloadName, type]);

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
          <img
            src={`/api/file/image/${fileName}`}
            alt={alt}
            className="w-full h-full rounded-xl object-contain bg-black"
          />
        )}
        {type === 'video' && (
          <video
            src={`/api/file/video/${fileName}`}
            controls
            className="w-full h-full rounded-xl object-contain bg-black"
          />
        )}
        {type === 'audio' && (
          <div className="flex items-center justify-center w-full h-full">
            <audio
              src={`/api/file/audio/${fileName}`}
              controls
              className="w-full max-w-md"
            />
          </div>
        )}
        {(showDownload || actions) && (
          <div className="flex justify-center space-x-2 mt-5">
            {showDownload && (
              <MediaActionButton
                href={`/api/file/${type}/${fileName}`}
                download={defaultDownloadName}
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
      {fileName && src && (
        <span className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
          {fileName}
        </span>
      )}
      {renderMediaContent()}
    </div>
  );
};
