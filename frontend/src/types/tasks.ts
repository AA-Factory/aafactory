export interface AudioTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
}

export interface VideoTask {
  taskId: string;
  userPrompt: string;
  filePath: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE';
  thumbnailPath?: string; // optional thumbnail path for videos
  taskType: 'VIDEO' | 'OTHER'; // to differentiate task types if needed
}