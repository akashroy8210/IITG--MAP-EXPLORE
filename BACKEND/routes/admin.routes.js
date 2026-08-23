const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const requireRole = require('../middleware/requireRole');
const { getDashboard } = require('../controllers/dashboard.controller');
const {
  listStudents,
  createSingleStudent,
  bulkCreate,
  getStudent,
  updateStatus,
  resetPassword,
  regenerateRouteKey,
  deleteStudent,
} = require('../controllers/student.controller');
const { listMaps, createMap, getMap } = require('../controllers/map.controller');
const {
  listMembers,
  createMember,
  bulkCreateMembers,
  updateMemberStatus,
  getMember,
} = require('../controllers/member.controller');

const router = express.Router();

// All admin routes require JWT auth
router.use(adminAuth);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboard);

// ─── Students ────────────────────────────────────────────────────────────────
router.get('/students', listStudents);
router.post('/students', createSingleStudent);
router.post('/students/bulk', bulkCreate);
router.get('/students/:id', getStudent);
router.patch('/students/:id/status', updateStatus);
router.post('/students/:id/reset-password', resetPassword);
router.post('/students/:id/regenerate-routekey', regenerateRouteKey);
router.delete('/students/:id', requireRole(['ADMIN', 'DEVOPS']), deleteStudent); // ADMIN or DEVOPS

// ─── Maps ─────────────────────────────────────────────────────────────────────
router.get('/maps', listMaps);
router.post('/maps', createMap);
router.get('/maps/:id', getMap);

// ─── Admin Members ────────────────────────────────────────────────────────────
router.get('/members', listMembers);
router.post('/members', requireRole('ADMIN'), createMember);           // ADMIN only
router.post('/members/bulk', requireRole('ADMIN'), bulkCreateMembers); // ADMIN only
router.get('/members/:id', getMember);
router.patch('/members/:id/status', requireRole('ADMIN'), updateMemberStatus); // ADMIN only

module.exports = router;
