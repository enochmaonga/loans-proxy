const { MongoClient } = require('mongodb');
const multer = require('multer');
const path = require('path');
const express = require('express');
const app = express();

app.use(express.json());

const uri = 'mongodb://127.0.0.1:27017/eswadb';
const client = new MongoClient(uri);

// Multer configuration
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: fileStorageEngine }).fields([
  { name: 'applicantIdAttachment', maxCount: 1 },
  { name: 'guarantorIdAttachment', maxCount: 1 },
  { name: 'loanSecurityAttachment', maxCount: 1 },
]);

// Initialize MongoDB connection
async function initDB() {
  try {
    await client.connect();
    console.log('MongoDB connection established');
    const database = client.db('eswadb');
    const loansCollection = database.collection('loans');
    return loansCollection;
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    throw err;
  }
}

// Check for duplicate entry
async function isEntryDuplicate(loansCollection, loans) {
  const existingEntry = await loansCollection.findOne({
    firstName: loans.firstName,
    middleName: loans.middleName,
    lastName: loans.lastName,
    idNumber: loans.idNumber,
    email: loans.email,
    phoneNumber: loans.phoneNumber,
    residentialAddress: loans.residentialAddress,
    loanAmount: loans.loanAmount,
    repaymentPeriod: loans.repaymentPeriod,
    placeOfWork: loans.placeOfWork,
    purpose: loans.purpose,
    loanSecurity: loans.loanSecurity,
    guarantorFirstName: loans.guarantorFirstName,
    guarantorLastName: loans.guarantorLastName,
    guarantorId: loans.guarantorId,
  });

  return existingEntry !== null;
}

// Handle new loan request
const handleNewLoan = async (req, res) => {
  const loansCollection = await initDB();
  try {
    const {
      firstName,
      middleName,
      lastName,
      idNumber,
      email,
      phoneNumber,
      residentialAddress,
      loanAmount,
      repaymentPeriod,
      placeOfWork,
      purpose,
      loanSecurity,
      guarantorFirstName,
      guarantorLastName,
      guarantorId,
    } = req.body;

    if (
      !firstName || !middleName || !lastName || !idNumber || !email ||
      !phoneNumber || !residentialAddress || !loanAmount || !repaymentPeriod ||
      !placeOfWork || !purpose || !loanSecurity || !guarantorFirstName ||
      !guarantorLastName || !guarantorId ||
      !req.files['applicantIdAttachment'] || !req.files['guarantorIdAttachment'] || !req.files['loanSecurityAttachment']
    ) {
      console.error('Validation error: All fields are required');
      console.log('Received Data:', req.body);
      return res.status(400).json({ message: 'All fields are required' });
    }

    const loans = {
      firstName,
      middleName,
      lastName,
      idNumber,
      email,
      phoneNumber,
      residentialAddress,
      loanAmount,
      repaymentPeriod,
      placeOfWork,
      purpose,
      loanSecurity,
      guarantorFirstName,
      guarantorLastName,
      guarantorId,
      applicantIdAttachment: req.files['applicantIdAttachment'][0].path,
      guarantorIdAttachment: req.files['guarantorIdAttachment'][0].path,
      loanSecurityAttachment: req.files['loanSecurityAttachment'][0].path,
      createdAt: new Date(),
    };

    // Check for duplicate entry
    const isDuplicated = await isEntryDuplicate(loansCollection, loans);
    if (isDuplicated) {
      return res.status(400).json({ success: false, message: 'Duplicate entry detected', errorType: 'duplicate' });
    }

    // Insert the new loan into the database
    await loansCollection.insertOne(loans);
    console.log('New entry inserted into the database');

    // Return success response
    res.status(201).json({ success: true, message: 'Entry created successfully' });
  } catch (err) {
    console.error('Error processing new entry:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error', errorType: 'internal_error' });
  }
};

module.exports = { handleNewLoan };