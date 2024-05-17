const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// Define issuer, label, and icon URL
const issuer = 'BarterFunds';
const label = 'BarterFunds Account';
const iconURL = 'https://res.cloudinary.com/bloody123/image/upload/v1712932808/cobf5bda56hwpcjtdtur.png';


// Generate a secret key
const authSecretKey = speakeasy.generateSecret({ length: 20 });


// Function to generate a QR code URL for Google Authenticator
function generateQRCodeURL(issuer, label, iconURL) {
    // Constructing the otpauth URL with issuer, label, and icon
    const otpauthURL = speakeasy.otpauthURL({
        secret: authSecretKey.ascii,
        label: label,
        issuer: issuer,
        icon: iconURL
    });

    return new Promise((resolve, reject) => {
        QRCode.toDataURL(otpauthURL, (err, dataURL) => {
            if (err) {
                reject(err);
            } else {
                resolve(dataURL);
            }
        });
    });
}


// Generate and display the QR code URL
generateQRCodeURL(issuer, label, iconURL)
    .then((dataURL) => {
        console.log(`Auth Secret Key: ${authSecretKey.base32}`);
        console.log("Scan the QR code with the Google Authenticator app:");
        console.log(dataURL);
    })
    .catch((err) => {
        console.error("Error generating QR code:", err);
    });

module.exports = { authSecretKey };  