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
