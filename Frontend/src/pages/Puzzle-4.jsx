import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Puzzle4.css";
import MainGateBg from "../assets/MainGateBg.png";

// ---- Puzzle configuration ----
const PUZZLE_ID = "puzzle-4";
const ANSWER = "7423";
const REWARD_POINTS = 15;

export default function Puzzle4() {
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
              SUBMIT
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

      {status === "hint" && (
        <div className="result-overlay">
          <div className="result-card wide">
            <h2>✦ A NEW CLUE ✦</h2>

            <div className="next-hint-box riddle-story">
              <p>
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
