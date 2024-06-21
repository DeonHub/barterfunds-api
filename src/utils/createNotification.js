const mongoose = require('mongoose');
const Notification = require('../models/notification'); 

/**
 * Creates a notification.
 * @param {ObjectId} userId - The ID of the user to whom the notification belongs.
 * @param {String} subject - The subject of the notification.
 * @param {String} message - The message of the notification.
 * @param {String} type - The type of the notification (e.g., 'info', 'warning', 'error', 'success').
 * @returns {Promise<Object>} - The created notification object.
 */
const createNotification = async (userId, subject, message, type = 'info') => {
  try {
    const notification = new Notification({
      _id: new mongoose.Types.ObjectId(),
      userId: userId,
      subject: subject,
      message: message,
      type: type
    });

    const result = await notification.save();
    return result;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

module.exports = createNotification;


// const createNotification = require('../utils/notificationUtils'); // Adjust the path according to your project structure

// // Example usage in a controller function
const someControllerFunction = async (req, res) => {
  try {
    // Assuming req.user.userId is available
    const userId = req.user.userId;
    const message = 'This is a test notification';
    const type = 'info'; // 'info', 'warning', 'error', 'success'

    const notification = await createNotification(userId, message, type);
    console.log('Notification created:', notification);
    res.status(200).json({
      success: true,
      message: 'Notification created successfully',
      notification: notification
    });
  } catch (err) {
    console.error('Error in controller function:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

