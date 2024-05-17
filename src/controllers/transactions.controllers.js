const mongoose = require("mongoose");
const Transactions = require("../models/transactions");
const baseUrl = process.env.BASE_URL;

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
    status: req.body.status || "active",
    action: req.body.action || "",
    transactionForm: req.body.transactionForm || ""

  });

  transaction
    .save()
    .then((result) => {
      console.log(result);
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


const updateTransactionByReference = (req, res, next) => {
  const referenceId = req.params.referenceId;
  const { status } = req.body;
  const updateOps = {};

  // Check if there is a file attached to update the transaction proof
  if (req.file) {
    updateOps.paymentProof = req.file.path;
  }

  // Iterate over the properties of req.body
  for (const propName in req.body) {
    // Check if the property is not inherited from the prototype chain
    if (Object.prototype.hasOwnProperty.call(req.body, propName)) {
      // Exclude the 'status' field from updateOps if it's provided
      if (propName !== "status") {
        updateOps[propName] = req.body[propName];
      }
    }
  }

  // If status is provided, update it as well
  if (status) {
    updateOps.status = status;
  }

  // Find and update the transaction by reference
  Transactions.findOneAndUpdate(
    { referenceId: referenceId, status: { $ne: 'deleted' } },
    { $set: updateOps },
    { new: true } // Return the updated transaction
  )
    .populate('userId')
    .exec()
    .then((transaction) => {
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          transaction: {}
        });
      }

      res.status(200).json({
        success: true,
        message: 'Transaction updated',
        transaction: transaction,
        request: {
          type: "GET",
          url: `${baseUrl}/transactions/` + transaction._id,
        },
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



const updateTransaction = (req, res, next) => {
  const id = req.params.transactionId;
  const { status } = req.body;
  const updateOps = {};

  // Check if there is a file attached to update the transaction proof
  if (req.file) {
    updateOps.paymentProof = req.file.path;
    console.log(req.file.path)
  }

  // Iterate over the properties of req.body
  for (const propName in req.body) {
    // Check if the property is not inherited from the prototype chain
    if (Object.prototype.hasOwnProperty.call(req.body, propName)) {
      // Exclude the 'status' field from updateOps if it's provided
      if (propName !== "status") {
        updateOps[propName] = req.body[propName];
      }
    }
  }

  // If status is provided, update it as well
  if (status) {
    updateOps.status = status;
  }

  // Update the currency
  Transactions.updateOne({ _id: id }, { $set: updateOps })
    .exec()
    .then((result) => {
      let message = "Transaction updated";
      
      Transactions.findById(id)
        .exec()
        .then((transaction) => {
          res.status(200).json({
            success: true,
            message: message,
            transaction: transaction,
            request: {
              type: "GET",
              url: `${baseUrl}/transactions/` + id,
            },
          });
        })
        .catch((err) => {
          res.status(500).json({
            success: false,
            error: err,
          });
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
  updateTransactionByReference
};
