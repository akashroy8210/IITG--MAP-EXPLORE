import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../style/Puzzle1.css";
import MainGateBg from "../assets/MainGateBg.png";
import puzzleImage from "../assets/puzzle-telescope.svg";
import { QUESTION_IDS } from "../constants/questionIds";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// ---- Puzzle configuration (swap per-location for future Puzzle-2, Puzzle-3 ...) ----
const PUZZLE_ID = QUESTION_IDS.PUZZLE_1;
// Verification happens server-side (see handleSubmit) — this is only used
// to name the object in the "quest complete" message.
// const ANSWER = "telescope";
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

function authHeaders() {
  const token = localStorage.getItem("student_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}


export default function Puzzle1() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [nextLocHint, setNextLocHint] = useState("");
  const [collected, setCollected] = useState(loadProgress);
  const [currQuestion , setCurrQuestion] = useState();
  const [questId, setQuestId] = useState();
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("playing"); // playing | correct | wrong | timeup
  const [code,setCode] = useState(0);
  
  const [toast, setToast] = useState(null);
  const [alreadySolvedCode, setAlreadySolvedCode] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const wrongTimeout = useRef(null);


  const allCollected = collected.every(Boolean);
  const foundCount = collected.filter(Boolean).length;

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

  // Pull the authoritative collected-pieces list from the backend on load,
  // so pieces collected earlier (at another location, or another session)
  // still show up as found and render their image here.
  useEffect( () => {
    let cancelled = false;

    // async function fetchProgress() {
    //   try {
    //     const res = await axios.get(
    //       `${API_BASE_URL}/student/puzzles/${PUZZLE_ID}/progress`,
    //       { headers: authHeaders() }
    //     );
    //     const collectedPieceIds = res.data?.collectedPieceIds || [];
    //     if (cancelled || !Array.isArray(collectedPieceIds)) return;

    //     setCollected((prev) => {
    //       const next = PIECES.map(
    //         (p) => prev[p.id] || collectedPieceIds.includes(p.id)
    //       );
    //       localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    //       return next;
    //     });
    //   } catch (err) {
    //     // Backend not available yet — keep using whatever is in localStorage.
    //     console.warn("Could not fetch puzzle progress from server:", err);
    //   }
    // }

    //fetchProgress();
    return () => {
      cancelled = true;
    };
  }, []);

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

    // Persist the collected piece server-side so it's remembered across
    // locations/sessions. UI already updated above — this just syncs it.
    // axios
    //   .post(
    //     `${API_BASE_URL}/student/puzzles/${PUZZLE_ID}/collect`,
    //     { pieceId },
    //     { headers: authHeaders() }
    //   )
    //   .catch((err) => {
    //     console.warn("Could not save collected piece to server:", err);
    //   });
  }

  async function handleSubmit(e) {
    
    e.preventDefault();

    if (!allCollected || status !== "playing" || !answer.trim()) return;

    const res1 = await axios.get(`${API_BASE_URL}/game/state`,{ headers: authHeaders() });
    const questions = JSON.parse(localStorage.getItem("student_sets_key"))

    console.log("student_sets_key:", questions);
    console.log(questions[0].questions[1].nextLocationHint);
    setNextLocHint(questions[0].questions[1].nextLocationHint);
    
    const questionId = questions[0].questions[res1.data.game.currentStageIndex]._id;
    setStatus("checking");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/game/answer`,
        { answer: answer.trim(),
          questionId: questionId,
         },
        { headers: authHeaders() }
      );

      if (res.data?.correct) {
        setCode(res.data.verificationCode);
        setStatus("correct");
        localStorage.removeItem(STORAGE_KEY);
            const res2 = await axios.get(`${API_BASE_URL}/game/state`,{ headers: authHeaders() });
            console.log(res2.data);
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

      {!alreadySolvedCode && toast && (
        <div className="piece-toast">
          <p>✦ {toast}</p>
          <button className="close-btn" onClick={() => window.close()}>
            Click here to continue with the game
          </button>
        </div>
      )}

      <div className="puzzle-card">
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

            <button className="back-btn" onClick={() => window.close()}>
              CLOSE WINDOW
            </button>
          </>
        ) : (
          <>
            <div className="puzzle-header">
              <div>
                <h1>◆ PUZZLE CHALLENGE ◆</h1>
                <p>
                  {currQuestion?.Question}
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


            <button className="back-btn" onClick={() => window.close()}>
              CLOSE WINDOW
            </button>

            <div className="puzzle-tip">
              💡 TIP: Explore every corner of the campus. Every location has a
              story to tell!
            </div>
          </>
        )}
      </div>

      {!alreadySolvedCode && status === "correct" && (
        <div className="result-overlay">
          <div className="result-card">
            <h2>✦ QUEST COMPLETE ✦</h2>
            <p>You correctly identified the Answer!</p>
            <p className="points-earned">+{REWARD_POINTS} POINTS</p>

            <div className="code-display">
              <span className="code-label">YOUR NEXT LOCATION CODE</span>
              <span className="code-value">{code}</span>
              <span className="code-note">
                Enter this code at the next location puzzle page to unlock it.
              </span>
            </div>

            <div className="next-hint-box">
              <span>💡</span>
              <p>{nextLocHint}</p>
            </div>
            <div className="result-actions">
              <button className="close-btn" onClick={() => window.close()}>
                Click here to continue with the game
              </button>
            </div>

          </div>
        </div>
      )}


    </div>
  );
}
