// src/models/BotSettings.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BotSettings = sequelize.define('BotSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 10000
  },
  leverage: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  maxRisk: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 2.0
  },
  isLiveTrading: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  botId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId']
    }
  ]
});

// Remove the associate method completely

module.exports = BotSettings;