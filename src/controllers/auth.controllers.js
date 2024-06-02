require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../utils/transporter");
const Users = require("../models/users");
const Wallet = require("../models/wallet");
const hostEmail = process.env.EMAIL_HOST_USER;
const baseUrl = process.env.BASE_URL;
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const sendMail = require("../utils/sendMail");
const { generateWalletAddress } = require("../controllers/wallet.controllers");

const crypto = require("crypto");

// Function to generate a QR code URL for Google Authenticator
function generateQRCodeURL(authSecretKey, issuer, label, iconURL) {
  // Constructing the otpauth URL with issuer, label, and icon
  const otpauthURL = speakeasy.otpauthURL({
    secret: authSecretKey.ascii,
    label: label,
    issuer: issuer,
    icon: iconURL,
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

const generateUsername = (name) => {
  const randomNumbers = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number
  return name + randomNumbers;
};

const generateToken = (user) => {
  return jwt.sign(
    { email: user.email, userId: user._id },
    process.env.JWT_KEY,
    { expiresIn: "30d" }
  );
};

const decodeToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    console.error("Error decoding token:", err);
    throw err;
  }
};

const getUserFromToken = async (req, res, next) => {
  try {
    // Extract the token from the request body
    const token = req.body.token;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    // Decode the token to extract user information
    const decodedToken = decodeToken(token);

    // Retrieve the user from the database using the user ID from the decoded token
    const user = await Users.findById(decodedToken.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    } else {
      // Return the retrieved user along with status and message
      return res
        .status(200)
        .json({ success: true, message: "User not found", user: user });
    }
  } catch (err) {
    console.error("Error retrieving user from token:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const generateReferralCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const codeLength = 8;
  let referralCode = '';

  for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters[randomIndex];
  }

  return referralCode;
}



const Login = async (req, res, next) => {
  try {
    const user = await Users.findOne({ email: req.body.email }).exec();

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const result = await bcrypt.compare(req.body.password, user.password);

    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Update lastLogin to current date and time
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res
      .status(200)
      .json({ success: true, message: "Login successful", token, user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



const Signup = async (req, res, next) => {
  try {
    // Check if any required field is missing
    const requiredFields = [
      "firstname",
      "surname",
      "email",
      "password",
      "contact",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check if email already exists
    const existingUser = await Users.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({
        message:
          "User with email already exists. Please Login to continue or reset password if you have forgotten.",
      });
    }

    // Hash the password
    const hash = await bcrypt.hash(req.body.password, 10);

    // Generate a verification code
    const activationToken = crypto.randomBytes(64).toString("base64");

    // Create and save the user
    const user = new Users({
      _id: new mongoose.Types.ObjectId(),
      firstname: req.body.firstname,
      surname: req.body.surname,
      username: generateUsername(req.body.firstname),
      email: req.body.email,
      password: hash,
      contact: req.body.contact,
      activationToken: activationToken,
      activationTokenExpires: Date.now() + 432000000,
      referralCode: generateReferralCode(),
      referrerCode: req.body.referrerCode ? req.body.referrerCode : ''
    });

    const result = await user.save();
    const subject = "BarterFunds Account Activation";

    // Send the verification code to the user's email
    sendMail(
      req.body.email,
      encodeURIComponent(activationToken),
      subject,
      "account-activation",
      "Thank you for registering with BarterFunds",
      "To complete your registration and activate your account, please click on the button below",
      "If you did not sign up for an account with BarterFunds, please disregard this email.",
      "Activate Account"
    );
    // (userEmail, token, subject, action, header1, header2, header3, buttonText)
    // sendMail("pebabot355@rartg.com", "11234567890qwertyuiop", "Account Activation", "account-activation", "Thank you for registering with BarterFunds", "To complete your registration and activate your account, please click on the button below", "If you did not sign up for an account with BarterFunds, please disregard this email.", "Activate Account");
    // sendMail("pebabot355@rartg.com", "11234567890qwertyuiop", "Password Reset", "reset-password", "Greetings from BarterFunds", "We received a request to reset the password for the BarterFunds account associated with this e-mail address. Click the button below to reset your password.", "If you did not request this, please ignore this email and your password will remain unchanged.", "Reset Password");

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      // user: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const accountActivation = (req, res, next) => {
  // const activationToken = req.query.token;
  const { activationToken } = req.body;

  if (!activationToken) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }

  // Find user by token
  Users.findOne({ activationToken: activationToken })
    .then((user) => {
      if (!user.verified) {
        if (user.activationTokenExpires < Date.now()) {
          return res
            .status(404)
            .json({
              success: false,
              message: "Invalid or expired activation token",
            });
        }

        user.verified = true;
        user.status = "active";
        user.activationTokenExpires = null;

        // Save the updated user document
        user
          .save()
          .then(() => {
            // Create a wallet for the user
            const wallet = new Wallet({
              _id: new mongoose.Types.ObjectId(),
              userId: user._id,
              walletAddress: generateWalletAddress(64)
            });

            return wallet.save();
          })
          .then(() => {
            res.status(200).json({
              success: true,
              message: "User account activation successful",
              user: user,
            });
          })
          .catch((err) => {
            console.error("Error creating wallet:", err);
            res
              .status(500)
              .json({ success: false, message: "Error creating wallet" });
          });
      } else {
        res.status(200).json({
          success: true,
          message: "User account already activated",
          user: user,
        });
      }
    })
    .catch((err) => {
      console.error("Error activating account:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
};


const forgotPassword = (req, res, next) => {
  const email = req.body.email;
  const resetToken = crypto.randomBytes(64).toString("base64");
  const subject = "BarterFunds Account Password Reset Request";

  // Find user by email
  Users.findOne({ email })
    .then((user) => {
      // If user not found, return error
      if (!user) {
        console.log("User not found");
        return res.status(201).json({ success: false, message: "User not found" });
      }

      // Debugging: Log user details
      console.log("User found:", user);

      // Update user's reset token and expiry time
      user.resetToken = resetToken;
      user.resetTokenExpires = Date.now() + 432000000;
      user.save();

      // Send reset password email
      sendMail(
        user.email,
        encodeURIComponent(resetToken),
        subject,
        "reset-password",
        "Greetings from BarterFunds",
        "We received a request to reset the password for the BarterFunds account associated with this e-mail address. Click the button below to reset your password.",
        "If you did not request this, please ignore this email and your password will remain unchanged.",
        "Reset Password"
      );

      // Send success response
      res.status(201).json({ success: true, message: "Reset Password email sent successfully." });
    })
    .catch((err) => {
      // Error handling: Log and return internal server error
      console.error("Error finding user:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    });
};


const resetPassword = (req, res, next) => {
  const { password, resetToken } = req.body;
  // const token = req.query.token;

  if (!resetToken) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }

  // Find user by token
  Users.findOne({ resetToken: resetToken, resetTokenExpires: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Invalid or expired reset token. Please request for another password reset link." });
      }

      // Hash the new password
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          throw err;
        }
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            throw err;
          }
          // Update user password with the new hashed password
          user.password = hash;
          user.resetToken = null;
          user.resetTokenExpires = null;

          // Save the updated user document
          user
            .save()
            .then(() => {
              res
                .status(200)
                .json({ success: true, message: "Password reset successful" });
            })
            .catch((err) => {
              console.error("Error updating password:", err);
              res
                .status(500)
                .json({ success: false, message: "Internal server error" });
            });
        });
      });
    })
    .catch((err) => {
      console.error("Error resetting password:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
};

const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Fetch the user from the database
    const user = await Users.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    // Update the user's password

    user.password = hashedPassword;
    await user.save();

    // Optionally, you can send a success message
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const twoFactorAuth = async (req, res, next) => {
  const issuer = "BarterFunds";
  const label = "BarterFunds Account";
  const iconURL =
    "https://res.cloudinary.com/bloody123/image/upload/v1712932808/cobf5bda56hwpcjtdtur.png";

  try {
    const userId = req.user.userId;

    // Find user by ID in the database
    const user = await Users.findById(userId);
    

    // Check if user exists
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    // Check if twoFactorAuth is enabled for the user
    if (!user.twoFactorAuth) {
      // Generate a secret key for two-factor authentication
      const authSecretKey = speakeasy.generateSecret({ length: 20 });

      console.log(authSecretKey)

      // Generate a QR code URL for Google Authenticator
      const qrCodeURL = await generateQRCodeURL(
        authSecretKey,
        issuer,
        label,
        iconURL
      );
      
      // Update the user document with the secret key and QR code URL
      // user.twoFactorAuth = true;
      !user.twoFactorAuthSecretKey
        ? (user.twoFactorAuthSecretKey = authSecretKey.base32)
        : user.twoFactorAuthSecretKey;
      !user.twoFactorAuthQrcode
        ? (user.twoFactorAuthQrcode = qrCodeURL)
        : user.twoFactorAuthQrcode;

        

      // Save the updated user document
      await user
        .save()
        .then(() => {
          
          res
            .status(200)
            .json({
              success: true,
              message: "QR Code generated successfully",
              user: user,
            });
        })
        .catch((err) => {
          console.error("User already authenticated:", err);
          res
            .status(500)
            .json({
              success: false,
              message: "Two Factor Auth already enabled",
              user: user,
            });
        });
    } else {
      // If two-factor authentication is already enabled, return nothing
      console.log('user has twofactor')
      return res
        .status(200)
        .json({
          success: true,
          message: "Two Factor Auth already enabled",
          user: user,
        });
    }
  } catch (err) {
    console.error("Error in twofactorauth:", err);
    throw err;
  }
};

const verifyTwoFactorAuth = async (req, res, next) => {
  try {
    const otp = req.params.otp;
    const userId = req.user.userId;
    const user = await Users.findById(userId);

    console.log(otp);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuthSecretKey,
      encoding: "base32",
      token: otp,
    });

    if (verified) {
      return res
        .status(200)
        .json({
          success: true,
          message: "Two-factor authentication successful",
        });
    } else {
      return res
        .status(401)
        .json({
          success: false,
          message: "Could not verify Two Factor Authentication code.",
        });
    }
  } catch (err) {
    console.error("Error verifying two-factor authentication:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  Login,
  Signup,
  updatePassword,
  accountActivation,
  forgotPassword,
  resetPassword,
  getUserFromToken,
  twoFactorAuth,
  verifyTwoFactorAuth,
};
