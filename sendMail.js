// const nodemailer = require('nodemailer');

// // Create a transporter object using SMTP transport
// const transporter = nodemailer.createTransport({
//     // host: "smtp.gmail.com",
//     service: 'Gmail',
//     port: 587,
//     secure: false,
//     auth: {
//       user: "clientservicealert@gmail.com",
//       pass: "jwfrbbplmxolykuq",
//     },
//   });


// // Function to send email
// const sendEmail = (to, subject, text) => {
//     // Email options
//     const mailOptions = {
//         from: "clientservicealert@gmail.com", // Sender address
//         to: to, // Recipient address
//         subject: subject, // Subject line
//         text: text // Plain text body
//     };

//     // Send email
//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.error('Error sending email:', error);
//         } else {
//             console.log('Email sent:', info.response);
//         }
//     });
// };

// // Example usage
// sendEmail('nadace7481@ekposta.com', 'Test Email', 'This is a test email from Nodemailer.');



const transporter  = require("./src/utils/transporter");


async function sendSMSviaEmail(phoneNumber, carrier, subject, message) {
  const carrierGateway = {
    "att": "@txt.att.net",
    "verizon": "@vtext.com",
    "tmobile": "@tmomail.net",
    "sprint": "@messaging.sprintpcs.com"
  };
  

  const mailOptions = {
    from: '"Chrissys Import" <noreply@chrissysimport.com>',
    to: `${phoneNumber}${carrierGateway[carrier]}`,
    subject: subject,
    text: message
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("SMS sent via email:", info.response);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

// Example usage
sendSMSviaEmail("+233558587873", "verizon", "Hello!", "This is a test SMS sent via email.");
