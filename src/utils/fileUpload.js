const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require("path");
const fs = require("fs");

// Configure Cloudinary with your API credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create local storage for PDFs and Word documents
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});

// Custom storage engine to switch between local and Cloudinary storage
const customStorage = (folderName) => ({
  _handleFile(req, file, cb) {
    const isDocument = file.mimetype === 'application/pdf' || 
                       file.mimetype === 'application/msword' || 
                       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isDocument) {
      localStorage._handleFile(req, file, cb);
    } else {
      const cloudinaryStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: folderName.trim(),
          publicId: `${file.fieldname}-${Date.now()}`,
          format: path.extname(file.originalname).substring(1),
        },
      });
      cloudinaryStorage._handleFile(req, file, cb);
    }
  },
  _removeFile(req, file, cb) {
    const isDocument = file.mimetype === 'application/pdf' || 
                       file.mimetype === 'application/msword' || 
                       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isDocument) {
      localStorage._removeFile(req, file, cb);
    } else {
      const cloudinaryStorage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: folderName.trim(),
          publicId: `${file.fieldname}-${Date.now()}`,
          format: path.extname(file.originalname).substring(1),
        },
      });
      cloudinaryStorage._removeFile(req, file, cb);
    }
  }
});

function fileUpload(folderName) {
  return multer({
    storage: customStorage(folderName),
    limits: {
      fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
    },
  });
}

module.exports = fileUpload;
