const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, required: true, unique: true },
    referenceId: { type: String },
    quote: { type: String },
    action: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'cancelled', 'failed', 'deleted'], default: 'pending' },
    amountGhs: { type: Number, default: 0 },
    amountUsd: { type: Number, default: 0 },
    balanceGhs: { type: Number, default: 0 },
    balanceUsd: { type: Number, default: 0 },
    paymentMethod: {
        type: String,
        enum: ['momo', 'credit-card', 'wallet', 'bank', '']
    },

    receipientMethod: {
        type: String,
        enum: ['momo', 'credit-card', 'wallet', 'bank', '']
    },
    paymentProof: { type: String },

    paymentSuccess: { type: Boolean, default: false },
    confirmedPayment: { type: Boolean, default: false },
    walletCredited: { type: Boolean, default: false },
    paymentNumber: { type: String },
    receipientNumber: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

orderSchema.pre('update', function(next) {
    this.updatedAt = new Date();
    next();
});

orderSchema.pre('find', function(next) {
    this.populate('userId', '');
    next();
});

module.exports = mongoose.model('Order', orderSchema);
