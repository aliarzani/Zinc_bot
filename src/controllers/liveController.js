// src/controllers/liveController.js
const { spawn } = require('child_process');
const path = require('path');
const User = require('../models/User');
const BotSettings = require('../models/BotSettings');

const liveBots = new Map();

exports.startLiveTrading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { balance, leverage, maxRisk } = req.body;

    console.log('Starting live trading for user:', userId, 'with settings:', { balance, leverage, maxRisk });

    // Validate input
    if (!balance || balance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'موجودی معتبر الزامی است'
      });
    }

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
        message: 'لطفاً ابتدا کلیدهای API را تنظیم کنید'
      });
    }

    // Update or create bot settings in database
    let botSettings = await BotSettings.findOne({ where: { userId } });
    
    if (!botSettings) {
      botSettings = await BotSettings.create({
        userId,
        balance,
        leverage,
        maxRisk,
        isLiveTrading: true
      });
    } else {
      await botSettings.update({
        balance,
        leverage,
        maxRisk,
        isLiveTrading: true
      });
    }

    // Check if user already has a live bot running
    const existingBot = Array.from(liveBots.values()).find(
      bot => bot.userId === userId && bot.status === 'running'
    );

    if (existingBot) {
      return res.status(400).json({
        success: false,
        message: 'ربات معاملاتی در حال اجرا است. لطفاً ابتدا آن را متوقف کنید.'
      });
    }

    // Pass API keys as environment variables
    const env = {
      ...process.env,
      BITFINEX_PUBLIC_KEY: user.bitfinexPublicKey,
      BITFINEX_SECRET_KEY: user.bitfinexSecretKey
    };

    // Start Python live trading process
    const botProcess = spawn('python3', [
      path.join(__dirname, '../../Backend-Bot/live_trading.py'),
      '--balance', balance.toString(),
      '--leverage', leverage.toString(),
      '--max-risk', maxRisk.toString(),
      '--user-id', userId.toString()
    ], { env });

    const botId = `live-${userId}-${Date.now()}`;
    
    // Save botId to database
    await botSettings.update({ botId });
    
    liveBots.set(botId, {
      process: botProcess,
      userId: userId,
      logs: [],
      status: 'running',
      startTime: new Date(),
      type: 'live',
      settings: { balance, leverage, maxRisk },
      currentPrice: null,
      prediction: null,
      lastSignal: null,
      profit: 0
    });

    // Capture bot output
    botProcess.stdout.on('data', (data) => {
      const log = data.toString().trim();
      if (log) {
        const bot = liveBots.get(botId);
        if (bot) {
          bot.logs.push({
            timestamp: new Date(),
            message: log,
            type: 'info'
          });
          
          // Parse real-time data from logs
          this.parseLiveDataFromLogs(bot, log);
        }
      }
    });

    botProcess.stderr.on('data', (data) => {
      const log = data.toString().trim();
      if (log) {
        const bot = liveBots.get(botId);
        if (bot) {
          bot.logs.push({
            timestamp: new Date(),
            message: log,
            type: 'error'
          });
        }
      }
    });

    botProcess.on('close', async (code) => {
      const bot = liveBots.get(botId);
      if (bot) {
        bot.status = code === 0 ? 'completed' : 'failed';
        bot.endTime = new Date();
        
        // Update database to mark trading as stopped
        await BotSettings.update(
          { isLiveTrading: false, botId: null },
          { where: { userId: bot.userId } }
        );
        
        // Clean up after a while
        setTimeout(() => {
          liveBots.delete(botId);
        }, 300000); // 5 minutes
      }
    });

    res.status(200).json({
      success: true,
      message: 'معاملات زنده شروع شد',
      botId: botId
    });

  } catch (error) {
    console.error('Start live trading error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در شروع معاملات زنده'
    });
  }
};

