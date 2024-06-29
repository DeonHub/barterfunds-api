const mongoose = require("mongoose");
const Transactions = require("../models/transactions");
const baseUrl = process.env.BASE_URL;
const createNotification = require("../utils/createNotification");
const Referral = require("../models/referral");
const Wallet = require("../models/wallet");
const path = require("path");


const getTransactions = (req, res, next) => {
  const filters = []; // Initialize an array to store all filters
  filters.push({ status: { $ne: 'deleted' } });
  // filters.push({ isAdmin: false });
  

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };

  Transactions.find(filter)
    .populate('userId')
    .populate('currencyId')
    .sort({ createdAt: -1 })
    .exec()
    .then((transactions) => {
      res.status(200).json({
        count: transactions.length,
        success: true,
        transactions: transactions,
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

const createTransaction = (req, res, next) => {
  const transaction = new Transactions({
    _id: new mongoose.Types.ObjectId(),
    userId: req.user.userId,
    currencyId: req.body.currencyId,
    transactionType: req.body.transactionType,
    transactionId: req.body.transactionId,
    referenceId: req.body.referenceId || "",
    amountGhs: req.body.amountGhs,
    amountUsd: req.body.amountUsd,
    walletAddress: req.body.walletAddress,
    sender: req.body.sender || "",
    receiver: req.body.receiver || "",
    paymentMethod: req.body.paymentMethod || "",
    receipientMethod: req.body.receipientMethod || "momo",
    receipientNumber: req.body.receipientNumber || "",
    paymentNumber: req.body.paymentNumber || "",
    status: req.body.status || "active",
    action: req.body.action || "",
    transactionForm: req.body.transactionForm || ""
  });

  transaction
    .save()
    .then((result) => {
      // Create notification for user
      const subject = "Transaction Created";
      const message = `Your transaction with ID ${result.transactionId} has been created successfully. Please wait for an admin to verify your transaction.`;
      createNotification(req.user.userId, subject, message);

      res.status(201).json({
        success: true,
        message: "Transaction created successfully",
        transaction: result
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Error creating transaction",
        error: err,
      });
    });
};

const getTransactionById = (req, res, next) => {
  const id = req.params.transactionId;
  Transactions.findById(id)
    .populate('userId')
    .populate('currencyId')
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json({
          success: true,
          message: "Transaction found",
          transaction: doc,
        });
      } else {
        res
          .status(404)
          .json({
            success: false,
            message: "No valid entry found for provided ID",
            transaction: {},
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};

const getTransactionsByUserId = (req, res, next) => {
  const userId = req.user.userId;

  // SupportTicket.find({ userId: userId, status: { $ne: 'deleted' } })
  Transactions.find({ userId: userId, status: { $ne: 'deleted' }})
      .exec()
      .then(transactions => {
          res.status(200).json({
              success: true,
              count: transactions.length,
              transactions: transactions
          });
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({
              success: false,
              error: err
          });
      });
};


const getTransactionsByUser = (req, res, next) => {
  const userId = req.params.userId;


  // SupportTicket.find({ userId: userId, status: { $ne: 'deleted' } })
  Transactions.find({ userId: userId, status: { $ne: 'deleted' }})
      .exec()
      .then(transactions => {
          res.status(200).json({
              success: true,
              count: transactions.length,
              transactions: transactions
          });
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({
              success: false,
              error: err
          });
      });
};



const updateTransactionByReference = async (req, res, next) => {
  const userId = req.user.userId;
  const referenceId = req.params.referenceId;
  const status = req.body.status || null;
  const updateOps = {};
  const conversionRate = 15;

  // Check if there is a file attached to update the transaction proof
  if (req.file) {
    let filePath = req.file.path;
    if (!filePath.startsWith('http')) {
      filePath = path.relative(path.join(__dirname, '../..'), filePath);
    }
    updateOps.paymentProof = filePath;
  }

  // Iterate over the properties of req.body
  for (const propName in req.body) {
    if (Object.prototype.hasOwnProperty.call(req.body, propName)) {
      if (propName !== "status") {
        updateOps[propName] = req.body[propName];
      }
    }
  }

  // If status is provided, update it as well
  if (status) {
    updateOps.status = status;
  }

  // Update the updatedAt field to the current date and time
  updateOps.updatedAt = new Date();

  try {
    // Find and update the transaction by reference
    const transaction = await Transactions.findOneAndUpdate(
      { referenceId: referenceId, status: { $ne: 'deleted' } },
      { $set: updateOps },
      { new: true } // Return the updated transaction
    ).populate('userId').exec();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
        transaction: {}
      });
    }

    // If the transaction amount is >= 1000 GHS and the status is success, credit the referee's wallet
    if (transaction.amountGhs >= 1000 && updateOps.status === 'success') {
      const referral = await Referral.findOne({ referee: transaction.userId._id }).exec();
      if (referral) {
        const referrerWallet = await Wallet.findOne({ userId: referral.referrer._id }).exec();
        if (referrerWallet) {
          const rewardGhs = 20;
          const rewardUsd = rewardGhs / conversionRate;

          referrerWallet.balanceGhs += rewardGhs;
          referrerWallet.balanceUsd += rewardUsd;

          await referrerWallet.save();

          // Create notification for the referrer
          const subject = "Referral Reward Credited";
          const message = `You have earned a referral reward of GHS 20.00 (USD ${rewardUsd.toFixed(2)}) for a successful transaction by your referee.`;
          createNotification(referral.referrer, subject, message);
        }
      }
    }

    // Create notification for the user
    const subject = "Transaction Updated";
    const message = `Your transaction with reference ID ${transaction.referenceId} has been updated. Please check your transaction history for more details.`;
    createNotification(userId, subject, message);

    res.status(200).json({
      success: true,
      message: 'Transaction updated',
      transaction: transaction,
      request: {
        type: "GET",
        url: `${baseUrl}/transactions/` + transaction._id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err,
    });
  }
};

const updateTransaction = async (req, res, next) => {
  const userId = req.user.userId;
  const id = req.params.transactionId;
  const { status } = req.body;
  const updateOps = {};
  const conversionRate = 15;

  // Check if there is a file attached to update the transaction proof
  if (req.file) {
    let filePath = req.file.path;
    if (!filePath.startsWith('http')) {
      filePath = path.relative(path.join(__dirname, '../..'), filePath);
    }
    updateOps.paymentProof = filePath;
    console.log(filePath);
  }

  // Iterate over the properties of req.body
  for (const propName in req.body) {
    if (Object.prototype.hasOwnProperty.call(req.body, propName)) {
      if (propName !== "status") {
        updateOps[propName] = req.body[propName];
      }
    }
  }

  // If status is provided, update it as well
  if (status) {
    updateOps.status = status;
  }

  // Update the updatedAt field to the current date and time
  updateOps.updatedAt = new Date();

  try {
    // Find and update the transaction by ID
    const result = await Transactions.updateOne({ _id: id }, { $set: updateOps }).exec();
    if (!result.nModified) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or no changes made',
      });
    }

    // Fetch the updated transaction
    const transaction = await Transactions.findById(id).exec();
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // If the transaction amount is >= 1000 GHS and the status is success, credit the referrer's wallet
    if (transaction.amountGhs >= 1000 && updateOps.status === 'success') {
      const referral = await Referral.findOne({ referee: transaction.userId._id }).exec();
      if (referral) {
        const referrerWallet = await Wallet.findOne({ userId: referral.referrer._id }).exec();
        if (referrerWallet) {
          const rewardGhs = 20;
          const rewardUsd = rewardGhs / conversionRate;

          referrerWallet.balanceGhs += rewardGhs;
          referrerWallet.balanceUsd += rewardUsd;

          await referrerWallet.save();

          // Create notification for the referrer
          const subject = "Referral Reward Credited";
          const message = `You have earned a referral reward of GHS 20.00 (USD ${rewardUsd.toFixed(2)}) for a successful transaction by your referee.`;
          createNotification(referral.referrer, subject, message);
        }
      }
    }

    // Create notification for user
    const subject = "Transaction Updated";
    const message = `Your transaction with ID ${transaction.transactionId} has been updated. Please check your transaction history for more details.`;
    createNotification(userId, subject, message);

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction: transaction,
      request: {
        type: "GET",
        url: `${baseUrl}/transactions/` + id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err,
    });
  }
};



const deleteTransaction = (req, res, next) => {
  const id = req.params.transactionId;
  Transactions.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
        success: true,
        message: "Transaction deleted",
        request: {
          type: "POST",
          url: `${baseUrl}/transactions`,
        },
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

module.exports = {
  getTransactions,
  createTransaction,
  getTransactionById,
  getTransactionsByUserId,
  updateTransaction,
  deleteTransaction,
  updateTransactionByReference,
  getTransactionsByUser
};
