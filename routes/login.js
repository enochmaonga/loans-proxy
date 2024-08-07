const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config(); // Load environment variables

// Define a Mongoose model for your user collection
const User = mongoose.model('User', {
  username: String,
  password: String,
  userType: String,
});

mongoose.connect('mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/eswadb', { useNewUrlParser: true, useUnifiedTopology: true });

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  console.log("Login", req.body);

  try {
    // Search for the user in the database
    const user = await User.findOne({ username: { $regex: new RegExp(username, 'i') } });

    if (!user) {
      // User not found
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if the provided password matches the stored hashed password
    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (passwordMatch) {
      // Generate a JWT token and send it back to the client
      const token = jwt.sign({ username: user.username, userType: user.userType }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      // Log successful login details
      console.log('User login successful:', { username: user.username, token });

      // Send token and user details back to the client
      return res.json({ token, username: user.username, userId: user._id });
    } else {
      // Passwords did not match
      return res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;