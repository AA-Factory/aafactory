// app/components/AppInitializer.tsx (or any path you prefer)
'use client';

import { useEffect } from 'react';

export default function AppInitializer() {
  useEffect(() => {
    const syncTasks = async () => {
      try {
        await fetch('/api/tasks/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error syncing tasks:', error);
      }
    };

    syncTasks();
  }, []);

  return null; // This component doesn't render anything
}
