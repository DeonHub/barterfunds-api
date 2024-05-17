const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Users = require("../models/users");

const getUsers = (req, res, next) => {
  const filters = []; // Initialize an array to store all filters
  filters.push({ status: { $ne: 'deleted' } });
  filters.push({ isAdmin: false });

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };

  Users.find(filter)
      .exec()
      .then(result => {
          const response = {
              success: true,
              count: result.length,
              users: result
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


const getUser = async (req, res, next) => {
  const userId = req.params.userId;
  let user;

  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      // If userId is a valid ObjectId
      user = await Users.findById(userId)
        // .select("_id firstname surname username email contact status verified createdAt")
        .exec();
    } else {
      // If userId is not a valid ObjectId
      user = await Users.findOne({ username: userId })
        // .select("_id firstname surname username email contact status verified createdAt")
        .exec();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No valid entry found for provided user ID"
      });
    }

    res.status(200).json({
      success: true,
      user: user,
      request: {
        type: "GET",
        url: `${process.env.BASE_URL}/users`
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


const updateUser = (req, res, next) => {
  const userId = req.params.userId;
  const { status } = req.body;
  const updateOps = {};

  // Iterate over the properties of req.body
  for (const propName in req.body) {
      // Check if the property is not inherited from the prototype chain
      if (Object.prototype.hasOwnProperty.call(req.body, propName)) {
          // Exclude the 'status' field from updateOps if it's provided
          if (propName !== 'status') {
              updateOps[propName] = req.body[propName];
          }
      }
  }

  // If status is provided, update it as well
  if (status) {
      updateOps.status = status;
  }

  // Update the user
  Users.updateOne({ _id: userId }, { $set: updateOps })
      .exec()
      .then(result => {
          let message = "User updated";
          // If status is provided and set to 'inactive', also include deactivation message
          if (status && status === 'inactive') {
              message += " and deactivated";
          }
          Users.findById(userId)
          .exec()
          .then(user => {
            res.status(200).json({
              success: true,
              message: message,
              user: user,
              request: {
                  type: "GET",
                  url: `${process.env.BASE_URL}/users/${userId}`
              }
          });
          }).catch(err => {
            res.status(500).json({
              success: false,
              error: err
            });
          })

          
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({
              success: false,
              error: err
          });
      });
};



const deleteUser = (req, res, next) => {
  const id = req.params.userId;
  Users.deleteOne({ _id: id })
    .exec()
    .then(result => {
      res.status(200).json({
        success: true,
        message: "User deleted",
        request: {
          type: "POST",
          url: `${process.env.BASE_URL}/users`,
        }
      });
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
  getUsers,
  getUser,
  updateUser,
  deleteUser
};
