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
    console.log('Backtest started with botId:', botId);

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

    let outputBuffer = '';
    let resultData = '';

    botProcess.stdout.on('data', (data) => {
      const rawData = data.toString();
      console.log('PYTHON RAW OUTPUT:', rawData);
      
      // Add to buffer
      outputBuffer += rawData;

      // Check if we have complete JSON in the buffer
      const jsonMatch = outputBuffer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        console.log('JSON EXTRACTED FROM BUFFER:', jsonString);
        resultData = jsonString;
        
        // Clear buffer after extracting JSON
        outputBuffer = outputBuffer.replace(jsonString, '');
      }

      const bot = backtestProcesses.get(botId);
      if (bot) {
        // Split into lines for logging
        const lines = rawData.split('\n').filter(line => line.trim());
        for (const line of lines) {
          bot.logs.push({
            timestamp: new Date(),
            message: line.trim(),
            type: 'info'
          });
        }
      }
    });

    botProcess.stderr.on('data', (data) => {
      const errorLog = data.toString().trim();
      console.log('PYTHON ERROR:', errorLog);

      const bot = backtestProcesses.get(botId);
      if (bot) {
        bot.logs.push({
          timestamp: new Date(),
          message: errorLog,
          type: 'error'
        });
      }
    });

    botProcess.on('close', async (code) => {
      console.log('=== BACKTEST PROCESS COMPLETED ===');
      console.log('Exit code:', code);
      console.log('Raw result data:', resultData);
      console.log('Result data length:', resultData.length);
      
      const bot = backtestProcesses.get(botId);
      if (bot) {
        bot.status = code === 0 ? 'completed' : 'failed';
        bot.endTime = new Date();

        if (code === 0 && resultData) {
          try {
            console.log('Attempting to parse JSON result...');
            
            // Clean the JSON data - remove any non-printable characters
            const cleanedResultData = resultData.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
            console.log('Cleaned result data:', cleanedResultData);
            
            // Parse the JSON
            const result = JSON.parse(cleanedResultData);
            console.log('Parsed result successfully:', result);

            bot.result = result;

            console.log('Attempting to save to database...');
            console.log('User ID:', userId);

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
            console.error('❌ Error parsing or saving backtest result:', error);
            console.error('Error details:', error.message);
            console.error('Problematic JSON:', resultData);
            
            // Try alternative parsing methods
            try {
              console.log('Trying alternative parsing...');
              
              // Extract just the JSON part using more specific regex
              const jsonMatch = resultData.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const jsonString = jsonMatch[0];
                console.log('Extracted JSON with regex:', jsonString);
                
                const result = JSON.parse(jsonString);
                console.log('Alternative parse successful:', result);
                
                // Save the result
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
                console.log('✅ Backtest result saved after alternative parsing!');
              }
            } catch (altError) {
              console.error('❌ Alternative parsing also failed:', altError);
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

// Test endpoint to verify JSON parsing
exports.testJsonParsing = async (req, res) => {
  try {
    // Test the exact format from your logs
    const testOutput = `==== BACKTEST_RESULT_START ====
{"initialBalance": 10000.0, "finalBalance": 13157.562008099983, "netProfit": 3157.56, "winRate": 76.18, "maxDrawdown": -3.75, "totalTrades": 1956, "winningTrades": 1490, "losingTrades": 463}
==== BACKTEST_RESULT_END ====`;

    console.log('Testing JSON parsing with exact output format...');
    console.log('Test output:', testOutput);
    
    // Use the same extraction method as in the main code
    const jsonMatch = testOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      console.log('Extracted JSON:', jsonString);
      
      const testResult = JSON.parse(jsonString);
      console.log('Test parse successful:', testResult);
      
      res.status(200).json({
        success: true,
        message: 'JSON parsing test successful',
        extracted: jsonString,
        result: testResult
      });
    } else {
      throw new Error('No JSON found in test output');
    }
  } catch (error) {
    console.error('JSON parsing test failed:', error);
    res.status(500).json({
      success: false,
      message: 'JSON parsing test failed',
      error: error.message
    });
  }
};
