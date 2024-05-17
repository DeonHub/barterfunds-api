const express = require("express");
const router = express.Router();
// const { upload } = require('../utils/fileUpload');
const checkAuth = require('../middleware/check-auth');

const fileUpload = require('../utils/fileUpload');
const upload = fileUpload("barterFunds/supportTicketFiles");


const { 
  getSupportTickets,
  createSupportTicket,
  getSupportTicketById,
  deleteSupportTicket,
  updateSupportTicket,
  getSupportTicketsByUserId
   } = require('../controllers/supportTicket.controllers');


router.get("/", checkAuth, getSupportTickets);
router.post("/", checkAuth, upload.array('files', 5), createSupportTicket);
router.get("/user/:userId", checkAuth, getSupportTicketsByUserId);
router.get("/:ticketId", checkAuth, getSupportTicketById);
router.patch("/:ticketId", checkAuth, updateSupportTicket);
router.delete("/:ticketId", checkAuth, deleteSupportTicket);

module.exports = router;
