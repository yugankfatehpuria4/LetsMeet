"use client";

import { useEffect, useState, useMemo, memo, useRef } from "react";

const SummaryPanel = memo(({ meetingId }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    if (!meetingId) return;

    let cancelled = false;
    let inFlight = false;
    const controller = new AbortController();

    const fetchData = async () => {
      if (inFlight) return;
      // Safety throttle for Next.js dev re-mount / fast-refresh scenarios.
      const now = Date.now();
      if (now - lastFetchRef.current < 4000) return;
      lastFetchRef.current = now;
      inFlight = true;

      setLoading(true);
      setError(null);

      try {
        const [summaryRes, actionItemsRes] = await Promise.all([
          fetch(`/api/summary?meeting_id=${meetingId}`, { signal: controller.signal }),
          fetch(`/api/action-items?meeting_id=${meetingId}`, { signal: controller.signal }),
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
          // Keep existing state if backend isn't ready yet.
          setActionItems([]);
        }
      } catch (err) {
        if (!cancelled && err?.name !== "AbortError") {
          setError("Failed to fetch");
          console.error("SummaryPanel fetch error:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
        inFlight = false;
      }
    };

    fetchData();
    const intervalId = window.setInterval(fetchData, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, [meetingId]);

  const summaryPoints = useMemo(() => {
    if (!summary?.summary) return [];
    return summary.summary.split("\n").filter(Boolean);
  }, [summary?.summary]);

  const actionItemsList = useMemo(() => {
    if (!summary?.action_items) return [];
    return summary.action_items;
  }, [summary?.action_items]);

  const hasContent = summary || actionItems.length > 0;

  return (
    <div className="flex flex-col border-t border-(--neon-dim) min-h-0 flex-1">
      <div className="px-4 py-3 border-b border-(--neon-dim) shrink-0">
        <h3 className="font-display text-sm font-bold tracking-[0.15em] text-(--neon) uppercase terminal-text">
          AI assistant
        </h3>
        <p className="text-(--text-muted) text-xs mt-0.5 font-mono">
          Summary & action items after the call
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {loading && (
          <div className="flex items-center gap-2 text-(--text-muted) text-sm font-mono">
            <div className="w-4 h-4 rounded-full border-2 border-(--neon) border-t-transparent animate-spin" />
            <span className="font-display tracking-wider terminal-text">Processing...</span>
          </div>
        )}
        {error && (
          <p className="text-(--danger) text-sm py-2 font-mono">Error: {error}</p>
        )}
        {!loading && !error && !hasContent && (
          <div className="text-center py-8">
            <div className="border border-(--neon-dim) rounded-lg p-4 font-mono text-(--text-muted) text-sm">
              <p className="text-(--neon) terminal-text font-display text-xs tracking-wider mb-2">AI INSIGHTS</p>
              <p>Summary will appear here after the meeting ends.</p>
              <p className="text-xs mt-2 opacity-75">Real-time updates every 10 seconds</p>
            </div>
          </div>
        )}

        {summary && summaryPoints.length > 0 && (
          <div>
            <p className="font-display text-xs font-bold text-(--neon) uppercase tracking-wider mb-2 terminal-text">
              Key discussion points
            </p>
            <div className="font-mono text-xs text-(--text-muted) mb-2">────────────────</div>
            <ul className="space-y-1.5 text-sm text-foreground font-mono">
              {summaryPoints.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-(--neon)">◆</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {actionItems.length > 0 && (
          <div>
            <p className="font-display text-xs font-bold text-(--neon) uppercase tracking-wider mb-2 terminal-text">
              Action items
            </p>
            <div className="font-mono text-xs text-(--text-muted) mb-2">────────────────</div>
            <div className="rounded-lg border border-(--neon-dim) overflow-hidden">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="bg-black/50 text-(--neon)">
                    <th className="text-left px-3 py-2.5 font-display font-bold tracking-wider">Task</th>
                    <th className="text-left px-3 py-2.5 font-display font-bold tracking-wider whitespace-nowrap w-24">Assigned</th>
                    <th className="text-left px-3 py-2.5 font-display font-bold tracking-wider whitespace-nowrap w-24">Deadline</th>
                  </tr>
                </thead>
                <tbody className="text-foreground divide-y divide-(--neon-dim)">
                  {actionItems.map((item, idx) => (
                    <tr key={idx} className="bg-black/20">
                      <td className="px-3 py-2.5">{item.task}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-(--text-muted)">{item.assigned_to}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-(--text-muted)">{item.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {actionItemsList.length > 0 && actionItems.length === 0 && (
          <div>
            <p className="font-display text-xs font-bold text-(--neon) uppercase tracking-wider mb-2 terminal-text">
              Action items
            </p>
            <div className="font-mono text-xs text-(--text-muted) mb-2">────────────────</div>
            <ul className="space-y-1.5 text-sm text-foreground font-mono">
              {actionItemsList.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-(--neon)">◆</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

SummaryPanel.displayName = 'SummaryPanel';

export default SummaryPanel;
