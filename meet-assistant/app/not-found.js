"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to home after 5 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-mesh-with-grid flex items-center justify-center px-4">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full border-(--danger)/40 glow text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--danger)/20 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="font-display text-xl tracking-wider text-(--danger) mb-2">
          Meeting Not Found
        </h1>
        <p className="text-(--text-muted) text-sm mb-6">
          The meeting you're looking for doesn't exist or has ended.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl bg-(--neon)/20 border border-(--neon)/50 text-(--neon) font-display tracking-wider hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] transition"
          >
            Go Home
          </button>
          <p className="text-xs text-(--text-muted)">
            Auto-redirecting in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}