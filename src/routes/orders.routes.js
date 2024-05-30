const express = require("express");
const router = express.Router();
// const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/orderProofs");

const { 
  getOrders,
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderByReference,
  updateOrder,
  deleteOrder,
  getOrdersByUser
   } = require('../controllers/orders.controllers');


router.get("/", checkAuth, getOrders);
router.post("/",  checkAuth, createOrder);
router.get("/:orderId", checkAuth, getOrderById);
router.patch("/:orderId", checkAuth, upload.single('paymentProof'), updateOrder);
router.patch("/x/:referenceId", checkAuth, upload.single('paymentProof'), updateOrderByReference);
router.get("/x/user", checkAuth, getOrdersByUserId);
router.get("/x/user/:userId", checkAuth, getOrdersByUser);
router.delete("/:orderId", checkAuth, deleteOrder);

module.exports = router;
