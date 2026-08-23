import { useState } from "react";
import "../style/InstructionsPage.css";

export default function InstructionsPage() {

  const [opened, setOpened] = useState(false);

  return (
    <div className="instructions-page">

      {/* Background */}
      <div className="instructions-overlay"></div>

      <div className="instructions-container">

        {!opened ? (
          /* CLOSED SCROLL */
          <div
            className="closed-scroll"
            onClick={() => setOpened(true)}
          >

            <div className="scroll-roll top-roll"></div>

            <div className="scroll-body">
              <span>📜</span>
              <h1>YOUR QUEST AWAITS</h1>
              <p>Click to reveal the instructions</p>
            </div>

            <div className="scroll-roll bottom-roll"></div>

          </div>
        ) : (

          /* OPEN SCROLL */
          <div className="open-scroll">

            <div className="scroll-top"></div>

            <div className="scroll-content">

              <h1>THE QUEST</h1>

              <div className="ornament">
                ✦ ───────── ✦ ───────── ✦
              </div>

              <h2>YOUR MISSION</h2>

              <p>
                Welcome, adventurer!
              </p>

              <p>
                Your journey begins inside the IIT Guwahati campus.
                Explore the campus, discover hidden locations,
                solve the challenges and follow the clues that
                lead you closer to the final destination.
              </p>


              <h2>HOW TO PLAY</h2>

              <div className="rules">

                <div className="rule">
                  <span>01</span>
                  <p>
                    Explore the campus map and locate the marked
                    quest locations.
                  </p>
                </div>

                <div className="rule">
                  <span>02</span>
                  <p>
                    Approach a quest location to reveal its puzzle.
                  </p>
                </div>

                <div className="rule">
                  <span>03</span>
                  <p>
                    Solve the puzzle correctly to earn points and
                    receive your next clue.
                  </p>
                </div>

                <div className="rule">
                  <span>04</span>
                  <p>
                    Follow the clues and continue your journey
                    across the campus.
                  </p>
                </div>

                <div className="rule">
                  <span>05</span>
                  <p>
                    Reach the final destination and enter the
                    secret code to complete the quest.
                  </p>
                </div>

              </div>


              <div className="warning">

                ⚔️ <strong>REMEMBER</strong>

                <br />

                Think carefully. Work quickly.
                Every clue brings you closer to the treasure.

              </div>

                <button
                    className="map-btn"
                    onClick={()=>window.location.href='https://play.workadventu.re/@/iitgmap/iitgmap/maps/office'}>
                    ENTER THE MAP <span>→</span>
                </button>

            </div>

            <div className="scroll-bottom"></div>

          </div>

        )}

      </div>

    </div>
  );
}