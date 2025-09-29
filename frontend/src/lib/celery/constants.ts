
export const CELERY_BASE_URL = process.env.NEXT_PUBLIC_CELERY_BASE_URL;
export const CELERY_BASE_URL_SERVER = process.env.CELERY_BASE_URL_SERVER || process.env.NEXT_PUBLIC_CELERY_BASE_URL_SERVER;

export const CELERY_RUN_TASK = `${CELERY_BASE_URL}/run_task/`;
export const CELERY_TASK_STATUS = `${CELERY_BASE_URL}/task_status/`;


export const CELERY_RUN_TASK_SERVER = `${CELERY_BASE_URL_SERVER}/run_task/`;
export const CELERY_TASK_STATUS_SERVER = `${CELERY_BASE_URL_SERVER}/task_status/`;

export const VIDEO_TYPES = [
  { id: "talking_head", label: "Conversational Video" },
  { id: "first_last", label: "First Last Frame" },
  { id: "text_to_video", label: "Text to Video" },
];

export const POLLING_CONFIG = {
  audio: {
    REFETCH_INTERVAL: 10000,
    BACKGROUND_REFETCH: true,
  },
  video: {
    REFETCH_INTERVAL: 50000,
    BACKGROUND_REFETCH: true,
  }
};

export const AVATAR_CONSTANTS = {
  FALLBACK_IMAGE: "/placeholder-avatar.png",
  STORAGE_KEY: "activeAvatarId",
  DEFAULT_VOICE_MODEL: "elevenlabs",
  ROUTES: {
    CREATE: "/avatar/create",
    EDIT: "/avatar/edit",
  },
};
