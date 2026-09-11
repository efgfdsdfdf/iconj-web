'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-500 mb-2">We&apos;re sorry, this page encountered an error. Please try again.</p>
        <div className="bg-red-50 text-red-800 text-xs p-4 rounded text-left mb-6 overflow-auto max-h-48 border border-red-200">
          <p className="font-bold">Error Details (for debugging):</p>
          <p className="mt-1">{error?.message || "Unknown error"}</p>
          {error?.digest && <p className="mt-1 text-red-600">Digest: {error.digest}</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Try Again
          </button>
          <Link
            href="/shop"
            className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 font-medium"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
