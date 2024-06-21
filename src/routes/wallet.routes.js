const express = require("express");
const router = express.Router();
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

module.exports = router;
