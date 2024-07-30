const express = require("express");
const verifyJWT = require("./middleware/verifyJWT");
const app = express();
const cookieParser = require("cookie-parser");
const wrapResponse = require("./middleware/wrapResponse");
const port = process.env.PORT || 4001;
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bodyParser = require('body-parser');
const path = require('path');


// CORS configuration
app.use(cors({
  origin: 'https://loan-lovat.vercel.app/',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Assuming your files are stored in a directory named 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Increase payload size limit
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(wrapResponse);
// app.use('/uploads', express.static('uploads'));
app.use("/login", require("./routes/login"));
app.use("/newuser", require("./routes/newuser"));
app.use("/users", require("./routes/users"));
app.use("/upload", require("./routes/upload"));
app.use("/applications", require("./routes/applications"));


const url = "mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/eswadb";

const client = new MongoClient(url);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Set a reference to your MongoDB database
    app.locals.db = client.db();

    // Start your Express server after connecting to MongoDB
    app.listen(port, () => {
      console.log(`ESWA listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
}


connectToMongoDB();