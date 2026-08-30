const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const requireRole = require('../middleware/requireRole');
const { getDashboard } = require('../controllers/dashboard.controller');
const { getLeaderboard, getStudentQuestionProgress } = require('../controllers/leaderboard.controller');
const {
  listStudents,
  createSingleStudent,
  bulkCreate,
  getStudent,
  updateStatus,
  resetPassword,
  assignStudentSet,
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
const {
  listQuestions,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions,
} = require('../controllers/question.controller');
const {
  listSets,
  getSet,
  generateSetsController,
  assignSetsController,
  deleteSet,
  deleteAllSets,
} = require('../controllers/sets.controller');

const router = express.Router();

// All admin routes require JWT auth
router.use(adminAuth);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboard);
router.get('/leaderboard', getLeaderboard);
router.get('/students-progress', getStudentQuestionProgress);

// ─── Questions ────────────────────────────────────────────────────────────────
router.get('/questions', listQuestions);
router.post('/questions', createQuestion);
router.post('/questions/bulk', bulkUploadQuestions);
router.get('/questions/:id', getQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// ─── Sets ─────────────────────────────────────────────────────────────────────
router.get('/sets', listSets);
router.get('/sets/:id', getSet);
router.post('/sets/generate', generateSetsController);
router.post('/sets/assign', assignSetsController);
router.delete('/sets/:id', deleteSet);
router.delete('/sets', deleteAllSets);

// ─── Students ────────────────────────────────────────────────────────────────
router.get('/students', listStudents);
router.post('/students', createSingleStudent);
router.post('/students/bulk', bulkCreate);
router.get('/students/:id', getStudent);
router.patch('/students/:id/status', updateStatus);
router.post('/students/:id/reset-password', resetPassword);
router.post('/students/:id/assign-set', assignStudentSet);
router.delete('/students/:id', requireRole(['ADMIN', 'DEVOPS']), deleteStudent);

// ─── Maps ─────────────────────────────────────────────────────────────────────
router.get('/maps', listMaps);
router.post('/maps', createMap);
router.get('/maps/:id', getMap);

// ─── Admin Members ────────────────────────────────────────────────────────────
router.get('/members', listMembers);
router.post('/members', requireRole('ADMIN'), createMember);
router.post('/members/bulk', requireRole('ADMIN'), bulkCreateMembers);
router.get('/members/:id', getMember);
router.patch('/members/:id/status', requireRole('ADMIN'), updateMemberStatus);

module.exports = router;
