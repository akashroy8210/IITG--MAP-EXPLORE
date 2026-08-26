import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Puzzle5.css";
import MainGateBg from "../assets/MainGateBg.png";
import Banner from "../assets/Banner.png";
import banner2 from "../assets/banner2.png";
import puzzleImage from "../assets/puzzle-telescope.svg";

// =========================================================================
// BACKEND URL CONFIGURATION
// Enter your backend API base URL or verification endpoint here:
// =========================================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const VERIFY_CODE_ENDPOINT = `${API_BASE_URL}/game/verify-code`; // <<< ENTER YOUR BACKEND URL HERE

function authHeaders() {
  const token = localStorage.getItem("student_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- Puzzle configuration ----
const PUZZLE_ID = "puzzle-5";
const ANSWER = "35";
const REWARD_POINTS = 25;
const GATE_CODE = "8156";

const RANDOM_IMAGES = [MainGateBg, Banner, banner2, puzzleImage];

export default function Puzzle5() {
  const navigate = useNavigate();

  // Sequence code verification state
  const [isVerified, setIsVerified] = useState(false);
  const [sequenceCode, setSequenceCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [gateCode, setGateCode] = useState(GATE_CODE);

  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("playing"); // playing | correct | wrong | image | checking
  const [flipped, setFlipped] = useState(false);
  const wrongTimeout = useRef(null);

  const [cardImage] = useState(
    () => RANDOM_IMAGES[Math.floor(Math.random() * RANDOM_IMAGES.length)]
  );

  // Check from backend whether the puzzle has already been completed on load
  useEffect(() => {
    let cancelled = false;

    async function checkCompletionStatus() {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/student/puzzles/${PUZZLE_ID}/status`,
          { headers: authHeaders() }
        );

        if (cancelled) return;

        if (res.data?.completed || res.data?.isCompleted) {
          setIsVerified(true);
          const codeFromBackend =
            res.data?.gateCode ||
            res.data?.code ||
            res.data?.sequenceCode ||
            res.data?.locationCode;
          if (codeFromBackend) {
            setGateCode(codeFromBackend);
          }
          setStatus("image");
        }
      } catch (err) {
        console.warn("Could not check puzzle completion status with server:", err);
      }
    }

    checkCompletionStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!sequenceCode.trim() || verifying) return;

    setVerifying(true);
    setVerifyError("");

    try {
      const res = await axios.post(
        VERIFY_CODE_ENDPOINT,
        {
          puzzleId: PUZZLE_ID,
          code: sequenceCode.trim(),
        },
        { headers: authHeaders() }
      );

      if (res.data?.success || res.data?.verified) {
        setIsVerified(true);
      } else {
        setVerifyError(
          res.data?.message || "Invalid verification code. Please try again."
        );
      }
    } catch (err) {
      console.warn("Backend sequence verification failed:", err);
      setVerifyError(
        err.response?.data?.message || "Failed to verify code with backend. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (status !== "playing" || !answer.trim()) return;

    setStatus("checking");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/student/puzzles/${PUZZLE_ID}/submit-answer`,
        { answer: answer.trim() },
        { headers: authHeaders() }
      );

      if (res.data?.correct || res.data?.success) {
        const codeFromBackend =
          res.data?.gateCode ||
          res.data?.code ||
          res.data?.sequenceCode ||
          res.data?.locationCode;
        if (codeFromBackend) {
          setGateCode(codeFromBackend);
        }
        setStatus("correct");
        return;
      }
    } catch (err) {
      console.warn("Could not verify answer with server:", err);
    }

    setStatus("wrong");
    clearTimeout(wrongTimeout.current);
    wrongTimeout.current = setTimeout(() => setStatus("playing"), 1200);
  }

  return (
    <div className="puzzle-page">
      <img src={MainGateBg} alt="" className="puzzle-bg" />
      <div className="puzzle-overlay" />

      <div className="puzzle-card">
        <div className="puzzle-top-roll" />

        {!isVerified ? (
          /* =========================================
             1. SEQUENCE CODE VERIFICATION SCREEN
             ========================================= */
          <>
            <div className="puzzle-header">
              <div>
                <h1>◆ ACCESS VERIFICATION ◆</h1>
                <p>
                  Enter the verification code to unlock this puzzle.
                </p>
              </div>
            </div>

            <form className="answer-section" onSubmit={handleVerifyCode}>
              <p className="answer-label">Enter Verification Code:</p>
              <div className="answer-row">
                <input
                  type="text"
                  placeholder="Enter code..."
                  value={sequenceCode}
                  disabled={verifying}
                  onChange={(e) => setSequenceCode(e.target.value)}
                />
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={verifying || !sequenceCode.trim()}
                >
                  {verifying ? "VERIFYING..." : "VERIFY CODE"}
                </button>
              </div>
              {verifyError && (
                <p className="answer-error">{verifyError}</p>
              )}
            </form>

  
          </>
        ) : (
          /* =========================================
             2. ACTUAL PUZZLE CONTENT
             ========================================= */
          <>
            <div className="puzzle-header">
              <div>
                <h1>◆ PUZZLE CHALLENGE ◆</h1>
                <p>
                  You found the room inside the New SAC. Chalked on the wall
                  is a single equation, waiting to be solved.
                </p>
              </div>
            </div>

        <div className="question-box">
          <span className="question-label">QUESTION</span>
          <p className="question-text equation">
            (MA)&sup2; + (CL)&sup2; + (PH)&sup2; = ?
          </p>
        </div>

        <form className="answer-section" onSubmit={handleSubmit}>
          <p className="answer-label">Enter your answer:</p>
          <div className="answer-row">
            <input
              type="text"
              placeholder="Enter the number..."
              value={answer}
              disabled={status !== "playing"}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              type="submit"
              className={`submit-btn ${status === "wrong" ? "shake" : ""}`}
              disabled={status !== "playing"}
            >
              {status === "checking" ? "CHECKING..." : "SUBMIT ANSWER"}
            </button>
          </div>
          {status === "wrong" && (
            <p className="answer-error">Not quite. Try again!</p>
          )}
        </form>

        <div className="puzzle-footer">
          <div className="reward-badge">
            <span>⭐</span> REWARD &nbsp;<strong>{REWARD_POINTS} POINTS</strong>
          </div>
          <div className="hint-box">
            <span>💡</span>
            <p>
              Each pair of letters is worth a number. Square each one, then
              add them together.
            </p>
          </div>
        </div>

        <button className="back-btn" onClick={() => navigate("/Instructions")}>
          ← BACK TO MAP
        </button>

        <div className="puzzle-tip">
          💡 TIP: Not every clue on this campus is written in words.
        </div>
          </>
        )}
      </div>

      {status === "correct" && (
        <div className="result-overlay">
          <div className="result-card">
            <h2>✦ QUEST COMPLETE ✦</h2>
            <p>Correct! The answer was {ANSWER}.</p>
            <p className="points-earned">+{REWARD_POINTS} POINTS</p>

            <div className="next-hint-box">
              <span>🚪</span>
              <p>You are now good to go to the Main Gate.</p>
            </div>

            <button onClick={() => setStatus("image")}>
              CONTINUE →
            </button>
          </div>
        </div>
      )}

      {status === "image" && (
        <div className="result-overlay">
          <div className="result-card wide">
            <h2>✦ ONE LAST THING ✦</h2>
            <p>Someone left this behind on the desk.</p>

            <div
              className={`flip-card ${flipped ? "flipped" : ""}`}
              onDoubleClick={() => setFlipped(true)}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <img src={cardImage} alt="A photograph left on the desk" />
                </div>
                <div className="flip-card-back">
                  <span className="code-label">MAIN GATE CODE</span>
                  <span className="code-value">{gateCode || GATE_CODE}</span>
                  <span className="code-note">
                    Enter this at the Main Gate.
                  </span>
                </div>
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
}
