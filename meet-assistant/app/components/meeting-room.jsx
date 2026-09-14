"use client";

import dynamic from "next/dynamic";
import {
  CallControls,
  SpeakerLayout,
  StreamCall,
  useStreamVideoClient,
} from "@stream-io/video-react-sdk";
import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import TranscriptPanel from "./transcript";
import SummaryPanel from "./summary-panel";

const AILoading = dynamic(() => import("./AILoading"), { ssr: false });

const MeetingRoom = memo(({ callId, onLeave, userId }) => {
  const client = useStreamVideoClient();
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const callType = "default";

  const handleCopyLink = useCallback(() => {
    const link = `${window.location.origin}/meeting/${encodeURIComponent(callId)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [callId]);

  const handleLeaveClick = useCallback(async () => {
    if (leavingRef.current) {
      onLeave?.();
      return;
    }
    leavingRef.current = true;
    try {
      if (callId) {
        // Trigger summary generation and mark meeting ended in background
        Promise.all([
          fetch("/api/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meeting_id: callId }),
          }),
          fetch("/api/meetings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meeting_id: callId, status: "ended" }),
          }),
        ]).catch((err) =>
          console.error("Failed to trigger post-meeting processing:", err)
        );
      }
      if (call) {
        await Promise.all([
          call.stopClosedCaptions().catch(() => {}),
          call.leave().catch(() => {}),
        ]);
      }
    } catch (err) {
      console.error("Error leaving call:", err);
    } finally {
      onLeave?.();
    }
  }, [callId, call, onLeave]);

  useEffect(() => {
    if (!client || joinedRef.current) return;
    joinedRef.current = true;

    const init = async () => {
      try {
        const myCall = client.call(callType, callId);
        // Must match the bot user id used by your external meeting assistant service (python).
        const meetingAssistantId = "meeting-assistant-bot";
        await myCall.getOrCreate({
          data: {
            created_by_id: userId,
            members: [
              { user_id: userId, role: "call_member" },
              { user_id: meetingAssistantId, role: "call_member" },
            ],
          },
        });
        await myCall.join();
        await myCall.startClosedCaptions({ language: "en" });
        myCall.on("call.session_ended", () => onLeave?.());
        setCall(myCall);

        // Register participant in DB
        fetch("/api/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meeting_id: callId,
            title: `Meeting ${callId}`,
            created_by: userId,
            participant: userId,
          }),
        }).catch(() => {});
      } catch (err) {
        setError("Failed to join the call: " + err.message);
      }
    };

    init();

    return () => {
      if (call && !leavingRef.current) {
        leavingRef.current = true;
        call.stopClosedCaptions().catch(() => {});
        call.leave().catch(() => {});
      }
    };
  }, [client, callId, userId, onLeave, call]);

  if (error) {
    return (
      <div className="min-h-screen bg-mesh-with-grid flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full border-(--danger)/40 glow">
          <h2 className="font-display text-lg tracking-wider text-(--danger) mb-2">Error</h2>
          <p className="text-(--text-muted) text-sm mb-6">{error}</p>
          <button
            onClick={onLeave}
            className="w-full py-3 rounded-xl bg-(--danger)/20 border border-(--danger)/50 text-(--danger) font-display tracking-wider hover:shadow-[0_0_20px_rgba(255,59,59,0.3)] transition"
          >
            Leave
          </button>
        </div>
      </div>
    );
  }

  if (!call) {
    return <AILoading />;
  }

  return (
    <StreamCall call={call}>
      <div className="min-h-screen bg-mesh-with-grid flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 glass border-b border-(--neon-dim) shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-lg font-bold text-white tracking-wider hover:text-(--neon) transition">
              LetsMeet
            </Link>
            <span className="text-(--neon) text-sm">◆</span>
            <span className="text-(--text-muted) text-xs truncate max-w-[180px] font-mono bg-black/40 px-2 py-1 rounded border border-(--neon-dim)">
              {callId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider bg-black/40 text-(--neon) border border-(--neon-dim) hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{copied ? "✓ Copied!" : "🔗 Share Link"}</span>
            </button>

            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider bg-black/40 text-white border border-(--neon-dim) hover:border-(--neon) transition hidden sm:inline-block"
            >
              Dashboard
            </Link>

            <button
              onClick={handleLeaveClick}
              className="px-4 py-2 rounded-full text-xs font-display tracking-wider bg-(--danger)/20 text-(--danger) border border-(--danger)/50 hover:shadow-[0_0_15px_rgba(255,59,59,0.3)] transition cursor-pointer uppercase font-bold"
            >
              End Call
            </button>
          </div>
        </header>

        {/* SYSTEM STATUS - Status bar */}
        <div className="px-4 py-2 border-b border-(--neon-dim) shrink-0 bg-black/30">
          <p className="font-display text-xs tracking-[0.2em] text-(--neon) uppercase mb-1.5" style={{ textShadow: "0 0 10px rgba(0,245,255,0.5)" }}>
            System Status
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-(--text-muted) text-xs font-mono">
            <span className="text-(--neon)">● AI ASSISTANT ONLINE</span>
            <span>● TRANSCRIPTION ACTIVE</span>
            <span>● STREAM CONNECTION STABLE</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 px-4 py-4 gap-4 overflow-y-auto lg:overflow-visible">
          <div className="flex-1 flex flex-col min-w-0 gap-4">
            {/* Video grid */}
            <div className="flex-1 rounded-xl overflow-hidden hud-panel min-h-[280px] border-2 border-cyan-400/30 shadow-[0_0_20px_rgba(0,245,255,0.25),0_0_40px_rgba(0,245,255,0.1)]">
              <SpeakerLayout />
            </div>
            {/* Control panel */}
            <div className="flex justify-center shrink-0 hud-controls">
              <div className="hud-panel rounded-full px-6 py-3 border-2 border-cyan-400/40 shadow-[0_0_15px_rgba(0,245,255,0.2)] hover:shadow-[0_0_25px_rgba(0,245,255,0.35)] transition-all">
                <CallControls onLeave={handleLeaveClick} />
              </div>
            </div>
          </div>

          {/* AI Console - right panel */}
          <aside className="w-full lg:w-96 flex flex-col rounded-xl overflow-hidden hud-panel border-2 border-cyan-400/30 shadow-[0_0_20px_rgba(0,245,255,0.2)] shrink-0 min-h-[450px]">
            <div className="flex-1 flex flex-col min-h-0">
              <TranscriptPanel meetingId={callId} />
              <SummaryPanel meetingId={callId} />
            </div>
          </aside>
        </div>
      </div>
    </StreamCall>
  );
});

MeetingRoom.displayName = 'MeetingRoom';

export default MeetingRoom;
