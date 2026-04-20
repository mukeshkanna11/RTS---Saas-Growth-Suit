// src/modules/company/company.controller.js
const asyncHandler = require("../../utils/asyncHandler");
const service = require("./company.service");

/**
 * Get company info (multi-tenant safe)
 */
exports.getCompany = asyncHandler(async (req, res) => {
  const company = await service.getMyCompany(req.tenantId);

  res.json({
    success: true,
    data: company,
  });
});

/**
 * Update company info
 */
exports.updateCompany = asyncHandler(async (req, res) => {
  const company = await service.updateCompany(req.tenantId, req.body);

  res.json({
    success: true,
    message: "Company updated successfully",
    data: company,
  });
});