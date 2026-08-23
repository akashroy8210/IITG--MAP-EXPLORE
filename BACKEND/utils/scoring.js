function computeAdjustedTimeSeconds({ startedAt, completedAt, totalHintPenaltySeconds = 0, totalBonusRewardSeconds = 0 }) {
  const rawTimeSeconds = Math.max(0, Math.floor((new Date(completedAt) - new Date(startedAt)) / 1000));
  const adjustedTimeSeconds = Math.max(0, rawTimeSeconds + totalHintPenaltySeconds - totalBonusRewardSeconds);
  return { rawTimeSeconds, adjustedTimeSeconds };
}

module.exports = { computeAdjustedTimeSeconds };
