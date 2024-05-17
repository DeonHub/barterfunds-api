const express = require("express");
const router = express.Router();
// const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/currencyLogos");

const { 
  getTransactions,
  createTransaction,
  getTransactionById,
  getTransactionsByUserId,
  updateTransaction,
  deleteTransaction,
  updateTransactionByReference
   } = require('../controllers/transactions.controllers');


router.get("/", checkAuth, getTransactions);
router.post("/",  checkAuth, createTransaction);
router.get("/:transactionId", checkAuth, getTransactionById);
router.patch("/:transactionId", checkAuth, upload.single('paymentProof'), updateTransaction);
router.patch("/x/:referenceId", checkAuth, upload.single('paymentProof'), updateTransactionByReference);
router.get("/x/user", checkAuth, getTransactionsByUserId);
router.delete("/:transactionId", checkAuth, deleteTransaction);

module.exports = router;
