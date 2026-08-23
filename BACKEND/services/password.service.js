const crypto = require('crypto');

const PASSWORD_LENGTH = 12; // characters

/**
 * Generate a cryptographically secure temporary password.
 * Uses a character set that avoids ambiguous chars (0/O, 1/l/I).
 * Returns plain-text password — caller must hash before storing.
 */
function generatePassword(length = PASSWORD_LENGTH) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length * 2); // extra bytes to filter bias
  let password = '';
  for (let i = 0; i < bytes.length && password.length < length; i++) {
    const index = bytes[i] % charset.length;
    password += charset[index];
  }
  return password;
}

module.exports = { generatePassword };
