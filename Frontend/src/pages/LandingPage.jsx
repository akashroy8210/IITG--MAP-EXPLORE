import '../style/LandingPage.css'
import MainGateBg from "../assets/MainGateBg.png";
import Banner from '../assets/Banner.png';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage(){
    const [username, setUsername] = useState("");
    const [gameCode, setGameCode] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");

        if (!username || !gameCode) {
            setError(
                "Please enter username and game code"
            );

            return;
        }

            try {

                setLoading(true);


            //   const response = await axios.post(

            //     "http://localhost:/api/login",

            //     {
            //       username,
            //       gameCode
            //     },

            //     {
            //       withCredentials: true
            //     }

            //   );


            //   if (response.data.success) {

            //     console.log(
            //       "Logged in:",
            //       response.data.player
            //     );
                

                navigate("/Instructions");

            

            } catch (error) {

            console.error(error);

            if (error.response) {

                setError(
                error.response.data.message
                );

            } else {
                navigate("/Instructions");
                setError(
                "Unable to connect to server"
                );

            }

            } finally {
                setError("Unable to connect to server");
                setLoading(false);
                navigate("/instructions");
            }
    };





    return(
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
          Enter your details to enter the adventure
        </p>


        <form onSubmit={handleLogin}>

        
            {/* Username */}
            <div className="input-wrapper">
            <span className="input-icon">♙</span>

            <input
                type="text"
                placeholder="ENTER USERNAME"
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
            />
            </div>

            {/* Game Code */}
            <div className="input-wrapper">
            <span className="input-icon">🔑</span>

            <input
                type="text"
                placeholder="ENTER GAME CODE"
                value={gameCode}
                onChange={(e)=>setGameCode(e.target.value)}
            />
            </div>

            {/* Button */}
            <button className="start-button">
            {loading
            ? "CHECKING..."
            : "ENTER THE QUEST "}
            <span> →</span>
            </button>
        </form>
        <p className="organizer-text">
          Game code provided by the organizers
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
    )
}