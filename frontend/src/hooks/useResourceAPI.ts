import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

export type ResourceType = 'image' | 'video' | 'audio' | 'document';

export interface ResourceData {
  id: string;
  src: string;
  filename: string;
  url: string;
  // Add other properties that come from your API
}

export interface UseResourceAPIReturn {
  data: ResourceData[] | null;
  isLoading: boolean;
  error: string | null;
  loadResources: () => Promise<ResourceData[]>;
  uploadResource: (file: File) => Promise<ResourceData>;
  refreshResources: () => Promise<void>;
}

export const useResourceAPI = (
  resourceType: ResourceType,
  autoLoad = true
): UseResourceAPIReturn => {
  const [data, setData] = useState<ResourceData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification, hideNotification, notification } = useNotification();
  const loadResources = async (): Promise<ResourceData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/${resourceType}`);
      const result = await response.json();

      if (response.ok) {
        const resources = result.data.map((item: any) => ({
          id: item.filename,
          src: item.url,
          filename: item.filename,
          url: item.url,
          ...item // Include any other properties
        }));

        setData(resources);
        console.log(`✅ Loaded ${resources.length} ${resourceType}s from database`);
        showNotification(`Loaded ${resources.length} ${resourceType}s`, 'success');
        return resources;
      } else {
        const errorMessage = result.message || `Failed to load ${resourceType}s`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`❌ Error loading ${resourceType}s:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadResource = async (file: File): Promise<ResourceData> => {
    try {
      const formData = new FormData();
      formData.append(resourceType, file);

      const response = await fetch(`/api/${resourceType}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const resource: ResourceData = {
          id: result.file.filename || file.name,
          src: result.file.path || result.file.filename,
          filename: result.file.filename || file.name,
          url: result.file.path || result.file.filename,
          ...result.file
        };

        console.log(`✅ Uploaded ${resourceType}:`, resource);
        return resource;
      } else {
        const errorMessage = result.message || `Failed to upload ${resourceType}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(`❌ Error uploading ${resourceType}:`, error);
      throw error;
    }
  };

  const refreshResources = async (): Promise<void> => {
    await loadResources();
  };

  useEffect(() => {
    if (autoLoad) {
      loadResources();
    }
  }, [resourceType, autoLoad]);

  return {
    data,
    isLoading,
    error,
    loadResources,
    uploadResource,
    refreshResources,
  };
};