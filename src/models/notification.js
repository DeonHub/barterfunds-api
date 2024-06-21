const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  read: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'deleted'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

notificationSchema.pre('update', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
