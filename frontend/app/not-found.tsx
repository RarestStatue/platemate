import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/home"
          className="inline-block bg-red text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-darker transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
