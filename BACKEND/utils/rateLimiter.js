const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again shortly' },
});

const adminLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many admin login attempts, please try again shortly' },
});

// Per-user-per-question cooldown on physical verification codes,
// tracked against timestamps already stored on the progress document.
function codeAttemptCooldownRemaining(attempts, cooldownSeconds) {
  if (!attempts || attempts.length === 0) return 0;
  const last = attempts[attempts.length - 1];
  const elapsedMs = Date.now() - new Date(last.at).getTime();
  const remainingMs = cooldownSeconds * 1000 - elapsedMs;
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

module.exports = { loginLimiter, adminLoginLimiter, codeAttemptCooldownRemaining };
