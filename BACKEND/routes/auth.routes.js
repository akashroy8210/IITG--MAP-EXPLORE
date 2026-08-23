const express = require('express');
const { studentLogin, adminLogin } = require('../controllers/auth.controller');
const { loginLimiter, adminLoginLimiter } = require('../utils/rateLimiter');

const router = express.Router();

// Student login: username + password
router.post('/student/login', loginLimiter, studentLogin);

// Admin/DevOps login: email + password
router.post('/admin/login', adminLoginLimiter, adminLogin);

module.exports = router;
