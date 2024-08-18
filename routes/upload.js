const express = require('express');
const router = express.Router();
const multer = require('multer');
const bucket = require('../firebaseConfig'); // Import Firebase bucket

// Configure multer for file storage
const storage = multer.memoryStorage(); // Use memory storage instead of disk storage

const upload = multer({ storage: storage });

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

    // Upload file to Firebase Storage
    const blob = bucket.file(`${Date.now()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on('error', (err) => {
      console.error('Error uploading file to Firebase Storage', err);
      res.status(500).json({ message: 'Error uploading file' });
    });

    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

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
        filePath: publicUrl,
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

      const result = await collection.insertOne(formData);
      res.status(201).json({ message: 'Form submitted successfully', data: result });
    });

    blobStream.end(req.file.buffer);

  } catch (error) {
    console.error('Error submitting form', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;