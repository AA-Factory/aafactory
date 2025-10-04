export const TASK_ENDPOINTS = {
  video: '/api/tasks/video',
  audio: '/api/tasks/audio',
  image: '/api/tasks/image',
}

export const VIDEO_TYPES = [
  { id: 'talking_head', label: 'Conversational Video' },
  { id: 'first_last', label: 'First Last Frame' },
  { id: 'text_to_video', label: 'Text to Video' },
];

export const SUPPORTED_TASK_TYPES = ['video', 'audio', 'image']

export const DEFAULT_LANGUAGE = 'en-us';

export const MIN_AUDIO_DURATION = 4;