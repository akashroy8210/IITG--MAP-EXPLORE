import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Puzzle5.css";
import MainGateBg from "../assets/MainGateBg.png";
import Banner from "../assets/Banner.png";
import banner2 from "../assets/banner2.png";
import puzzleImage from "../assets/puzzle-telescope.svg";

// ---- Puzzle configuration ----
const PUZZLE_ID = "puzzle-5";
const ANSWER = "35";
const REWARD_POINTS = 25;
const GATE_CODE = "8156";

const RANDOM_IMAGES = [MainGateBg, Banner, banner2, puzzleImage];

export default function Puzzle5() {
  const navigate = useNavigate();

  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("playing"); // playing | correct | wrong | image
  const [flipped, setFlipped] = useState(false);
  const wrongTimeout = useRef(null);

  const [cardImage] = useState(
    () => RANDOM_IMAGES[Math.floor(Math.random() * RANDOM_IMAGES.length)]
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (status !== "playing" || !answer.trim()) return;

    if (answer.trim().toLowerCase() === ANSWER) {
      setStatus("correct");
    } else {
      setStatus("wrong");
      clearTimeout(wrongTimeout.current);
      wrongTimeout.current = setTimeout(() => setStatus("playing"), 1200);
    }
  }

  return (
    <div className="puzzle-page">
      <img src={MainGateBg} alt="" className="puzzle-bg" />
      <div className="puzzle-overlay" />

      <div className="puzzle-card">
        <div className="puzzle-top-roll" />

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
              SUBMIT ANSWER
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
                  <span className="code-value">{GATE_CODE}</span>
                  <span className="code-note">
                    Enter this at the Main Gate.
                  </span>
                </div>
              </div>
            </div>

            <button onClick={() => navigate("/Instructions")}>
              CONTINUE →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
