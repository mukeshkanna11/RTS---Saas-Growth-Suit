const router = require("express").Router();

const ctrl = require("./support.controller");

const {
  protect,
  authorize,
} = require(
  "../../../middleware/auth.middleware"
);

/**
 * ======================================================
 * CLIENT ROUTES
 * ======================================================
 */

// Create Support Ticket
router.post(
  "/contact",
  protect,
  ctrl.createTicket
);

// Get Logged-in Client Tickets
router.get(
  "/my-tickets",
  protect,
  ctrl.getMyTickets
);

/**
 * ======================================================
 * ADMIN ROUTES
 * ======================================================
 */

// Get All Support Tickets
router.get(
  "/admin/tickets",
  protect,
  authorize("admin"),
  ctrl.getAllTickets
);

// Get Single Ticket
router.get(
  "/admin/tickets/:id",
  protect,
  authorize("admin"),
  ctrl.getTicketById
);

// Reply To Ticket
router.post(
  "/admin/tickets/:id/reply",
  protect,
  authorize("admin"),
  ctrl.replyTicket
);

// Mark Ticket As Resolved
router.patch(
  "/admin/tickets/:id/resolve",
  protect,
  authorize("admin"),
  ctrl.resolveTicket
);

// Support Dashboard Stats
router.get(
  "/admin/stats",
  protect,
  authorize("admin"),
  ctrl.getTicketStats
);

module.exports = router;