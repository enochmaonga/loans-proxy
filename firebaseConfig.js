const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const serviceAccount = require('./serviceAccount.json'); // Download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'eswa-cb695.appspot.com'
});

const bucket = getStorage().bucket();

module.exports = bucket;