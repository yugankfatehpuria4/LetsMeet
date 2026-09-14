"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/meetings")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setMeetings(data.meetings || []);
        }
      })
      .catch((err) => console.error("Failed to load meetings dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectMeeting = async (meetingId) => {
    setSelectedMeeting(meetingId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/meetings?meeting_id=${meetingId}`);
      const data = await res.json();
      if (data.ok) {
        setMeetingDetails(data);
      }
    } catch (err) {
      console.error("Failed to load meeting details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredMeetings = meetings.filter(
    (m) =>
      m.meeting_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.created_by && m.created_by.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-mesh-with-grid flex flex-col text-white">
      {/* HEADER */}
      <header className="border-b border-(--neon-dim) px-6 py-4 glass flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-xl font-bold text-white tracking-wider hover:text-(--neon) transition">
            LetsMeet
          </Link>
          <span className="text-(--neon) font-mono">◆</span>
          <span className="font-display text-xs tracking-widest text-(--neon) uppercase">
            Meeting Intelligence Dashboard
          </span>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-black/40 border border-(--neon-dim) text-(--neon) text-xs font-mono tracking-wider hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition"
        >
          + New Meeting
        </Link>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* LEFT COLUMN - MEETING LIST */}
        <section className="w-full lg:w-1/3 flex flex-col glass-panel rounded-2xl p-4 border border-(--neon-dim) min-h-[500px]">
          <div className="mb-4">
            <h2 className="font-display text-sm uppercase tracking-wider text-(--neon) mb-2">
              Past Meetings ({filteredMeetings.length})
            </h2>
            <input
              type="text"
              placeholder="Search meetings..."
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-(--neon-dim) text-xs font-mono text-white placeholder-(--text-muted) focus:outline-none focus:border-(--neon)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {loading ? (
              <div className="text-center py-10 font-mono text-xs text-(--text-muted)">
                Loading history...
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs text-(--text-muted)">
                No meetings found. Start a meeting to view records here!
              </div>
            ) : (
              filteredMeetings.map((m) => (
                <button
                  key={m._id || m.meeting_id}
                  onClick={() => handleSelectMeeting(m.meeting_id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedMeeting === m.meeting_id
                      ? "bg-(--neon)/15 border-(--neon) shadow-[0_0_15px_rgba(0,245,255,0.2)]"
                      : "bg-black/30 border-(--neon-dim)/50 hover:border-(--neon-dim)"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-display text-sm font-bold truncate max-w-[180px] text-white">
                      {m.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded text-(--neon) bg-(--neon)/10 border border-(--neon-dim)">
                      {m.status || "ended"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-(--text-muted) mb-2">
                    <span>ID: {m.meeting_id}</span>
                    <span>•</span>
                    <span>{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 text-[10px] font-mono text-(--neon)">
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-(--neon-dim)">
                      📝 {m.transcriptCount || 0} Captions
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-(--neon-dim)">
                      🎯 {m.actionItemsCount || 0} Action Items
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* RIGHT COLUMN - MEETING DETAILS */}
        <section className="flex-1 glass-panel rounded-2xl p-6 border border-(--neon-dim) flex flex-col min-h-[500px]">
          {!selectedMeeting ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full border border-(--neon) flex items-center justify-center text-(--neon) font-display text-xl mb-4 shadow-[0_0_20px_rgba(0,245,255,0.3)]">
                ✦
              </div>
              <h3 className="font-display text-lg tracking-wider text-white mb-2">
                Select a Meeting
              </h3>
              <p className="text-xs font-mono text-(--text-muted) max-w-sm">
                Click any meeting from the list to view full transcript history, AI summaries, and action item details.
              </p>
            </div>
          ) : loadingDetails ? (
            <div className="flex-1 flex items-center justify-center font-mono text-xs text-(--neon)">
              Loading meeting insights...
            </div>
          ) : !meetingDetails ? (
            <div className="flex-1 flex items-center justify-center font-mono text-xs text-(--danger)">
              Failed to load details for meeting: {selectedMeeting}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 space-y-6 overflow-y-auto pr-1 scrollbar-thin">
              {/* DETAIL HEADER */}
              <div className="border-b border-(--neon-dim) pb-4 flex justify-between items-start">
                <div>
                  <h2 className="font-display text-xl font-bold text-white tracking-wider mb-1">
                    {meetingDetails.meeting?.title || `Meeting ${selectedMeeting}`}
                  </h2>
                  <div className="flex items-center gap-3 text-xs font-mono text-(--text-muted)">
                    <span>ID: {selectedMeeting}</span>
                    <span>•</span>
                    <span>Host: {meetingDetails.meeting?.created_by || "Anonymous"}</span>
                    <span>•</span>
                    <span>
                      {new Date(meetingDetails.meeting?.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/meeting/${selectedMeeting}`}
                  className="px-4 py-2 rounded-xl bg-(--neon) text-black font-display text-xs font-bold uppercase tracking-wider hover:bg-cyan-400 transition"
                >
                  Join Room
                </Link>
              </div>

              {/* AI SUMMARY SECTION */}
              <div className="bg-black/40 border border-(--neon-dim) rounded-xl p-5">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-(--neon) mb-3 flex items-center gap-2">
                  <span>✦ AI Summary & Key Decisions</span>
                </h3>
                {meetingDetails.summary?.summary ? (
                  <div className="space-y-2 text-sm font-mono text-foreground leading-relaxed">
                    {meetingDetails.summary.summary.split("\n").map((pt, i) => (
                      <p key={i} className="flex gap-2">
                        <span className="text-(--neon)">◆</span>
                        <span>{pt}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-(--text-muted)">
                    No summary generated yet for this session.
                  </p>
                )}
              </div>

              {/* ACTION ITEMS SECTION */}
              <div className="bg-black/40 border border-(--neon-dim) rounded-xl p-5">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-(--neon) mb-3 flex items-center gap-2">
                  <span>🎯 Action Items ({meetingDetails.actionItems?.length || 0})</span>
                </h3>
                {meetingDetails.actionItems?.length > 0 ? (
                  <div className="rounded-lg border border-(--neon-dim)/50 overflow-hidden">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-black/60 text-(--neon)">
                          <th className="p-2.5 text-left font-display">Task</th>
                          <th className="p-2.5 text-left font-display w-28">Assigned</th>
                          <th className="p-2.5 text-left font-display w-28">Deadline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--neon-dim)/40">
                        {meetingDetails.actionItems.map((item, idx) => (
                          <tr key={idx} className="bg-black/20">
                            <td className="p-2.5 text-white">{item.task}</td>
                            <td className="p-2.5 text-(--text-muted)">{item.assigned_to}</td>
                            <td className="p-2.5 text-(--text-muted)">{item.deadline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-(--text-muted)">
                    No action items extracted.
                  </p>
                )}
              </div>

              {/* TRANSCRIPT ENTRIES */}
              <div className="bg-black/40 border border-(--neon-dim) rounded-xl p-5">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-(--neon) mb-3 flex items-center gap-2">
                  <span>📝 Transcript Logs ({meetingDetails.transcripts?.length || 0})</span>
                </h3>
                {meetingDetails.transcripts?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                    {meetingDetails.transcripts.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-black/40 border border-(--neon-dim)/30 text-xs font-mono"
                      >
                        <div className="flex justify-between text-[11px] text-(--neon) mb-1">
                          <span>{t.speaker}</span>
                          <span className="text-(--text-muted)">
                            {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-foreground">{t.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-(--text-muted)">
                    No transcript entries saved for this call.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
