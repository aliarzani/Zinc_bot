// src/controllers/ticketController.js
const { Ticket, TicketResponse } = require('../models/Ticket');

exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const tickets = await Ticket.findAll({
      where: { userId },
      include: [{
        model: TicketResponse,
        as: 'responses',
        order: [['createdAt', 'ASC']]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تیکت‌ها'
    });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, category, priority } = req.body;

    const ticket = await Ticket.create({
      userId,
      title,
      description,
      category,
      priority: priority || 'medium',
      status: 'open'
    });

    res.status(201).json({
      success: true,
      message: 'تیکت با موفقیت ایجاد شد',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد تیکت'
    });
  }
};

exports.addTicketResponse = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Verify the ticket belongs to the user
    const ticket = await Ticket.findOne({
      where: { id: ticketId, userId }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'تیکت یافت نشد'
      });
    }

    const response = await TicketResponse.create({
      ticketId,
      message,
      sender: 'user'
    });

    res.status(201).json({
      success: true,
      message: 'پاسخ ارسال شد',
      response
    });
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال پاسخ'
    });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, userId },
      include: [{
        model: TicketResponse,
        as: 'responses',
        order: [['createdAt', 'ASC']]
      }]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'تیکت یافت نشد'
      });
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تیکت'
    });
  }
};