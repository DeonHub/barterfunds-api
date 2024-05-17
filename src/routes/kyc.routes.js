const express = require("express");
const router = express.Router();
// const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/kycImages");

const { 
    addKYC,
    deleteKYC,
    getAllKYC,
    getKYCByUserId,
    getKYCById,
    updateKyc
   } = require('../controllers/kyc.controllers');


router.get("/", checkAuth, getAllKYC);
router.post("/", checkAuth, upload.fields([ { name: 'frontImage', maxCount: 1 },  { name: 'backImage', maxCount: 1 }, { name: 'photograph', maxCount: 1 }, { name: 'proofOfAddress', maxCount: 1 } ]), addKYC);
router.get("/:kycId", checkAuth, getKYCById);
router.get("/x/user", checkAuth, getKYCByUserId);
router.delete("/:kycId", checkAuth, deleteKYC);
router.patch("/:kycId", checkAuth, updateKyc);

module.exports = router;
