const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pastStudentController = require('../controllers/pastStudentController');

// All routes in this router require admin authentication
router.use(auth);

// --- STATS ---
router.get('/stats', pastStudentController.getStats);

// --- APPLICATION MANAGEMENT ---
router.get('/applications', pastStudentController.getApplications);
router.get('/applications/:id', pastStudentController.getApplicationById);
router.patch('/applications/:id', pastStudentController.updateApplication);
router.patch('/applications/:id/status', pastStudentController.updateApplicationStatus);
router.delete('/applications/:id', pastStudentController.deleteApplication);

// --- LINK MANAGEMENT ---
router.get('/links', pastStudentController.getLinks);
router.post('/links', pastStudentController.createLink);
router.patch('/links/:id', pastStudentController.updateLink);
router.delete('/links/:id', pastStudentController.deleteLink);

module.exports = router;
