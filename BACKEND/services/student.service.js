const Student = require('../models/Student');
const Map = require('../models/Map');
const { nextUserNumber } = require('./userNumber.service');
const { generateInstagramUsername } = require('./username.service');
const { generatePassword } = require('./password.service');
const { generateUniqueRouteKey, generateUniqueMainGateCode } = require('./routeKey.service');
const { claimMapSlot, releaseMapSlot } = require('./mapAssignment.service');

/**
 * Create a single student with all auto-generated fields.
 *
 * Steps (all backend-driven — frontend sends only name + email):
 *  1. Generate sequential userNumber (atomic counter)
 *  2. Derive unique Instagram-style username from student name
 *  3. Generate secure temporary password
 *  4. Hash password
 *  5. Claim a map slot (atomic, concurrency-safe)
 *  6. Generate unique routeKey & unique Main Gate victory code
 *  7. Save Student document
 *  8. Push studentId into Map.studentIds (display reference)
 *
 * Returns { student, temporaryPassword } — temporaryPassword is the
 * plain-text password that must be returned to the admin ONCE and never stored.
 *
 * Throws on any failure. Caller should handle 503 for no-map-available.
 */
async function createStudent({ name, email }) {
  // 1 & 2 — userNumber + Instagram-style username
  const userNumber = await nextUserNumber();
  const username = await generateInstagramUsername(name, userNumber);

  // 3 & 4 — password
  const temporaryPassword = generatePassword();
  const passwordHash = await Student.hashPassword(temporaryPassword);

  // 5 — map slot (atomic)
  const map = await claimMapSlot();
  if (!map) {
    const err = new Error('No available map slot. All maps have reached their maximum capacity of 10 students. Please create a new map first.');
    err.status = 503;
    throw err;
  }

  // 6 — routeKey and unique Main Gate Code
  let routeKey;
  let mainGateCode;
  try {
    routeKey = await generateUniqueRouteKey(userNumber);
    mainGateCode = await generateUniqueMainGateCode();
  } catch (err) {
    // Roll back the map slot claim
    await releaseMapSlot(map._id);
    throw err;
  }

  // 7 — save student
  let student;
  try {
    student = await Student.create({
      userNumber,
      username,
      name,
      email: email || null,
      passwordHash,
      mapId: map._id,
      routeKey,
      mainGateCode,
    });
  } catch (err) {
    await releaseMapSlot(map._id);
    throw err;
  }

  // 8 — add student ref to map (non-critical; don't fail on error here)
  await Map.updateOne({ _id: map._id }, { $addToSet: { studentIds: student._id } }).catch(() => {});

  return { student, map, temporaryPassword };
}

/**
 * Bulk-create students from an array of { name, email } objects.
 * Returns per-student results including failures with reasons.
 */
async function bulkCreateStudents(entries) {
  const results = [];

  for (const entry of entries) {
    try {
      const { student, map, temporaryPassword } = await createStudent({
        name: entry.name,
        email: entry.email,
      });

      results.push({
        status: 'created',
        name: student.name,
        email: student.email,
        userNumber: student.userNumber,
        username: student.username,
        temporaryPassword,
        mapId: map._id,
        mapName: map.name,
        routeKey: student.routeKey,
      });
    } catch (err) {
      results.push({
        status: 'failed',
        name: entry.name,
        email: entry.email,
        error: err.message,
      });
    }
  }

  return results;
}

module.exports = { createStudent, bulkCreateStudents };
