const app = require('./app');
const sequelize = require('./config/database');
const { initializeRunningBots } = require('./controllers/liveController');

const PORT = process.env.PORT || 3001;

// Function to test database connection with retries
const testConnection = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to database (attempt ${i + 1}/${retries})...`);
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      return true;
    } catch (error) {
      console.error(`Database connection failed (attempt ${i + 1}/${retries}):`, error.message);
      
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

// Sync database and start server
const startServer = async () => {
  try {
    // Test database connection with retries
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Unable to connect to database after multiple attempts');
      process.exit(1);
    }

    // Sync models
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

    // Initialize running bots (check database for any bots that were running before server restart)
    await initializeRunningBots();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();