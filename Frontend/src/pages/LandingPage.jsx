import '../style/LandingPage.css';
import MainGateBg from "../assets/MainGateBg.png";
import Banner from '../assets/Banner.png';
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
                localStorage.setItem("student_user", JSON.stringify(response.data.student));
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
        <>
            <div className="landing-page">
                {/* Campus gate background */}
                <img
                    src={MainGateBg}
                    alt="IIT Guwahati Gate"
                    className="gate-bg"
                />

                {/* Quest banner */}
                <img
                    src={Banner}
                    alt="The IITG Quest"
                    className="quest-banner"
                />

                {/* Login Card */}
                <div className="login-card">
                    <div className="login-heading">
                        BEGIN YOUR QUEST
                    </div>

                    <div className="login-divider">
                        <span>✦</span>
                    </div>

                    <p className="login-description">
                        Enter your credentials to enter the adventure
                    </p>

                    <form onSubmit={handleLogin}>
                        {/* Username */}
                        <div className="input-wrapper">
                            <span className="input-icon">♙</span>
                            <input
                                type="text"
                                placeholder="ENTER USERNAME (e.g. user100001)"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>

                        {/* Game Code / Password */}
                        <div className="input-wrapper">
                            <span className="input-icon">🔑</span>
                            <input
                                type="password"
                                placeholder="ENTER PASSWORD / GAME CODE"
                                value={gameCode}
                                onChange={(e) => setGameCode(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Button */}
                        <button className="start-button" type="submit" disabled={loading}>
                            {loading ? "CHECKING..." : "ENTER THE QUEST "}
                            <span> →</span>
                        </button>
                    </form>

                    <p className="organizer-text">
                        Credentials provided by the administrators
                    </p>
                </div>
            </div>

            {error && (
                <div className="quest-error">
                    <div className="error-icon">⚠</div>
                    <div className="error-content">
                        <div className="error-title">
                            QUEST DENIED
                        </div>
                        <div className="error-message">
                            {error}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}