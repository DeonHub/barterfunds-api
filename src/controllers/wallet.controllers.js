const mongoose = require("mongoose");
const Wallet = require("../models/wallet");
const baseUrl = process.env.BASE_URL;

const generateWalletAddress = (length) => {
  const characters = "0123456789abcdef";
  let address = "";
  for (let i = 0; i < length; i++) {
    address += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return address;
};

const getWallets = (req, res, next) => {
  const filters = []; // Initialize an array to store all filters
  filters.push({ status: { $ne: 'deleted' } });
  // filters.push({ isAdmin: false });

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };

  Wallet.find(filter)
    .exec()
    .then((wallets) => {
      res.status(200).json({
        success: true,
        count: wallets.length,
        wallets: wallets,
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

const createWallet = (req, res, next) => {
  const userId = req.user.userId;

  const wallet = new Wallet({
    _id: new mongoose.Types.ObjectId(),
    userId: userId,
    walletAddress: generateWalletAddress(64),
    walletName: req.body.walletName,
    currencyType: req.body.currencyType,
    transactionHistory: [],
    walletType: req.body.walletType,
    limits: {
      maxBalance: req.body.maxBalance,
      dailyTransactionLimit: req.body.dailyTransactionLimit,
    },
  });

  wallet
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        success: true,
        message: "Wallet created successfully",
        createdWallet: result,
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

const getWalletById = (req, res, next) => {
  const id = req.params.walletId;
  Wallet.findById(id)
    .exec()
    .then((wallet) => {
      if (wallet) {
        res
          .status(200)
          .json({ success: true, message: "Wallet found", wallet: wallet });
      } else {
        res
          .status(404)
          .json({ success: false, message: "Wallet not found", wallet: {} });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};

const updateWallet = (req, res, next) => {
  const id = req.params.walletId;
  const { status } = req.body;
  const updateOps = {};

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

  // Update the wallet
  Wallet.updateOne({ _id: id }, { $set: updateOps })
    .exec()
    .then((result) => {
      let message = "Wallet updated";
      // If status is provided and set to 'inactive', also include deactivation message
      if (status && status === "inactive") {
        message += " and deactivated";
      }
      Wallet.findById(id)
        .exec()
        .then((wallet) => {
          res.status(200).json({
            success: true,
            message: message,
            wallet: wallet,
            request: {
              type: "GET",
              url: `${baseUrl}/wallets/` + id,
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

const deleteWallet = (req, res, next) => {
  const id = req.params.walletId;
  Wallet.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
        success: true,
        message: "Wallet deleted",
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
  getWallets,
  createWallet,
  getWalletById,
  updateWallet,
  deleteWallet,
  generateWalletAddress,
};
