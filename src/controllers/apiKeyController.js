// src/controllers/apiKeyController.js - Simplified without encryption
const User = require('../models/User');

exports.saveAPIKeys = async (req, res) => {
  try {
    const { publicKey, secretKey } = req.body;
    const userId = req.user.id;

    console.log('Saving API keys for user:', userId);

    if (!publicKey || !secretKey) {
      return res.status(400).json({
        success: false,
        message: 'Public key and secret key are required'
      });
    }

    // Basic validation
    if (publicKey.trim().length < 5 || secretKey.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'API keys are too short'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Simply store the keys directly
    await user.update({
      bitfinexPublicKey: publicKey.trim(),
      bitfinexSecretKey: secretKey.trim()
    });

    console.log('API keys saved successfully for user:', userId);

    res.status(200).json({
      success: true,
      message: 'API keys saved successfully'
    });
  } catch (error) {
    console.error('Save API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getAPIKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.bitfinexPublicKey || !user.bitfinexSecretKey) {
      return res.status(200).json({
        success: true,
        hasKeys: false,
        keys: null
      });
    }

    res.status(200).json({
      success: true,
      hasKeys: true,
      keys: {
        publicKey: user.bitfinexPublicKey,
        secretKey: '••••••••' + user.bitfinexSecretKey.slice(-4) // Show last 4 chars for verification
      }
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deleteAPIKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Simply clear the key fields
    await user.update({
      bitfinexPublicKey: null,
      bitfinexSecretKey: null,
      isBotRunning: false
    });

    res.status(200).json({
      success: true,
      message: 'API keys deleted successfully'
    });
  } catch (error) {
    console.error('Delete API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};