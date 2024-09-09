const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { ObjectId } = require('mongodb');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // Set in your environment variables
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
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'uploads' }, // Adjust folder based on your structure
      async (error, result) => {
        if (error) {
          console.error('Error uploading file to Cloudinary', error);
          return res.status(500).json({ message: 'Error uploading file' });
        }

        // File upload successful, now save form data to MongoDB
        const formData = {
          firstName: req.body.firstName,
          middleName: req.body.middleName,
          lastName: req.body.lastName,
          idNumber: req.body.idNumber,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          residentialAddress: req.body.residentialAddress,
          loanAmount: parseFloat(req.body.loanAmount),
          repaymentPeriod: req.body.repaymentPeriod,
          placeOfWork: req.body.placeOfWork,
          purpose: req.body.purpose,
          loanSecurity: req.body.loanSecurity,
          guarantorFirstName: req.body.guarantorFirstName,
          guarantorLastName: req.body.guarantorLastName,
          guarantorId: req.body.guarantorId,
          filePath: result.secure_url, // Cloudinary URL
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
        };

        formData.interestAmount = calculateInterest(formData.loanAmount);

        const dbResult = await collection.insertOne(formData);
        res.status(201).json({ message: 'Form submitted successfully', data: dbResult });
      }
    );

    // Start the upload by streaming the file buffer
    const uploadStream = cloudinary.uploader.upload_stream(result);
    uploadStream.end(req.file.buffer);
    
  } catch (error) {
    console.error('Error submitting form', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;