const CELERY_BASE_URL = process.env.NEXT_PUBLIC_CELERY_BASE_URL;
const CELERY_BASE_URL_SERVER =
  process.env.CELERY_BASE_URL_SERVER ||
  process.env.NEXT_PUBLIC_CELERY_BASE_URL_SERVER;

export const CELERY_RUN_TASK = `${CELERY_BASE_URL}/run_task/`;
export const CELERY_TASK_STATUS = `${CELERY_BASE_URL}/task_status/`;

export const CELERY_TASK_STATUS_SERVER = `${CELERY_BASE_URL_SERVER}/task_status/`;

export const POLLING_CONFIG = {
  audio: {
    REFETCH_INTERVAL: 5000,
    BACKGROUND_REFETCH: true,
    STALE_TIME: 0,
  },
  video: {
    REFETCH_INTERVAL: 5000,
    BACKGROUND_REFETCH: true,
    STALE_TIME: 0,
  },
  image: {
    REFETCH_INTERVAL: 5000,
    BACKGROUND_REFETCH: true,
    STALE_TIME: 0,
  },
};

export const MAX_PENDING_TASK_AGE_HOURS = 24; // Maximum age for pending tasks