const Student = require('../models/Student');
const Map = require('../models/Map');
const AdminUser = require('../models/AdminUser');

/**
 * GET /api/admin/dashboard
 * Returns aggregated stats for the admin dashboard.
 */
async function getDashboard(req, res) {
  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    totalMaps,
    fullMaps,
    availableMaps,
    totalRouteKeys,
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Student.countDocuments({ status: 'inactive' }),
    Map.countDocuments(),
    Map.countDocuments({ status: 'full' }),
    Map.countDocuments({ status: 'available' }),
    Student.countDocuments({ routeKey: { $ne: null } }),
  ]);

  // Total available slots across all non-full maps
  const mapsWithSlots = await Map.aggregate([
    { $match: { status: 'available' } },
    { $project: { slots: { $subtract: ['$capacity', '$assignedCount'] } } },
    { $group: { _id: null, totalSlots: { $sum: '$slots' } } },
  ]);
  const availableSlots = mapsWithSlots[0]?.totalSlots ?? 0;

  // Game progress breakdown
  const [notStarted, inProgress, completed] = await Promise.all([
    Student.countDocuments({ gameStatus: 'not_started' }),
    Student.countDocuments({ gameStatus: 'in_progress' }),
    Student.countDocuments({ gameStatus: 'completed' }),
  ]);

  res.json({
    students: {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
    },
    maps: {
      total: totalMaps,
      full: fullMaps,
      available: availableMaps,
      availableSlots,
    },
    routeKeys: {
      total: totalRouteKeys,
    },
    gameProgress: {
      notStarted,
      inProgress,
      completed,
    },
  });
}

module.exports = { getDashboard };
