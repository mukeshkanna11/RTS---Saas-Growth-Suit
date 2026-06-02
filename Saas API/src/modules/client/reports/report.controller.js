const reportService = require("./report.service");

exports.createReport = async (
  req,
  res
) => {
  try {
    const report =
      await reportService.createReport(
        req.body,
        req.user
      );

    return res.status(201).json({
      success: true,
      message:
        "Report created successfully",
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReports = async (
  req,
  res
) => {
  try {
    const reports =
      await reportService.getReports(
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReportById = async (
  req,
  res
) => {
  try {
    const report =
      await reportService.getReportById(
        req.params.id,
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteReport = async (
  req,
  res
) => {
  try {
    await reportService.deleteReport(
      req.params.id,
      req.user.tenantId
    );

    return res.status(200).json({
      success: true,
      message:
        "Report deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.exportReport = async (
  req,
  res
) => {
  try {
    const data =
      await reportService.exportReport();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};