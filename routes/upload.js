const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { ObjectId } = require("mongodb");

// Function to calculate interest (define this too if necessary)
const calculateInterest = (loanAmount) => {
  const interestRate = 0.05; // Example: 5% interest rate
  return loanAmount * interestRate;
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Set in your environment variables
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Add the function above the route or where it's needed
const calculateInterestDueDate = (createdAt) => {
  const interestPeriod = 30; // Example: 30 days after loan creation
  const dueDate = new Date(createdAt);
  dueDate.setDate(dueDate.getDate() + interestPeriod);
  return dueDate;
};

// File submission route
router.post("/submit", upload.single("file"), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const collection = db.collection("submissions");

    const createdAt = new Date();
    const formattedCreatedAt = createdAt.toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    const interestDueDate = calculateInterestDueDate(createdAt);

    // Upload file to Cloudinary using stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "uploads",
        allowed_formats: ["jpg", "png", "pdf", "docx"],
      },
      async (error, result) => {
        if (error) {
          console.error("Error uploading file to Cloudinary", error);
          return res.status(500).json({ message: "Error uploading file" });
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
          interestDueDate: interestDueDate.toLocaleString("en-US", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
        };

        formData.interestAmount = calculateInterest(formData.loanAmount);

        console.log("Database connection:", db);
        console.log("Collection:", collection);

        const dbResult = await collection.insertOne(formData);
        res
          .status(201)
          .json({ message: "Form submitted successfully", data: dbResult });
      }
    );

    // Start the upload by streaming the file buffer
    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    res
      .status(500)
      .json({ message: "Error uploading file to Cloudinary", error });
  }
});

// Route to fetch all submitted documents
router.get("/documents", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const collection = db.collection("submissions");

    // Retrieve all documents from the "submissions" collection
    const documents = await collection.find().toArray();

    if (!documents.length) {
      return res.status(404).json({ message: "No documents found" });
    }

    // Send the documents as the response
    res
      .status(200)
      .json({ message: "Documents retrieved successfully", data: documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Error fetching documents", error });
  }
});
// Route to view a file by its URL
router.get("/view/:public_id", (req, res) => {
  const publicId = req.params.public_id;
  const fileUrl = cloudinary.url(publicId);
  res.redirect(fileUrl);
});

module.exports = router;
