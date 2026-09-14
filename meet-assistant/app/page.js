"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";

const ArcReactor = dynamic(() => import("@/app/components/ArcReactor"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const [username, setUsername] = useState("");
  const [customRoomId, setCustomRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleJoinOrCreate = async (targetRoomId) => {
    const name = username.trim() === "" ? "Anonymous" : username.trim();
    const finalRoomId = targetRoomId || customRoomId.trim() || process.env.NEXT_PUBLIC_CALL_ID || "demo-meeting-room";

    try {
      // Register meeting in database
      await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id: finalRoomId,
          title: `Meeting ${finalRoomId}`,
          created_by: name,
          participant: name,
        }),
      }).catch(() => {});
    } finally {
      router.push(`/meeting/${encodeURIComponent(finalRoomId)}?name=${encodeURIComponent(name)}`);
    }
  };

  const handleCreateInstant = async () => {
    setIsCreating(true);
    const randomCode = "room-" + Math.random().toString(36).substring(2, 10);
    await handleJoinOrCreate(randomCode);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    handleJoinOrCreate();
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden bg-mesh-with-grid">
      <ArcReactor />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,245,255,0.3)]">
            LetsMeet
          </h1>
          <p className="mt-3 text-(--text-muted) text-sm">
            AI-powered meetings · Live transcript · Smart summaries
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 glow">
          <div className="border-b border-(--neon-dim) pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="font-display text-lg tracking-wider text-(--neon) uppercase">
                Join or Host
              </h2>
              <p className="text-(--text-muted) text-xs mt-0.5">
                Connect with AI Assistant active
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-(--neon) animate-ping" />
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-mono text-(--text-muted) uppercase mb-1.5">
                Your Display Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Alex (optional)"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-(--neon-dim) text-white placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--neon) focus:border-(--neon) transition text-sm font-mono"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="roomId" className="block text-xs font-mono text-(--text-muted) uppercase mb-1.5">
                Meeting Room Code
              </label>
              <input
                id="roomId"
                type="text"
                placeholder={`Default: ${process.env.NEXT_PUBLIC_CALL_ID || "demo-meeting-room"}`}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-(--neon-dim) text-white placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--neon) focus:border-(--neon) transition text-sm font-mono"
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value)}
              />
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-(--neon) hover:bg-cyan-400 text-black font-bold font-display tracking-wider uppercase text-sm transition shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] cursor-pointer"
              >
                Join Meeting
              </button>

              <button
                type="button"
                onClick={handleCreateInstant}
                disabled={isCreating}
                className="w-full py-3 rounded-xl bg-black/50 hover:bg-black/70 border border-(--neon-dim) text-(--neon) font-bold font-display tracking-wider uppercase text-xs transition hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] cursor-pointer flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <span>Generating Room...</span>
                ) : (
                  <>
                    <span>✦ Create Instant Room</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-(--neon-dim)/50 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-(--text-muted) hover:text-(--neon) font-mono transition"
            >
              <span>📊 View Past Meetings & Summaries</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {["Live transcript", "AI summary", "Action items"].map((label) => (
            <span
              key={label}
              className="px-3 py-1.5 rounded-full text-xs text-(--neon) bg-(--neon)/10 border border-(--neon-dim) font-mono"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
