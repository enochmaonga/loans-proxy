const { MongoClient } = require('mongodb');
const bcryptjs = require('bcryptjs');


const uri = "mongodb+srv://maongaenoch:P6QpXaBRe8zHA5gI@cluster0.gqnfqjq.mongodb.net/eswadb";

async function initDB() {
  const client = new MongoClient(uri);
  await client.connect();
  const database = client.db('eswadb');
  const collection = database.collection('users');
  const eswadb = {
    users: collection,
  };

  return { client, eswadb };
}

const handleNewUser = async (req, res) => {
  const { firstName, middleName, lastName, email, username, password, phoneNumber, userType } = req.body;

  if (!username || !password || !firstName || !middleName || !lastName|| !email || !phoneNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  let client; // Declare client outside of the try block

  try {
    const { client: initializedClient, eswadb } = await initDB();
    client = initializedClient; // Assign the initialized client to the outer client variable

    // Check for duplicates in the database
    const duplicate = await eswadb.users.findOne({ username: username });
    if (duplicate) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Encrypt the password
    const hashedPwd = await bcryptjs.hash(password, 10);

    // Store the new user with the hashed password
    const newUser = {
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      email: email,
      username: username,
      password: hashedPwd,
      phoneNumber: phoneNumber,
      userType: userType,
    };

    // Insert the new user into the database
    await eswadb.users.insertOne(newUser);

    // Return an array with the new user object
    const newUserArray = [{ firstName, middleName, lastName, email, username, phoneNumber, userType }];
    res.status(201).json(newUserArray);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    // Close the MongoDB connection if it was established
    if (client) {
      await client.close();
    }
  }
};

module.exports = { handleNewUser };