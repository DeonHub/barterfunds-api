const mongoose = require("mongoose");
const Transactions = require("../models/transactions");
const baseUrl = process.env.BASE_URL;
const createNotification = require("../utils/createNotification");
const Referral = require("../models/referral");
const Wallet = require("../models/wallet");
const Currency = require("../models/currency");
const path = require("path");
const sendMail = require("../utils/sendMail");
const Orders = require("../models/orders");
const Users = require("../models/users");

const formatDate = (dateTimeString) => {
  const date = new Date(dateTimeString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
};

const formatCurrency = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Invalid number";
  }

  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getTransactions = (req, res, next) => {
  const filters = []; // Initialize an array to store all filters
  filters.push({ status: { $ne: "deleted" } });
  // filters.push({ isAdmin: false });

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };

  Transactions.find(filter)
    .populate("userId")
    .populate("currencyId")
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

const generateOrderId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let orderId = "";
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    orderId += characters[randomIndex];
  }
  return orderId;
};

function capitalizeFirstLetter(str) {
  if (str.length === 0) return str; // Return the empty string as is

  return str.charAt(0).toUpperCase() + str.slice(1);
}

const createTransaction = async (req, res, next) => {
  const user = await Users.findOne({ email: req.user.email });

  let qrCode = "";

  if (req.file) {
    let filePath = req.file.path;
    if (!filePath.startsWith("http")) {
      filePath = path.relative(path.join(__dirname, "../.."), filePath);
    }
    qrCode = filePath;
  }

  const transaction = new Transactions({
    _id: new mongoose.Types.ObjectId(),
    userId: req.user.userId,
    currencyId: req.body.currencyId,
    transactionType: req.body.transactionType,
    transactionId: req.body.transactionId,
    transactionFee: req.body.transactionFee || 0,
    exchangeRate: req.body.exchangeRate || 0,
    qrCode: qrCode || "",
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
    transactionForm: req.body.transactionForm || "",
  });

  try {
    const result = await transaction.save();

    // Create notification for user
    if (transaction.paymentMethod === "wallet") {
      const wallet = await Wallet.findOne({ userId: req.user.userId }).exec();
      if (wallet) {
        wallet.balanceGhs -= transaction.amountGhs + transaction.transactionFee;
        await wallet.save();
      }

      const currency = await Currency.findOne({
        _id: transaction.currencyId,
      }).exec();

      const order = new Orders({
        _id: new mongoose.Types.ObjectId(),
        userId: req.user.userId,
        walletId: wallet._id,
        action: "withdraw",
        orderId: generateOrderId(),
        amountGhs: transaction.amountGhs,
        balanceGhs: wallet.balanceGhs,
        paymentMethod: transaction.paymentMethod || "",
        receipientMethod: transaction.receipientMethod || "",
        receipientNumber: transaction.receipientNumber || "",
        paymentNumber: transaction.paymentNumber || "",
        quote: `${capitalizeFirstLetter(transaction.transactionType)} ${
          currency.currencyName
        }`,
        status: "success",
      });

      const result = await order.save();

      // Create a notification
      const subject = "Order Created Successfully";
      const message = `Your order with ID ${result.orderId} has been created successfully.`;
      await createNotification(req.user.userId, subject, message);
    }

    const subject = "Transaction Created";
    const message = `Your transaction with ID ${result.transactionId} has been created successfully. Please wait for an admin to verify your transaction.`;
    await createNotification(req.user.userId, subject, message);

    // Send email for order creation
    sendMail(
      user.email,
      "",
      `Your Transaction Has Been Created`,
      "login",
      `Hi ${user.firstname}`,
      `
    <p>Your ${
      result.transactionType
    } transaction has been successfully created and is now pending processing.</p><br>
    
    <p><strong>Transaction ID:</strong> ${result.transactionId}<br>
    <strong>Date Created:</strong> ${formatDate(result.createdAt)}<br>
    <strong>Amount:</strong> ${formatCurrency(result.amountGhs)} GHS</p>
    <br>
    <p>All payments are manually reviewed and processed. This process typically takes between 2 and 60 minutes but may extend on certain occasions. Please be patient while your payment is being reviewed. </p>
  <br>
  <p>We’ll notify you once the transaction status is updated. If you have any questions, feel free to contact our support team.</p>
    `,
      ``,
      "Visit Dashboard"
    );

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction: result,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error creating transaction",
      error: err,
    });
  }
};

