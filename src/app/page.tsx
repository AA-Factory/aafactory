export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-center">
      <h1 className="text-5xl font-extrabold text-gray-900">Welcome to AAFactory</h1>
      <p className="mt-6 text-xl text-gray-700 max-w-2xl">
        AAFactory is an open-source project for building lifelike, video-based avatars.
        Whether you're creating a virtual assistant, a digital character, or an AI-powered presenter —
        AAFactory gives you the tools to bring your avatars to life.
      </p>
      <p className="mt-4 text-md text-gray-500">Join the community, contribute, and shape the future of interactive AI.</p>
      <div className="mt-8">
        <a
          href="https://github.com/orgs/AA-Factory/repositories"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-black text-white px-6 py-3 rounded-xl text-lg font-medium hover:bg-gray-800 transition"
        >
          🚀 Get Started on GitHub
        </a>
      </div>
    </main>
  );
}

