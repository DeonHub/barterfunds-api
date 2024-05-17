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
  deleteCurrency
   } = require('../controllers/currency.controllers');


router.get("/", checkAuth, getCurrencies);
router.post("/",  checkAuth, upload.single('currencyLogo'), createCurrency);
router.get("/:currencyId", checkAuth, getCurrencyById);
router.patch("/:currencyId", checkAuth, upload.single('currencyLogo'), updateCurrency);
router.delete("/:currencyId", checkAuth, deleteCurrency);

module.exports = router;
