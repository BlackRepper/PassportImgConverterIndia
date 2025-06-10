const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Set up multer to upload directly to S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: function (req, file, cb) {
    // Accept image files only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// Export the handler
module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Use the multer middleware directly with a callback
  upload.single('file')(req, res, function (err) {
    if (err) {
      // Handle Multer errors
      let message = err.message;
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File size should be less than 20MB';
      }
      return res.status(400).json({ error: message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.status(200).json({
      originalname: req.file.originalname,
      key: req.file.key, // <-- This is required for frontend
      url: req.file.location,
    });
  });
};

// Disable bodyParser (important for file upload)
module.exports.config = {
  api: {
    bodyParser: false,
  },
};