/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import dynamic from "next/dynamic";
import MeetingRoom from "@/app/components/meeting-room";
import StreamProvider from "@/app/components/stream-provider";
import { StreamTheme } from "@stream-io/video-react-sdk";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AILoading = dynamic(() => import("@/app/components/AILoading"), {
  ssr: false,
});

export default function MeetingPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const callId = params.id;
  const name = searchParams.get("name") || "Anonymous";

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setUser({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name: name,
    });
  }, [name]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) setToken(data.token);
        else setError("No token received");
      })
      .catch((err) => setError(err.message));
  }, [user]);

  if (error) {
    return (
      <div className="min-h-screen bg-mesh-with-grid flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full border-(--danger)/40">
          <div className="flex items-center gap-3 text-(--danger) mb-4">
            <span className="text-2xl">⚠</span>
            <h2 className="font-display text-lg tracking-wider">System error</h2>
          </div>
          <p className="text-(--text-muted) text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 rounded-xl bg-black/40 border border-(--neon-dim) text-(--neon) font-display tracking-wider hover:shadow-[0_0_20px_rgba(0,245,255,0.2)] transition"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return <AILoading />;
  }

  return (
    <StreamProvider user={user} token={token}>
      <StreamTheme>
        <MeetingRoom
          callId={callId}
          userId={user.id}
          onLeave={() => router.push("/")}
        />
      </StreamTheme>
    </StreamProvider>
  );
}
