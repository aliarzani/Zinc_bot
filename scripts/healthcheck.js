const sequelize = require('./src/config/database');

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('Checking database health...');
  const isHealthy = await checkDatabase();
  process.exit(isHealthy ? 0 : 1);
}

main();
