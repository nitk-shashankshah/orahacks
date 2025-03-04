const express = require('express');
const { createClient } = require('../controllers/clientController');

const router = express.Router();

router.post('/add-client', createClient);

module.exports = router;
