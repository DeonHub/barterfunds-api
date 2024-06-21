const express = require("express");
const router = express.Router();
// const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/kycImages");

const { 
    getAdminDashboard,
    getUserDashboard,
   } = require('../controllers/dashboard.controllers');


router.get("/admin", checkAuth, getAdminDashboard);
router.get("/user", checkAuth, getUserDashboard);
// router.post("/", checkAuth, upload.fields([ { name: 'frontImage', maxCount: 1 },  { name: 'backImage', maxCount: 1 }, { name: 'photograph', maxCount: 1 }, { name: 'proofOfAddress', maxCount: 1 } ]), addKYC);
// router.get("/:kycId", checkAuth, getKYCById);
// router.get("/:userId", checkAuth, getKYCByUserId);
// router.delete("/:kycId", checkAuth, deleteKYC);
// router.patch("/:kycId", checkAuth, updateKyc);

module.exports = router;
