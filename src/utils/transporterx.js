require('dotenv').config();
const nodemailer = require("nodemailer");
const emailUser = process.env.EMAIL_HOST_USER_TEST;
const emailPassword = process.env.EMAIL_HOST_PASSWORD_TEST;
const emailHost = process.env.EMAIL_HOST;

// Create a transporter object with SMTP configuration
const transporterx = nodemailer.createTransport({
  service: 'Gmail',
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

module.exports = transporterx;
