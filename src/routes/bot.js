// src/routes/bot.js
const express = require('express');
const { startBacktest, getBotStatus, stopBot } = require('../controllers/botController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/backtest/start', protect, startBacktest);
router.get('/backtest/status/:botId', protect, getBotStatus);
router.post('/backtest/stop/:botId', protect, stopBot);

module.exports = router;