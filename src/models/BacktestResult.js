// src/models/BacktestResult.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BacktestResult = sequelize.define('BacktestResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  initialBalance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  finalBalance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  netProfit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  winRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  maxDrawdown: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  totalTrades: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  winningTrades: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  losingTrades: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: false
  }
});

// Add associations
BacktestResult.associate = function(models) {
  BacktestResult.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = BacktestResult;