module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "RBAC error"
      });
    }
  };
};