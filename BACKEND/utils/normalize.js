function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

module.exports = { normalizeText };
