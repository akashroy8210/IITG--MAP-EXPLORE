import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../style/Puzzle1.css";
import MainGateBg from "../assets/MainGateBg.png";
import puzzleImage from "../assets/puzzle-telescope.svg";

// ---- Puzzle configuration (swap per-location for future Puzzle-2, Puzzle-3 ...) ----
const PUZZLE_ID = "puzzle-1";
const ANSWER = "telescope";
const REWARD_POINTS = 10;


const PIECES = [
  { id: 0, location: "Central Library", hint: "Where stories live forever." },
  { id: 1, location: "Lecture Hall Complex", hint: "Where knowledge is passed down." },
  { id: 2, location: "Senate Hall", hint: "Where decisions echo." },
  { id: 3, location: "Brahmaputra Hostel", hint: "Where adventurers rest." },
];

// background-position for each quadrant of the 200%-sized puzzle image
const PIECE_POSITION = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];

const STORAGE_KEY = `${PUZZLE_ID}-progress`;

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(raw) && raw.length === PIECES.length) return raw;
  } catch {
    // ignore malformed storage
  }
  return PIECES.map(() => false);
}


export default function Puzzle1() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [collected, setCollected] = useState(loadProgress);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("playing"); // playing | correct | wrong | timeup
  
  const [toast, setToast] = useState(null);
  const wrongTimeout = useRef(null);


  const allCollected = collected.every(Boolean);
  const foundCount = collected.filter(Boolean).length;

  // A location in the game map hands this page a piece by linking to
  // /puzzle-1?collect=<pieceId>. The COLLECT button only shows for the
  // piece matching that id — the player must click it to collect.
  const collectIncoming = searchParams.get("collect");
  const collectId = (() => {
    if (collectIncoming === null) return null;
    const id = Number(collectIncoming);
    return Number.isInteger(id) && PIECES[id] ? id : null;
  })();

  function handleCollect(pieceId) {
    collectPiece(pieceId);
    searchParams.delete("collect");
    setSearchParams(searchParams, { replace: true });
  }


  function collectPiece(pieceId) {
    setCollected((prev) => {
      if (prev[pieceId]) return prev;
      const next = [...prev];
      next[pieceId] = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setToast(`Piece found at ${PIECES[pieceId].location}!`);
    window.clearTimeout(collectPiece._t);
    collectPiece._t = window.setTimeout(() => setToast(null), 3000);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!allCollected || status !== "playing" || !answer.trim()) return;

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

      {toast && <div className="piece-toast">✦ {toast}</div>}

      <div className="puzzle-card">
        <div className="puzzle-top-roll" />

        <div className="puzzle-header">
          <div>
            <h1>◆ PUZZLE CHALLENGE ◆</h1>
            <p>
              Find all 4 parts of the image. Once you have them all, guess
              the name of the object!
            </p>
          </div>
  
        </div>

        <div className="puzzle-grid-wrap">
          <div className="compass" aria-hidden="true">
            <span className="compass-n">N</span>
            <span className="compass-s">S</span>
            <span className="compass-w">W</span>
            <span className="compass-e">E</span>
            <div className="compass-needle" />
          </div>

          <div className="puzzle-grid">
            {PIECES.map((piece) => {
              const found = collected[piece.id];
              return (
                <div
                  key={piece.id}
                  className={`puzzle-piece piece-${piece.id} ${
                    found ? "found" : "locked"
                  }`}
                  style={
                    found
                      ? {
                          backgroundImage: `url(${puzzleImage})`,
                          backgroundPosition: PIECE_POSITION[piece.id],
                        }
                      : undefined
                  }
                  title={found ? piece.location : "???"}
                >
                  {!found && (
                    <>
                      <span className="piece-mark">?</span>
                      <span className="piece-loc">{piece.location}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="puzzle-progress">
          {foundCount} / {PIECES.length} pieces collected
        </div>

        <div className="locations-list">
          {PIECES.map((piece) => (
            <div
              key={piece.id}
              className={`location-chip ${collected[piece.id] ? "done" : ""}`}
            >
              <span className="location-name">
                {collected[piece.id] ? "✓" : "📍"} {piece.location}
              </span>
              {!collected[piece.id] && collectId === piece.id && (
                <button
                  type="button"
                  className="collect-btn"
                  onClick={() => handleCollect(piece.id)}
                >
                  COLLECT
                </button>
              )}
            </div>
          ))}
        </div>

        <form className="answer-section" onSubmit={handleSubmit}>
          <p className="answer-label">
            {allCollected
              ? "Think you know the answer?"
              : "Collect all 4 pieces to unlock the answer box."}
          </p>
          <div className="answer-row">
            <input
              type="text"
              placeholder="Enter the name of the object..."
              value={answer}
              disabled={!allCollected || status !== "playing"}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              type="submit"
              className={`submit-btn ${status === "wrong" ? "shake" : ""}`}
              disabled={!allCollected || status !== "playing"}
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
              Four parts of the same image are hidden across campus. Collect
              them all!
              {!allCollected && (
                <>
                  {" "}
                  Still hidden at:{" "}
                  {PIECES.filter((p) => !collected[p.id])
                    .map((p) => p.location)
                    .join(", ")}
                  .
                </>
              )}
            </p>
          </div>
        </div>

        <button className="back-btn" onClick={() => navigate("/Instructions")}>
          ← BACK TO MAP
        </button>

        <div className="puzzle-tip">
          💡 TIP: Explore every corner of the campus. Every location has a
          story to tell!
        </div>
      </div>

      {status === "correct" && (
        <div className="result-overlay">
          <div className="result-card">
            <h2>✦ QUEST COMPLETE ✦</h2>
            <p>You correctly identified the {ANSWER}!</p>
            <p className="points-earned">+{REWARD_POINTS} POINTS</p>
            <div className="next-hint-box">
              <span>💡</span>
              <p>
                Professor X has something important to tell you. He needs
                your help to solve a problem. Head to the Physics Department
                in Core 4 and find what Professor X has left for you.
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
