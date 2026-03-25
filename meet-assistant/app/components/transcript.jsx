"use client";

import { useCall } from "@stream-io/video-react-sdk";
import React, { useEffect, useState, useRef, useCallback, memo } from "react";

const TranscriptPanel = memo(({ meetingId }) => {
  const [transcripts, setTranscripts] = useState([]);
  const transcriptEndRef = useRef(null);
  const call = useCall();
  const saveTimeoutRef = useRef(null);

  // Debounced save function to reduce API calls
  const debouncedSave = useCallback((transcript) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/transcripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meeting_id: meetingId || process.env.NEXT_PUBLIC_CALL_ID,
            speaker: transcript.speaker,
            text: transcript.text,
            timestamp: transcript.timestamp,
          }),
        });
      } catch (err) {
        console.error("Failed to save transcript:", err);
      }
    }, 1000); // Save after 1 second of no new transcripts
  }, [meetingId]);

  useEffect(() => {
    if (!call) return;
    const callId = meetingId || process.env.NEXT_PUBLIC_CALL_ID;

    const handleClosedCaptions = (event) => {
      if (event.closed_caption && event.closed_caption.text) {
        const newTranscript = {
          id: Date.now(),
          text: event.closed_caption.text,
          timestamp: new Date().toISOString(),
          speaker: "Unknown",
        };
        setTranscripts((prev) => [...prev, newTranscript]);
        debouncedSave(newTranscript);
      }
    };

    call.on("call.closed_captions", handleClosedCaptions);
    return () => {
      call.off("call.closed_captions", handleClosedCaptions);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [call, meetingId, debouncedSave]);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcripts]);

  const formatTime = useCallback((iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }, []);

  const isRecording = transcripts.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 py-3 border-b border-(--neon-dim) shrink-0">
        <h3 className="font-display text-sm font-bold tracking-[0.15em] text-(--neon) uppercase terminal-text">
          AI transcript
        </h3>
        <p className="text-(--text-muted) text-xs mt-1 font-mono">
          Real-time captions from the call
        </p>
        <div className="mt-2 flex items-center gap-2 font-mono text-xs text-(--neon)" style={{ textShadow: "0 0 8px rgba(0,245,255,0.5)" }}>
          <span>STATUS:</span>
          <span className="flex items-center gap-1.5">
            {!isRecording ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-(--neon) animate-pulse" style={{ boxShadow: "0 0 8px #00f5ff" }} />
                LISTENING
              </>
            ) : (
              <>● RECORDING</>
            )}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {transcripts.length === 0 ? (
          <div className="text-center py-10">
            <div className="flex justify-center gap-1.5 h-6 items-end mb-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <span
                  key={i}
                  className="w-1.5 bg-(--neon)/70 rounded-full waveform-bar"
                  style={{ height: "18px", animationDelay: `${i * 0.1}s`, boxShadow: "0 0 6px rgba(0,245,255,0.4)" }}
                />
              ))}
            </div>
            <p className="text-(--text-muted) text-sm font-mono">Waiting for speech...</p>
            <p className="text-(--text-muted)/80 text-xs mt-1 font-mono">
              Speak or enable captions to see text here
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-(--neon-dim)/50 pb-2 mb-2 font-mono text-xs text-(--text-muted)">────────────────</div>
            {transcripts.map((t) => (
              <div
                key={t.id}
                className="rounded-lg px-3 py-2.5 bg-black/40 border border-(--neon-dim)"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-display tracking-wider text-(--neon) terminal-text">
                    {t.speaker}:
                  </span>
                  <span className="text-xs text-(--text-muted) font-mono">
                    {formatTime(t.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed font-mono">{t.text}</p>
              </div>
            ))}
            <div className="border-t border-(--neon-dim)/50 pt-2 mt-2 font-mono text-xs text-(--text-muted)">────────────────</div>
          </>
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
});

TranscriptPanel.displayName = 'TranscriptPanel';

export default TranscriptPanel;
