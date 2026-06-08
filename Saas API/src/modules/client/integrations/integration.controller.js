const integrationService =
  require("./integration.service");

exports.connect =
  async (req, res) => {
    try {
      const data =
        await integrationService.connectIntegration(
          req.user.tenantId,
          req.user.id,
          req.body
        );

      res.status(200).json({
        success: true,
        message:
          "Integration connected successfully",
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

exports.getAll =
  async (req, res) => {
    try {
      const data =
        await integrationService.getIntegrations(
          req.user.tenantId
        );

      res.status(200).json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

exports.getOne =
  async (req, res) => {
    try {
      const data =
        await integrationService.getIntegrationById(
          req.params.id,
          req.user.tenantId
        );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

exports.disconnect =
  async (req, res) => {
    try {
      const data =
        await integrationService.disconnectIntegration(
          req.params.id,
          req.user.tenantId
        );

      res.status(200).json({
        success: true,
        message:
          "Integration disconnected",
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

exports.updateSettings =
  async (req, res) => {
    try {
      const data =
        await integrationService.updateSettings(
          req.params.id,
          req.user.tenantId,
          req.body
        );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

exports.deleteIntegration =
  async (req, res) => {
    try {
      const data =
        await integrationService.deleteIntegration(
          req.params.id,
          req.user.tenantId
        );

      res.status(200).json({
        success: true,
        message:
          "Integration deleted",
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };