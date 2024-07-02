const express = require('express');
const router = express.Router()
const newloanController = require('../controllers/newloanControllers');

router.post('/',newloanController.handleNewLoan);

module.exports = router;