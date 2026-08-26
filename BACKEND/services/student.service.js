const Student = require('../models/Student');
const Map = require('../models/Map');
const Sets = require('../models/Sets.model');
const { nextUserNumber } = require('./userNumber.service');
const { generateInstagramUsername } = require('./username.service');
const { generatePassword } = require('./password.service');
const { generateUniqueMainGateCode } = require('./routeKey.service');
const { claimMapSlot, releaseMapSlot } = require('./mapAssignment.service');

/**
 * Helper to pick next available SetsKey round-robin
 */
async function getRoundRobinSet() {
  const sets = await Sets.find({}).sort({ setsKey: 1 });
  if (sets.length === 0) return null;
  const count = await Student.countDocuments();
  return sets[count % sets.length];
}

/**
 * Create a single student with all auto-generated fields.
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
    const err = new Error('No available map slot. All maps have reached their maximum capacity. Please create a new map first.');
    err.status = 503;
    throw err;
  }

  // 6 — setsKey and unique Main Gate Code
  let mainGateCode;
  let assignedSet;
  try {
    mainGateCode = await generateUniqueMainGateCode();
    assignedSet = await getRoundRobinSet();
  } catch (err) {
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
      password: passwordHash,
      mapId: map._id,
      setsKey: assignedSet ? assignedSet._id : null,
      mainGateCode,
    });
  } catch (err) {
    await releaseMapSlot(map._id);
    throw err;
  }

  // 8 — add student ref to map (non-critical)
  await Map.updateOne({ _id: map._id }, { $addToSet: { studentIds: student._id } }).catch(() => {});

  return { student, map, temporaryPassword, mainGateCode, assignedSet };
}

/**
 * Bulk-create students from an array of { name, email } objects.
 */
async function bulkCreateStudents(entries) {
  const results = [];

  for (const entry of entries) {
    try {
      const { student, map, temporaryPassword, mainGateCode, assignedSet } = await createStudent({
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
        mainGateCode,
        mapId: map._id,
        mapName: map.name,
        setsKey: assignedSet ? assignedSet.setsKey : null,
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
