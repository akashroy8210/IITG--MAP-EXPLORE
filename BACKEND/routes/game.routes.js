const express = require('express');
const studentAuth = require('../middleware/studentAuth');
const {
  getMe,
  startGame,
  submitAnswer,
  verifyCode,
  useHint,
  finalAnswer,
  mainGateCode,
} = require('../controllers/game.controller');

const router = express.Router();

// Specific routes with student JWT auth
router.get('/student/me', studentAuth, getMe);
router.get('/game/state', studentAuth, getMe);
router.post('/game/start', studentAuth, startGame);
router.post('/game/answer', studentAuth, submitAnswer);
router.post('/game/submit-answer', studentAuth, submitAnswer);
router.post('/game/verify-code', studentAuth, verifyCode);
router.post('/game/verify-location', studentAuth, verifyCode);
router.post('/game/hint', studentAuth, useHint);
router.post('/game/use-hint', studentAuth, useHint);
router.post('/game/final-answer', studentAuth, finalAnswer);
router.post('/game/maingate-code', studentAuth, mainGateCode);
router.post('/game/main-gate', studentAuth, mainGateCode);

module.exports = router;
