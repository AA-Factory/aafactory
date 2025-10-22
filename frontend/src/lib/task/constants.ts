export const TASK_ENDPOINTS = {
  video: '/api/tasks/video',
  audio: '/api/tasks/audio',
  image: '/api/tasks/image',
};

export const VIDEO_TYPES = [
  { id: 'talking_head', label: 'Conversational Video', disabled: false },
  { id: 'first_last', label: 'First Last Frame', disabled: true },
  { id: 'text_to_video', label: 'Text to Video', disabled: true },
];

export const VIDEO_CONFIG = [
  { label: '6 Steps', value: '6_steps' },
  { label: '8 Steps', value: '8_steps' },
  { label: 'High Quality', value: 'high_quality' },
  { label: 'Medium Quality', value: 'medium_quality' },
  { label: 'Quantize Model', value: 'quantize_model' },
];

export const IMAGE_TYPES = [
  { id: 'text_to_image', label: 'Text to Image', disabled: false },
  {
    id: 'image_to_image_edit',
    label: 'Image to Image (Edit)',
    disabled: false,
  },
];

export const IMAGE_QUALITIES = [
  { label: 'low', value: 'low' },
  { label: 'medium', value: 'medium' },
  { label: 'high', value: 'high' },
  { label: 'ultra', value: 'ultra' },
];

export const IMAGE_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
];

export const SUPPORTED_TASK_TYPES = ['video', 'audio', 'image'];

export const DEFAULT_LANGUAGE = 'en-us';

export const MIN_AUDIO_DURATION = 4;

export const LOCAL_STORAGE_KEY = 'notification-history';