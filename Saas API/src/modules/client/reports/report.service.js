const ClientReport = require("./client-report.model");

exports.createReport = async (
  data,
  user
) => {
  return await ClientReport.create({
    tenantId: user.tenantId,
    reportName: data.reportName,
    reportType: data.reportType,
    status: data.status || "ready",
    fileUrl: data.fileUrl || null,
    createdBy: user.id,
  });
};

exports.getReports = async (
  tenantId
) => {
  return await ClientReport.find({
    tenantId,
    isDeleted: false,
  }).sort({
    createdAt: -1,
  });
};

exports.getReportById = async (
  id,
  tenantId
) => {
  return await ClientReport.findOne({
    _id: id,
    tenantId,
    isDeleted: false,
  });
};

exports.deleteReport = async (
  id,
  tenantId
) => {
  return await ClientReport.findOneAndUpdate(
    {
      _id: id,
      tenantId,
    },
    {
      isDeleted: true,
    },
    {
      new: true,
    }
  );
};

exports.exportReport = async () => {
  return {
    downloadUrl:
      "/exports/monthly-report.pdf",
  };
};