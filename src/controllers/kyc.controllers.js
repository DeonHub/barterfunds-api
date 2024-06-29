const mongoose = require("mongoose");
const KYC = require("../models/kyc");
const baseUrl = process.env.BASE_URL;
const Users = require("../models/users");
const createNotification = require("../utils/createNotification");
const path = require("path");


// Function to add KYC details
const addKYC = async (req, res, next) => {
    try {
      const userId = req.user.userId;
  
      let filePath = req.files['proofOfAddress'][0]['path'];
      if (!filePath.startsWith('http')) {
          filePath = path.relative(path.join(__dirname, '../..'), filePath);
      }
      const proofOfAddress = filePath;
  
      const kyc = new KYC({
          _id: new mongoose.Types.ObjectId(),
          userId: userId,
          firstname: req.body.firstname,
          surname: req.body.surname,
          email: req.body.email,
          contact: req.body.contact,
          dateOfBirth: req.body.dateOfBirth,
          country: req.body.country,
          region: req.body.region,
          city: req.body.city,
          nationality: req.body.nationality,
          residentialAddress: req.body.residentialAddress,
          postalAddress: req.body.postalAddress,
          identityDocumentType: req.body.identityDocumentType,
          identityDocumentNumber: req.body.identityDocumentNumber,
          issueDate: req.body.issueDate,
          expiryDate: req.body.expiryDate,
          issuingAuthority: req.body.issuingAuthority,
          photograph: req.files['photograph'][0]['path'],
          frontImage: req.files['frontImage'][0]['path'],
          backImage: req.files['backImage'][0]['path'],
          proofOfAddress: proofOfAddress,
          identityDocumentUploaded: req.body.identityDocumentUploaded,
          proofDocumentUploaded: req.body.proofDocumentUploaded,
      });
  
      const result = await kyc.save();
  
      // Subject and message for the notification
      const subject = "KYC Details Submitted Successfully";
      const message = "Your KYC details have been successfully submitted and are under review.";
  
      // Create the notification
      const notification = await createNotification(userId, subject, message);

      res.status(201).json({
          success: true,
          message: "KYC details added successfully",
          kyc: result,
          notification: notification
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
          success: false,
          error: err
      });
    }
  };


// Function to delete KYC details
const deleteKYC = (req, res, next) => {
    const id = req.params.kycId;
    KYC.deleteOne({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({
                success: true,
                message: "KYC details deleted successfully"
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

// Function to get all KYC details
const getAllKYC = (req, res, next) => {
    const filters = []; // Initialize an array to store all filters
    filters.push({ status: { $ne: 'deleted' } });
    // filters.push({ isAdmin: false });

    const filter = { $and: filters };

    KYC.find(filter)
        .exec()
        .then(docs => {
            res.status(200).json({
                success: true,
                count: docs.length,
                kycs: docs
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

// Function to get KYC details by user ID
const getKYCByUserId = (req, res, next) => {
    const userId = req.user.userId;

    KYC.find({ userId: userId })
        .exec()
        .then(docs => {
            res.status(200).json({
                success: true,
                count: docs.length,
                kycs: docs
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




const getKYCById = (req, res, next) => {
    const id = req.params.kycId;
    KYC.findById(id)
      .exec()
      .then(doc => {
        if (doc) {
          res.status(200).json({
            success: true,
            message: 'KYC found',
            kyc: doc
          });
        } else {
          res.status(404).json({ success: false, message: "No valid entry found for provided ID", kyc: {} });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ success: false, error: err });
      });
  };
  

const updateKyc = (req, res, next) => {
    const id = req.params.kycId;
    const { status } = req.body;
    const updateOps = {};
  
    // If status is provided, update it as well
    if (status) {
      updateOps.status = status;
    }
  
    // Update the KYC
    KYC.updateOne({ _id: id }, { $set: updateOps })
      .exec()
      .then((result) => {
        KYC.findById(id)
          .exec()
          .then((kyc) => {
            if (!kyc) {
              return res.status(404).json({
                success: false,
                message: "KYC not found",
              });
            }
  
            // Handle the case when KYC is approved
            if (status === 'approved' && kyc.userId) {
              Users.updateOne({ _id: kyc.userId }, { $set: { kycApproved: true } })
                .exec()
                .then(async () => {
                  const subject = "KYC Approved";
                  const message = "Your KYC has been approved successfully. You can now access all features.";
                  
                  const notification = await createNotification(kyc.userId, subject, message);
                  console.log('Notification created:', notification);
  
                  res.status(200).json({
                    success: true,
                    message: "KYC status updated successfully",
                    kyc: kyc,
                    notification: notification,
                    request: {
                      type: "GET",
                      url: `${baseUrl}/kycs/` + id,
                    },
                  });
                })
                .catch((err) => {
                  res.status(500).json({
                    success: false,
                    error: err,
                  });
                });
            } 
            // Handle the case when KYC is rejected
            else if (status === 'rejected' && kyc.userId) {
              Users.updateOne({ _id: kyc.userId }, { $set: { kycApproved: false } })
                .exec()
                .then(async () => {
                  const subject = "KYC Rejected";
                  const message = "Your KYC has been rejected. Please check your details and submit again.";
                  
                  const notification = await createNotification(kyc.userId, subject, message);
                  console.log('Notification created:', notification);
  
                  res.status(200).json({
                    success: true,
                    message: "KYC status updated successfully",
                    kyc: kyc,
                    notification: notification,
                    request: {
                      type: "GET",
                      url: `${baseUrl}/kycs/` + id,
                    },
                  });
                })
                .catch((err) => {
                  res.status(500).json({
                    success: false,
                    error: err,
                  });
                });
            } 
            // Handle other status updates
            else {
              res.status(200).json({
                success: true,
                message: "KYC status updated successfully",
                kyc: kyc,
                request: {
                  type: "GET",
                  url: `${baseUrl}/kycs/` + id,
                },
              });
            }
          })
          .catch((err) => {
            res.status(500).json({
              success: false,
              error: err,
            });
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({
          success: false,
          error: err,
        });
      });
  };


module.exports = {
    addKYC,
    deleteKYC,
    getAllKYC,
    getKYCByUserId,
    getKYCById,
    updateKyc
};
