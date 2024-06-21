const mongoose = require("mongoose");
const KYC = require("../models/kyc");
const baseUrl = process.env.BASE_URL;
const Users = require("../models/users");
const Kycs = require("../models/kyc");
const Wallet = require("../models/wallet");
const Currencies = require("../models/currency");
const SupportTickets = require("../models/supportTicket");
const Referrals = require("../models/referral");

const getAdminDashboard = async (req, res, next) => {
    try {
        // Get total number of users
        const totalUsers = await Users.countDocuments({
            $and: [
                { isAdmin: { $ne: true } },
                { status: { $ne: 'deleted' } }
            ]
        });
        
        const activeUsers = await Users.countDocuments({ status: 'active' });
        const verifiedUsers = await Users.countDocuments({ verified: true });
        const inactiveUsers = await Users.countDocuments({ status: 'inactive' });

        // Get total number of KYCs
        const totalKycs = await Kycs.countDocuments({ status: { $ne: 'deleted' } });
        const approvedKycs = await Kycs.countDocuments({ status: 'approved' });
        const rejectedKycs = await Kycs.countDocuments({ status: 'rejected' });
        const pendingKycs = await Kycs.countDocuments({ status: 'pending' });

        // Get total number of currencies
        const totalCurrencies = await Currencies.countDocuments({ status: { $ne: 'deleted' } });
        const activeCurrencies = await Currencies.countDocuments({ status: 'active' });
        const inactiveCurrencies = await Currencies.countDocuments({ status: 'inactive' });
        const deletedCurrencies = await Currencies.countDocuments({ status: 'deleted'})

        // get all currencies
        const currencies = await Currencies.find({}).sort({ createdAt: -1 });

        // Get total number of support tickets
        const totalTickets = await SupportTickets.countDocuments({ status: { $ne: 'deleted' } });
        const openTickets = await SupportTickets.countDocuments({ status: 'open' });
        const closedTickets = await SupportTickets.countDocuments({ status: 'closed' });
        const pendingTickets = await SupportTickets.countDocuments({ status: 'pending' });


        // Return the aggregated data
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                verifiedUsers,
                inactiveUsers,
                totalKycs,
                approvedKycs,
                rejectedKycs,
                pendingKycs,
                totalCurrencies,
                activeCurrencies,
                inactiveCurrencies,
                deletedCurrencies,
                currencies,
                totalTickets,
                openTickets,
                closedTickets,
                pendingTickets
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const getUserDashboard = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // Get the user's referral code
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const referralCode = user.referralCode;

        // Get all currencies
        const currencies = await Currencies.find({}).sort({ createdAt: -1 }).limit(9);

        // Get the user's wallet
        const wallet = await Wallet.findOne({ userId: userId, status: { $ne: 'deleted' }})
            .populate({
                path: 'orderHistory',
                match: { status: { $ne: 'deleted' } },
                select: '-__v'
            })
            .exec();

        // Get all referrals using the user's referral code
        const referrals = await Referrals.countDocuments({ referralCode: referralCode });

        // Return the aggregated data
        res.status(200).json({
            success: true,
            info: {
                currencies: currencies,
                wallet: wallet || {},
                referrals: referrals
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


module.exports = {
    getAdminDashboard,
    getUserDashboard
};
