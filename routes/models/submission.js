const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  firstName: String,
  middleName: String,
  lastName: String,
  idNumber: Number,
  email: String,
  phoneNumber: Number,
  residentialAddress: String,
  loanAmount: Number,
  repaymentPeriod: Number,
  placeOfWork: String,
  purpose: String,
  loanSecurity: String,
  guarantorFirstName: String,
  guarantorLastName: String,
  guarantorId: Number,
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;