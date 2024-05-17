const mongoose = require("mongoose");
const SupportTicket = require("../models/supportTicket");
const baseUrl = process.env.BASE_URL;

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
    // filters.push({ isAdmin: false });
  
    const filter = { $and: filters };

    SupportTicket.find(filter)
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
    const files = req.files;
    const descriptions = req.body.descriptions;

    // Ensure that the number of files matches the number of descriptions
    if (files.length !== descriptions.length) {
        return res.status(400).json({
            success: false,
            message: "Number of files does not match the number of descriptions"
        });
    }

    // Extract file metadata and descriptions and store them in an array
    const fileMetadata = files.map((file, index) => ({
        originalName: file.originalname,
        path: file.path,
        description: descriptions[index] // Match each file with its corresponding description
    }));

    const ticket = new SupportTicket({
        _id: new mongoose.Types.ObjectId(),
        ticketId: generateTicketId(8),
        userId: userId,
        subject: req.body.subject,
        message: req.body.message,
        files: fileMetadata // Add file metadata to the files array
    });

    ticket
        .save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                success: true,
                message: "Support ticket created successfully",
                createdTicket: result
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
    const id = req.params.ticketId;
    const { status, comments } = req.body;
    const updateOps = {};

    // Validate if the status is one of the allowed values
    if (status && (status === "open" || status === "closed" || status === "pending" || status === "resolved")) {
        updateOps.status = status;
    }

    // Update comments if provided
    if (comments) {
        updateOps.comments = comments;
    }

    // If no valid update operations are provided, return an error
    if (Object.keys(updateOps).length === 0) {
        return res.status(400).json({ success: false, message: "No valid update operations provided." });
    }

    // Update the updatedAt field to the current date and time
    updateOps.updatedAt = new Date();

    // Update the support ticket
    SupportTicket.updateOne({ _id: id }, { $set: updateOps })
        .exec()
        .then(result => {
            SupportTicket.findById(id).exec().then(ticket => {
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
    getSupportTicketsByUserId
};
