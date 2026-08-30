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

/**
 * Formats a Date/Timestamp into standard Indian Format (en-IN, IST)
 * Example: 30/08/2026, 02:30:45 pm
 */
function formatIndianDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function rankLabel(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "#" + rank;
}

// ─── Question Progress Bar Component ──────────────────────────────────────────

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

// ─── Podium Component ─────────────────────────────────────────────────────────

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

// ─── Student Detail Drawer Modal ──────────────────────────────────────────────

function StudentDetailDrawer({ student, onClose }) {
  if (!student) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          background: "var(--neo-white)",
          height: "100%",
          boxShadow: "-4px 0 0 var(--neo-black)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: 20,
            background: "var(--neo-yellow)",
            borderBottom: "var(--neo-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>STUDENT QUESTION TIMELINE</span>
            <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 900, textTransform: "uppercase" }}>
              {student.name}
            </h3>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>
              @{student.username} · #{student.userNumber}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "6px 14px",
              background: "var(--neo-black)",
              color: "#fff",
              border: "var(--neo-border-sm)",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: 20, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Game Timestamps Summary Card */}
          <div
            style={{
              padding: 16,
              background: "var(--neo-surface)",
              border: "var(--neo-border)",
              boxShadow: "var(--neo-shadow-sm)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--neo-gray)", textTransform: "uppercase" }}>🚀 GAME START TIME</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2, color: "var(--neo-black)" }}>
                {formatIndianDateTime(student.startedAt)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--neo-gray)", textTransform: "uppercase" }}>🏁 GAME END TIME</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2, color: student.completedAt ? "var(--neo-green)" : "#d97706" }}>
                {student.completedAt ? formatIndianDateTime(student.completedAt) : student.gameStatus === "in_progress" ? "⏳ In Progress" : "💤 Not Started"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--neo-gray)", textTransform: "uppercase" }}>🗺️ ASSIGNED MAP</div>
              <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>{student.map?.name || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--neo-gray)", textTransform: "uppercase" }}>🔢 QUESTION SET</div>
              <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>{student.setsKey || "—"}</div>
            </div>
          </div>

          {/* Question Breakdown Timeline */}
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 900, textTransform: "uppercase", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>📋 QUESTION-BY-QUESTION TIMELINE</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--neo-green)" }}>
                {student.verifiedCount || student.solvedCount || 0} / {student.totalQuestions || 0} Questions Solved
              </span>
            </div>

            {(!student.questions || !student.questions.length) ? (
              <div style={{ padding: 20, textAlign: "center", fontWeight: 700, color: "var(--neo-gray)", border: "var(--neo-border-sm)" }}>
                No question progress data recorded yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {student.questions.map((q) => {
                  const isVerified = q.status === "location_verified";
                  const isSolved = q.status === "answer_solved" || isVerified;

                  return (
                    <div
                      key={q.questionId}
                      style={{
                        padding: 14,
                        background: isVerified ? "#e6fcf5" : isSolved ? "#fdf8e6" : "var(--neo-white)",
                        border: "var(--neo-border)",
                        boxShadow: "var(--neo-shadow-sm)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13, textTransform: "uppercase" }}>
                          Q{q.sequence}. {q.questionText}
                        </span>
                        <span
                          style={{
                            padding: "2px 8px",
                            fontSize: 10,
                            fontFamily: "var(--font-heading)",
                            fontWeight: 800,
                            border: "1.5px solid var(--neo-black)",
                            background: isVerified ? "var(--neo-green)" : isSolved ? "var(--neo-yellow)" : "var(--neo-gray-light)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isVerified ? "VERIFIED ✅" : isSolved ? "SOLVED 🟡" : "UNSOLVED ⚪"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, fontWeight: 700, color: "var(--neo-gray)" }}>
                        <div>
                          <span style={{ color: "var(--neo-black)" }}>Answer Solved At: </span>
                          <span style={{ color: q.solvedAt ? "var(--neo-purple)" : "inherit", fontWeight: 800 }}>
                            {formatIndianDateTime(q.solvedAt)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--neo-black)" }}>Location Verified At: </span>
                          <span style={{ color: q.verifiedAt ? "var(--neo-green)" : "inherit", fontWeight: 800 }}>
                            {formatIndianDateTime(q.verifiedAt)}
                          </span>
                        </div>
                      </div>

                      {(q.hintsUsed || q.answerAttemptsCount > 0 || q.codeAttemptsCount > 0) && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px dashed #ccc", fontSize: 10, fontWeight: 700, display: "flex", gap: 12 }}>
                          {q.hintsUsed && <span style={{ color: "#dc2626" }}>💡 Hint Used</span>}
                          {q.answerAttemptsCount > 0 && <span>Answer Attempts: {q.answerAttemptsCount}</span>}
                          {q.codeAttemptsCount > 0 && <span>Code Attempts: {q.codeAttemptsCount}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("leaderboard"); // "leaderboard" | "progress"
  const [leaderboard, setLeaderboard] = useState([]);
  const [studentsProgress, setStudentsProgress] = useState([]);
  const [allCount, setAllCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [gameFilter, setGameFilter] = useState("all");
  const [viewMode, setViewMode] = useState("live");
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [tick, setTick] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { flashedIds, flash } = useFlash(2500);

  // 1-second tick for live timer calculation
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch leaderboard & detailed progress data
  const fetchLeaderboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setError("");
      const [lbRes, progRes] = await Promise.all([
        studentService.getLeaderboard().catch(() => ({ leaderboard: [] })),
        studentService.getStudentsProgress().catch(() => ({ students: [] })),
      ]);

      setLeaderboard(lbRes.leaderboard || []);
      setAllCount(lbRes.allStudentsCount || 0);

      // Sort student progress by number of questions solved (descending)
      const rawProg = progRes.students || [];
      rawProg.sort((a, b) => {
        const aSolved = a.verifiedCount ?? a.solvedCount ?? 0;
        const bSolved = b.verifiedCount ?? b.solvedCount ?? 0;
        if (bSolved !== aSolved) return bSolved - aSolved;
        const aDone = a.gameStatus === "completed" ? 0 : 1;
        const bDone = b.gameStatus === "completed" ? 0 : 1;
        return aDone - bDone;
      });

      setStudentsProgress(rawProg);
      setLastRefreshed(new Date());
    } catch {
      setError("Failed to load data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // Socket event listener
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

  // Filtered Leaderboard
  const filteredLeaderboard = gameFilter === "all" ? leaderboard : leaderboard.filter((s) => s.gameStatus === gameFilter);

  // Filtered & Sorted Student Progress Tab
  const filteredProgress = studentsProgress.filter((s) => {
    const matchesFilter = gameFilter === "all" || s.gameStatus === gameFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      String(s.userNumber).includes(q);
    return matchesFilter && matchesSearch;
  });

  const TH = { background: "var(--neo-yellow)", color: "var(--neo-black)", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", padding: "12px 13px", borderBottom: "var(--neo-border)", borderRight: "2px solid var(--neo-black)", textAlign: "left", whiteSpace: "nowrap" };
  const TD = { padding: "10px 13px", borderBottom: "2px solid var(--neo-black)", borderRight: "2px solid #ddd", fontWeight: 600, verticalAlign: "middle" };

  return (
    <AdminLayout>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
      `}</style>

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
            🏆 GAME LEADERBOARD & STUDENT PROGRESS
          </h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--neo-gray)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>Live student rankings — question timestamps in Indian Format (en-IN)</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", border: "2px solid var(--neo-black)", fontWeight: 800, fontSize: 11, background: socketConnected ? "var(--neo-green)" : "var(--neo-pink)", color: socketConnected ? "var(--neo-black)" : "#fff" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block", ...(socketConnected ? { animation: "pulse 1.5s infinite" } : {}) }} />
              {socketConnected ? "SOCKET LIVE" : "SOCKET OFFLINE"}
            </span>
            {lastRefreshed && <span style={{ color: "var(--neo-purple)" }}>· Synced {lastRefreshed.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <NeoButton variant="yellow" className="neo-btn-sm" onClick={() => fetchLeaderboard()}>↻ REFRESH</NeoButton>
          {activeTab === "leaderboard" && (
            <NeoButton variant={viewMode === "final" ? "black" : "white"} className="neo-btn-sm" onClick={() => setViewMode((v) => (v === "live" ? "final" : "live"))}>
              {viewMode === "final" ? "🎬 FINAL VIEW" : "📡 LIVE VIEW"}
            </NeoButton>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "var(--neo-border)", paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab("leaderboard")}
          style={{
            padding: "10px 20px",
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            fontSize: 13,
            textTransform: "uppercase",
            border: "var(--neo-border)",
            boxShadow: activeTab === "leaderboard" ? "var(--neo-shadow-sm)" : "none",
            background: activeTab === "leaderboard" ? "var(--neo-yellow)" : "var(--neo-white)",
            color: "var(--neo-black)",
            cursor: "pointer",
          }}
        >
          🏆 LEADERBOARD RANKINGS
        </button>
        <button
          onClick={() => setActiveTab("progress")}
          style={{
            padding: "10px 20px",
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            fontSize: 13,
            textTransform: "uppercase",
            border: "var(--neo-border)",
            boxShadow: activeTab === "progress" ? "var(--neo-shadow-sm)" : "none",
            background: activeTab === "progress" ? "var(--neo-purple)" : "var(--neo-white)",
            color: activeTab === "progress" ? "#fff" : "var(--neo-black)",
            cursor: "pointer",
          }}
        >
          📊 STUDENT QUESTION PROGRESS
        </button>
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

      {/* ─── TAB 1: LEADERBOARD RANKINGS ─── */}
      {activeTab === "leaderboard" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18, alignItems: "start", marginBottom: 24 }}>
            {/* Table Container */}
            <div className="neo-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "var(--neo-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "var(--neo-white)" }}>
                <div>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}>
                    {viewMode === "final" ? "📋 FINAL RANKINGS" : "📡 LIVE RANKINGS"}
                  </span>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--neo-gray)", marginTop: 2 }}>
                    Click any student row to open detailed question timeline
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
              ) : !filteredLeaderboard.length ? (
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
                      {filteredLeaderboard.map((s) => {
                        const done = s.gameStatus === "completed";
                        const ip = s.gameStatus === "in_progress";
                        const flashed = flashedIds.has(String(s._id));
                        const bg = flashed ? "#bbf7d0" : done ? "#e6fcf5" : ip ? "#fdf8e6" : "var(--neo-white)";
                        const matchingProg = studentsProgress.find((p) => String(p._id) === String(s._id));

                        return (
                          <tr
                            key={s._id}
                            onClick={() => setSelectedStudent(matchingProg || s)}
                            style={{ background: bg, transition: "background 0.6s ease", cursor: "pointer" }}
                          >
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
                            <td style={{ ...TD, minWidth: 145 }}>
                              <QuestionProgressBar solved={s.answersSolved ?? 0} total={s.totalQuestions} />
                            </td>
                            <td style={{ ...TD, whiteSpace: "nowrap" }}>
                              <LiveTimer student={s} tick={tick} />
                            </td>
                            <td style={{ ...TD, whiteSpace: "nowrap", color: (s.totalHintPenaltySeconds || 0) > 0 ? "#dc2626" : "var(--neo-gray)", fontWeight: 800, fontSize: 12 }}>
                              {(s.totalHintPenaltySeconds || 0) > 0 ? "+" + s.totalHintPenaltySeconds + "s" : "—"}
                            </td>
                            <td style={{ ...TD, fontSize: 11, color: "var(--neo-gray)", whiteSpace: "nowrap" }}>
                              {formatIndianDateTime(s.startedAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && !error && (
                <div style={{ padding: "7px 12px", borderTop: "2px solid var(--neo-black)", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 10, fontWeight: 700, background: "var(--neo-surface)" }}>
                  {[["#e6fcf5", "Completed"], ["#fdf8e6", "In Progress"], ["#bbf7d0", "Live Flash"]].map(([bg, lbl]) => (
                    <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ display: "inline-block", width: 11, height: 11, background: bg, border: "2px solid var(--neo-black)" }} />
                      {lbl}
                    </span>
                  ))}
                  <span style={{ color: "var(--neo-gray)", marginLeft: 4 }}>Click any row to open student question timeline!</span>
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
              </BentoCard>
            </div>
          )}
        </>
      )}

      {/* ─── TAB 2: STUDENT QUESTION PROGRESS (CLEAN SUMMARY & SEARCHABLE VIEW) ─── */}
      {activeTab === "progress" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Searchable Header & Filter Bar */}
          <div
            style={{
              padding: 16,
              background: "var(--neo-white)",
              border: "var(--neo-border)",
              boxShadow: "var(--neo-shadow-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 280 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12 }}>🔍 SEARCH STUDENT:</span>
              <input
                type="text"
                placeholder="Type name, username, or # to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "var(--neo-border-sm)",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  flex: 1,
                  background: "var(--neo-surface)",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "in_progress", "completed", "not_started"].map((f) => (
                <button
                  key={f}
                  onClick={() => setGameFilter(f)}
                  style={{
                    padding: "6px 12px",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 800,
                    fontSize: 11,
                    textTransform: "uppercase",
                    border: "var(--neo-border-sm)",
                    cursor: "pointer",
                    background: gameFilter === f ? "var(--neo-purple)" : "var(--neo-white)",
                    color: gameFilter === f ? "#fff" : "var(--neo-black)",
                    boxShadow: "var(--neo-shadow-sm)",
                  }}
                >
                  {f === "all" ? "ALL" : f === "in_progress" ? "IN PROG" : f === "completed" ? "DONE" : "WAITING"}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Student Cards Grid — Sorted by Questions Solved Descending */}
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", fontWeight: 800, color: "var(--neo-gray)" }}>⏳ Loading student progress data…</div>
          ) : !filteredProgress.length ? (
            <div style={{ padding: 40, textAlign: "center", fontWeight: 800, color: "var(--neo-gray)" }}>
              {searchQuery ? `No student found matching "${searchQuery}".` : "No matching student progress found."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filteredProgress.map((student, index) => {
                const isCompleted = student.gameStatus === "completed";
                const isInProgress = student.gameStatus === "in_progress";
                const bg = isCompleted ? "#e6fcf5" : isInProgress ? "#fdf8e6" : "var(--neo-white)";
                const solvedNum = student.verifiedCount || student.solvedCount || 0;

                return (
                  <div
                    key={student._id}
                    onClick={() => setSelectedStudent(student)}
                    style={{
                      background: bg,
                      border: "var(--neo-border)",
                      boxShadow: "var(--neo-shadow-sm)",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      cursor: "pointer",
                      position: "relative",
                      transition: "transform 0.1s ease, boxShadow 0.1s ease",
                    }}
                  >
                    {/* Rank Indicator Badge based on Questions Solved */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontFamily: "var(--font-heading)",
                        fontWeight: 900,
                        fontSize: index < 3 ? 18 : 12,
                      }}
                    >
                      {rankLabel(index + 1)}
                    </div>

                    {/* Student Name & Username */}
                    <div style={{ paddingRight: 40 }}>
                      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, textTransform: "uppercase" }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--neo-gray)", fontWeight: 700, marginTop: 2 }}>
                        @{student.username} · #{student.userNumber}
                      </div>
                    </div>

                    {/* Status & Assignment Badges */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          fontFamily: "var(--font-heading)",
                          fontWeight: 800,
                          fontSize: 10,
                          textTransform: "uppercase",
                          border: "2px solid var(--neo-black)",
                          background: isCompleted ? "var(--neo-green)" : isInProgress ? "var(--neo-yellow)" : "var(--neo-gray-light)",
                        }}
                      >
                        {isCompleted ? "✅ COMPLETED" : isInProgress ? "⏳ IN PROGRESS" : "💤 NOT STARTED"}
                      </span>
                      {student.map && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--neo-gray)" }}>
                          🗺️ {student.map.name}
                        </span>
                      )}
                    </div>

                    {/* Questions Solved Progress Summary Bar */}
                    <div style={{ background: "var(--neo-white)", padding: 10, border: "1.5px solid var(--neo-black)" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--neo-gray)", textTransform: "uppercase", marginBottom: 4 }}>
                        QUESTIONS SOLVED
                      </div>
                      <QuestionProgressBar solved={solvedNum} total={student.totalQuestions} />
                    </div>

                    {/* Game Start & End Timestamps in Indian Format */}
                    <div
                      style={{
                        padding: 10,
                        background: "var(--neo-surface)",
                        border: "1.5px solid var(--neo-black)",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div>
                        <span style={{ color: "var(--neo-gray)" }}>🚀 Start: </span>
                        <span style={{ color: "var(--neo-black)", fontWeight: 800 }}>{formatIndianDateTime(student.startedAt)}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--neo-gray)" }}>🏁 End: </span>
                        <span style={{ color: student.completedAt ? "var(--neo-green)" : "#d97706", fontWeight: 800 }}>
                          {student.completedAt ? formatIndianDateTime(student.completedAt) : isInProgress ? "⏳ In Progress" : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Action Button: View Question Details */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(student);
                      }}
                      style={{
                        padding: "10px",
                        background: "var(--neo-purple)",
                        color: "#fff",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 900,
                        fontSize: 11,
                        textTransform: "uppercase",
                        border: "2px solid var(--neo-black)",
                        boxShadow: "2px 2px 0 var(--neo-black)",
                        cursor: "pointer",
                        marginTop: 4,
                      }}
                    >
                      👁 VIEW QUESTION DETAILS
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive Detail Drawer Modal */}
      {selectedStudent && (
        <StudentDetailDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </AdminLayout>
  );
}
