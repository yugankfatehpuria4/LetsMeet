"use client";

import dynamic from "next/dynamic";
import {
  CallControls,
  SpeakerLayout,
  StreamCall,
  useStreamVideoClient,
} from "@stream-io/video-react-sdk";
import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import TranscriptPanel from "./transcript";
import SummaryPanel from "./summary-panel";

const AILoading = dynamic(() => import("./AILoading"), { ssr: false });

const MeetingRoom = memo(({ callId, onLeave, userId }) => {
  const client = useStreamVideoClient();
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const callType = "default";

  const handleLeaveClick = useCallback(async () => {
    if (leavingRef.current) {
      onLeave?.();
      return;
    }
    leavingRef.current = true;
    try {
      if (callId) {
        // Trigger summary generation in background
        fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meeting_id: callId }),
        }).catch((err) =>
          console.error("Failed to trigger summary generation:", err)
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
            // Ensure the call starts with only two members: the host + the meeting assistant bot.
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
            <span className="font-display text-lg font-bold text-white tracking-wider">LetsMeet</span>
            <span className="text-(--neon) text-sm">◆</span>
            <span className="text-(--text-muted) text-sm truncate max-w-[200px] font-mono">
              {callId}
            </span>
          </div>
          <button
            onClick={handleLeaveClick}
            className="px-4 py-2 rounded-full text-sm font-display tracking-wider bg-(--danger)/20 text-(--danger) border border-(--danger)/50 hover:shadow-[0_0_15px_rgba(255,59,59,0.3)] transition"
          >
            End call
          </button>
        </header>

        {/* SYSTEM STATUS - Jarvis-style status bar */}
        <div className="px-4 py-2 border-b border-(--neon-dim) shrink-0 bg-black/30">
          <p className="font-display text-xs tracking-[0.2em] text-(--neon) uppercase mb-1.5" style={{ textShadow: "0 0 10px rgba(0,245,255,0.5)" }}>
            System status
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-(--text-muted) text-xs font-mono">
            <span className="text-(--neon)">● AI ASSISTANT ONLINE</span>
            <span>● TRANSCRIPTION ACTIVE</span>
            <span>● STREAM CONNECTION STABLE</span>
          </div>
        </div>

        <div className="flex-1 flex min-h-0 px-4 py-4 gap-4">
          <div className="flex-1 flex flex-col min-w-0 gap-4">
            {/* Holographic video grid */}
            <div className="flex-1 rounded-xl overflow-hidden hud-panel min-h-[280px] border-2 border-cyan-400/30 shadow-[0_0_20px_rgba(0,245,255,0.25),0_0_40px_rgba(0,245,255,0.1)]">
              <SpeakerLayout />
            </div>
            {/* Spaceship-style control panel */}
            <div className="flex justify-center shrink-0 hud-controls">
              <div className="hud-panel rounded-full px-6 py-3 border-2 border-cyan-400/40 shadow-[0_0_15px_rgba(0,245,255,0.2)] hover:shadow-[0_0_25px_rgba(0,245,255,0.35)] transition-all">
                <CallControls onLeave={handleLeaveClick} />
              </div>
            </div>
          </div>

          {/* AI Console - right panel */}
          <aside className="w-full lg:w-96 flex flex-col rounded-xl overflow-hidden hud-panel border-2 border-cyan-400/30 shadow-[0_0_20px_rgba(0,245,255,0.2)] shrink-0">
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
