const crypto = require('crypto');
const Student = require('../models/Student');

const ROUTE_GROUPS = ['ROUTE_A', 'ROUTE_B', 'ROUTE_C', 'ROUTE_D', 'ROUTE_E'];
const CHAR_SET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random alphanumeric string.
 */
function generateRaw(length = 4) {
  const bytes = crypto.randomBytes(length * 2);
  let key = '';
  for (let i = 0; i < bytes.length && key.length < length; i++) {
    key += CHAR_SET[bytes[i] % CHAR_SET.length];
  }
  return key;
}

/**
 * Generate a unique routeKey with guaranteed route sequence rotation.
 * Examples:
 *  Student 1 -> "ROUTE_A_K92M" (Sequence A: Library -> Physics -> Auditorium -> Keypad -> SAC)
 *  Student 2 -> "ROUTE_B_74P2" (Sequence B: Physics -> Auditorium -> Library -> Keypad -> SAC)
 *  Student 3 -> "ROUTE_C_X81L" (Sequence C: Auditorium -> Library -> Physics -> Keypad -> SAC)
 *  Student 4 -> "ROUTE_D_53MN" (Sequence D: Keypad -> Auditorium -> Physics -> Library -> SAC)
 *  Student 5 -> "ROUTE_E_92AQ" (Sequence E: Library -> Auditorium -> Physics -> Keypad -> SAC)
 */
async function generateUniqueRouteKey(userNumber = 0) {
  const routeGroupIndex = userNumber ? Math.abs(Number(userNumber)) % ROUTE_GROUPS.length : Math.floor(Math.random() * ROUTE_GROUPS.length);
  const routeGroup = ROUTE_GROUPS[routeGroupIndex];

  for (let attempt = 0; attempt < 10; attempt++) {
    const key = `${routeGroup}_${generateRaw(4)}`;
    const exists = await Student.exists({ routeKey: key });
    if (!exists) return key;
  }

  return `${routeGroup}_${generateRaw(6)}`;
}

/**
 * Generate a unique personal Main Gate code for a student.
 * Examples: "GATE-7391", "GATE-8156", "GATE-2409"
 */
async function generateUniqueMainGateCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 digit number
    const code = `GATE-${randomDigits}`;
    const exists = await Student.exists({ mainGateCode: code });
    if (!exists) return code;
  }

  // Fallback with 6 chars
  return `GATE-${Math.floor(100000 + Math.random() * 900000)}`;
}

module.exports = { generateUniqueRouteKey, generateUniqueMainGateCode, generateRaw, ROUTE_GROUPS };
