export const DEFAULT_AVATAR_TRAINING_AUDIOS = {
  default: {
    src: '/test/training_audio/rick_and_morty_voice_training.wav',
    filename: 'rick_and_morty_voice_training.wav',
  },
  japanese: {
    src: '/test/training_audio/japanese_voice_training.wav',
    filename: 'japanese_voice_training.wav',
  },
  rick_and_morty: {
    src: '/test/training_audio/rick_and_morty_voice_training.wav',
    filename: 'rick_and_morty_voice_training.wav',
  },
};

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
