import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Puzzle2.css";
import MainGateBg from "../assets/MainGateBg.png";

// ---- Puzzle configuration ----
const PUZZLE_ID = "puzzle-2";
const ANSWER = "refraction";
const REWARD_POINTS = 15;

export default function Puzzle2() {
  const navigate = useNavigate();

  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("playing"); // playing | correct | wrong | hint
  const wrongTimeout = useRef(null);

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
              Professor X left a note for you in the Physics Department.
              Read it carefully, then answer the question below.
            </p>
          </div>
        </div>

        <div className="physics-note">
          <div className="note-seal">✦</div>
          <h2 className="note-title">A Note from Professor X</h2>

          <p className="note-body">
            "Ah, you made it. I knew the telescope would lead you here.
            Let me tell you something about how that telescope actually
            works.
          </p>

          <p className="note-body">
            When light travels from one medium into another — say, from
            air into a curved glass lens — it changes speed, and because
            of that, it bends. This bending of light as it crosses the
            boundary between two media is what allows a lens to gather
            faint, scattered starlight and focus it into a single sharp
            point. Without it, every telescope, microscope, and pair of
            spectacles would be useless.
          </p>

          <p className="note-signature">— Professor X, Dept. of Physics</p>
        </div>

        <div className="question-box">
          <span className="question-label">QUESTION</span>
          <p className="question-text">
            What is the name of the phenomenon described in the note —
            the bending of light as it passes from one medium into
            another?
          </p>
        </div>

        <form className="answer-section" onSubmit={handleSubmit}>
          <p className="answer-label">Enter your answer:</p>
          <div className="answer-row">
            <input
              type="text"
              placeholder="Enter the physics term..."
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
              Re-read the note closely — the professor names the concept
              indirectly. Think about lenses, light, and bending.
            </p>
          </div>
        </div>

        <button className="back-btn" onClick={() => navigate("/Instructions")}>
          ← BACK TO MAP
        </button>

        <div className="puzzle-tip">
          💡 TIP: Every good physicist reads the fine print twice.
        </div>
      </div>

      {status === "correct" && (
        <div className="result-overlay">
          <div className="result-card">
            <h2>✦ QUEST COMPLETE ✦</h2>
            <p>Correct! The answer was {ANSWER}.</p>
            <p className="points-earned">+{REWARD_POINTS} POINTS</p>
            <button onClick={() => setStatus("hint")}>
              CONTINUE →
            </button>
          </div>
        </div>
      )}

      {status === "hint" && (
        <div className="result-overlay">
          <div className="result-card">
            <h2>✦ A NEW RIDDLE ✦</h2>
            <div className="next-hint-box riddle">
              <span>💡</span>
              <p>
                I have no classroom, yet lessons are heard here.
                <br />
                I have no stadium, yet crowds gather here.
                <br />
                Find me.
              </p>
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
