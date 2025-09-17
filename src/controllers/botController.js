// src/controllers/botController.js - Simplified
const { spawn } = require('child_process');
const path = require('path');
const User = require('../models/User');

const activeBots = new Map();

exports.startBacktest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { balance = 10000, leverage = 1 } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has API keys
    if (!user.bitfinexPublicKey || !user.bitfinexSecretKey) {
      return res.status(400).json({
        success: false,
        message: 'Please set API keys first'
      });
    }

    // Pass API keys as environment variables
    const env = {
      ...process.env,
      BITFINEX_PUBLIC_KEY: user.bitfinexPublicKey,
      BITFINEX_SECRET_KEY: user.bitfinexSecretKey
    };

    const botProcess = spawn('python3', [
      path.join(__dirname, '../../Backend-Bot/backtest.py'),
      '--balance', balance.toString(),
      '--leverage', leverage.toString(),
      '--user-id', userId
    ], { env });

    const botId = `${userId}-${Date.now()}`;
    
    activeBots.set(botId, {
      process: botProcess,
      userId: userId,
      logs: [],
      status: 'running',
      startTime: new Date()
    });

    botProcess.stdout.on('data', (data) => {
      const log = data.toString().trim();
      if (log) {
        const bot = activeBots.get(botId);
        if (bot) {
          bot.logs.push({
            timestamp: new Date(),
            message: log,
            type: 'info'
          });
        }
      }
    });

    botProcess.stderr.on('data', (data) => {
      const log = data.toString().trim();
      if (log) {
        const bot = activeBots.get(botId);
        if (bot) {
          bot.logs.push({
            timestamp: new Date(),
            message: log,
            type: 'error'
          });
        }
      }
    });

    botProcess.on('close', (code) => {
      const bot = activeBots.get(botId);
      if (bot) {
        bot.status = code === 0 ? 'completed' : 'failed';
        bot.endTime = new Date();
        
        // Clean up after a while
        setTimeout(() => {
          activeBots.delete(botId);
        }, 300000);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Backtest started',
      botId: botId
    });

  } catch (error) {
    console.error('Start backtest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ... keep the rest of botController.js the same ...

exports.getBotStatus = async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = activeBots.get(botId);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found'
      });
    }

    res.status(200).json({
      success: true,
      bot: {
        id: botId,
        status: bot.status,
        logs: bot.logs.slice(-50),
        startTime: bot.startTime,
        endTime: bot.endTime
      }
    });
  } catch (error) {
    console.error('Get bot status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.stopBot = async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = activeBots.get(botId);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found'
      });
    }

    bot.process.kill();
    bot.status = 'stopped';
    bot.endTime = new Date();

    res.status(200).json({
      success: true,
      message: 'Bot stopped'
    });
  } catch (error) {
    console.error('Stop bot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};