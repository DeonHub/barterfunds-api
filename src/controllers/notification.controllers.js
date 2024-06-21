const mongoose = require('mongoose');
const Notification = require('../models/notification');

const getNotifications = (req, res, next) => {
  const filters = [];
  filters.push({ status: { $ne: 'deleted' } });

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };

  Notification.find(filter)
  .populate('userId')
    .exec()
    .then((notifications) => {
      res.status(200).json({
        success: true,
        count: notifications.length,
        notifications: notifications,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        success: false,
        error: err,
      });
    });
};

const getNotificationsByUser = (req, res, next) => {
    const userId = req.user.userId;

    Notification.find({ userId: userId })
        .sort({ createdAt: -1 })
        .populate('userId')
        .exec()
        .then(notifications => {
            res.status(200).json({
                success: true,
                count: notifications.length,
                notifications: notifications,
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                success: false,
                error: err,
            });
        });
};


const createNotification = (req, res, next) => {
    const notification = new Notification({
      _id: new mongoose.Types.ObjectId(),
        userId: req.body.userId,
        subject: req.body.subject,
        message: req.body.message,
        type: 'info'
    });

    notification.save()
        .then(result => {
            res.status(201).json({
                success: true,
                message: "Notification created successfully",
                createdNotification: result,
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                success: false,
                error: err,
            });
        });
};

const getNotificationById = (req, res, next) => {
  const id = req.params.notificationId;
  Notification.findById(id)
  .populate('userId')
    .exec()
    .then((notification) => {
      if (notification) {
        res
          .status(200)
          .json({ success: true, message: "Notification found", notification: notification });
      } else {
        res
          .status(404)
          .json({ success: false, message: "Notification not found", notification: {} });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};

const markAsUnread = async (req, res, next) => {
    const notificationId = req.params.notificationId;
    console.log()

    try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        if (!notification.read) {
            return res.status(200).json({
                success: true,
                message: "Notification is already marked as unread",
            });
        }

        notification.read = false;
        notification.updatedAt = new Date();
        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as unread",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err,
        });
    }
};


const updateNotification = async (req, res, next) => {
    const notificationId = req.params.notificationId;

    try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        if (notification.read) {
            return res.status(200).json({
                success: true,
                message: "Notification is already marked as read",
            });
        }

        notification.read = true;
        notification.updatedAt = new Date();
        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err,
        });
    }
};

const deleteNotification = (req, res, next) => {
    const notificationId = req.params.notificationId;

    Notification.deleteOne({ _id: notificationId })
        .exec()
        .then(result => {
            res.status(200).json({
                success: true,
                message: "Notification deleted",
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                success: false,
                error: err,
            });
        });
};

module.exports = {
    getNotifications,
    createNotification,
    updateNotification,
    getNotificationById,
    deleteNotification,
    getNotificationsByUser,
    markAsUnread
};
