// src/routes/bot.js
const express = require('express');
const { startBacktest, getBotStatus, stopBot } = require('../controllers/botController');
const { 
  startLiveTrading, 
  stopLiveTrading, 
  getLiveBotStatus,
  getUserLiveBots,
  getUserBotSettings  // Make sure this function exists in liveController
} = require('../controllers/liveController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Backtest routes
router.post('/backtest/start', protect, startBacktest);
router.get('/backtest/status/:botId', protect, getBotStatus);
router.post('/backtest/stop/:botId', protect, stopBot);

// Live trading routes
router.post('/live/start', protect, startLiveTrading);
router.get('/live/status/:botId', protect, getLiveBotStatus);
router.post('/live/stop/:botId', protect, stopLiveTrading);
router.get('/live/bots', protect, getUserLiveBots);
router.get('/live/settings', protect, getUserBotSettings); // Use the controller function

module.exports = router;