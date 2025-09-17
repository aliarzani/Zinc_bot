const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine database URL based on environment
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // For Docker environment
  if (process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV) {
    return 'postgresql://zinkuser:zinkpassword@postgres:5432/zinkbot';
  }
  
  // For local development without Docker
  return 'postgresql://zinkuser:zinkpassword@localhost:5432/zinkbot';
};

const sequelize = new Sequelize(getDatabaseUrl(), {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 5,
    timeout: 60000,
    backoffBase: 1000,
    backoffExponent: 1.5,
  }
});

module.exports = sequelize;
