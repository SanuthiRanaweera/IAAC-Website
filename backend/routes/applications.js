const express = require('express');
const { create } = require('../controllers/applicationController');
const { reviewApplication } = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public endpoint to submit applications
router.post('/', create);

// Authenticated endpoint to review applications without approval or email
router.patch('/:id/review', auth, reviewApplication);

module.exports = router;
