const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

router.get('/', async (req, res) => {
  const db = req.app.locals.db; // Access the MongoDB database
  const loansCollection = db.collection('loans'); // Replace 'users' with your actual collection name

  try {
    const loans = await loansCollection.find().toArray();

    if (loans && Array.isArray(loans)) {
      res.json(loans);
    } else {
      res.status(404).json({ error: 'No loans found' });
    }
  } catch (error) {
    console.error('Error retrieving loans:', error);
    res.status(500).json({ error: 'Failed to retrieve loans' });
  }
});

module.exports = router;