const express = require('express');
const router = express.Router();
const pastStudentController = require('../controllers/pastStudentController');

// --- PUBLIC ROUTES (No login required) ---

// 1. Fetch link details, verify token status & get dynamic diplomas
router.get('/link/:token', pastStudentController.getLinkByToken);

// 2. Fetch available diplomas list
router.get('/diplomas', pastStudentController.getAvailableDiplomas);

// 3. Submit public application
router.post('/submit/:token', pastStudentController.submitApplication);

module.exports = router;