const getTransactionById = (req, res, next) => {
  const id = req.params.transactionId;
  Transactions.findById(id)
    .populate("userId")
    .populate("currencyId")
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json({
          success: true,
          message: "Transaction found",
          transaction: doc,
        });
      } else {
        res.status(404).json({
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
  Transactions.find({ userId: userId, status: { $ne: "deleted" } })
    .exec()
    .then((transactions) => {
      res.status(200).json({
        success: true,
        count: transactions.length,
        transactions: transactions,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err,
      });
    });
};

const getTransactionsByUser = (req, res, next) => {
  const userId = req.params.userId;

  // SupportTicket.find({ userId: userId, status: { $ne: 'deleted' } })
  Transactions.find({ userId: userId, status: { $ne: "deleted" } })
    .exec()
    .then((transactions) => {
      res.status(200).json({
        success: true,
        count: transactions.length,
        transactions: transactions,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err,
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
    if (!filePath.startsWith("http")) {
      filePath = path.relative(path.join(__dirname, "../.."), filePath);
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
      { referenceId: referenceId, status: { $ne: "deleted" } },
      { $set: updateOps },
      { new: true } // Return the updated transaction
    )
      .populate("userId")
      .exec();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        transaction: {},
      });
    }

    // If the transaction amount is >= 1000 GHS and the status is success, credit the referee's wallet
    if (transaction.amountGhs >= 1000 && updateOps.status === "success") {
      const referral = await Referral.findOne({
        referee: transaction.userId._id,
      }).exec();
      if (referral) {
        const referrerWallet = await Wallet.findOne({
          userId: referral.referrer._id,
        }).exec();
        if (referrerWallet) {
          const rewardGhs = 20;
          const rewardUsd = rewardGhs / conversionRate;

          referrerWallet.balanceGhs += rewardGhs;
          referrerWallet.balanceUsd += rewardUsd;

          await referrerWallet.save();

          // Create notification for the referrer
          const subject = "Referral Reward Credited";
          const message = `You have earned a referral reward of GHS 20.00 (USD ${rewardUsd.toFixed(
            2
          )}) for a successful transaction by your referee.`;
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
      message: "Transaction updated",
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
  const user = await Users.findOne({ email: req.user.email });
  const id = req.params.transactionId;
  const { status } = req.body;
  const updateOps = {};
  // const conversionRate = 15;

  // Check if there is a file attached to update the transaction proof
  if (req.file) {
    let filePath = req.file.path;
    if (!filePath.startsWith("http")) {
      filePath = path.relative(path.join(__dirname, "../.."), filePath);
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
    // Find and update the transaction by ID
    const result = await Transactions.updateOne(
      { _id: id },
      { $set: updateOps }
    ).exec();
    console.log("After result");

    // Fetch the updated transaction
    const transaction = await Transactions.findById(id).exec();
    console.log("transaction found");
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    console.log("before referral");
    // If the transaction amount is >= 1000 GHS and the status is success, credit the referrer's wallet
    if (transaction.amountGhs >= 1000 && updateOps.status === "success") {
      console.log("Inside referral");
      const referral = await Referral.findOne({
        referee: transaction.userId._id,
      }).exec();
      if (referral) {
        console.log("Referral found");
        const referrerWallet = await Wallet.findOne({
          userId: referral.referrer._id,
        }).exec();
        if (referrerWallet) {
          const rewardGhs = 20;
          referrerWallet.balanceGhs += rewardGhs;
          referrerWallet.referralEarned += rewardGhs;

          await referrerWallet.save();

          // Create notification for the referrer
          const subject = "Referral Reward Credited";
          const message = `You have earned a referral reward of GHS 20.00 for a successful transaction by your referee.`;
          createNotification(referral.referrer, subject, message);

          // Send email for order creation
          sendMail(
            user.email,
            "",
            `You’ve Earned Referral Rewards!`,
            "login",
            `Hi ${user.firstname}`,
            `
    <p>Congratulations! You’ve just earned 20.00 GHS from your referral on Barter Funds. </p><br>

    <p>The funds have been credited to your account.</p>
    `,
            ``,
            "Visit Dashboard"
          );
        }
      }
      console.log("referral not found");
    }

    if (
      transaction.receipientMethod === "wallet" &&
      updateOps.status === "success"
    ) {
      const wallet = await Wallet.findOne({
        userId: transaction.userId,
      }).exec();
      if (wallet) {
        wallet.balanceGhs += transaction.amountGhs;
        await wallet.save();
      }

      const currency = await Currency.findById(
        transaction.currencyId._id
      ).exec();

      const order = new Orders({
        _id: new mongoose.Types.ObjectId(),
        userId: transaction.userId,
        walletId: wallet._id,
        action: "deposit",
        orderId: generateOrderId(),
        amountGhs: transaction.amountGhs,
        balanceGhs: wallet.balanceGhs,
        paymentMethod: transaction.paymentMethod || "",
        receipientMethod: transaction.receipientMethod || "",
        receipientNumber: transaction.receipientNumber || "",
        paymentNumber: transaction.paymentNumber || "",
        quote: `${capitalizeFirstLetter(transaction.transactionType)} ${
          currency.currencyName
        }`,
        status: "success",
      });

      const result = await order.save();

      // Create a notification
      const subject = "Order Created Successfully";
      const message = `Your order with ID ${result.orderId} has been created successfully.`;
      await createNotification(transaction.userId._id, subject, message);
    }

    // Update the currency reserve amount if the transaction is successful
    if (updateOps.status === "success") {
      const currency = await Currency.findById(
        transaction.currencyId._id
      ).exec();
      if (currency) {
        if (
          transaction.transactionType === "buy" ||
          transaction.transactionType === "send"
        ) {
          currency.reserveAmount -= transaction.amountGhs;
        } else if (
          transaction.transactionType === "sell" ||
          transaction.transactionType === "receive"
        ) {
          currency.reserveAmount += transaction.amountGhs;
        }
        await currency.save();
      }

      // Send email for order creation
      sendMail(
        user.email,
        "",
        `Your Transaction is Complete`,
        "login",
        `Hi ${user.firstname}`,
        `
      <p>We are happy to inform you that your ${
        transaction.transactionType
      } transaction on Barter Funds has been successfully completed.</p><br>
      
      <p><strong>Transaction ID:</strong> ${transaction.transactionId}<br>
      <strong>Date Created:</strong> ${formatDate(transaction.createdAt)}<br>
      <strong>Amount:</strong> ${formatCurrency(transaction.amountGhs)} GHS</p>
      <br>
     
      `,
        ``,
        "Visit Dashboard"
      );
    } else if (updateOps.status === "processing") {
      // Send email for order creation
      sendMail(
        user.email,
        "",
        `Your Transaction is Being Processed`,
        "login",
        `Hi ${user.firstname}`,
        `
<p>Your transaction with ID ${
          transaction.transactionId
        } is currently being processed. We will notify you once it is completed.</p><br>

<p><strong>Date Created:</strong> ${formatDate(transaction.createdAt)}<br>
<strong>Amount:</strong> ${formatCurrency(transaction.amountGhs)} GHS</p>
<br>

`,
        ``,
        "Visit Dashboard"
      );
    } else if (updateOps.status === "cancelled") {
      // Send email for order creation
      sendMail(
        user.email,
        "",
        `Your Transaction Has Been Canceled`,
        "login",
        `Hi ${user.firstname}`,
        `
      <p>Unfortunately, your transaction with ID ${transaction.transactionId} has been canceled.</p><br>
      
      <p>If you believe this is an error or need further assistance, please reach out to our support team.</p>
      
      `,
        ``,
        "Visit Dashboard"
      );
    }

    console.log("Creating notification");
    // Create notification for user
    const subject = "Transaction Updated";
    const message = `Your transaction with ID ${transaction.transactionId} has been updated. Please check your transaction history for more details.`;
    createNotification(transaction.userId._id, subject, message);

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
  getTransactionsByUser,
};
