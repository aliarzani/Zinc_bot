// migrate-tickets.js
const path = require('path');
const sequelize = require(path.join(__dirname, '../src/config/database'));

async function migrateTickets() {
  try {
    console.log('Starting ticket migration...');
    
    // Test the connection first
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if Users table exists (since we reference it)
    const usersTableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Users'
      )
    `);
    
    if (!usersTableExists[0][0].exists) {
      console.log('Warning: Users table does not exist. Creating it first...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Users" (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created successfully.');
    }

    // Create Ticket table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Tickets" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(255) NOT NULL,
        priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        status VARCHAR(15) CHECK (status IN ('open', 'in-progress', 'closed')) DEFAULT 'open',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tickets table created successfully.');

    // Create TicketResponses table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "TicketResponses" (
        id SERIAL PRIMARY KEY,
        "ticketId" INTEGER NOT NULL REFERENCES "Tickets"(id) ON UPDATE CASCADE ON DELETE CASCADE,
        message TEXT NOT NULL,
        sender VARCHAR(10) CHECK (sender IN ('user', 'support')) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('TicketResponses table created successfully.');

    // Create indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS "Tickets_userId_idx" ON "Tickets"("userId")');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "Tickets_status_idx" ON "Tickets"(status)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "Tickets_priority_idx" ON "Tickets"(priority)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS "TicketResponses_ticketId_idx" ON "TicketResponses"("ticketId")');
    console.log('Indexes created successfully.');

    console.log('Ticket migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await sequelize.close();
  }
}

migrateTickets();