const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

router.get('/', async (req, res) => {
  const db = req.app.locals.db; // Access the MongoDB database
  const submissionsCollection = db.collection('submissions'); // Replace 'users' with your actual collection name

  try {
    const submissions = await submissionsCollection.find().toArray();

    if (submissions && Array.isArray(submissions)) {
      res.json(submissions);
    } else {
      res.status(404).json({ error: 'No submissions found' });
    }
  } catch (error) {
    console.error('Error retrieving submissions:', error);
    res.status(500).json({ error: 'Failed to retrieve submissions' });
  }
});

module.exports = router;