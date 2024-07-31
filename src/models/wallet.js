const mongoose = require('mongoose');
const User = require("./users");
const Order = require("./orders");

const walletSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    walletName: { type: String, required: true, default: 'My Wallet'},
    walletAddress: { type: String, required: true },
    currencyType: { type: String, required: true, default: 'All' },
    balanceGhs: { type: Number, default: 0 },
    referralEarned: { type: Number, default: 0 },

    status: { type: String, enum: ['active', 'inactive', 'suspended', 'deleted'], default: 'active' },
    walletType: { type: String, enum: ['personal', 'business'], default: 'personal' },

    limits: {
        maxBalance: { type: Number, default: 1000 },
        dailyTransactionLimit: { type: Number, default: 1000 }
    },

    creationDate: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

walletSchema.virtual('orderHistory', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'walletId'
});

walletSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

walletSchema.pre('update', function(next) {
    this.updatedAt = new Date();
    next();
});

walletSchema.pre('find', function(next) {
    this.populate('userId', '');
    next();
});


module.exports = mongoose.model('Wallet', walletSchema);
