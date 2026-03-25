"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ArcReactor = dynamic(() => import("@/app/components/ArcReactor"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleJoin = (e) => {
    e?.preventDefault();
    const name = username.trim() === "" ? "Anonymous" : username.trim();
    const meetingId = process.env.NEXT_PUBLIC_CALL_ID;
    router.push(`/meeting/${meetingId}?name=${encodeURIComponent(name)}`);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-mesh-with-grid">
      <ArcReactor />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,245,255,0.3)]">
            LetsMeet
          </h1>
          <p className="mt-3 text-(--text-muted) text-sm">
            AI-powered meetings · Live transcript · Smart summaries
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 glow">
          <div className="border-b border-(--neon-dim) pb-4 mb-6">
            <h2 className="font-display text-lg tracking-wider text-(--neon) uppercase">
              Join session
            </h2>
            <p className="text-(--text-muted) text-sm mt-1">
              Enter your name to connect
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label htmlFor="name" className="sr-only">Your name</label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Alex (optional)"
                className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-(--neon-dim) text-white placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--neon) focus:border-(--neon) transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <button
              type="submit"
              onClick={handleJoin}
              className="w-full py-3.5 rounded-xl bg-(--neon) hover:bg-cyan-400 text-black font-bold font-display tracking-wider uppercase text-sm transition shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)]"
            >
              Join Meeting
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {["Live transcript", "AI summary", "Action items"].map((label) => (
            <span
              key={label}
              className="px-3 py-1.5 rounded-full text-xs text-(--neon) bg-(--neon)/10 border border-(--neon-dim)"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
