import '../style/LandingPage.css';
import MainGateBg from "../assets/MainGateBg.png";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function LandingPage() {
    const [username, setUsername] = useState("");
    const [gameCode, setGameCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!username.trim() || !gameCode.trim()) {
            setError("Please enter your username and password / game code");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(
                `${API_BASE_URL}/auth/student/login`,
                {
                    username: username.trim().toLowerCase(),
                    password: gameCode.trim()
                }
            );

            if (response.data && response.data.token) {
                localStorage.setItem("student_token", response.data.token);
                console.log(
    "TOKEN AFTER LOGIN:",
    localStorage.getItem("student_token")
);
                localStorage.setItem("student_user", JSON.stringify(response.data.student));
                if (response.data.student?.setsKey) {
                    localStorage.setItem("student_sets_key", JSON.stringify(response.data.student.setsKey));
                }
                console.log(response);
                navigate("/Instructions");
            } else {
                setError("Login failed. No token received.");
            }
        } catch (err) {
            console.error("Student login error:", err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Unable to connect to game server. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="landing-page">
            {/* Campus gate background */}
            <img
                src={MainGateBg}
                alt="IIT Guwahati Gate"
                className="gate-bg"
            />

            {/* Dark Cinematic Vignette */}
            <div className="vignette-overlay" />

            {/* Subtle Floating Embers / Golden Particles */}
            <div className="ember-particles" aria-hidden="true">
                <div className="ember ember-1"></div>
                <div className="ember ember-2"></div>
                <div className="ember ember-3"></div>
                <div className="ember ember-4"></div>
                <div className="ember ember-5"></div>
                <div className="ember ember-6"></div>
                <div className="ember ember-7"></div>
                <div className="ember ember-8"></div>
            </div>

            {/* HUD Corner Elements */}
            <div className="hud-element hud-top-left">
                <div className="hud-label">IITG QUEST</div>
                <div className="hud-value">MISSION 01</div>
            </div>

            <div className="hud-element hud-top-right">
                <span className="online-pulse"></span>
                <span className="hud-value">PLAYERS ONLINE: 00</span>
            </div>

            <div className="hud-element hud-bottom-left">
                <div className="hud-value">ADVENTURE MODE</div>
            </div>

            <div className="hud-element hud-bottom-right">
                <div className="hud-value">v1.0 • IIT GUWAHATI</div>
            </div>

            {/* Main Center Content Container */}
            <div className="quest-container">
                {/* Prominent Game Header Logo */}
                <header className="game-header">
                    <h1 className="game-title">THE IITG QUEST</h1>
                    <div className="game-subtitle-row">
                        <span className="sub-line"></span>
                        <p className="game-subtitle">RACE • SOLVE • DISCOVER</p>
                        <span className="sub-line"></span>
                    </div>
                    <p className="game-tagline">A CAMPUS ADVENTURE</p>
                </header>

                {/* Centered Ornate RPG Quest Panel */}
                <main className="login-card">
                    {/* Ornamental Corners */}
                    <div className="corner-ornament top-left">✦</div>
                    <div className="corner-ornament top-right">✦</div>
                    <div className="corner-ornament bottom-left">✦</div>
                    <div className="corner-ornament bottom-right">✦</div>

                    <h2 className="login-heading">⚔ BEGIN YOUR QUEST ⚔</h2>

                    <div className="login-divider">
                        <span>❖</span>
                    </div>

                    <form onSubmit={handleLogin} className="quest-form">
                        {/* Field 1: PLAYER NAME */}
                        <div className="input-group">
                            <label className="input-label">PLAYER NAME</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🛡️</span>
                                <input
                                    type="text"
                                    placeholder="Enter your username..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Field 2: QUEST CODE */}
                        <div className="input-group">
                            <label className="input-label">QUEST CODE</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🗝️</span>
                                <input
                                    type="password"
                                    placeholder="Enter game code..."
                                    value={gameCode}
                                    onChange={(e) => setGameCode(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* Primary Button */}
                        <button className="start-button" type="submit" disabled={loading}>
                            <span className="button-text">
                                {loading ? "CHECKING..." : "⚔ START ADVENTURE"}
                            </span>
                        </button>
                    </form>
                </main>

                {/* Quest Denied Error Message */}
                {error && (
                    <div className="quest-error" role="alert">
                        <div className="error-icon">⚠</div>
                        <div className="error-content">
                            <div className="error-title">QUEST DENIED</div>
                            <div className="error-message">{error}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}