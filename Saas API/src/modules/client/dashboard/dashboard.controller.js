const dashboardService = require("./dashboard.service");

exports.getDashboard = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const dashboard =
      await dashboardService.getDashboardData(
        tenantId
      );

    return res.status(200).json({
      success: true,
      message:
        "Dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    console.error(
      "DASHBOARD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to load dashboard",
    });
  }
};