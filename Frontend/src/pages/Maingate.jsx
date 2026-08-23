import { useMemo, useRef, useState } from "react";
import "../style/Maingate.css";
import MainGateBg from "../assets/MainGateBg.png";

// ---- Mock data — remove once the backend is wired up ----
const MOCK_VALID_CODE = "8156"; // matches the code revealed at the end of Puzzle 5
const MOCK_COMPLETED_AT = "2026-08-19T14:32:07.000Z";

/**
 * Placeholder for the real gate-verification API call.
 *
 * Swap the body for something like:
 *   const { data } = await axios.post("/api/quest/verify-gate", { code });
 *   return data; // { success, completedAt }
 *
 * The backend is the source of truth for `completedAt` — the frontend
 * never generates its own completion timestamp.
 */
async function verifyCode(code) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const success = code.trim() === MOCK_VALID_CODE;
  return {
    success,
    completedAt: success ? MOCK_COMPLETED_AT : null,
  };
}

const CONFETTI_COLORS = [
  "#f6d98b",
  "#e3b969",
  "#d1503a",
  "#3f7a3f",
  "#c9934c",
  "#f5d99b",
];

function makeConfettiPieces(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.7,
    duration: 2.4 + Math.random() * 1.8,
    rotation: Math.round(Math.random() * 540 - 270),
    drift: Math.round((Math.random() - 0.5) * 140),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));
}

function formatCompletedAt(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "medium",
  });
}

export default function Maingate() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | success | error
  const [completedAt, setCompletedAt] = useState(null);
  const submitLock = useRef(false);

  const confettiPieces = useMemo(() => makeConfettiPieces(70), []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current || !code.trim() || status === "checking") return;

    submitLock.current = true;
    setStatus("checking");

    try {
      const res = await verifyCode(code);
      if (res.success) {
        setCompletedAt(res.completedAt);
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      submitLock.current = false;
    }
  }

  return (
    <div className="maingate-page">
      <img src={MainGateBg} alt="" className="maingate-bg" />
      <div className="maingate-overlay" />

      <div className="maingate-card">
        <div className="maingate-top-roll" />

        {status !== "success" ? (
          <>
            <h1 className="maingate-title">◆ THE FINAL GATE ◆</h1>
            <p className="maingate-subtitle">
              Enter the code revealed at the end of your journey to unlock
              the gate and complete the quest.
            </p>

            <form className="gate-form" onSubmit={handleSubmit}>
              <label className="gate-label" htmlFor="gate-code">
                GATE CODE
              </label>
              <input
                id="gate-code"
                name="gate-code"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter the code..."
                value={code}
                disabled={status === "checking"}
                onChange={(e) => setCode(e.target.value)}
                className={status === "error" ? "shake" : ""}
              />

              <button
                type="submit"
                className="unlock-btn"
                disabled={status === "checking" || !code.trim()}
              >
                {status === "checking" ? "CHECKING…" : "UNLOCK THE GATE"}
              </button>

              {status === "error" && (
                <p className="gate-error">
                  ✦ That code doesn't fit this lock. Retrace your last
                  clue and try again.
                </p>
              )}
            </form>

            <div className="maingate-tip">
              💡 TIP: The final code was left behind at your last stop —
              look closely, it may not have shown itself right away.
            </div>
          </>
        ) : (
          <div className="quest-complete">
            <div className="confetti-layer" aria-hidden="true">
              {confettiPieces.map((p) => (
                <span
                  key={p.id}
                  className="confetti-piece"
                  style={{
                    left: `${p.left}%`,
                    backgroundColor: p.color,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`,
                    "--drift": `${p.drift}px`,
                    "--rotation": `${p.rotation}deg`,
                  }}
                />
              ))}
            </div>

            <div className="quest-complete-icon">🎉</div>
            <h1 className="quest-complete-title">QUEST COMPLETED!</h1>
            <p className="quest-complete-message">
              Congratulations, Explorer!
            </p>

            <div className="completed-at-box">
              <span className="completed-at-label">COMPLETED AT</span>
              <span className="completed-at-value">
                {formatCompletedAt(completedAt)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
