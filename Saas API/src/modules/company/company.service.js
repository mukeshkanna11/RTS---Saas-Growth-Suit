// src/modules/company/company.service.js
const Company = require("./company.model");

/**
 * Get company by tenantId (multi-tenant safe)
 */
exports.getMyCompany = async (tenantId) => {
  const company = await Company.findOne({ tenantId }).lean(); // lean for faster read
  if (!company) {
    throw new Error("Company not found");
  }
  return company;
};

/**
 * Update company info by tenantId
 */
exports.updateCompany = async (tenantId, data) => {
  const updatedCompany = await Company.findOneAndUpdate(
    { tenantId }, // query by tenantId
    { $set: data }, // only set fields provided
    { new: true, runValidators: true } // return updated doc & validate
  );

  if (!updatedCompany) {
    throw new Error("Company not found or cannot update");
  }
  return updatedCompany;
};