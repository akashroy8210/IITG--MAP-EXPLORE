import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import "../style/InstructionsPage.css";


function authHeaders() {
  const token = localStorage.getItem("student_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';


export default function InstructionsPage() {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    const token = localStorage.getItem("student_token");
  
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const student = JSON.parse(localStorage.getItem("student_user") || "{}");
      if (student && (student.name || student.username)) {
        setStudentInfo(student);
      } else {
        navigate("/login", { replace: true });
      }
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleEnterMap = async () => {
    if (loading) return;
    setLoading(true);
    try {
      console.log("inentermap");
      const res = await axios.post(
        `${API_BASE_URL}/game/start`,{},
        { headers: authHeaders() }
      );

      console.log(res);

      
      const student = JSON.parse(localStorage.getItem('student_user') || '{}');
      const rawUrl = student?.map?.mapUrl || 'https://play.workadventu.re/@/iitgmap/iitgmap/maps/office';
      const playerName = (student.name || student.username || 'Adventurer').trim();
      const sessionId = res.data.sessionId;

      // Parse and inject bypass parameters into map URL
      let targetUrl = rawUrl;
      try {
        const urlObj = new URL(rawUrl);
        urlObj.searchParams.set("name", playerName);
        urlObj.searchParams.set("session", sessionId);
        urlObj.searchParams.set('disableCamera', 'true');
        urlObj.searchParams.set('disableMicrophone', 'true');
        urlObj.searchParams.set('audio', 'disabled');
        urlObj.searchParams.set('video', 'disabled');
        targetUrl = urlObj.toString();
      } catch {
        // Fallback string concatenation if not standard URL
        const separator = rawUrl.includes('?') ? '&' : '?';
        targetUrl = `${rawUrl}${separator}name=${encodeURIComponent(playerName)}&disableCamera=true&disableMicrophone=true&audio=disabled&video=disabled`;
      }

      window.location.href = targetUrl;
    } catch {
      window.location.href = 'https://play.workadventu.re/@/iitgmap/iitgmap/maps/office';
    }
  };

  return (
    <div className="instructions-page">
      {/* Background Dark Overlay */}
      <div className="instructions-overlay"></div>

      {/* Atmospheric Particles */}
      <div className="ember-particles" aria-hidden="true">
        <div className="ember ember-1"></div>
        <div className="ember ember-2"></div>
        <div className="ember ember-3"></div>
        <div className="ember ember-4"></div>
        <div className="ember ember-5"></div>
      </div>

      <div className="instructions-container">
        {!opened ? (
          /* STATE 1: CLOSED QUEST CARD */
          <div
            className="closed-quest-card"
            onClick={() => setOpened(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setOpened(true)}
          >
            {/* Corner Ornaments */}
            <div className="corner-ornament top-left">✦</div>
            <div className="corner-ornament top-right">✦</div>
            <div className="corner-ornament bottom-left">✦</div>
            <div className="corner-ornament bottom-right">✦</div>

            <div className="quest-card-inner">
              <span className="quest-emblem">⚔</span>
              <h1 className="quest-card-title">YOUR QUEST AWAITS</h1>
              <div className="quest-card-divider">❖</div>
              <p className="quest-card-subtitle">Click to reveal the instructions</p>
            </div>
          </div>
        ) : (
          /* STATE 2: REVEALED INSTRUCTIONS PANEL */
          <div className="open-quest-panel">
            {/* Corner Ornaments */}
            <div className="corner-ornament top-left">✦</div>
            <div className="corner-ornament top-right">✦</div>
            <div className="corner-ornament bottom-left">✦</div>
            <div className="corner-ornament bottom-right">✦</div>

            <div className="panel-content">
              {/* Header */}
              <header className="mission-header">
                <h1 className="mission-title">⚔ YOUR MISSION ⚔</h1>
                <p className="mission-intro">
                  Explore the IIT Guwahati campus, discover hidden locations,
                  solve puzzles, follow clues and reach the Main Gate and enter the code.
                </p>
              </header>

              <div className="ornamental-divider">
                <span>✦</span>
                <span className="line"></span>
                <span>❖</span>
                <span className="line"></span>
                <span>✦</span>
              </div>

              {/* 4 Quest Steps */}
              <div className="quest-steps">
                <div className="quest-step">
                  <div className="step-badge">01</div>
                  <div className="step-info">
                    <h3 className="step-title">EXPLORE</h3>
                    <p className="step-desc">
                      Explore the campus map and locate hidden quest locations.
                    </p>
                  </div>
                </div>

                <div className="quest-step">
                  <div className="step-badge">02</div>
                  <div className="step-info">
                    <h3 className="step-title">DISCOVER</h3>
                    <p className="step-desc">
                      Approach a quest location to reveal its puzzle.
                    </p>
                  </div>
                </div>

                <div className="quest-step">
                  <div className="step-badge">03</div>
                  <div className="step-info">
                    <h3 className="step-title">SOLVE</h3>
                    <p className="step-desc">
                      Solve the puzzle correctly and Get clues for the next Location and carry the verification code to the next location.
                    </p>
                  </div>
                </div>

                <div className="quest-step">
                  <div className="step-badge">04</div>
                  <div className="step-info">
                    <h3 className="step-title">PROGRESS</h3>
                    <p className="step-desc">
                      Follow the clue and continue your journey.
                    </p>
                  </div>
                </div>

                <div className="quest-step">
                  <div className="step-badge">05</div>
                  <div className="step-info">
                    <h3 className="step-title">Winner</h3>
                    <p className="step-desc">
                      Be the first to enter the code to win!
                    </p>
                  </div>
                </div>
              </div>

              {/* Player Status Badge if present */}
              {studentInfo && (
                <div className="player-status-bar">
                  <span className="player-icon">🛡️</span>
                  <span className="player-name">
                    ADVENTURER: <strong>{(studentInfo.name || studentInfo.username || '').toUpperCase()}</strong>
                  </span>
                  {studentInfo.score !== undefined && (
                    <span className="player-score">
                      POINTS: <strong>{studentInfo.score}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Primary Action Button */}
              <button
                className={`enter-campus-btn ${loading ? 'loading' : ''}`}
                onClick={handleEnterMap}
                disabled={loading}
              >
                <span className="btn-text">
                  {loading ? (
                    <span className="loading-spinner-wrap">
                      <span className="spinner-icon">⏳</span> ENTERING THE MAP...
                    </span>
                  ) : (
                    "⚔ ENTER THE CAMPUS"
                  )}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay when Entering Map */}
      {loading && (
        <div className="map-loading-overlay">
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <h2>ENTERING CAMPUS MAP...</h2>
            <p>Preparing your quest world, adventurer!</p>
          </div>
        </div>
      )}
    </div>
  );
}