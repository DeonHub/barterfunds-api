const dotenv = require("dotenv");
const speakeasy = require("speakeasy");
// const { authSecretKey } = require('../controllers/auth.controllers');
// const { authSecretKey } = require('./generate_qr_code')
dotenv.config();

function verifyOTP(otp) {
  const verified = speakeasy.totp.verify({
    secret: "HY2TAZBVHBVUYTTUIBLCMNK6EZZHQV2W",
    encoding: "base32",
    token: otp,
  });

  return verified;
}

module.exports = verifyOTP;