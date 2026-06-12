const SupportTicket = require("../models/supportTicket.model");
const EmailService = require("../../../services/email.service");

/**
 * ======================================================
 * CLIENT CREATE SUPPORT REQUEST
 * ======================================================
 */
exports.createTicket = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your message",
      });
    }

    const ticket = await SupportTicket.create({
      clientId: req.user.id,
      name: req.user.name,
      email: req.user.email,
      message,
      status: "NEW",
    });

    // Send support request to company
    await EmailService.sendSupportRequest({
      ticketId: ticket._id,
      clientName: req.user.name,
      clientEmail: req.user.email,
      message,
    });

    // Send confirmation email to client
    await EmailService.sendSupportConfirmation({
      email: req.user.email,
      name: req.user.name,
    });

    return res.status(201).json({
      success: true,
      message:
        "Thank you for contacting ReadyTech Solutions. Our team will reach out within 24 hours.",
      data: ticket,
    });
  } catch (err) {
    console.error(
      "CREATE SUPPORT ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit support request",
    });
  }
};

/**
 * ======================================================
 * CLIENT VIEW OWN TICKETS
 * ======================================================
 */
exports.getMyTickets = async (
  req,
  res
) => {
  try {
    const tickets =
      await SupportTicket.find({
        clientId: req.user.id,
      }).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (err) {
    console.error(
      "GET MY TICKETS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ======================================================
 * ADMIN VIEW ALL TICKETS
 * ======================================================
 */
exports.getAllTickets = async (
  req,
  res
) => {
  try {
    const tickets =
      await SupportTicket.find()
        .populate(
          "clientId",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

    return res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (err) {
    console.error(
      "GET ALL TICKETS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ======================================================
 * ADMIN VIEW SINGLE TICKET
 * ======================================================
 */
exports.getTicketById =
  async (req, res) => {
    try {
      const ticket =
        await SupportTicket.findById(
          req.params.id
        ).populate(
          "clientId",
          "name email"
        );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Support ticket not found",
        });
      }

      return res.json({
        success: true,
        data: ticket,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

/**
 * ======================================================
 * ADMIN REPLY
 * ======================================================
 */
exports.replyTicket = async (
  req,
  res
) => {
  try {
    const { reply } = req.body;

    if (!reply?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Reply message is required",
      });
    }

    const ticket =
      await SupportTicket.findById(
        req.params.id
      );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message:
          "Support request not found",
      });
    }

    ticket.adminReply = reply;

    ticket.status =
      "IN_PROGRESS";

    ticket.repliedAt =
      new Date();

    await ticket.save();

    // Email reply to client
    await EmailService.sendSupportReply({
      email: ticket.email,
      name: ticket.name,
      reply,
    });

    return res.json({
      success: true,
      message:
        "Reply sent successfully",
      data: ticket,
    });
  } catch (err) {
    console.error(
      "REPLY TICKET ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * ======================================================
 * MARK AS RESOLVED
 * ======================================================
 */
exports.resolveTicket =
  async (req, res) => {
    try {
      const ticket =
        await SupportTicket.findById(
          req.params.id
        );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Support request not found",
        });
      }

      ticket.status =
        "RESOLVED";

      ticket.resolvedAt =
        new Date();

      await ticket.save();

      return res.json({
        success: true,
        message:
          "Ticket marked as resolved",
        data: ticket,
      });
    } catch (err) {
      console.error(
        "RESOLVE TICKET ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

/**
 * ======================================================
 * ADMIN DASHBOARD STATS
 * ======================================================
 */
exports.getTicketStats =
  async (req, res) => {
    try {
      const total =
        await SupportTicket.countDocuments();

      const open =
        await SupportTicket.countDocuments(
          {
            status: "NEW",
          }
        );

      const inProgress =
        await SupportTicket.countDocuments(
          {
            status:
              "IN_PROGRESS",
          }
        );

      const resolved =
        await SupportTicket.countDocuments(
          {
            status: "RESOLVED",
          }
        );

      return res.json({
        success: true,
        data: {
          total,
          open,
          inProgress,
          resolved,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };