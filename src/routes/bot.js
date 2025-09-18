// src/routes/bot.js
const express = require('express');
const { startBacktest, getBotStatus, stopBot } = require('../controllers/botController');
const { 
  startLiveTrading, 
  stopLiveTrading, 
  getLiveBotStatus,
  getUserLiveBots,
  getUserBotSettings
} = require('../controllers/liveController');
const { getUserBacktestResults } = require('../controllers/backtestResultController'); // Add this
const { 
  getUserTickets, 
  createTicket, 
  addTicketResponse, 
  getTicket 
} = require('../controllers/ticketController'); // Add this
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
router.get('/live/settings', protect, getUserBotSettings);

// Backtest results route - ADD THIS
router.get('/backtest/results', protect, getUserBacktestResults);

// Ticket routes - ADD THESE
router.get('/tickets', protect, getUserTickets);
router.post('/tickets', protect, createTicket);
router.post('/tickets/:ticketId/responses', protect, addTicketResponse);
router.get('/tickets/:ticketId', protect, getTicket);

module.exports = router;