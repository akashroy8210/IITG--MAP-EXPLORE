const Student = require('../models/Student');

/**
 * Generate a clean, unique Instagram-style username from student's name.
 * Examples:
 *  "Rahul Sharma" -> "rahul_sharma"
 *  "Aditi Roy" -> "aditi_roy"
 *  "Johnathan Smith Jr." -> "johnathan_smith"
 *
 * If collisions exist in DB, tries:
 *  "rahul.sharma", "rahul_sharma_12", "rahul_sharma_984", etc.
 */
async function generateInstagramUsername(name, userNumber) {
  if (!name || typeof name !== 'string') {
    return `user${userNumber}`;
  }

  // 1. Clean and slugify name
  const cleanName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '')     // remove special symbols
    .trim();

  const parts = cleanName.split(/\s+/).filter(Boolean);

  let baseHandle = '';
  if (parts.length >= 2) {
    baseHandle = `${parts[0]}_${parts[1]}`;
  } else if (parts.length === 1) {
    baseHandle = parts[0];
  } else {
    baseHandle = `user${userNumber}`;
  }

  // Ensure minimum length
  if (baseHandle.length < 3) {
    baseHandle = `${baseHandle}_${userNumber % 1000}`;
  }

  // 2. Check if base handle is available
  const existingBase = await Student.findOne({ username: baseHandle });
  if (!existingBase) {
    return baseHandle;
  }

  // 3. Try dot-separated alternative (e.g. rahul.sharma)
  if (parts.length >= 2) {
    const dotHandle = `${parts[0]}.${parts[1]}`;
    const existingDot = await Student.findOne({ username: dotHandle });
    if (!existingDot) {
      return dotHandle;
    }
  }

  // 4. Try random 2-4 digit suffix (like Instagram suggestion)
  for (let i = 0; i < 10; i++) {
    const randomSuffix = Math.floor(10 + Math.random() * 900); // 2-3 digits
    const candidate = `${baseHandle}_${randomSuffix}`;
    const exists = await Student.findOne({ username: candidate });
    if (!exists) {
      return candidate;
    }
  }

  // 5. Ultimate deterministic fallback
  return `${baseHandle}_${userNumber}`;
}

module.exports = { generateInstagramUsername };
