export const COMFYUI_BASE_URL = process.env.NEXT_PUBLIC_COMFYUI_BASE_URL;
export const COMFYUI_SERVER_URL = process.env.NEXT_PUBLIC_COMFYUI_SERVER_URL;
export const COMFYUI_RUN_ASYNC = `${COMFYUI_BASE_URL}/run`;
export const COMFYUI_RUN_SYNC = `${COMFYUI_BASE_URL}/runsync`;
export const COMFYUI_STATUS = `${COMFYUI_BASE_URL}/status`;
export const CELERY_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://0.0.0.0:8000";
export const CELERY_RUN_TASK = `${CELERY_BASE_URL}/run_task/`;
export const CELERY_TASK_STATUS = `${CELERY_BASE_URL}/task_status/`;
