const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Users = require("../models/users");
const Referrals = require("../models/referral");

const getReferrals = (req, res, next) => {
  const filters = []; // Initialize an array to store all filters
  filters.push({ status: { $ne: 'deleted' } });

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };

  Referrals.find(filter)
        .populate('referrer')
        .populate('referee')
      .exec()
  
      .then(result => {
          const response = {
              success: true,
              count: result.length,
              referrals: result
          };
          res.status(200).json(response);
      })
      .catch(err => {
          console.log(err);
          res.status(500).json({
              success: false,
              error: err
          });
      });
};




module.exports = {
  getReferrals
};
