// src/controllers/backtestResultController.js
const BacktestResult = require('../models/BacktestResult');

exports.getUserBacktestResults = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const results = await BacktestResult.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.status(200).json({
      success: true,
      results: results || []
    });
  } catch (error) {
    console.error('Get backtest results error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت نتایج بک‌تست'
    });
  }
};