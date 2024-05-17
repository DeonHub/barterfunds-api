const mongoose = require('mongoose');
const User = require("./users");

const kycSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    firstname: { type: String, required: true },
    surname: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    contact: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    country: { type: String, required: true },
    nationality: { type: String, required: true },
    region: { type: String, required: true },
    city: { type: String, required: true },
    residentialAddress: { type: String, required: true },
    postalAddress: { type: String, required: true },
    identityDocumentType: { type: String, required: true },
    identityDocumentNumber: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    issuingAuthority: { type: String, required: true },
    identityDocumentUploaded: { type: String },
    photograph: { type: String, required: true },
    frontImage: { type: String, required: true },
    backImage: { type: String, required: true },
    proofDocumentUploaded: { type: String },
    proofOfAddress: { type: String, required: true },
    kycReviewer: { type: String },
    status: { type: String, enum: ['pending', 'reviewing', 'approved', 'rejected', 'deleted'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

kycSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

kycSchema.pre('update', function(next) {
    this.updatedAt = new Date();
    next();
});

kycSchema.pre('find', function(next) {
    this.populate('userId', '');
    next();
});

module.exports = mongoose.model('KYC', kycSchema);
