const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { ObjectId } = require('mongodb');

// Function to calculate interest (if necessary)
const calculateInterest = (loanAmount) => {
  const interestRate = 0.05; // Example: 5% interest rate
  return loanAmount * interestRate;
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File submission route
router.post('/submit', upload.single('file'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const collection = db.collection('submissions');
    
    const createdAt = new Date();
    const formattedCreatedAt = createdAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    const interestDueDate = calculateInterestDueDate(createdAt);

    // Upload file to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'uploads' },
      async (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          return res.status(500).json({ message: 'Error uploading file' });
        }

        // File upload successful, save form data to MongoDB
        const formData = {
          ...req.body,  // Spread form fields from the request
          loanAmount: parseFloat(req.body.loanAmount),
          filePath: result.secure_url, // URL from Cloudinary
          fileName: req.file.originalname,
          fileId: new ObjectId(),
          createdAt: formattedCreatedAt,
          interestDueDate: interestDueDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          }),
          interestAmount: calculateInterest(parseFloat(req.body.loanAmount)),
        };

        const dbResult = await collection.insertOne(formData);
        res.status(201).json({ message: 'Form submitted successfully', data: dbResult });
      }
    );

    // Start the upload stream
    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    res.status(500).json({ message: 'Error uploading file', error });
  }
});

module.exports = router;