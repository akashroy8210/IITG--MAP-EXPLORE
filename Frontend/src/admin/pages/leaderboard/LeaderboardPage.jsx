import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import BentoCard from "../../components/BentoCard";
import NeoButton from "../../components/NeoButton";
import { studentService } from "../../api/studentService";
import { useAdminSocket } from "../../hooks/useAdminSocket";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds) || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (h > 0) parts.push(h + "h");
  if (m > 0 || h > 0) parts.push(m + "m");
  parts.push(s + "s");
  return parts.join(" ");
}

function rankLabel(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "#" + rank;
}

function getRankBg(rank) {
  if (rank === 1) return { background: "#fff9db", border: "3px solid #f59e0b" };
  if (rank === 2) return { background: "#f0f0f0", border: "3px solid #9ca3af" };
  if (rank === 3) return { background: "#fff1e6", border: "3px solid #f97316" };
  return { background: "var(--neo-white)", border: "var(--neo-border-sm)" };
}

// ─── Question Progress Component ──────────────────────────────────────────────

function QuestionProgressBar({ solved, total, compact = false }) {
  if (total == null || total === 0) {
    return <span style={{ color: "var(--neo-gray)", fontWeight: 700, fontSize: 12 }}>—</span>;
  }
  const pct = Math.min(100, Math.round((solved / total) * 100));
  const isComplete = solved >= total;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 2 : 4, minWidth: compact ? 90 : 120 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            fontSize: compact ? 13 : 15,
            color: isComplete ? "var(--neo-green)" : "#d97706",
          }}
        >
          {solved}
          <span style={{ fontWeight: 600, color: "var(--neo-gray)", fontSize: compact ? 10 : 12 }}>/{total}</span>
        </span>
        <span
          style={{
            padding: "1px 5px",
            background: isComplete ? "var(--neo-green)" : "var(--neo-yellow)",
            border: "1.5px solid var(--neo-black)",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: 9,
            textTransform: "uppercase",
            color: "var(--neo-black)",
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: compact ? 5 : 7,
          background: "#e5e0d8",
          border: "1.5px solid var(--neo-black)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: isComplete ? "var(--neo-green)" : "var(--neo-purple)",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Live Timer Component ─────────────────────────────────────────────────────

function LiveTimer({ student, tick }) {
  const isCompleted = student.gameStatus === "completed";
  const isInProgress = student.gameStatus === "in_progress";

  if (!student.startedAt) return <span style={{ color: "var(--neo-gray)" }}>—</span>;

  let currentAdj = student.adjustedTimeSeconds || 0;
  if (isInProgress) {
    const start = new Date(student.startedAt).getTime();
    const raw = Math.max(0, Math.floor((tick - start) / 1000));
    currentAdj = Math.max(0, raw + (student.totalHintPenaltySeconds || 0));
  }

  return (
    <span
      style={{
        fontFamily: "var(--font-heading)",
        fontWeight: 900,
        fontSize: 13,
        color: isCompleted ? "var(--neo-purple)" : isInProgress ? "#d97706" : "var(--neo-black)",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {isInProgress && (
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0, animation: "pulse 1s infinite" }} />
      )}
      {formatDuration(currentAdj)}
    </span>
  );
}

// ─── Flash Hook ───────────────────────────────────────────────────────────────

function useFlash(duration = 2500) {
  const [flashedIds, setFlashedIds] = useState(new Set());
  const flash = useCallback((id) => {
    setFlashedIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setFlashedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, duration);
  }, [duration]);
  return { flashedIds, flash };
}

// ─── Event Feed Component ─────────────────────────────────────────────────────

const EVENT_META = {
  game_started:        { emoji: "🚀", label: "GAME STARTED",       bg: "var(--neo-blue)" },
  answer_solved:       { emoji: "✅", label: "ANSWER SOLVED",       bg: "var(--neo-green)" },
  code_verified:       { emoji: "📍", label: "LOCATION VERIFIED",  bg: "var(--neo-purple)", color: "#fff" },
  hint_used:           { emoji: "💡", label: "HINT USED",           bg: "var(--neo-orange)" },
  game_completed:      { emoji: "🏆", label: "GAME COMPLETED!",     bg: "var(--neo-yellow)" },
  leaderboard_updated: { emoji: "🔄", label: "LB UPDATED",          bg: "var(--neo-yellow)" },
  final_solved:        { emoji: "🎯", label: "FINAL SOLVED",         bg: "var(--neo-pink)", color: "#fff" },
};

function LiveEventFeed({ events }) {
  if (!events.length) {
    return <div style={{ padding: 20, textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--neo-gray)" }}>Waiting for live events…</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {events.slice(0, 8).map((ev, i) => {
        const meta = EVENT_META[ev.event] || { emoji: "📡", label: ev.event.toUpperCase(), bg: "var(--neo-gray-light)" };
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 10px", background: meta.bg, border: "var(--neo-border-sm)", color: meta.color || "var(--neo-black)" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{meta.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 10, textTransform: "uppercase" }}>{meta.label}</div>
              {ev.studentName && <div style={{ fontSize: 9, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.studentName}</div>}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, flexShrink: 0 }}>{ev.time}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Podium Components ────────────────────────────────────────────────────────

function PodiumCard({ student, medal, height, color }) {
  if (!student) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ background: "var(--neo-white)", border: "var(--neo-border)", boxShadow: "var(--neo-shadow)", padding: "14px 18px", textAlign: "center", minWidth: 150 }}>
        <div style={{ fontSize: 34, marginBottom: 6 }}>{medal}</div>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, textTransform: "uppercase" }}>{student.name}</div>
        <div style={{ fontSize: 11, color: "var(--neo-gray)", fontWeight: 700, marginTop: 2 }}>@{student.username}</div>
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "var(--neo-green)" }}>
          ✅ {student.answersSolved}/{student.totalQuestions} Qs solved
        </div>
        <div style={{ marginTop: 6, padding: "5px 10px", background: color, border: "var(--neo-border-sm)", fontWeight: 800, fontSize: 13 }}>
          🏁 {formatDuration(student.adjustedTimeSeconds)}
        </div>
      </div>
      <div style={{ background: color, border: "var(--neo-border)", width: 110, height, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 26 }}>
        {medal}
      </div>
    </div>
  );
}

