// src/controllers/backtestController.js
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

    botProcess.stdout.on('data', (data) => {
      const log = data.toString().trim();
      if (log) {
        const bot = backtestProcesses.get(botId);
        if (bot) {
          bot.logs.push({
            timestamp: new Date(),
            message: log,
            type: 'info'
          });
          
          // Capture backtest results
          if (log.includes('==== Backtest Report ====')) {
            resultData = '';
          } else if (log.trim() && !log.includes('==== Classification Report ====')) {
            resultData += log + '\n';
          }
        }
      }
    });

    botProcess.stderr.on('data', (data) => {
      const log = data.toString().trim();
      if (log) {
        const bot = backtestProcesses.get(botId);
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
      const bot = backtestProcesses.get(botId);
      if (bot) {
        bot.status = code === 0 ? 'completed' : 'failed';
        bot.endTime = new Date();
        
        if (code === 0) {
          // Parse and save backtest results
          const result = this.parseBacktestResult(resultData);
          bot.result = result;
          
          // Save to database
          await BacktestResult.create({
            userId,
            initialBalance: result.initialBalance,
            finalBalance: result.finalBalance,
            netProfit: result.netProfit,
            winRate: result.winRate,
            maxDrawdown: result.maxDrawdown,
            totalTrades: result.totalTrades,
            winningTrades: result.winningTrades,
            losingTrades: result.losingTrades,
            settings: { balance, leverage, period, timeframe }
          });
        }
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

exports.parseBacktestResult = (resultData) => {
  const result = {};
  const lines = resultData.split('\n');
  
  lines.forEach(line => {
    if (line.includes('Initial Balance:')) {
      result.initialBalance = parseFloat(line.split(':')[1].trim());
    } else if (line.includes('Final Balance:')) {
      result.finalBalance = parseFloat(line.split(':')[1].trim());
    } else if (line.includes('Net Profit:')) {
      result.netProfit = parseFloat(line.split(':')[1].trim());
    } else if (line.includes('Win Rate:')) {
      result.winRate = parseFloat(line.split(':')[1].replace('%', '').trim());
    } else if (line.includes('Max Drawdown:')) {
      result.maxDrawdown = parseFloat(line.split(':')[1].replace('%', '').trim());
    } else if (line.includes('Total Trades:')) {
      result.totalTrades = parseInt(line.split(':')[1].trim());
    } else if (line.includes('Winning Trades:')) {
      result.winningTrades = parseInt(line.split(':')[1].trim());
    } else if (line.includes('Losing Trades:')) {
      result.losingTrades = parseInt(line.split(':')[1].trim());
    }
  });
  
  return result;
};

exports.getBacktestStatus = async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = backtestProcesses.get(botId);

    if (!bot) {
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

exports.stopBacktest = async (req, res) => {
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