export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404 – Not Found</h1>
        <p className="text-gray-400">This page doesn't exist. Or maybe it vanished 🫠</p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
        >
          Take me home
        </a>
      </div>
    </div>
  );
}
