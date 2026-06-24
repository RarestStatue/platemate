"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red mb-4">Oops!</h1>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-block bg-red text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-darker transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
