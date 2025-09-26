export const CELERY_BASE_URL = process.env.NEXT_PUBLIC_CELERY_BASE_URL;
export const CELERY_RUN_TASK = `${CELERY_BASE_URL}/run_task/`;
export const CELERY_TASK_STATUS = `${CELERY_BASE_URL}/task_status/`;
