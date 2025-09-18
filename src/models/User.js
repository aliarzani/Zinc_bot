// src/models/User.js - Remove the associate method completely
const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bitfinexPublicKey: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bitfinexSecretKey: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isBotRunning: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Remove the associate method completely

User.prototype.setAPIKeys = function(publicKey, secretKey) {
  return {
    bitfinexPublicKey: publicKey,
    bitfinexSecretKey: secretKey
  };
};

User.prototype.getAPIKeys = function() {
  if (!this.bitfinexPublicKey || !this.bitfinexSecretKey) {
    return null;
  }
  
  return {
    publicKey: this.bitfinexPublicKey,
    secretKey: this.bitfinexSecretKey
  };
};

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;