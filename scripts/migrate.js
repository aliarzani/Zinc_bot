const sequelize = require('./src/config/database');
const User = require('./src/models/User');

async function migrate() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models with force:true to drop and recreate tables
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
