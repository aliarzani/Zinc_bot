// src/routes/apiKeys.js
const express = require('express');
const { saveAPIKeys, getAPIKeys, deleteAPIKeys } = require('../controllers/apiKeyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/keys', protect, saveAPIKeys);
router.get('/keys', protect, getAPIKeys);
router.delete('/keys', protect, deleteAPIKeys);

module.exports = router;