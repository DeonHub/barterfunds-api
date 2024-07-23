const express = require("express");
const router = express.Router();
// const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/currencyLogos");

const { 
  getCurrencies,
  createCurrency,
  getCurrencyById,
  updateCurrency,
  deleteCurrency,
  getCurrenciex
   } = require('../controllers/currency.controllers');


router.get("/", getCurrencies);
router.get("/x", getCurrenciex);
// router.get("/", checkAuth, getCurrencies);
router.post("/",  checkAuth, upload.single('currencyLogo'), createCurrency);
router.get("/:currencyId", checkAuth, getCurrencyById);
router.patch("/:currencyId", checkAuth, upload.single('currencyLogo'), updateCurrency);
router.delete("/:currencyId", checkAuth, deleteCurrency);

module.exports = router;
