const express = require("express");
const router = express.Router();
const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const { 
  getWallets,
  createWallet,
  getWalletById,
  updateWallet,
  deleteWallet
   } = require('../controllers/wallet.controllers');


router.get("/", checkAuth, getWallets);
router.post("/",checkAuth, createWallet);
router.get("/:walletId", checkAuth, getWalletById);
router.patch("/:walletId", checkAuth, updateWallet);
router.delete("/:walletId", checkAuth, deleteWallet);

module.exports = router;
