import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Puzzle4.css";
import MainGateBg from "../assets/MainGateBg.png";
import { QUESTION_IDS } from "../constants/questionIds";

// =========================================================================
// BACKEND URL CONFIGURATION
// Enter your backend API base URL or verification endpoint here:
// =========================================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const VERIFY_CODE_ENDPOINT = `${API_BASE_URL}/game/verify-code`; // <<< ENTER YOUR BACKEND URL HERE

// ---- Puzzle configuration ----
const PUZZLE_ID = QUESTION_IDS.PUZZLE_4;

function authHeaders() {
  const token = localStorage.getItem("student_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}



export default function Puzzle4() {
  const navigate = useNavigate();

  // Sequence code verification state
  const [isVerified, setIsVerified] = useState(false);
  const [sequenceCode, setSequenceCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [nextCode, setNextCode] = useState("");
  const [nextLocHint, setNextLocHint] = useState();
  const [questId, setQuestId] = useState(null);

  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("playing"); // playing | correct | wrong | hint | completed
  const [alreadySolvedCode, setAlreadySolvedCode] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const wrongTimeout = useRef(null);

  // Redirect to login if the student isn't authenticated.
  useEffect(() => {
    if (!localStorage.getItem("student_token")) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // If this puzzle's question was already solved earlier (or in a previous
  // session), show the student their verification code again in case they
  // forgot to write it down before moving to the next location.
  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/student/puzzles/${PUZZLE_ID}/status`,
          { headers: authHeaders() }
        );
        if (cancelled) return;
        console.log(res.data);
        if(res.data?.status === "location_verified"  ) {
          console.log(res.data?.status);
          setIsVerified(true);
        }
        if (res.data?.completed || res.data?.isCompleted) {
          setAlreadySolvedCode(res.data?.verificationCode || res.data?.code || null);
        }
      } catch (err) {
        console.warn("Could not check puzzle status with server:", err);
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    }

    checkStatus();
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
      const currentIdx = res1.data.game.currentStageIndex;
      const nextIdx = currentIdx + 1;
      const nextQuestionId = JSON.parse(localStorage.getItem("student_sets_key"))[0].questions[nextIdx]._id;

      if(prevQuestionId === PUZZLE_ID) {
        setIsVerified(true);
        setVerifying(false);
        return;
      }

    try {
      const res = await axios.post(
        VERIFY_CODE_ENDPOINT,
        {
          questionId: prevQuestionId,
          code: sequenceCode.trim(),
          nextQuestionId: PUZZLE_ID, // nextQuestionId
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
    const questionId = questionss[0].questions[res1.data.game.currentStageIndex]._id;
    console.log("questionId", questionId);
    console.log(PUZZLE_ID);
    setNextLocHint(questionss[0].questions[res1.data.game.currentStageIndex+1].nextLocationHint);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/game/answer`,
        { answer: answer.trim(),
          questionId: questionId
         },
        { headers: authHeaders() }
      );

      if (res.data?.correct || res.data?.success) {
        const codeFromBackend =
          res.data?.nextCode ||
          res.data?.verificationCode ||
          res.data?.sequenceCode ||
          res.data?.locationCode;
          console.log("codeFromBackend", codeFromBackend);
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

      <div className="puzzle-card nes-container is-dark">
        <div className="puzzle-top-roll" />

        {checkingStatus ? (
          <div className="puzzle-header">
            <div>
              <h1>◆ LOADING ◆</h1>
              <p>Checking puzzle status...</p>
            </div>
          </div>
        ) : alreadySolvedCode ? (
          <>
            <div className="puzzle-header">
              <div>
                <h1>✦ PUZZLE COMPLETED ✦</h1>
                <p>You've already solved this puzzle.</p>
              </div>
            </div>

            <div className="code-display">
              <span className="code-label">YOUR VERIFICATION CODE</span>
              <span className="code-value">{alreadySolvedCode}</span>
              <span className="code-note">
                Enter this code at the next location puzzle page.
              </span>
            </div>

            <button className="back-btn nes-btn" onClick={() => window.close()}>
              CLOSE WINDOW
            </button>
          </>
        ) : !isVerified ? (
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
                  type="text" className="nes-input is-dark"
                  placeholder="Enter code..."
                  value={sequenceCode}
                  disabled={verifying}
                  onChange={(e) => setSequenceCode(e.target.value)}
                />
                <button
                  type="submit"
                  className="submit-btn nes-btn is-warning"
                  disabled={verifying || !sequenceCode.trim()}
                >
                  {verifying ? "VERIFYING..." : "VERIFY CODE"}
                </button>
              </div>
              {verifyError && (
                <p className="answer-error">{verifyError}</p>
              )}
            </form>

            <button className="back-btn nes-btn" onClick={() => window.close()}>
              CLOSE WINDOW
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

        </div>

        <div className="question-box">
          <span className="question-label">QUESTION</span>
          <p className="question-text">
            The librarian of Lakshminath Bezbarao library of IITG is arranging books on different shelves. To make it easier to identify the shelves, she creates a special code for each shelf. The code contains a letter, a number, and another letter.
            <br /><br />
            The librarian notices that the shelf codes follow a particular pattern:
            <br />
            <strong>Z1A, X2D, V6G, T21J, ...?</strong>
            <br /><br />
            A student is asked to help the librarian determine the code for the fifth shelf by carefully observing the pattern in the letters and numbers.
            <br /><br />
            What should be the code for Shelf 5?
          </p>
        </div>

        <form className="answer-section" onSubmit={handleSubmit}>
          <p className="answer-label">Enter your answer:</p>
          <div className="answer-row">
            <input
              type="text"
              placeholder="Enter your answer..."
              value={answer}
              disabled={status !== "playing"}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              type="submit"
              className={`submit-btn nes-btn is-warning ${status === "wrong" ? "shake" : ""}`}
              disabled={status !== "playing"}
            >
              {status === "checking" ? "CHECKING..." : "SUBMIT"}
            </button>
          </div>
          {status === "wrong" && (
            <p className="answer-error">Wrong answer. Try again!</p>
          )}
        </form>

        <div className="puzzle-footer">

          <div className="hint-box">
            <span>💡</span>
            <p>
              Observe the pattern in the first letter, the middle number, and the last letter separately.
            </p>
          </div>
        </div>

        <button className="back-btn nes-btn" onClick={() => window.close()}>
          CLOSE WINDOW
        </button>


          </>
        )}
      </div>

      {!alreadySolvedCode && status === "correct" && (
        <div className="result-overlay">
          <div className="result-card nes-container is-dark">
            <h2>✦ DOOR UNLOCKED ✦</h2>
            <p>The keypad blinks green. You're in.</p>

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

      {!alreadySolvedCode && (status === "hint" || status === "completed") && (
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

            <div className="next-hint-box riddle-story" style={{ whiteSpace: "pre-line" }}>
              {nextLocHint}
            </div>

            <div className="result-actions">
              <button className="close-btn nes-btn is-warning" onClick={() => window.close()}>
                CLOSE WINDOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
