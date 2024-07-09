const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ObjectId } = require('mongodb');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Handle form submission with file uploads
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

    // Calculate interest due date
    const interestDueDate = calculateInterestDueDate(createdAt);

    // Define formData here
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
      filePath: req.file.path,
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

    // Calculate interest immediately
    formData.interestAmount = calculateInterest(formData.loanAmount);

    const result = await collection.insertOne(formData);
    res.status(201).json({ message: 'Form submitted successfully', data: result });
  } catch (error) {
    console.error('Error submitting form', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Function to calculate interest immediately
function calculateInterest(loanAmount) {
  const interestRate = 0.10; // 10% immediate interest
  const interestAmount = loanAmount * interestRate;
  return interestAmount;
}

// Function to calculate interest due date
function calculateInterestDueDate(createdAt) {
  const interestDueDate = new Date(createdAt);
  interestDueDate.setDate(interestDueDate.getDate() + 30);
  return interestDueDate;
}

module.exports = router;