const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    // host: "smtp.gmail.com",
    service: 'Gmail',
    port: 587,
    secure: false,
    auth: {
      user: "clientservicealert@gmail.com",
      pass: "jwfrbbplmxolykuq",
    },
  });


// Function to send email
const sendEmail = (to, subject, text) => {
    // Email options
    const mailOptions = {
        from: "clientservicealert@gmail.com", // Sender address
        to: to, // Recipient address
        subject: subject, // Subject line
        text: text // Plain text body
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

// Example usage
sendEmail('nadace7481@ekposta.com', 'Test Email', 'This is a test email from Nodemailer.');
