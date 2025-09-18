// src/controllers/botController.js
const { spawn } = require('child_process');
const path = require('path');
const BacktestResult = require('../models/BacktestResult');

const backtestProcesses = new Map();

exports.startBacktest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { balance, leverage, period, timeframe } = req.body;

    console.log('Starting backtest for user:', userId, 'with settings:', { balance, leverage, period, timeframe });

    // Validate input
    if (!balance || balance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'موجودی معتبر الزامی است'
      });
    }

    const botId = `backtest-${userId}-${Date.now()}`;
    
    // Start Python backtest process
    const botProcess = spawn('python3', [
      path.join(__dirname, '../../Backend-Bot/backtest.py'),
      '--mode', 'backtest',
      '--balance', balance.toString(),
      '--leverage', leverage.toString(),
      '--user-id', userId.toString(),
      '--period', period || '7',
      '--timeframe', timeframe || '1m'
    ]);

    backtestProcesses.set(botId, {
      process: botProcess,
      userId: userId,
      logs: [],
      status: 'running',
      startTime: new Date(),
      type: 'backtest',
      result: null
    });

    let resultData = '';
    let capturingResult = false;

// In your botController.js, add more debug logging:
botProcess.stdout.on('data', (data) => {
  const log = data.toString().trim();
  console.log('PYTHON OUTPUT:', log); // Add this
  
  if (log) {
    const bot = backtestProcesses.get(botId);
    if (bot) {
      bot.logs.push({
        timestamp: new Date(),
        message: log,
        type: 'info'
      });
      
      // Capture backtest results
      if (log.includes('==== BACKTEST_RESULT_START ====')) {
        capturingResult = true;
        resultData = '';
        console.log('STARTED CAPTURING RESULT'); // Debug
      } else if (log.includes('==== BACKTEST_RESULT_END ====')) {
        capturingResult = false;
        console.log('FINISHED CAPTURING RESULT:', resultData); // Debug
      } else if (capturingResult) {
        resultData += log + '\n';
      }
    }
  }
});

botProcess.stderr.on('data', (data) => {
  const errorLog = data.toString().trim();
  console.log('PYTHON ERROR:', errorLog); // Add this
  // ... rest of error handling
});

// In the botProcess.on('close') handler, add detailed logging:
botProcess.on('close', async (code) => {
  console.log('=== BACKTEST PROCESS COMPLETED ===');
  console.log('Exit code:', code);
  console.log('Raw result data:', resultData);
  
  const bot = backtestProcesses.get(botId);
  if (bot) {
    bot.status = code === 0 ? 'completed' : 'failed';
    bot.endTime = new Date();
    
    if (code === 0 && resultData) {
      try {
        console.log('Cleaning JSON data...');
        
        // Clean the JSON - remove commas and fix any formatting issues
        const cleanedResultData = resultData
          .replace(/,/g, '') // Remove commas from numbers
          .replace(/\n/g, '') // Remove newlines
          .trim();
        
        console.log('Cleaned data:', cleanedResultData);
        
        const result = JSON.parse(cleanedResultData);
        console.log('Parsed result:', result);
        
        bot.result = result;
        
        console.log('Attempting to save to database...');
        console.log('User ID:', userId);
        console.log('Balance:', balance);
        console.log('Leverage:', leverage);
        
        const savedResult = await BacktestResult.create({
          userId: parseInt(userId),
          initialBalance: parseFloat(result.initialBalance),
          finalBalance: parseFloat(result.finalBalance),
          netProfit: parseFloat(result.netProfit),
          winRate: parseFloat(result.winRate),
          maxDrawdown: parseFloat(result.maxDrawdown),
          totalTrades: parseInt(result.totalTrades),
          winningTrades: parseInt(result.winningTrades),
          losingTrades: parseInt(result.losingTrades),
          settings: { 
            balance: parseFloat(balance), 
            leverage: parseInt(leverage), 
            period: period || '7', 
            timeframe: timeframe || '1m' 
          }
        });

        console.log('✅ Backtest result saved successfully!');
        console.log('Saved result ID:', savedResult.id);
        console.log('Saved at:', savedResult.createdAt);
        
      } catch (error) {
        console.error('❌ Error saving backtest result:', error);
        console.error('Error details:', error.message);
        if (error.errors) {
          console.error('Validation errors:', error.errors);
        }
        bot.status = 'failed';
      }
    } else {
      console.log('❌ No result data or process failed');
      console.log('Result data available:', !!resultData);
      console.log('Exit code:', code);
    }

    setTimeout(() => {
      backtestProcesses.delete(botId);
    }, 300000);
  }
});

    res.status(200).json({
      success: true,
      message: 'بک‌تست شروع شد',
      botId: botId
    });

  } catch (error) {
    console.error('Start backtest error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در شروع بک‌تست'
    });
  }
};

exports.getBotStatus = async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = backtestProcesses.get(botId);

    if (!bot) {
      // Check if result exists in database
      try {
        const backtestResult = await BacktestResult.findOne({
          where: { userId: req.user.id },
          order: [['createdAt', 'DESC']]
        });
        
        if (backtestResult) {
          return res.status(200).json({
            success: true,
            bot: {
              id: botId,
              status: 'completed',
              logs: [],
              startTime: backtestResult.createdAt,
              endTime: backtestResult.updatedAt,
              type: 'backtest',
              result: {
                initialBalance: backtestResult.initialBalance,
                finalBalance: backtestResult.finalBalance,
                netProfit: backtestResult.netProfit,
                winRate: backtestResult.winRate,
                maxDrawdown: backtestResult.maxDrawdown,
                totalTrades: backtestResult.totalTrades,
                winningTrades: backtestResult.winningTrades,
                losingTrades: backtestResult.losingTrades
              }
            }
          });
        }
      } catch (dbError) {
        console.error('Database check error:', dbError);
      }
      
      return res.status(404).json({
        success: false,
        message: 'بک‌تست یافت نشد'
      });
    }

    res.status(200).json({
      success: true,
      bot: {
        id: botId,
        status: bot.status,
        logs: bot.logs.slice(-50),
        startTime: bot.startTime,
        endTime: bot.endTime,
        type: bot.type,
        result: bot.result
      }
    });
  } catch (error) {
    console.error('Get backtest status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت وضعیت بک‌تست'
    });
  }
};

exports.stopBot = async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = backtestProcesses.get(botId);

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'بک‌تست یافت نشد'
      });
    }

    bot.process.kill();
    bot.status = 'stopped';
    bot.endTime = new Date();

    res.status(200).json({
      success: true,
      message: 'بک‌تست متوقف شد'
    });
  } catch (error) {
    console.error('Stop backtest error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در توقف بک‌تست'
    });
  }
};