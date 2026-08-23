// Thin helpers around io.to(room).emit(...) so controllers don't need to know
// room-naming conventions. Rooms are now per-user instead of per-team.

let ioInstance = null;

function initEmitters(io) {
  ioInstance = io;
}

function room(userId) {
  return `user:${userId}`;
}

function emitGameStarted(userId, payload) {
  ioInstance.to(room(userId)).emit('game_started', payload);
}

function emitAnswerSolved(userId, payload) {
  ioInstance.to(room(userId)).emit('answer_solved', payload);
}

function emitAnswerRejected(userId, payload) {
  ioInstance.to(room(userId)).emit('answer_rejected', payload);
}

function emitCodeVerified(userId, payload) {
  ioInstance.to(room(userId)).emit('code_verified', payload);
}

function emitHintUsed(userId, payload) {
  ioInstance.to(room(userId)).emit('hint_used', payload);
}

function emitBonusUsed(userId, payload) {
  ioInstance.to(room(userId)).emit('bonus_used', payload);
}

function emitFinalPuzzleUnlocked(userId, payload) {
  ioInstance.to(room(userId)).emit('final_puzzle_unlocked', payload);
}

function emitFinalSolved(userId, payload) {
  ioInstance.to(room(userId)).emit('final_solved', payload);
}

function emitGameCompleted(userId, payload) {
  ioInstance.to(room(userId)).emit('game_completed', payload);
}

module.exports = {
  initEmitters,
  emitGameStarted,
  emitAnswerSolved,
  emitAnswerRejected,
  emitCodeVerified,
  emitHintUsed,
  emitBonusUsed,
  emitFinalPuzzleUnlocked,
  emitFinalSolved,
  emitGameCompleted,
};
