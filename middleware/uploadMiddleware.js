const multer = require('multer');

// Use memoryStorage to hold the file as a buffer temporarily
const storage = multer.memoryStorage();

// Filter to allow only specific document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, or DOCX are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
});

// Export the middleware configured to handle a single file with the field name 'resume'
module.exports = upload.single('resume');