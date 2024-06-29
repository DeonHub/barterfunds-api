const mongoose = require("mongoose");
const Currency = require("../models/currency");
const baseUrl = process.env.BASE_URL;

const getCurrencies = (req, res, next) => {
  const filters = []; // Initialize an array to store all filters
  filters.push({ status: { $ne: 'deleted' } });
  // filters.push({ isAdmin: false });

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };

  Currency.find(filter)
    .exec()
    .then((currencies) => {
      res.status(200).json({
        count: currencies.length,
        success: true,
        currencies: currencies,
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

const createCurrency = (req, res, next) => {
  const currency = new Currency({
    _id: new mongoose.Types.ObjectId(),
    currencyName: req.body.currencyName,
    currencyLogo: req.file.path,
    currencyCode: req.body.currencyCode,
    walletAddress: req.body.walletAddress,
    currencySymbol: req.body.currencySymbol || "$",
    status: req.body.status || "active",
    reserveAmount: req.body.reserveAmount || 0,
    exchangeRate: req.body.exchangeRate || 0,
    isBaseCurrency: req.body.isBaseCurrency || false,
    rateShow: req.body.rateShow || true,
    paymentGateway: req.body.paymentGateway || "Manual",
    instructions: req.body.instructions || "Info",

    buyAt: req.body.buyAt || 0,
    availableForBuy: req.body.availableForBuy || true,
    minimumBuyAmount: req.body.minimumBuyAmount || 0,
    maximumBuyAmount: req.body.maximumBuyAmount || 0,
    buyFixedCharge: req.body.buyFixedCharge || 0,
    buyPercentCharge: req.body.buyPercentCharge || 0,

    sellAt: req.body.sellAt || 0,
    availableForSell: req.body.availableForSell || true,
    minimumSellAmount: req.body.minimumSellAmount || 0,
    maximumSellAmount: req.body.maximumSellAmount || 0,
    sellFixedCharge: req.body.sellFixedCharge || 0,
    sellPercentCharge: req.body.sellPercentCharge || 0,

    sendAt: req.body.sendAt || 0,
    availableForSend: req.body.availableForSend || true,
    minimumSendAmount: req.body.minimumSendAmount || 0,
    maximumSendAmount: req.body.maximumSendAmount || 0,
    sendFixedCharge: req.body.sendFixedCharge || 0,
    sendPercentCharge: req.body.sendPercentCharge || 0,

    receiveAt: req.body.receiveAt || 0,
    availableForReceive: req.body.availableForReceive || true,
    minimumReceiveAmount: req.body.minimumReceiveAmount || 0,
    maximumReceiveAmount: req.body.maximumReceiveAmount || 0,
    receiveFixedCharge: req.body.receiveFixedCharge || 0,
    receivePercentCharge: req.body.receivePercentCharge || 0,

  });

  currency
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        success: true,
        message: "Currency created successfully",
        createdCurrency: result,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Error creating currency",
        error: err,
      });
    });
};

const getCurrencyById = (req, res, next) => {
  const id = req.params.currencyId;
  Currency.findById(id)
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json({
          success: true,
          message: "Currency found",
          currency: doc,
        });
      } else {
        res
          .status(404)
          .json({
            success: false,
            message: "No valid entry found for provided ID",
            currency: {},
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};


const updateCurrency = (req, res, next) => {
  const id = req.params.currencyId;
  const { status } = req.body;
  const updateOps = {};

  // Check if there is a file attached to update the currency logo
  if (req.file) {
    updateOps.currencyLogo = req.file.path;
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
  Currency.updateOne({ _id: id }, { $set: updateOps })
    .exec()
    .then((result) => {
      let message = "Currency updated";
      // If status is provided and set to 'inactive', also include deactivation message
      if (status && status === "inactive") {
        message += " and deactivated";
      }
      Currency.findById(id)
        .exec()
        .then((currency) => {
          res.status(200).json({
            success: true,
            message: message,
            currency: currency,
            request: {
              type: "GET",
              url: `${baseUrl}/currencies/` + id,
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



const deleteCurrency = (req, res, next) => {
  const id = req.params.currencyId;
  Currency.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
        success: true,
        message: "Currency deleted",
        request: {
          type: "POST",
          url: `${baseUrl}/currencies`,
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
  getCurrencies,
  createCurrency,
  getCurrencyById,
  updateCurrency,
  deleteCurrency,
};
