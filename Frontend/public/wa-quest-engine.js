/**
 * WorkAdventure Interactive Quest Engine Script
 *
 * Automatically manages:
 *  1. Zone triggers for the 5 campus quest puzzles
 *  2. Code gating — only the active stage popup opens
 *  3. Removal/suppression of popups for already solved locations
 *  4. Instant auto-close when a puzzle is solved
 */

(function () {
  // Base frontend URL where the React puzzle pages live
  const FRONTEND_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:5173'
    : window.location.origin;

  // 5 Location Zones mapped to stages
  const QUEST_ZONES = [
    { zone: 'zone_puzzle_1', stageIndex: 0, path: '/puzzle-1', name: 'Central Library (Telescope)' },
    { zone: 'zone_puzzle_2', stageIndex: 1, path: '/puzzle-2', name: 'Physics Dept Core 4' },
    { zone: 'zone_puzzle_3', stageIndex: 2, path: '/puzzle-3', name: 'Auditorium' },
    { zone: 'zone_puzzle_4', stageIndex: 3, path: '/puzzle-4', name: 'Library Keypad' },
    { zone: 'zone_puzzle_5', stageIndex: 4, path: '/puzzle-5', name: 'New SAC (Final Puzzle)' },
  ];

  let currentPopup = null;

  function getStudentProgress() {
    try {
      const student = JSON.parse(localStorage.getItem('student_user') || '{}');
      return {
        stageIndex: student.currentStageIndex ?? 0,
        gameStatus: student.gameStatus || 'in_progress',
        username: student.username || WA.player.name || '',
      };
    } catch {
      return { stageIndex: 0, gameStatus: 'in_progress', username: WA.player.name || '' };
    }
  }

  // Register each zone trigger in WorkAdventure
  QUEST_ZONES.forEach(({ zone, stageIndex, path, name }) => {
    WA.room.onEnterZone(zone, () => {
      const { stageIndex: currentStage } = getStudentProgress();

      // CASE 1: ALREADY SOLVED LOCATION → DO NOT SHOW POPUP
      if (stageIndex < currentStage) {
        WA.ui.displayActionMessage({
          message: `✓ ${name}: Puzzle already completed. Proceed to your next clue!`,
          callback: () => {},
        });
        return;
      }

      // CASE 2: FUTURE LOCKED LOCATION → SHOW LOCK NOTIFICATION
      if (stageIndex > currentStage) {
        WA.ui.displayActionMessage({
          message: `🔒 ${name} is locked! Solve your current clue first to unlock this puzzle.`,
          callback: () => {},
        });
        return;
      }

      // CASE 3: CURRENT ACTIVE PUZZLE → OPEN EMBEDDED WEBSITE POPUP
      const targetUrl = `${FRONTEND_URL}${path}`;

      currentPopup = WA.ui.openPopup(
        'quest_popup',
        `⚡ ACTIVE QUEST: ${name}\nPress SPACE or click below to open the challenge!`,
        [
          {
            label: 'OPEN PUZZLE CHALLENGE →',
            className: 'primary',
            callback: () => {
              WA.nav.openTab(targetUrl);
            },
          },
        ]
      );
    });

    WA.room.onLeaveZone(zone, () => {
      if (currentPopup) {
        currentPopup.close();
        currentPopup = null;
      }
    });
  });

  // Listen for puzzle solved events to auto-close modals and update state
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PUZZLE_SOLVED') {
      const { nextStageIndex } = event.data;
      try {
        const student = JSON.parse(localStorage.getItem('student_user') || '{}');
        student.currentStageIndex = nextStageIndex;
        localStorage.setItem('student_user', JSON.stringify(student));
      } catch {}

      if (currentPopup) {
        currentPopup.close();
        currentPopup = null;
      }

      WA.ui.displayActionMessage({
        message: `🎉 Quest solved! Your next location has been unlocked on the map!`,
        callback: () => {},
      });
    }
  });

  console.log('✅ WorkAdventure Quest Engine loaded with code gating and dynamic popup suppression.');
})();
