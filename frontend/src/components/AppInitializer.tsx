// app/components/AppInitializer.tsx (or any path you prefer)
'use client';

import { useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

export default function AppInitializer() {
  const { showNotification } = useNotification();

  useEffect(() => {
    const syncTasks = async () => {
      try {
        const response = await fetch('/api/tasks/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to sync tasks: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.tasks) {
          const completedTasks = result.tasks.filter(
            (task: any) => task.newStatus === 'SUCCESS',
          );
          completedTasks.forEach((task: any) => {
            showNotification(
              `${task.taskType} generation completed successfully`,
              'success',
              5000,
              {
                avatarId: task.avatarId,
                taskId: task.taskId,
                mediaType: task.taskType,
              },
            );
          });
        }
      } catch (error) {
        console.error('Error syncing tasks:', error);
      }
    };

    syncTasks();
  }, []);

  return null; // This component doesn't render anything
}
