import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Puzzle3.css";
import MainGateBg from "../assets/MainGateBg.png";

// ---- Puzzle configuration ----
const PUZZLE_ID = "puzzle-3";
const ANSWER = "chirag";
const ANSWER_DISPLAY = "Chirag";
const REWARD_POINTS = 20;
const LOCATION_CODE = "7423";

export default function Puzzle3() {
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

      {status === "hint" && (
        <div className="result-overlay">
          <div className="result-card wide">
            <h2>✦ A NEW RIDDLE ✦</h2>

            <div className="next-hint-box riddle-story">
              <p>
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
              </p>
            </div>

            <div className="code-display">
              <span className="code-label">YOUR CODE</span>
              <span className="code-value">{LOCATION_CODE}</span>
              <span className="code-note">
                Carry this with you — enter it once you reach the place
                hidden in the story above.
              </span>
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
