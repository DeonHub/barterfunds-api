const mongoose = require('mongoose');

const currencySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    currencyName: { type: String, required: true },
    currencyLogo: { type: String, required: true },
    currencyCode: { type: String, required: true },
    walletAddress: { type: String, default: '1Lbcfr7sAHTD9CgdQo3HTMTkV8LK4ZnX71' },
    currencySymbol: { type: String, default: 'none' },
    paymentGateway: { type: String, default: 'Manual' },
    status: { type: String, enum: ['active', 'inactive', 'blocked', 'deleted'], default: 'active' },
    reserveAmount: { type: Number, required: true, default: 0 },
    exchangeRate: { type: Number, required: true, default: 1 },
    isBaseCurrency: { type: Boolean, default: false },
    rateShow: { type: Boolean, default: true },
    instructions: { type: String, default: 'Instructions for transaction' },

    // buy
    buyAt: { type: Number, default: 0 },
    availableForBuy: { type: Boolean, default: true },
    minimumBuyAmount: { type: Number, default: 0 },
    maximumBuyAmount: { type: Number, default: 0 },
    buyFixedCharge: { type: Number, default: 0 },
    buyPercentCharge: { type: Number, default: 0},

    // sell
    sellAt: { type: Number, default: 0 },
    availableForSell: { type: Boolean, default: true },
    minimumSellAmount: { type: Number, default: 0 },
    maximumSellAmount: { type: Number, default: 0 },
    sellFixedCharge: { type: Number, default: 0 },
    sellPercentCharge: { type: Number, default: 0 },

    // send
    sendAt: { type: Number, default: 0 },
    availableForSend: { type: Boolean, default: true },
    minimumSendAmount: { type: Number, default: 0 },
    maximumSendAmount: { type: Number, default: 0 },
    sendFixedCharge: { type: Number, default: 0 },
    sendPercentCharge: { type: Number, default: 0 },

    // receive
    receiveAt: { type: Number, default: 0 },
    availableForReceive: { type: Boolean, default: true },
    minimumReceiveAmount: { type: Number, default: 0 },
    maximumReceiveAmount: { type: Number, default: 0 },
    receiveFixedCharge: { type: Number, default: 0 },
    receivePercentCharge: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
    
});


currencySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

currencySchema.pre('update', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Currency', currencySchema);