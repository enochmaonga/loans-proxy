const express = require('express');
const router = express.Router()
const createUserController = require('../controllers/createUserController');

router.post('/',createUserController.handleNewUser);

module.exports = router;