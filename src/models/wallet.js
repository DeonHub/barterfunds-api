const mongoose = require('mongoose');
const User = require("./users");

const walletSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    walletName: { type: String, required: true, default: 'My Wallet'},
    walletAddress: { type: String, required: true },
    currencyType: { type: String, required: true, default: 'All' },
    balance: { type: Number, default: 0 },

    transactionHistory: [{
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
        timestamp: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        transactionType: { type: String, enum: ['deposit', 'withdrawal', 'transfer'], required: true }
    }],


    status: { type: String, enum: ['active', 'inactive', 'suspended', 'deleted'], default: 'active' },
    walletType: { type: String, enum: ['personal', 'business'], default: 'personal' },

    limits: {
        maxBalance: { type: Number, default: 1000 },
        dailyTransactionLimit: { type: Number, default: 1000 }
    },

    creationDate: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
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
