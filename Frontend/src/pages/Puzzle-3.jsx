import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Puzzle3.css";
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



export default function Puzzle3() {
  const navigate = useNavigate();

  // Sequence code verification state
  const [isVerified, setIsVerified] = useState(false);
  const [sequenceCode, setSequenceCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [nextCode, setNextCode] = useState(LOCATION_CODE);
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

    try {
      const res1 = await axios.get(`${API_BASE_URL}/game/state`,{ headers: authHeaders() });
      const prevQuestionId = res1.data.game.currentQuestion.id;
     
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

    const res1 = await axios.get(`${API_BASE_URL}/game/state`,{ headers: authHeaders() });
    const questionss = JSON.parse(localStorage.getItem("student_sets_key"))
    console.log(questionss[0].questions[res1.data.game.currentStageIndex+1].nextLocationHint);
    setNextLocHint(questionss[0].questions[res1.data.game.currentStageIndex+1].nextLocationHint);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/game/answer`,
        { answer: answer.trim(),
          questionId:"6a8d40ac727e88236a58d3ad"
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
                  The riddle led you to the Auditorium — no classroom, yet
                  lessons are heard; no stadium, yet crowds gather. The front
                  row is still warm — five friends were sitting here just
                  moments ago.
                </p>
              </div>
            </div>

        <div className="info-note">
          <div className="note-seal">✦</div>
          <h2 className="note-title">Whispers From the Front Row</h2>

          <p className="note-body">
            Five friends — Aditi, Bhavya, Chirag, Dev, and Esha — claimed
            the front row of the Auditorium just before the show began,
            filling five seats numbered 1 to 5 from left to right.
            Scattered whispers overheard nearby gave away exactly how
            they sat:
          </p>

          <ul className="clue-list">
            <li>Aditi and Dev sit at the two ends of the row.</li>
            <li>Bhavya sits immediately to the right of Chirag.</li>
            <li>Aditi sits somewhere to the left of Chirag.</li>
            <li>Esha is not seated next to Dev.</li>
            <li>Esha sits somewhere between Aditi and Chirag.</li>
          </ul>
        </div>

        <div className="question-box">
          <span className="question-label">QUESTION</span>
          <p className="question-text">
            Going by the clues above, who occupies Seat 3?
          </p>
        </div>

        <form className="answer-section" onSubmit={handleSubmit}>
          <p className="answer-label">Enter your answer:</p>
          <div className="answer-row">
            <input
              type="text"
              placeholder="Enter a name..."
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
              Start with the clue that pins down both ends of the row —
              everything else falls into place from there.
            </p>
          </div>
        </div>

        <button className="back-btn" onClick={() => navigate("/Instructions")}>
          ← BACK TO MAP
        </button>

        <div className="puzzle-tip">
          💡 TIP: Fix what you know for certain first, then fill in the
          gaps.
        </div>
          </>
        )}
      </div>

      {status === "correct" && (
        <div className="result-overlay">
          <div className="result-card">
            <h2>✦ QUEST COMPLETE ✦</h2>
            <p>Correct! {ANSWER_DISPLAY} was seated in Seat 3.</p>
            <p className="points-earned">+{REWARD_POINTS} POINTS</p>

            <div className="next-hint-box">
              <span>🏛️</span>
              <p>
                The IITG Auditorium is one of the largest gathering spaces
                on campus, home to convocations, guest lectures, and the
                annual cultural festival Alcheringa. Its sweeping,
                shell-like roof and tiered seating were designed to carry a
                single voice to the very last row without a microphone —
                proof that this building has been listening back the whole
                time.
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
                Last weekend, the football team decided to change their
                usual practice location.
                <br />
                Instead of meeting in the evening, they arrived shortly
                after noon.
                <br />
                Before anyone could begin, someone realized that the
                equipment was still missing.
                <br />
                Rather than wasting time, the captain divided everyone
                into small groups.
                <br />
                After searching for several minutes, they finally found
                everything near the entrance.
                <br />
                Relieved that the problem was solved, the team continued
                with their practice.
                <br />
                Yet nobody noticed that one important clue had been left
                behind.
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
