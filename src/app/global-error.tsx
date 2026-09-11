'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>Something went wrong</h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>We&apos;re sorry, this page encountered an error. Please try again.</p>
            <div className="bg-red-50 text-red-800 text-xs p-4 rounded text-left mb-6 overflow-auto max-h-48 border border-red-200">
              <p className="font-bold">Error Details (for debugging):</p>
              <p className="mt-1">{error?.message || "Unknown error"}</p>
              {error?.digest && <p className="mt-1 text-red-600">Digest: {error.digest}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{ background: '#2563eb', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Try Again
              </button>
              <a
                href="/shop"
                style={{ background: '#e2e8f0', color: '#334155', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500 }}
              >
                Go to Shop
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
