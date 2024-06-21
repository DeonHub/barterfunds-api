const express = require("express");
const router = express.Router();
const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/profilePictures");

const { getUsers,
        getUser,
        updateUser,
        deleteUser
     } = require('../controllers/users.controllers');

const checkAuth = require('../middleware/check-auth');

router.get("/", checkAuth, getUsers);
router.get("/:userId", checkAuth, getUser);
router.patch("/:userId", checkAuth, upload.single('profilePicture'), updateUser);
router.delete("/:userId", checkAuth, deleteUser);


module.exports = router;
