/**
 * Compute raw elapsed time and penalty/bonus adjusted time.
 */
function computeAdjustedTimeSeconds({
  startedAt,
  completedAt,
  totalHintPenaltySeconds = 0,
  totalBonusRewardSeconds = 0,
}) {
  if (!startedAt) {
    return { rawTimeSeconds: 0, adjustedTimeSeconds: 0 };
  }

  const end = completedAt ? new Date(completedAt) : new Date();
  const start = new Date(startedAt);
  const rawTimeSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const adjustedTimeSeconds = Math.max(
    0,
    rawTimeSeconds + (totalHintPenaltySeconds || 0) - (totalBonusRewardSeconds || 0)
  );

  return { rawTimeSeconds, adjustedTimeSeconds };
}

module.exports = { computeAdjustedTimeSeconds };
