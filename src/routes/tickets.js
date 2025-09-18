// src/routes/tickets.js
const express = require('express');
const { 
  getUserTickets, 
  createTicket, 
  addTicketResponse, 
  getTicket 
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all tickets for user
router.get('/', protect, getUserTickets);

// Create new ticket
router.post('/', protect, createTicket);

// Add response to ticket
router.post('/:ticketId/responses', protect, addTicketResponse);

// Get single ticket
router.get('/:ticketId', protect, getTicket);

module.exports = router;