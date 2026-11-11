const express = require('express');
const noticeController = require('../controllers/noticeController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', noticeController.list);
router.get('/active-popups', noticeController.getActivePopups);

// Protected administrative routes
router.post('/', auth, noticeController.create);
router.put('/:id', auth, noticeController.update);
router.patch('/:id/toggle-popup', auth, noticeController.togglePopup);
router.delete('/:id', auth, noticeController.remove);

module.exports = router;

