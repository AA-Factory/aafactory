'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-24 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20 animate-gradient bg-[length:200%_200%]" />

      {/* Floating animated shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-float-delayed-2" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white animate-fade-in">
          Welcome to AAFactory
        </h1>
        <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 max-w-2xl animate-fade-in-delayed">
          AAFactory is an open-source project for building lifelike, video-based
          avatars. Whether you&apos;re creating a virtual assistant, a digital
          character, or an AI-powered presenter — AAFactory gives you the tools
          to bring your avatars to life.
        </p>
        <p className="mt-4 text-md text-gray-700 dark:text-gray-300 animate-fade-in-delayed-2">
          Get started by creating your own avatar or exploring our documentation
        </p>
        <div className="mt-8 animate-fade-in-delayed-3">
          <button
            onClick={() => router.push('/avatar/create')}
            className="inline-block bg-blue-600 text-white dark:bg-blue-700 px-6 py-3 rounded-xl text-lg font-medium hover:bg-blue-700 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
          >
            Create Your Avatar
          </button>
        </div>
      </div>
    </main>
  );
}
