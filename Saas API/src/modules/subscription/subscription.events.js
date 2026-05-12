const EventEmitter = require("events");

class SubscriptionEvents extends EventEmitter {}

module.exports = new SubscriptionEvents();