exports.stopLiveTrading = async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = liveBots.get(botId);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'ربات معاملاتی یافت نشد'
      });
    }

    bot.process.kill();
    bot.status = 'stopped';
    bot.endTime = new Date();

    // Update database to mark trading as stopped
    await BotSettings.update(
      { isLiveTrading: false, botId: null },
      { where: { userId: bot.userId } }
    );

    res.status(200).json({
      success: true,
      message: 'معاملات زنده متوقف شد'
    });
  } catch (error) {
    console.error('Stop live trading error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در توقف معاملات زنده'
    });
  }
};

exports.getLiveBotStatus = async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = liveBots.get(botId);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'ربات معاملاتی یافت نشد'
      });
    }

    res.status(200).json({
      success: true,
      bot: {
        id: botId,
        status: bot.status,
        logs: bot.logs.slice(-50), // Last 50 logs
        startTime: bot.startTime,
        endTime: bot.endTime,
        type: bot.type,
        settings: bot.settings,
        currentPrice: bot.currentPrice,
        prediction: bot.prediction,
        lastSignal: bot.lastSignal,
        profit: bot.profit
      }
    });
  } catch (error) {
    console.error('Get live bot status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت وضعیت ربات'
    });
  }
};

exports.getUserLiveBots = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userBots = Array.from(liveBots.entries())
      .filter(([_, bot]) => bot.userId === userId)
      .map(([botId, bot]) => ({
        id: botId,
        status: bot.status,
        startTime: bot.startTime,
        endTime: bot.endTime,
        type: bot.type,
        settings: bot.settings,
        currentPrice: bot.currentPrice,
        prediction: bot.prediction,
        lastSignal: bot.lastSignal,
        profit: bot.profit
      }));

    res.status(200).json({
      success: true,
      bots: userBots
    });
  } catch (error) {
    console.error('Get user live bots error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت ربات‌های کاربر'
    });
  }
};

exports.parseLiveDataFromLogs = (bot, log) => {
  // Parse BTC price
  const priceMatch = log.match(/BTC Price: \$([\d,]+\.\d{2})/);
  if (priceMatch) {
    bot.currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
  }

  // Parse prediction
  const predictionMatch = log.match(/AI Prediction: ([\d.]+)%/);
  if (predictionMatch) {
    bot.prediction = parseFloat(predictionMatch[1]) / 100;
  }

  // Parse signals
  if (log.includes('STRONG BUY SIGNAL')) {
    bot.lastSignal = 'BUY';
  } else if (log.includes('STRONG SELL SIGNAL')) {
    bot.lastSignal = 'SELL';
  } else if (log.includes('HOLD')) {
    bot.lastSignal = 'HOLD';
  }

  // Parse profit
  const profitMatch = log.match(/Profit: \$([\d.-]+)/);
  if (profitMatch) {
    bot.profit = parseFloat(profitMatch[1]);
  }
};

// Add this function to check running bots on server start
// In the initializeRunningBots function, remove the include
exports.initializeRunningBots = async () => {
  try {
    const runningBots = await BotSettings.findAll({
      where: { isLiveTrading: true }
    });

    console.log(`Found ${runningBots.length} running bots from database`);

    for (const botSetting of runningBots) {
      console.log(`Found running bot for user ${botSetting.userId}, marking as stopped (server was restarted)`);
      // Mark as stopped since the server was restarted
      await botSetting.update({ isLiveTrading: false, botId: null });
    }
  } catch (error) {
    console.error('Error initializing running bots:', error);
  }
};

// Add function to get user bot settings
// Add this to src/controllers/liveController.js
exports.getUserBotSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let botSettings = await BotSettings.findOne({ where: { userId } });
    
    if (!botSettings) {
      // Create default settings if they don't exist
      botSettings = await BotSettings.create({
        userId,
        balance: 1000,
        leverage: 1,
        maxRisk: 2.0,
        isLiveTrading: false
      });
    }

    res.status(200).json({
      success: true,
      settings: {
        balance: botSettings.balance,
        leverage: botSettings.leverage,
        maxRisk: botSettings.maxRisk,
        isLiveTrading: botSettings.isLiveTrading
      }
    });
  } catch (error) {
    console.error('Get user bot settings error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تنظیمات ربات'
    });
  }
};