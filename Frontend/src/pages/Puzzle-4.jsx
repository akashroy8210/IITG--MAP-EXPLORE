import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Puzzle4.css";
import MainGateBg from "../assets/MainGateBg.png";

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
const PUZZLE_ID = "puzzle-4";
const ANSWER = "7423";
const REWARD_POINTS = 15;

export default function Puzzle4() {
  const navigate = useNavigate();

  // Sequence code verification state
  const [isVerified, setIsVerified] = useState(false);
  const [sequenceCode, setSequenceCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [nextCode, setNextCode] = useState("");
  const [nextLocHint, setNextLocHint] = useState();

  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("playing"); // playing | correct | wrong | hint | completed
  const wrongTimeout = useRef(null);

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
            res.data?.nextCode ||
            res.data?.code ||
            res.data?.sequenceCode ||
            res.data?.locationCode;
          if (codeFromBackend) {
            setNextCode(codeFromBackend);
          }
          setStatus("completed");
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
      const res1 = await axios.get(`${API_BASE_URL}/game/state`,{ headers: authHeaders() });
      const prevQuestionId = res1.data.game.currentQuestion.id;
    try {
      const res = await axios.post(
        VERIFY_CODE_ENDPOINT,
        {
          questionId: prevQuestionId,
          code: sequenceCode.trim(),
        },
        { headers: authHeaders() }
      );

      if (res.data?.correct || res.data?.verified) {
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
    console.log("insubmit")
    
    const res1 = await axios.get(`${API_BASE_URL}/game/state`,{ headers: authHeaders() });
    const questionss = JSON.parse(localStorage.getItem("student_sets_key"))
    setNextLocHint(questionss[0].questions[res1.data.game.currentStageIndex].nextLocationHint);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/game/answer`,
        { answer: answer.trim(),
          questionId:"6a8d40ac727e88236a58d3ae"
         },
        { headers: authHeaders() }
      );

      if (res.data?.correct || res.data?.success) {
        const codeFromBackend =
          res.data?.nextCode ||
          res.data?.verificationCode ||
          res.data?.sequenceCode ||
          res.data?.locationCode;
        if (codeFromBackend) {
          setNextCode(codeFromBackend);
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

            <button className="back-btn" onClick={() => navigate("/Instructions")}>
              ← BACK TO MAP
            </button>
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
                  The story from the Auditorium spelled it out — L-I-B-R-A-R-Y.
                  You've found it. Now it's time to use what you were given.
                </p>
              </div>
            </div>

        <div className="info-note">
          <div className="note-seal">✦</div>
          <h2 className="note-title">At the Library Entrance</h2>

          <p className="note-body">
            A small keypad is mounted beside the entrance, worn smooth by
            countless fingers before yours. Above it, a faded sign reads:
            "Only those who carried the code this far may enter."
          </p>
        </div>

        <div className="question-box">
          <span className="question-label">ENTER CODE</span>
          <p className="question-text">
            Enter the code you were given at the Auditorium to unlock what
            waits inside the Library.
          </p>
        </div>

        <form className="answer-section" onSubmit={handleSubmit}>
          <p className="answer-label">Enter the code:</p>
          <div className="answer-row">
            <input
              type="text"
              placeholder="Enter the code..."
              value={answer}
              disabled={status !== "playing"}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              type="submit"
              className={`submit-btn ${status === "wrong" ? "shake" : ""}`}
              disabled={status !== "playing"}
            >
              {status === "checking" ? "CHECKING..." : "SUBMIT"}
            </button>
          </div>
          {status === "wrong" && (
            <p className="answer-error">Wrong code. Try again!</p>
          )}
        </form>

        <div className="puzzle-footer">
          <div className="reward-badge">
            <span>⭐</span> REWARD &nbsp;<strong>{REWARD_POINTS} POINTS</strong>
          </div>
          <div className="hint-box">
            <span>💡</span>
            <p>
              You were told to carry this code with you from the previous
              location. Check what you were handed there.
            </p>
          </div>
        </div>

        <button className="back-btn" onClick={() => navigate("/Instructions")}>
          ← BACK TO MAP
        </button>

        <div className="puzzle-tip">
          💡 TIP: Some doors don't need a puzzle solved — just proof you
          solved the last one.
        </div>
          </>
        )}
      </div>

      {status === "correct" && (
        <div className="result-overlay">
          <div className="result-card">
            <h2>✦ DOOR UNLOCKED ✦</h2>
            <p>The keypad blinks green. You're in.</p>
            <p className="points-earned">+{REWARD_POINTS} POINTS</p>

            <div className="next-hint-box">
              <span>📚</span>
              <p>
                The Central Library at IIT Guwahati is one of the largest
                in North-East India, spread across multiple floors of
                reading halls, journals, and rare collections. It stays
                open around the clock during exam season, and generations
                of students have called its silence the loudest place on
                campus to think.
              </p>
            </div>

            <button onClick={() => setStatus("hint")}>
              CONTINUE →
            </button>
          </div>
        </div>
      )}

      {(status === "hint" || status === "completed") && (
        <div className="result-overlay">
          <div className="result-card wide">
            <h2>✦ QUESTION COMPLETED ✦</h2>
            <p className="completion-msg">
              Your question is completed! Enter this code in the next location box.
            </p>

            {nextCode && (
              <div className="code-display">
                <span className="code-label">YOUR NEXT LOCATION CODE</span>
                <span className="code-value">{nextCode}</span>
                <span className="code-note">
                  Enter this code at the next location puzzle page to unlock it.
                </span>
              </div>
            )}

            <div className="next-hint-box riddle-story">
              {/* <p>
                This is a place where students turn ideas into reality.
                <br />
                Clubs meet here. Events are planned here. Cultural
                activities come alive here.
                <br />
                Your next clue lies somewhere inside the New SAC (Student
                Activity Centre).
                <br />
                But finding the building is only the beginning.
                <br />
                Find the room that serves as the execution centre for the
                examination you have already conquered.
                <br />
                Find the room.
              </p> */}
              {nextLocHint}
            </div>

            <div className="result-actions">
              <button onClick={() => navigate("/Instructions")}>
                CONTINUE →
              </button>
              <button className="close-btn" onClick={() => window.close()}>
                CLOSE WINDOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
