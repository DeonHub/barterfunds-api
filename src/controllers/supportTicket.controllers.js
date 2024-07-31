const mongoose = require("mongoose");
const SupportTicket = require("../models/supportTicket");
const baseUrl = process.env.BASE_URL;
const path = require("path");
const createNotification = require("../utils/createNotification");

const generateTicketId = (length) => {
    const characters = '0123456789';
    let ticketId = '';
    for (let i = 0; i < length; i++) {
        ticketId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return ticketId;
};

const getSupportTickets = (req, res, next) => {
    const filters = [];
    filters.push({ status: { $ne: 'deleted' } });

    const filter = { $and: filters };

    SupportTicket.find(filter)
        // .sort({ createdAt: -1 })
        .exec()
        .then(tickets => {
            res.status(200).json({
                success: true,
                count: tickets.length,
                tickets: tickets
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                success: false,
                error: err
            });
        });
};




const createSupportTicket = (req, res, next) => {
    const userId = req.user.userId;
    const files = req.files ? req.files : [];
    let descriptions = req.body.descriptions ? req.body.descriptions : [];

    // Ensure descriptions is always an array
    if (!Array.isArray(descriptions)) {
        descriptions = [descriptions];
    }

    let fileMetadata = [];

    if (files.length !== 0) {
        // Ensure that the number of files matches the number of descriptions
        if (files.length !== descriptions.length) {
            return res.status(400).json({
                success: false,
                message: "Number of files does not match the number of descriptions"
            });
        }

        // Extract file metadata and descriptions and store them in an array
        fileMetadata = files.map((file, index) => {
            let filePath = file.path;
            if (!filePath.startsWith('http')) {
                filePath = path.relative(path.join(__dirname, '../..'), filePath);
            }

            return {
                originalName: file.originalname,
                path: filePath,
                description: descriptions[index]
            };
        });
    }

    // Example ticket creation
    const ticket = new SupportTicket({
        _id: new mongoose.Types.ObjectId(),
        ticketId: generateTicketId(8),
        userId: userId,
        subject: req.body.subject,
        message: req.body.message,
        category: req.body.category,
        files: files.length > 0 ? fileMetadata : [],
    });

    ticket.save()
        .then(result => {
            // Create notification for user
            const subject = "Support Ticket Created";
            const message = `Your support ticket ${ticket.ticketId} has been created successfully. We will get back to you soon.`;
            createNotification(userId, subject, message);

            res.status(201).json({
                success: true,
                message: "Support ticket created successfully",
                createdTicket: result
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                success: false,
                error: err,
                message: "Error creating ticket. Please try again."
            });
        });
};



const replySupportTicket = async (req, res, next) => {
    const userId = req.user.userId;
    const ticketId = req.params.ticketId;
    const files = req.files ? req.files : [];
    let descriptions = req.body.descriptions ? req.body.descriptions : [];
  
    // Ensure descriptions is always an array
    if (!Array.isArray(descriptions)) {
      descriptions = [descriptions];
    }
  
    let fileMetadata = [];
  
    if (files.length !== 0) {
      // Ensure that the number of files matches the number of descriptions
      if (files.length !== descriptions.length) {
        return res.status(400).json({
          success: false,
          message: "Number of files does not match the number of descriptions"
        });
      }
  
      // Extract file metadata and descriptions and store them in an array
      fileMetadata = files.map((file, index) => {
        let filePath = file.path;
        if (!filePath.startsWith('http')) {
          filePath = path.relative(path.join(__dirname, '../..'), filePath);
        }
  
        return {
          originalName: file.originalname,
          path: filePath,
          description: descriptions[index]
        };
      });
    }

    try {
      // Find the support ticket by ID
      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Support ticket not found"
        });
      }
  
      // Add the reply to the ticket's replies array
      const reply = {
        authorId: userId,
        role: req.body.role,
        message: req.body.message,
        files: files.length > 0 ? fileMetadata : []
      };
  
      ticket.replies.push(reply);
      ticket.updatedAt = Date.now();
  
      await ticket.save();
  
      // Create notification for user if the reply is not from the user
      if (ticket.userId._id.toString() !== userId.toString()) {
      const subject = "Support Ticket Reply";
      const message = `You have a new reply on your support ticket ${ticket.ticketId}. Please check the ticket for details.`;
      createNotification(ticket.userId._id, subject, message);
      }

  
      res.status(201).json({
        success: true,
        message: "Reply added successfully",
        updatedTicket: ticket
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err,
        message: "Error adding reply. Please try again."
      });
    }
  };



