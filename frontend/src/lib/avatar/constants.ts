export const DEFAULT_AVATAR_IMAGES = [
  { src: '/uploads/defaults/image/person_1.jpeg', filename: 'person_1.jpeg' },
  { src: '/uploads/defaults/image/person_2.jpeg', filename: 'person_2.jpeg' },
  { src: '/uploads/defaults/image/person_3.jpeg', filename: 'person_3.jpeg' },
  { src: '/uploads/defaults/image/person_4.jpeg', filename: 'person_4.jpeg' },
  { src: '/uploads/defaults/image/person_5.jpeg', filename: 'person_5.jpeg' }
];

export const DEFAULT_AVATAR_TRAINING_AUDIOS = [
  { src: '/uploads/defaults/audio/japanese_voice_training.wav', filename: 'japanese_voice_training.wav' },
  { src: '/uploads/defaults/audio/rick_and_morty_voice_training.wav', filename: 'rick_and_morty_voice_training.wav' }
];

export const AVATAR_CONSTANTS = {
  FALLBACK_IMAGE: '/placeholder-avatar.png',
  STORAGE_KEY: 'activeAvatarId',
  DEFAULT_VOICE_MODEL: 'elevenlabs',
  ROUTES: {
    CREATE: '/avatar/create',
    EDIT: '/avatar/edit',
  },
};

export const CATEGORY_OPTIONS = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'stylized', label: 'Stylized' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'fantasy', label: 'Fantasy' },
];