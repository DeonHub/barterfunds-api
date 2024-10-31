const express = require("express");
const router = express.Router();

const { 
    sendBulkEmail
     } = require('../controllers/mails.controllers');

router.post("/send-bulk-email", sendBulkEmail);

module.exports = router;