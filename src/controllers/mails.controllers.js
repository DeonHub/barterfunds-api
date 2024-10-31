require("dotenv").config();
const sendMailx = require("../utils/sendMailx");

// Function to send email
const sendBulkEmail = async (req, res) => {
    const { emails, subject } = req.body;
    
    // Send email to each recipient
    emails.forEach(async (email) => {
        try {
            sendMailx(
                email,
                "",
                "Purchase Cheap and Affordable Wholesale Goods from China and Turkey! 🇨🇳🇹🇷",
                "login",
                `<p style="font-size: 25px; font-weight: bold; margin-bottom:-20%;">Hey there!</p>`,
                `
                <p style="font-size:18px; font-weight:bold; margin-bottom:10px;">Would you like to purchase goods made in China and Turkey at wholesale prices? 🇨🇳 🇹🇷 </p>
                <p style="font-size:18px; font-weight:bold">Would you like to start your own business and make profit?</p><br>
            
                <p style="font-size:15px; font-weight:semi-bold">We directly import bags, shoes, slippers, clothes, kitchenware, home appliances and other items from China 🌨🌳 at wholesale costs, enabling anyone to launch their own business.</p><br>
                <p style="font-size:15px; font-weight:semi-bold">Join our WhatsApp group via this link</p>
                `,
                ``,
                "Join Now"
              );

        } catch (error) {
        console.error("Error sending email:", error);
        }
    });
    
    res.status(200).json({ message: "Emails sent successfully" });
}

module.exports = {
    sendBulkEmail
}