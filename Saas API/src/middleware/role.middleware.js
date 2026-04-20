// src/middleware/role.middleware.js
/**
 * Role-based access control middleware
 * @param {string} requiredRole - role required to access route
 */
module.exports = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};