"use client";

import { useEffect, useState, useMemo, memo, useRef, useCallback } from "react";

const SummaryPanel = memo(({ meetingId }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);

  const fetchData = useCallback(async (signal) => {
    const now = Date.now();
    if (now - lastFetchRef.current < 3000) return;
    lastFetchRef.current = now;

    setLoading(true);
    setError(null);

    try {
      const [summaryRes, actionItemsRes] = await Promise.all([
        fetch(`/api/summary?meeting_id=${meetingId}`, { signal }),
        fetch(`/api/action-items?meeting_id=${meetingId}`, { signal }),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData?.ok) setSummary(summaryData.summary);
        else setSummary(null);
      } else if (summaryRes.status !== 404) {
        setError("Failed to load summary");
      }

      if (actionItemsRes.ok) {
        const actionData = await actionItemsRes.json();
        if (actionData?.ok) setActionItems(actionData.action_items || []);
      } else if (actionItemsRes.status !== 404) {
        setActionItems([]);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError("Failed to fetch");
        console.error("SummaryPanel fetch error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId) return;
    const controller = new AbortController();

    fetchData(controller.signal);
    const intervalId = window.setInterval(() => fetchData(controller.signal), 10000);

    return () => {
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, [meetingId, fetchData]);

  const handleToggleActionItem = async (itemId, currentStatus) => {
    const newStatus = !currentStatus;
    // Optimistic UI update
    setActionItems((prev) =>
      prev.map((item) =>
        item._id === itemId ? { ...item, completed: newStatus } : item
      )
    );

    try {
      await fetch("/api/action-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, completed: newStatus }),
      });
    } catch (err) {
      console.error("Failed to toggle action item status:", err);
    }
  };

  const handleExportNotes = () => {
    if (!summary && actionItems.length === 0) return;

    let content = `# LetsMeet Intelligence Summary\n`;
    content += `**Meeting ID:** ${meetingId}\n`;
    content += `**Date:** ${new Date().toLocaleString()}\n\n`;

    if (summary?.summary) {
      content += `## Key Discussion Points & Decisions\n`;
      content += `${summary.summary}\n\n`;
    }

    if (actionItems.length > 0) {
      content += `## Action Items\n`;
      actionItems.forEach((item, idx) => {
        const status = item.completed ? "[x]" : "[ ]";
        content += `${idx + 1}. ${status} **${item.task}** (Assigned: ${item.assigned_to} | Due: ${item.deadline})\n`;
      });
    }

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-notes-${meetingId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const summaryPoints = useMemo(() => {
    if (!summary?.summary) return [];
    return summary.summary.split("\n").filter(Boolean);
  }, [summary?.summary]);

  const hasContent = summary || actionItems.length > 0;

  return (
    <div className="flex flex-col border-t border-(--neon-dim) min-h-0 flex-1">
      <div className="px-4 py-3 border-b border-(--neon-dim) shrink-0 flex justify-between items-center">
        <div>
          <h3 className="font-display text-sm font-bold tracking-[0.15em] text-(--neon) uppercase terminal-text">
            AI Assistant
          </h3>
          <p className="text-(--text-muted) text-xs mt-0.5 font-mono">
            Summary & action items
          </p>
        </div>

        {hasContent && (
          <button
            onClick={handleExportNotes}
            className="px-2.5 py-1 rounded border border-(--neon-dim) bg-black/40 text-(--neon) text-[11px] font-mono hover:bg-(--neon)/10 transition cursor-pointer"
            title="Download Notes in Markdown"
          >
            📥 Export .md
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {loading && (
          <div className="flex items-center gap-2 text-(--text-muted) text-xs font-mono">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-(--neon) border-t-transparent animate-spin" />
            <span className="font-display tracking-wider terminal-text">Processing insights...</span>
          </div>
        )}

        {error && (
          <p className="text-(--danger) text-xs py-2 font-mono">Error: {error}</p>
        )}

        {!loading && !error && !hasContent && (
          <div className="text-center py-8">
            <div className="border border-(--neon-dim) rounded-lg p-4 font-mono text-(--text-muted) text-xs">
              <p className="text-(--neon) terminal-text font-display text-xs tracking-wider mb-2">AI INSIGHTS</p>
              <p>Summary will appear here after the meeting or when requested.</p>
              <p className="text-[11px] mt-2 opacity-75">Say &quot;Hey Assistant, summarize&quot; during call</p>
            </div>
          </div>
        )}

        {summary && summaryPoints.length > 0 && (
          <div>
            <p className="font-display text-xs font-bold text-(--neon) uppercase tracking-wider mb-2 terminal-text">
              Key Discussion Points
            </p>
            <div className="font-mono text-xs text-(--text-muted) mb-2">────────────────</div>
            <ul className="space-y-1.5 text-xs text-foreground font-mono">
              {summaryPoints.map((line, idx) => (
                <li key={idx} className="flex gap-2 leading-relaxed">
                  <span className="text-(--neon) shrink-0">◆</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {actionItems.length > 0 && (
          <div>
            <p className="font-display text-xs font-bold text-(--neon) uppercase tracking-wider mb-2 terminal-text">
              Action Items ({actionItems.filter(i => i.completed).length}/{actionItems.length})
            </p>
            <div className="font-mono text-xs text-(--text-muted) mb-2">────────────────</div>
            <div className="rounded-lg border border-(--neon-dim) overflow-hidden">
              <div className="space-y-1 p-2 bg-black/40">
                {actionItems.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    onClick={() => item._id && handleToggleActionItem(item._id, item.completed)}
                    className={`flex items-start gap-2.5 p-2 rounded border transition cursor-pointer font-mono text-xs ${
                      item.completed
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300 line-through opacity-75"
                        : "bg-black/30 border-(--neon-dim)/40 text-white hover:border-(--neon-dim)"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(item.completed)}
                      onChange={() => {}} // Handled by div click
                      className="mt-0.5 rounded border-(--neon-dim) text-(--neon) focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-snug">{item.task}</p>
                      <div className="flex gap-3 text-[10px] text-(--text-muted) mt-0.5">
                        <span>Assignee: {item.assigned_to}</span>
                        <span>Due: {item.deadline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SummaryPanel.displayName = 'SummaryPanel';

export default SummaryPanel;
