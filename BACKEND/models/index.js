// Central export point
module.exports = {
  // New student-based models
  Student: require('./Student'),
  AdminUser: require('./AdminUser'),
  Counter: require('./Counter'),

  // Map (updated)
  Map: require('./Map'),

  // Game engine models (kept)
  Question: require('./Question'),
  GameConfig: require('./GameConfig'),

  // Progress / log models (updated userId)
  UserQuestionProgress: require('./UserQuestionProgress'),
  HintUsageLog: require('./HintUsageLog'),
  BonusUsageLog: require('./BonusUsageLog'),
};