function Podium({ top3 }) {
  if (!top3 || !top3.length) return null;
  const [first, second, third] = top3;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 14, padding: "20px 0 0" }}>
      {second && <PodiumCard student={second} medal="🥈" height={75} color="var(--neo-gray-light)" />}
      {first && <PodiumCard student={first} medal="🥇" height={115} color="var(--neo-yellow)" />}
      {third && <PodiumCard student={third} medal="🥉" height={55} color="#ffe0c8" />}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [allCount, setAllCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [gameFilter, setGameFilter] = useState("all");
  const [viewMode, setViewMode] = useState("live");
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [tick, setTick] = useState(Date.now());

  const { flashedIds, flash } = useFlash(2500);

  // 1-second tick for live timer calculation
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch leaderboard data from backend API endpoint
  const fetchLeaderboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setError("");
      const res = await studentService.getLeaderboard();
      setLeaderboard(res.leaderboard || []);
      setAllCount(res.allStudentsCount || 0);
      setLastRefreshed(new Date());
    } catch {
      setError("Failed to load leaderboard data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // Socket event listener: re-fetch instantly when any event occurs
  const handleSocketEvent = useCallback((event, payload) => {
    fetchLeaderboard(true);
    if (payload?.userId) flash(String(payload.userId));
    setLiveEvents((prev) => [
      {
        event,
        payload,
        studentName: payload?.studentName || null,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      },
      ...prev.slice(0, 19),
    ]);
  }, [fetchLeaderboard, flash]);

  useAdminSocket({
    onUpdate: handleSocketEvent,
    onConnected: () => setSocketConnected(true),
    onDisconnected: () => setSocketConnected(false),
  });

  // Derived counts
  const completedCount = leaderboard.filter((s) => s.gameStatus === "completed").length;
  const inProgressCount = leaderboard.filter((s) => s.gameStatus === "in_progress").length;
  const totalStarted = leaderboard.length;
  const notStartedCount = Math.max(0, allCount - totalStarted);
  const top3 = leaderboard.filter((s) => s.gameStatus === "completed").slice(0, 3);
  const showPodium = viewMode === "final" && top3.length > 0;

  const filtered = gameFilter === "all" ? leaderboard : leaderboard.filter((s) => s.gameStatus === gameFilter);

  const TH = { background: "var(--neo-yellow)", color: "var(--neo-black)", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", padding: "12px 13px", borderBottom: "var(--neo-border)", borderRight: "2px solid var(--neo-black)", textAlign: "left", whiteSpace: "nowrap" };
  const TD = { padding: "10px 13px", borderBottom: "2px solid var(--neo-black)", borderRight: "2px solid #ddd", fontWeight: 600, verticalAlign: "middle" };

  return (
    <AdminLayout>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 900, textTransform: "uppercase", margin: 0 }}>🏆 GAME LEADERBOARD</h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--neo-gray)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>Live student rankings — real-time WebSocket updates</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", border: "2px solid var(--neo-black)", fontWeight: 800, fontSize: 11, background: socketConnected ? "var(--neo-green)" : "var(--neo-pink)", color: socketConnected ? "var(--neo-black)" : "#fff" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block", ...(socketConnected ? { animation: "pulse 1.5s infinite" } : {}) }} />
              {socketConnected ? "SOCKET LIVE" : "SOCKET OFFLINE"}
            </span>
            {lastRefreshed && <span style={{ color: "var(--neo-purple)" }}>· Synced {lastRefreshed.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <NeoButton variant="yellow" className="neo-btn-sm" onClick={() => fetchLeaderboard()}>↻ REFRESH</NeoButton>
          <NeoButton variant={viewMode === "final" ? "black" : "white"} className="neo-btn-sm" onClick={() => setViewMode((v) => (v === "live" ? "final" : "live"))}>
            {viewMode === "final" ? "🎬 FINAL VIEW" : "📡 LIVE VIEW"}
          </NeoButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="bento-grid" style={{ marginBottom: 24 }}>
        {[
          { l: "TOTAL STARTED", v: totalStarted, i: "🚀", vr: "yellow" },
          { l: "IN PROGRESS", v: inProgressCount, i: "⏳", vr: "purple" },
          { l: "COMPLETED", v: completedCount, i: "✅", vr: "green" },
          { l: "NOT STARTED", v: notStartedCount, i: "💤", vr: "pink" },
        ].map(({ l, v, i, vr }) => (
          <div key={l} className={"neo-card neo-card-" + vr + " bento-span-3"}>
            <div className="card-header-row"><span className="card-title">{l}</span><span className="card-icon-badge">{i}</span></div>
            <div className="stat-value">{v}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Table + Live Event Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18, alignItems: "start", marginBottom: 24 }}>

        {/* Table Container */}
        <div className="neo-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "var(--neo-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "var(--neo-white)" }}>
            <div>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>
                {viewMode === "final" ? "📋 FINAL RANKINGS" : "📡 LIVE RANKINGS"}
              </span>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--neo-gray)", marginTop: 2 }}>
                Sorted by Completion Status → Questions Solved → Adjusted Time
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "in_progress", "completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setGameFilter(f)}
                  style={{
                    padding: "4px 10px",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 800,
                    fontSize: 10,
                    textTransform: "uppercase",
                    border: "var(--neo-border-sm)",
                    cursor: "pointer",
                    background: gameFilter === f ? "var(--neo-purple)" : "var(--neo-white)",
                    color: gameFilter === f ? "#fff" : "var(--neo-black)",
                    boxShadow: "var(--neo-shadow-sm)",
                  }}
                >
                  {f === "all" ? "ALL" : f === "in_progress" ? "IN PROG" : "DONE"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", fontWeight: 800, color: "var(--neo-gray)" }}>⏳ Loading leaderboard data…</div>
          ) : error ? (
            <div style={{ padding: 16, background: "var(--neo-pink)", color: "#fff", fontWeight: 800 }}>⚠️ {error}</div>
          ) : !filtered.length ? (
            <div style={{ padding: 40, textAlign: "center", fontWeight: 800, color: "var(--neo-gray)" }}>No active participants found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["#", "STUDENT", "MAP", "STATUS", "QUESTIONS SOLVED", "⏱ LIVE TIMER", "PENALTY", "STARTED"].map((h) => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const done = s.gameStatus === "completed";
                    const ip = s.gameStatus === "in_progress";
                    const flashed = flashedIds.has(String(s._id));
                    const bg = flashed ? "#bbf7d0" : done ? "#e6fcf5" : ip ? "#fdf8e6" : "var(--neo-white)";
                    return (
                      <tr key={s._id} style={{ background: bg, transition: "background 0.6s ease" }}>
                        <td style={{ ...TD, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: s.rank <= 3 ? 20 : 14, textAlign: "center", minWidth: 48 }}>
                          {rankLabel(s.rank)}
                        </td>
                        <td style={{ ...TD, whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 900, fontSize: 14 }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: "var(--neo-gray)", fontWeight: 600 }}>@{s.username} · #{s.userNumber}</div>
                        </td>
                        <td style={{ ...TD, fontSize: 12, whiteSpace: "nowrap" }}>{s.map?.name || "—"}</td>
                        <td style={{ ...TD, whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 7px", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 10, textTransform: "uppercase", border: "2px solid var(--neo-black)", boxShadow: "2px 2px 0 var(--neo-black)", background: done ? "var(--neo-green)" : ip ? "var(--neo-yellow)" : "var(--neo-gray-light)", whiteSpace: "nowrap" }}>
                            {ip && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 1s infinite", flexShrink: 0 }} />}
                            {done ? "✅ DONE" : ip ? "IN PROG" : "WAITING"}
                          </span>
                        </td>
                        {/* Questions Solved Progress Bar */}
                        <td style={{ ...TD, minWidth: 145 }}>
                          <QuestionProgressBar solved={s.answersSolved ?? 0} total={s.totalQuestions} />
                        </td>
                        {/* Live Timer */}
                        <td style={{ ...TD, whiteSpace: "nowrap" }}>
                          <LiveTimer student={s} tick={tick} />
                        </td>
                        <td style={{ ...TD, whiteSpace: "nowrap", color: (s.totalHintPenaltySeconds || 0) > 0 ? "#dc2626" : "var(--neo-gray)", fontWeight: 800, fontSize: 12 }}>
                          {(s.totalHintPenaltySeconds || 0) > 0 ? "+" + s.totalHintPenaltySeconds + "s" : "—"}
                        </td>
                        <td style={{ ...TD, fontSize: 11, color: "var(--neo-gray)", whiteSpace: "nowrap" }}>
                          {s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          {!loading && !error && (
            <div style={{ padding: "7px 12px", borderTop: "2px solid var(--neo-black)", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 10, fontWeight: 700, background: "var(--neo-surface)" }}>
              {[["#e6fcf5", "Completed"], ["#fdf8e6", "In Progress"], ["#bbf7d0", "Live Flash"]].map(([bg, lbl]) => (
                <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ display: "inline-block", width: 11, height: 11, background: bg, border: "2px solid var(--neo-black)" }} />
                  {lbl}
                </span>
              ))}
              <span style={{ color: "var(--neo-gray)", marginLeft: 4 }}>Updates instantly over WebSocket when any student answers a question or completes a stage!</span>
            </div>
          )}
        </div>

        {/* Live Event Feed Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="neo-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "9px 13px", borderBottom: "var(--neo-border)", background: "var(--neo-black)", color: "#fff" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>📡 LIVE EVENTS</div>
              <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.6, marginTop: 1 }}>Real-time game activity stream</div>
            </div>
            <div style={{ padding: 9 }}>
              <LiveEventFeed events={liveEvents} />
            </div>
          </div>

          <div className="neo-card neo-card-dark" style={{ padding: 13 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 10, textTransform: "uppercase", marginBottom: 9, color: "var(--neo-yellow)" }}>⚡ QUICK STATS</div>
            {[
              ["Events Logged", liveEvents.length],
              ["Active Participants", totalStarted],
              ["Completion Rate", allCount > 0 ? Math.round((completedCount / allCount) * 100) + "%" : "—"],
              ["Real-time Mode", "WebSocket Push"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                <span style={{ opacity: 0.6 }}>{l}</span>
                <span style={{ color: "var(--neo-yellow)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Podium */}
      {showPodium && (
        <div className="bento-grid" style={{ marginBottom: 24 }}>
          <BentoCard title="🏆 FINAL PODIUM — TOP FINISHERS" subtitle="Ranked by questions solved then adjusted time" span="bento-span-12" variant="yellow">
            <Podium top3={top3} />
            <div style={{ display: "flex", gap: 13, marginTop: 20, flexWrap: "wrap" }}>
              {top3.map((s) => (
                <div key={s._id} style={{ flex: "1 1 170px", padding: 13, background: s.rank === 1 ? "#fff9db" : s.rank === 2 ? "#f0f0f0" : "#fff1e6", border: "2px solid var(--neo-black)", boxShadow: "var(--neo-shadow-sm)" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16 }}>{rankLabel(s.rank)} {s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--neo-gray)", fontWeight: 700, marginBottom: 7 }}>@{s.username} · #{s.userNumber}</div>
                  <div style={{ marginBottom: 7 }}>
                    <QuestionProgressBar solved={s.answersSolved ?? 0} total={s.totalQuestions} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, fontWeight: 700 }}>
                    <span>⏱ Raw Time: {formatDuration(s.rawTimeSeconds)}</span>
                    {(s.totalHintPenaltySeconds || 0) > 0 && <span style={{ color: "#dc2626" }}>⚠️ +{s.totalHintPenaltySeconds}s penalty</span>}
                    <span style={{ color: "var(--neo-purple)", fontWeight: 900 }}>🏁 Adjusted: {formatDuration(s.adjustedTimeSeconds)}</span>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>
      )}

      {/* Individual Progress Cards */}
      {!loading && leaderboard.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 900, textTransform: "uppercase", marginBottom: 13, display: "flex", alignItems: "center", gap: 10 }}>
            📊 INDIVIDUAL PROGRESS CARDS
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--neo-gray)" }}>({leaderboard.length} participants)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px,1fr))", gap: 12 }}>
            {leaderboard.map((s) => {
              const done = s.gameStatus === "completed";
              const ip = s.gameStatus === "in_progress";
              const flashed = flashedIds.has(String(s._id));
              const bg = flashed ? "#bbf7d0" : done ? "#e6fcf5" : ip ? "#fdf8e6" : "var(--neo-white)";
              return (
                <div key={s._id} style={{ background: bg, border: "var(--neo-border)", boxShadow: "var(--neo-shadow-sm)", padding: 13, position: "relative", transition: "background 0.6s ease" }}>
                  <div style={{ position: "absolute", top: 10, right: 10, fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: s.rank <= 3 ? 19 : 12 }}>{rankLabel(s.rank)}</div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13, textTransform: "uppercase", paddingRight: 32 }}>{s.name}</div>
                  <div style={{ fontSize: 9, color: "var(--neo-gray)", fontWeight: 700, marginBottom: 7 }}>@{s.username} · #{s.userNumber}</div>
                  <div style={{ marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                    {ip && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 1s infinite" }} />}
                    <span style={{ display: "inline-block", padding: "1px 6px", background: done ? "var(--neo-green)" : ip ? "var(--neo-yellow)" : "var(--neo-gray-light)", border: "2px solid var(--neo-black)", fontWeight: 800, fontSize: 9, textTransform: "uppercase" }}>
                      {done ? "✅ DONE" : ip ? "⏳ IN PROGRESS" : "💤 WAITING"}
                    </span>
                  </div>
                  {s.map && <div style={{ fontSize: 9, fontWeight: 700, color: "var(--neo-gray)", marginBottom: 7 }}>🗺️ {s.map.name}</div>}
                  <div style={{ marginBottom: 9 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--neo-gray)", marginBottom: 3 }}>Questions Solved</div>
                    <QuestionProgressBar solved={s.answersSolved ?? 0} total={s.totalQuestions} compact />
                  </div>
                  <div style={{ borderTop: "2px solid var(--neo-black)", paddingTop: 7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--neo-gray)", textTransform: "uppercase" }}>Adjusted Time</span>
                      <LiveTimer student={s} tick={tick} />
                    </div>
                    {(s.totalHintPenaltySeconds || 0) > 0 && <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626" }}>⚠️ +{s.totalHintPenaltySeconds}s penalty</div>}
                    <div style={{ fontSize: 9, fontWeight: 600, color: "var(--neo-gray)", marginTop: 2 }}>
                      Started: {s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      {s.completedAt && " · Done: " + new Date(s.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
