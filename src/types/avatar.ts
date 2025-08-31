// types/avatar.ts
export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  voiceModel: string;
  createdAt: string;
  personality: string;
  backgroundKnowledge: string;
  description?: string;
  category?: 'realistic' | 'stylized' | 'cartoon' | 'fantasy';
  hasEncodedData?: boolean;
  fileName?: string;
}

export interface AvatarResponse {
  avatars: any[];
}

export interface AvatarPageProps {
  editMode?: boolean;
  avatarId?: string;
}
export interface TouchedFields {
  [key: string]: boolean;
}