const getSupportTicketById = (req, res, next) => {
    const id = req.params.ticketId;
    SupportTicket.findById(id)
        .populate('userId')
        .exec()
        .then(ticket => {
            if (ticket) {
                res.status(200).json({ success: true, message:'Ticket found', ticket:ticket});
            } else {
                res.status(404).json({ success: false, message: "Support ticket not found", ticket: {} });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ success: false, error: err });
        });
};


const updateSupportTicket = (req, res, next) => {
    const userId = req.user.userId;
    const id = req.params.ticketId;
    const status = req.body.status || null;
    const updateOps = {};

    // Validate if the status is one of the allowed values
    if (status && (status === "open" || status === "closed" || status === "pending" || status === "resolved")) {
        updateOps.status = status;
    }

    // Add all other fields from the request body to updateOps, excluding 'status'
    for (const propName in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, propName)) {
            if (propName !== "status") {
                updateOps[propName] = req.body[propName];
            }
        }
    }

    // Update the updatedAt field to the current date and time
    updateOps.updatedAt = new Date();

    // If no valid update operations are provided, return an error
    if (Object.keys(updateOps).length === 0) {
        return res.status(400).json({ success: false, message: "No valid update operations provided." });
    }

    // Update the support ticket
    SupportTicket.updateOne({ _id: id }, { $set: updateOps })
        .exec()
        .then(result => {
            if (result.nModified === 0) {
                return res.status(404).json({ success: false, message: "Ticket not found or no changes made." });
            }
            return SupportTicket.findById(id).exec();
        })
        .then(ticket => {
            if (!ticket) {
                return res.status(404).json({ success: false, message: "Ticket not found." });
            }

            // Create notification for user
            const subject = "Support Ticket Updated";
            const message = `Your support ticket ${ticket.ticketId} has been updated successfully. Check the status for more details.`;
            createNotification(userId, subject, message);

            res.status(200).json({
                success: true,
                message: "Support ticket updated successfully",
                ticket: ticket,
                request: {
                    type: "GET",
                    url: `${baseUrl}/tickets/${id}`
                }
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                success: false,
                error: err
            });
        });
};



const deleteSupportTicket = (req, res, next) => {
    const id = req.params.ticketId;
    SupportTicket.deleteOne({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({
                success: true,
                message: "Support ticket deleted"
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                success: false,
                error: err
            });
        });
};

const getSupportTicketsByUserId = (req, res, next) => {
    const userId = req.user.userId;
    

    // SupportTicket.find({ userId: userId, status: { $ne: 'deleted' } })
    SupportTicket.find({ userId: userId, status: { $ne: 'deleted' }})
        .exec()
        .then(tickets => {
            res.status(200).json({
                success: true,
                count: tickets.length,
                tickets: tickets
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                success: false,
                error: err
            });
        });
};

const getSupportTicketsByUser = (req, res, next) => {
    const userId = req.params.userId;
  
  
    // SupportTicket.find({ userId: userId, status: { $ne: 'deleted' } })
    SupportTicket.find({ userId: userId, status: { $ne: 'deleted' }})
        .exec()
        .then(tickets => {
            res.status(200).json({
                success: true,
                count: tickets.length,
                tickets: tickets
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                success: false,
                error: err
            });
        });
  };
  


module.exports = {
    getSupportTickets,
    createSupportTicket,
    getSupportTicketById,
    deleteSupportTicket,
    updateSupportTicket,
    getSupportTicketsByUserId,
    getSupportTicketsByUser,
    replySupportTicket
};
