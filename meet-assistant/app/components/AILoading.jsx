"use client";

import { useState, useEffect, memo } from "react";

const BOOT_MESSAGES = [
  "Initializing AI Assistant...",
  "Loading speech recognition...",
  "Connecting to meeting...",
  "Syncing participants...",
  "Starting transcription engine...",
];

const AILoading = memo(() => {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState(BOOT_MESSAGES[0]);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % BOOT_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setDisplayText(BOOT_MESSAGES[index]);
  }, [index]);

  return (
    <div className="min-h-screen w-full bg-mesh-with-grid flex flex-col items-center justify-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center">
        {/* CSS-only "AI brain" concentric rotating rings */}
        <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center relative">
          {/* Outer ring */}
          <div
            className="absolute rounded-full border border-[#00f5ff]/40 ai-loading-spin"
            style={{
              width: "100%",
              height: "100%",
              boxShadow: "0 0 20px rgba(0,245,255,0.2), inset 0 0 20px rgba(0,245,255,0.05)",
            }}
          />
          {/* Middle ring - reverse */}
          <div
            className="absolute rounded-full border border-[#00f5ff]/50 ai-loading-spin-reverse"
            style={{
              width: "75%",
              height: "75%",
              boxShadow: "0 0 15px rgba(0,245,255,0.25)",
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute rounded-full border border-[#00ff88]/50 ai-loading-spin"
            style={{
              width: "50%",
              height: "50%",
              animationDuration: "4s",
              boxShadow: "0 0 15px rgba(0,255,136,0.2)",
            }}
          />
          {/* Core glow */}
          <div
            className="absolute rounded-full bg-[#00f5ff]/20 ai-loading-pulse"
            style={{
              width: "25%",
              height: "25%",
              boxShadow: "0 0 30px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.2)",
            }}
          />
        </div>

        <p
          className="mt-8 text-[#00f5ff] text-lg font-display tracking-wider animate-pulse max-w-[320px] text-center"
          style={{
            textShadow: "0 0 10px #00f5ff, 0 0 20px rgba(0,245,255,0.5)",
          }}
        >
          {displayText}
        </p>

        {/* Waveform "AI listening" */}
        <div className="flex justify-center gap-1.5 h-6 items-end mt-6">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <span
              key={i}
              className="w-1.5 bg-[#00f5ff]/70 rounded-full waveform-bar"
              style={{
                height: "18px",
                animationDelay: `${i * 0.1}s`,
                boxShadow: "0 0 6px rgba(0,245,255,0.4)",
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-64 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#00f5ff] progress-pulse"
            style={{
              width: "45%",
              boxShadow: "0 0 10px #00f5ff",
            }}
          />
        </div>
      </div>
    </div>
  );
});

AILoading.displayName = 'AILoading';

export default AILoading;
