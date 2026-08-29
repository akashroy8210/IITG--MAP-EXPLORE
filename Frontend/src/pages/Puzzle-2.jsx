import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Puzzle2.css";
import MainGateBg from "../assets/MainGateBg.png";
import { QUESTION_IDS } from "../constants/questionIds";

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
const PUZZLE_ID = QUESTION_IDS.PUZZLE_2;


export default function Puzzle2() {
  const navigate = useNavigate();

  // Sequence code verification state
  const [isVerified, setIsVerified] = useState(false);
  const [sequenceCode, setSequenceCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [nextCode, setNextCode] = useState("");
  const [currQuestion, setCurrQuestion] = useState();
  const [nextLocHint,setNextLocHint] = useState();

  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("playing"); // playing | correct | wrong | hint | completed
  const wrongTimeout = useRef(null);
  const [questId, setQuestId] = useState(null);
  const [alreadySolvedCode, setAlreadySolvedCode] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

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

  // Check from backend whether the puzzle has already been completed on load
  useEffect(() => {
    let cancelled = false;

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!sequenceCode.trim() || verifying) return;
    const res1 = await axios.get(`${API_BASE_URL}/game/state`,{ headers: authHeaders() });
    const prevQuestionId = res1.data.game.currentQuestion.id;
    setVerifying(true);
    setVerifyError("");
      const currentIdx = res1.data.game.currentStageIndex;
      const nextIdx = currentIdx + 1;
      const nextQuestionId = PUZZLE_ID; // JSON.parse(localStorage.getItem("student_sets_key"))[0].questions[nextIdx]._id;
  
    try {
      const res = await axios.post(
        VERIFY_CODE_ENDPOINT,
        {
          questionId: prevQuestionId,
          code: sequenceCode.trim(),
          nextQuestionId: nextQuestionId,
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
    const questions = JSON.parse(localStorage.getItem("student_sets_key"));
    console.log(questions[0].questions[res1.data.game.currentStageIndex+1].nextLocationHint);
    setNextLocHint(questions[0].questions[res1.data.game.currentStageIndex+1].nextLocationHint);
    const questionId = questions[0].questions[res1.data.game.currentStageIndex]._id;
    
    try {


      const res = await axios.post(
        `${API_BASE_URL}/game/answer`,
        { answer: answer.trim(),
          questionId: questionId,
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
      return;
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

            <button className="back-btn" onClick={() => window.close()}>
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
                  Professor Albert left a note for you in the Physics Department.
                  Read it carefully, then answer the question below.
                </p>
              </div>
            </div>

        <div className="physics-note">
          <div className="note-seal">🌍</div>
          <h2 className="note-title">The Weight of an Astronaut 🪐</h2>

          <p className="note-body" style={{ fontStyle: "normal", marginBottom: "10px" }}>
            Every object in the universe attracts every other object with a force called <strong>gravitational force</strong>. The strength of this force depends on the masses of the objects and the distance between them.
          </p>

          <p className="note-body" style={{ fontStyle: "normal", marginBottom: "6px" }}>
            The acceleration due to gravity of a celestial body can be expressed as:
          </p>
          <div className="math-equation">
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>g = </span>
            <div className="fraction">
              <span className="numerator">GM</span>
              <span className="denominator">r<sup>2</sup></span>
            </div>
          </div>
          <p className="note-body" style={{ fontStyle: "normal", fontSize: "12px", marginBottom: "10px", textAlign: "center" }}>
            where <em>G</em> is the universal gravitational constant, <em>M</em> is the mass of the celestial body, and <em>r</em> is the distance from its centre.
          </p>

          <p className="note-body" style={{ fontStyle: "normal", marginBottom: "10px" }}>
            The <strong>weight</strong> of an object is the gravitational force acting on it and is given by <strong>W = mg</strong>. Although an object's mass remains unchanged, its weight depends on the gravitational field in which it is located.
          </p>

          <p className="note-body" style={{ fontStyle: "normal", marginBottom: "6px" }}>
            On a planet named <strong>Aurelia</strong> in another solar system, the acceleration due to gravity is <strong>two-fifths of the acceleration due to gravity on Earth</strong>, i.e.
          </p>

          <div className="math-equation">
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>g<sub>Aurelia</sub> = </span>
            <div className="fraction">
              <span className="numerator">2 &middot; g<sub>Earth</sub></span>
              <span className="denominator">5</span>
            </div>
          </div>

          <p className="note-body" style={{ fontStyle: "normal", marginTop: "10px" }}>
            An astronaut has a mass of <strong>60 kg</strong>. If the acceleration due to gravity on Earth is <strong>9.8 m/s<sup>2</sup></strong>.
          </p>
        </div>

        <div className="question-box">
          <span className="question-label">QUESTION</span>
          <p className="question-text">
            Calculate the sum of the astronaut's weight on Earth and on Aurelia (in Newtons).
          </p>
        </div>

        <form className="answer-section" onSubmit={handleSubmit}>
          <p className="answer-label">Enter your answer:</p>
          <div className="answer-row">
            <input
              type="text"
              placeholder="Enter answer in Newtons..."
              value={answer}
              disabled={status !== "playing"}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              type="submit"
              className={`submit-btn nes-btn is-warning ${status === "wrong" ? "shake" : ""}`}
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
          <div className="hint-box">
            <span>💡</span>
            <p>
              Weight = m &times; g. Calculate W<sub>Earth</sub> and W<sub>Aurelia</sub>, then sum them together!
            </p>
          </div>
        </div>


        <div className="puzzle-tip">
          💡 TIP: Every good physicist reads the fine print twice.
        </div>
            <button className="back-btn" onClick={() => window.close()}>
              CLOSE WINDOW
            </button>
          </>
        )}
      </div>

      {!alreadySolvedCode && status === "correct" && (
        <div className="result-overlay">
          <div className="result-card nes-container is-dark">
            <h2>✦ QUEST COMPLETE ✦</h2>
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

            <div className="next-hint-box riddle" style={{ whiteSpace: "pre-line" }}>
              <span>💡</span>
              <p>
                {nextLocHint}
              </p>
            </div>
            <div>
              <button className="close-btn nes-btn is-warning" onClick={()=>window.close()}>Click here to continue with the game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
