// create-tables.js
const sequelize = require('./src/config/database');
const { DataTypes } = require('sequelize');

async function createTables() {
  try {
    console.log('Creating missing tables...');
    
    // Create BacktestResult table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "BacktestResults" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE CASCADE,
        "initialBalance" DECIMAL(15,2) NOT NULL,
        "finalBalance" DECIMAL(15,2) NOT NULL,
        "netProfit" DECIMAL(15,2) NOT NULL,
        "winRate" DECIMAL(5,2) NOT NULL,
        "maxDrawdown" DECIMAL(5,2) NOT NULL,
        "totalTrades" INTEGER NOT NULL,
        "winningTrades" INTEGER NOT NULL,
        "losingTrades" INTEGER NOT NULL,
        settings JSONB NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Tickets table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Tickets" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(255) NOT NULL,
        priority VARCHAR(10) DEFAULT 'medium',
        status VARCHAR(15) DEFAULT 'open',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create TicketResponses table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TicketResponses" (
        id SERIAL PRIMARY KEY,
        "ticketId" INTEGER NOT NULL REFERENCES "Tickets"(id) ON UPDATE CASCADE ON DELETE CASCADE,
        message TEXT NOT NULL,
        sender VARCHAR(10) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "BacktestResults_userId_idx" ON "BacktestResults"("userId")');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "Tickets_userId_idx" ON "Tickets"("userId")');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "TicketResponses_ticketId_idx" ON "TicketResponses"("ticketId")');

    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await sequelize.close();
  }
}

createTables();