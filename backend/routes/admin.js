const express = require('express');
const { 
  login, me, applications, markApplicationDone, approveApplication, reviewApplication, 
  stats, config, createCourse, createEvent, deleteCourse, deleteEvent, 
  deleteApplication, messages, markMessageDone, deleteMessage 
} = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public: Admin login
router.post('/login', login);

// Public: Suggested admin email
router.get('/config', config);

// Protected: current admin info
router.get('/me', auth, me);

// Protected: example dashboard data
router.get('/applications', auth, applications);
router.patch('/applications/:id/done', auth, markApplicationDone);
router.post('/applications/:id/approve', auth, approveApplication);
router.patch('/applications/:id/review', auth, reviewApplication);
router.get('/stats', auth, stats);
router.get('/messages', auth, messages);
router.patch('/messages/:id/done', auth, markMessageDone);

// Protected: content creation
router.post('/courses', auth, createCourse);
router.post('/events', auth, createEvent);

// Protected: deletions
router.delete('/applications/:id', auth, deleteApplication);
router.delete('/courses/:id', auth, deleteCourse);
router.delete('/events/:id', auth, deleteEvent);
router.delete('/messages/:id', auth, deleteMessage);

module.exports = router;
