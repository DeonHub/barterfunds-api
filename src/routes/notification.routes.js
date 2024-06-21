const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');

const {
  getNotifications,
  createNotification,
  updateNotification,
  getNotificationById,
  deleteNotification,
  getNotificationsByUser,
  markAsUnread
} = require('../controllers/notification.controllers');

router.get('/', checkAuth, getNotifications);
router.post('/', checkAuth, createNotification);
router.patch('/:notificationId', checkAuth, updateNotification);
router.patch('/z/:notificationId', checkAuth, markAsUnread);

router.get("/x/user", checkAuth, getNotificationsByUser);
router.get('/:notificationId', checkAuth, getNotificationById);
router.delete('/:notificationId', checkAuth, deleteNotification);

module.exports = router;
