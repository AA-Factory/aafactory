// types/avatar.ts
export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  personality: string;
  backgroundKnowledge: string;
  description?: string;
  category?: 'realistic' | 'stylized' | 'cartoon' | 'fantasy';
  hasEncodedData?: boolean;
  fileName?: string;
  src?: string;
  trainingAudioPath?: string;
  trainingAudioFileName?: string;
}

export interface AvatarResponse {
  avatars: Avatar[];
}

export interface AvatarPageProps {
  editMode?: boolean;
  avatarId?: string;
}
export interface TouchedFields {
  [key: string]: boolean;
}
