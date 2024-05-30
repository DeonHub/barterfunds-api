const express = require("express");
const router = express.Router();
const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const { 
  getWallets,
  createWallet,
  getWalletById,
  updateWallet,
  deleteWallet,
  getWalletByUserId
   } = require('../controllers/wallet.controllers');


router.get("/", checkAuth, getWallets);
router.post("/", checkAuth, createWallet);
router.get("/:walletId", checkAuth, getWalletById);
router.get("/x/user", checkAuth, getWalletByUserId);
router.patch("/:walletId", checkAuth, updateWallet);
router.delete("/:walletId", checkAuth, deleteWallet);

// router.get("/", checkAuth, getTransactions);
// router.post("/",  checkAuth, createTransaction);
// router.get("/:transactionId", checkAuth, getTransactionById);
// router.patch("/:transactionId", checkAuth, upload.single('paymentProof'), updateTransaction);
// router.patch("/x/:referenceId", checkAuth, upload.single('paymentProof'), updateTransactionByReference);
// router.get("/x/user", checkAuth, getTransactionsByUserId);
// router.delete("/:transactionId", checkAuth, deleteTransaction);

module.exports = router;
