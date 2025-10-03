/**
 * Celery task types for API communication
 */

// Base Celery Task Status
export type CeleryTaskStatus =
  | 'PENDING'
  | 'STARTED'
  | 'SUCCESS'
  | 'FAILURE'
  | 'RETRY';

export type ServerName = 'mock' | 'infinite_talk' | 'zonos';

// Generic Celery Task Request
export interface CeleryTaskRequest<T = Record<string, any>> {
  server_name: string;
  task_name: string;
  payload: T;
}

// Generic Celery Task Response
interface CeleryTaskResponse {
  task_id: string;
  status: string;
  message?: string;
}

// Generic Celery Task Status Response
interface CeleryTaskStatusResponse<T = any> {
  status: CeleryTaskStatus;
  result?: T;
  error?: string;
  traceback?: string;
  task_id?: string;
  timestamp?: string;
}


// Type guards
export function isCeleryTaskResponse(obj: any): obj is CeleryTaskResponse {
  return (
    obj && typeof obj.task_id === 'string' && typeof obj.status === 'string'
  );
}

export function isCeleryTaskStatusResponse(
  obj: any,
): obj is CeleryTaskStatusResponse {
  return (
    obj &&
    typeof obj.status === 'string' &&
    ['PENDING', 'STARTED', 'SUCCESS', 'FAILURE', 'RETRY'].includes(obj.status)
  );
}
