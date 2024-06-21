const express = require("express");
const router = express.Router();

const { getReferrals
     } = require('../controllers/referrals.controllers');

const checkAuth = require('../middleware/check-auth');

router.get("/", checkAuth, getReferrals);


module.exports = router;
