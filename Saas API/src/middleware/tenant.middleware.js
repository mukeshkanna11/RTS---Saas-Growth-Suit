// module.exports = function tenantMiddleware(req, res, next) {
//   try {
//     // 🔐 Ensure user exists (must come after auth middleware)
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized - No user found",
//       });
//     }

//     // 🏢 Ensure companyId exists (multi-tenant check)
//     if (!req.user.companyId) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied - No company assigned",
//       });
//     }

//     // ✅ Attach tenant info globally
//     req.tenantId = req.user.companyId;

//     // (optional) normalize for DB queries
//     req.query.companyId = req.user.companyId;

//     next();
//   } catch (error) {
//     console.error("Tenant Middleware Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Tenant middleware failure",
//     });
//   }
// };