'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20 text-center">
      <h1 className="text-5xl font-extrabold text-gray-900">
        Welcome to AAFactory
      </h1>
      <p className="mt-6 text-xl text-gray-700 dark:text-gray-400 max-w-2xl">
        AAFactory is an open-source project for building lifelike, video-based
        avatars. Whether you&apos;re creating a virtual assistant, a digital
        character, or an AI-powered presenter — AAFactory gives you the tools to
        bring your avatars to life.
      </p>
      <p className="mt-4 text-md text-gray-500 dark:text-gray-400">
        Get started by creating your own avatar or exploring our documentation
      </p>
      <div className="mt-8">
        <button
          onClick={() => router.push('/avatar/create')}
          className="inline-block bg-blue-600 text-white dark:bg-blue-700 dark:text-white px-6 py-3 rounded-xl text-lg font-medium hover:bg-blue-700 transition hover:shadow-lg"
        >
          Create Your Avatar
        </button>
      </div>
    </main>
  );
}
