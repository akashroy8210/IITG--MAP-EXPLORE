import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Maingate.css";
import MainGateBg from "../assets/MainGateBg.png";

// =========================================================================
// BACKEND URL CONFIGURATION
// Enter your backend API base URL or verification endpoint here:
// =========================================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const VERIFY_GATE_ENDPOINT = `${API_BASE_URL}/game/maingate-code`; // <<< ENTER YOUR BACKEND URL HERE

function authHeaders() {
  const token = localStorage.getItem("student_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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

function clearGameStorage() {
  localStorage.removeItem("student_token");
  localStorage.removeItem("student_user");
  localStorage.removeItem("student_sets_key");
  localStorage.removeItem("puzzle-1-progress");
}

function formatCompletedAt(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "medium",
    });
  } catch {
    return String(value);
  }
}

export default function Maingate() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | success | error
  const [completedAt, setCompletedAt] = useState(null);
  const submitLock = useRef(false);

  const confettiPieces = useMemo(() => makeConfettiPieces(70), []);

  // Redirect to login if the student isn't authenticated.
  useEffect(() => {
    if (!localStorage.getItem("student_token")) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Check from backend whether the main gate was already completed on load
  useEffect(() => {
    let cancelled = false;

    async function checkGateStatus() {
      try {
        const res = await axios.get(
          `${API_BASE_URL}`,
          { headers: authHeaders() }
        );

        if (cancelled) return;

        if (res.data?.correct || res.data?.isCompleted || res.data?.correct) {
          const timeVal = res.data?.time || res.data?.completedAt || res.data?.timestamp;
          if (timeVal) {
            setCompletedAt(res.data.completionTimeSeconds);
          }
          setStatus("success");
          clearGameStorage();
        }
      } catch (err) {
        console.warn("Could not check gate completion status with server:", err);
      }
    }

    checkGateStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLock.current || !code.trim() || status === "checking") return;

    submitLock.current = true;
    setStatus("checking");

    try {
      const res = await axios.post(
        VERIFY_GATE_ENDPOINT,
        { code: code.trim() },
        { headers: authHeaders() }
      );

      const isCorrect = res.data?.correct ?? res.data?.success;
      const timeVal = res.data?.completionTimeSeconds || res.data?.completedAt || res.data?.timestamp;

      if (isCorrect) {
        const time = new Date(timeVal * 1000).toISOString().substring(11, 19);
        console.log("Completion time (HH:MM:SS):", time);
        setCompletedAt(time);
        setStatus("success");
        clearGameStorage();
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.warn("Backend gate verification failed:", err);
      setStatus("error");
    } finally {
      submitLock.current = false;
    }
  }

  return (
    <div className="maingate-page">
      <img src={MainGateBg} alt="" className="maingate-bg" />
      <div className="maingate-overlay" />

      <div className="maingate-card nes-container is-dark">
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
                type="text" className="nes-input is-dark"
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
                className="unlock-btn nes-btn is-error"
                disabled={status === "checking" || !code.trim()}
              >
                {status === "checking" ? "CHECKING…" : "UNLOCK THE GATE"}
              </button>
                          <button
                type="button"
                className="back-btn"
                onClick={() => window.close()}
              >
                CLOSE WINDOW
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
                {completedAt }
              </span>
            </div>

            <button type="button" className="back-btn" onClick={() => window.close()} style={{ marginTop: "20px" }}>
              CLOSE WINDOW
            </button>
          </div>
        )}
      </div>
    </div>
  );
}