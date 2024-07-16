const mongoose = require("mongoose");
const Orders = require("../models/orders");
const Wallet = require("../models/wallet");
const baseUrl = process.env.BASE_URL;
const path = require("path");
const createNotification = require("../utils/createNotification");

const getOrders = async (req, res, next) => {
  const filters = [];
  filters.push({ status: { $ne: 'deleted' } });

  // Combine all filters into a single filter object using $and
  const filter = { $and: filters };
  const matchStage = {
    status: 'pending',
  };

  const totalPendingAmountGhs = await Orders.aggregate([{$match: { status: 'pending' }},{ $group: {_id: null, totalAmount: { $sum: "$amountGhs" }}}]);
  const totalApprovedAmountGhs = await Orders.aggregate([{$match: { status: 'success' }},{ $group: {_id: null, totalAmount: { $sum: "$amountGhs" }}}]);
  const totalFailedAmountGhs = await Orders.aggregate([{$match: { status: 'failed' }},{ $group: {_id: null, totalAmount: { $sum: "$amountGhs" }}}]);

  const totalPendingOrders = totalPendingAmountGhs.length > 0 ? totalPendingAmountGhs[0].totalAmount : 0;
  const totalApprovedOrders = totalApprovedAmountGhs.length > 0 ? totalApprovedAmountGhs[0].totalAmount : 0;
  const totalFailedOrders = totalFailedAmountGhs.length > 0 ? totalFailedAmountGhs[0].totalAmount : 0;

  Orders.find(filter)
    .populate('userId')
    .populate('walletId')
    .sort({ createdAt: -1 })
    .exec()
    .then((orders) => {
      res.status(200).json({
        count: orders.length,
        success: true,
        orders: orders,
        data: {
          totalPendingOrders: totalPendingOrders,
          totalApprovedOrders: totalApprovedOrders,
          totalFailedOrders: totalFailedOrders
        }

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

const createOrder = async (req, res, next) => {
  const order = new Orders({
    _id: new mongoose.Types.ObjectId(),
    userId: req.user.userId,
    walletId: req.body.walletId,
    action: req.body.action,
    orderId: req.body.orderId,
    amountGhs: req.body.amountGhs,
    amountUsd: req.body.amountUsd,
    paymentMethod: req.body.paymentMethod || "",
    receipientMethod: req.body.receipientMethod || "",
    receipientNumber: req.body.receipientNumber || ""
  });

  try {
    const result = await order.save();
    console.log(result);

    // Create a notification
    const subject = "Order Created Successfully";
    const message = `Your order with ID ${result.orderId} has been created successfully.`;
    const notification = await createNotification(req.user.userId, subject, message);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: result,
      notification: notification
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: err,
    });
  }
};




const getOrderById = (req, res, next) => {
  const id = req.params.orderId;

  Orders.findById(id)
    .populate('userId')
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json({
          success: true,
          message: "Order found",
          order: doc,
        });
      } else {
        res
          .status(404)
          .json({
            success: false,
            message: "No valid entry found for provided ID",
            order: {},
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};

const getOrdersByUserId = (req, res, next) => {
  const userId = req.user.userId;

  Orders.find({ userId: userId, status: { $ne: 'deleted' }})
      .exec()
      .then(orders => {
          res.status(200).json({
              success: true,
              count: orders.length,
              orders: orders
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

const getOrdersByUser = (req, res, next) => {
  const userId = req.params.userId;

  // SupportTicket.find({ userId: userId, status: { $ne: 'deleted' } })
  Orders.find({ userId: userId, status: { $ne: 'deleted' }})
      .exec()
      .then(orders => {
          res.status(200).json({
              success: true,
              count: orders.length,
              orders: orders
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


const updateOrderByReference = async (req, res, next) => {
  const userId = req.user.userId;
  const referenceId = req.params.referenceId;
  const status = req.body.status || null;
  const updateOps = {};

  // Check if there is a file attached to update the order proof
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

  try {
    const order = await Orders.findOne({ referenceId: referenceId, status: { $ne: 'deleted' } }).exec();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // If walletCredited is false, update the wallet balances
    if (!order.walletCredited) {
      const wallet = await Wallet.findById(order.walletId).exec();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Associated wallet not found',
        });
      }

      // Update wallet balances
      wallet.balanceGhs += order.amountGhs;
      wallet.balanceUsd += order.amountUsd;

      // Save the updated wallet
      await wallet.save();

      // Update the order balances and set walletCredited and confirmedPayment to true
      updateOps.balanceGhs = wallet.balanceGhs;
      updateOps.balanceUsd = wallet.balanceUsd;
      updateOps.walletCredited = true;
      updateOps.confirmedPayment = true;
      updateOps.status = 'success';
    }

    // Update the updatedAt field to the current date and time
    updateOps.updatedAt = new Date();

    const updatedOrder = await Orders.findOneAndUpdate(
      { referenceId: referenceId, status: { $ne: 'deleted' } },
      { $set: updateOps },
      { new: true }
    ).populate('userId').exec();

    // Create a notification
    const subject = "Order Updated Successfully";
    const message = `Your order with reference ID ${referenceId} has been successfully updated. Please check your wallet for your balance.`;
    const notification = await createNotification(userId, subject, message);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
      notification: notification,
      request: {
        type: 'GET',
        url: `${baseUrl}/orders/${updatedOrder._id}`,
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


const updateOrder = async (req, res, next) => {
  const userId = req.user.userId;
  const id = req.params.orderId;
  const status = req.body.status || null;
  const updateOps = {};

  // Check if there is a file attached to update the order proof
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

  try {
    const order = await Orders.findById(id).exec();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check the order action and handle wallet balance updates for withdrawals
    if (order.action === 'withdraw') {
      const wallet = await Wallet.findById(order.walletId).exec();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Associated wallet not found',
        });
      }

      // Deduct wallet balances
      wallet.balanceGhs -= order.amountGhs;
      wallet.balanceUsd -= order.amountUsd;

      // Save the updated wallet
      await wallet.save();

      // Update the order balances and set walletCredited and confirmedPayment to true
      updateOps.balanceGhs = wallet.balanceGhs;
      updateOps.balanceUsd = wallet.balanceUsd;
      updateOps.confirmedPayment = true;
      updateOps.status = 'success';
    }

    // Update the updatedAt field to the current date and time
    updateOps.updatedAt = new Date();

    const updatedOrder = await Orders.findOneAndUpdate(
      { _id: id, status: { $ne: 'deleted' } },
      { $set: updateOps },
      { new: true }
    ).populate('userId').exec();

    // Create a notification
    const subject = "Order Updated Successfully";
    const message = `Your order with ID ${id} has been updated successfully. Please check your wallet for your balance.`;
    const notification = await createNotification(userId, subject, message);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
      notification: notification,
      request: {
        type: 'GET',
        url: `${baseUrl}/orders/${updatedOrder._id}`,
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




const deleteOrder = (req, res, next) => {
  const id = req.params.orderId;
  Orders.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
        success: true,
        message: "Order deleted",
        request: {
          type: "POST",
          url: `${baseUrl}/orders`,
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
  getOrders,
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderByReference,
  updateOrder,
  getOrdersByUser,
  deleteOrder
};
