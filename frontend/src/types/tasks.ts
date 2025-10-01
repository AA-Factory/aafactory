export interface AudioTask {
  taskId: string;
  status: 'PENDING' | 'RECEIVED' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  taskType: 'audio';
  userPrompt: string;
  filePath: string;
}

export interface VideoTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
  status: 'PENDING' | 'RECEIVED' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  thumbnailPath?: string; // optional thumbnail path for videos
  taskType: 'video' | 'OTHER'; // to differentiate task types if needed
}
