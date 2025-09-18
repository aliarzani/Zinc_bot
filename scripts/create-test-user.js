// scripts/create-test-user.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../src/config/database');
const User = require('../src/models/User');

async function createTestUser() {
  try {
    console.log('🔄 Attempting to connect to database...');
    
    // Test connection with retries
    let connected = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!connected && attempts < maxAttempts) {
      try {
        await sequelize.authenticate();
        connected = true;
        console.log('✅ Database connected successfully');
      } catch (error) {
        attempts++;
        console.log(`⏳ Database connection attempt ${attempts}/${maxAttempts} failed, retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (!connected) {
      throw new Error('Could not connect to database after multiple attempts');
    }

    // Sync models
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: false });
    console.log('✅ Database synced');

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (existingUser) {
      console.log('ℹ️ Test user already exists:', existingUser.email);
    } else {
      // Create test user
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Test user created:', testUser.email);
    }

    // Get the user (whether newly created or existing)
    const user = await User.findOne({ where: { email: 'test@example.com' } });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-this-in-production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log('✅ JWT Token:', token);
    console.log('\n📋 You can use this token for testing API endpoints:');
    console.log('Authorization: Bearer ' + token);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Make sure PostgreSQL is running: docker-compose up -d postgres');
  } finally {
    await sequelize.close();
  }
}

createTestUser();