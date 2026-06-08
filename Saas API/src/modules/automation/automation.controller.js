const automationService = require(
  "./automation.service"
);

exports.createAutomation =
  async (req, res) => {
    try {
      const automation =
        await automationService.createAutomationService(
          req.body,
          req.user
        );

      return res.status(201).json({
        success: true,
        message:
          "Automation created successfully",
        data: automation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

exports.getAutomations =
  async (req, res) => {
    try {
      const automations =
        await automationService.getAutomationsService(
          req.user
        );

      return res.status(200).json({
        success: true,
        count: automations.length,
        data: automations,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

exports.getAutomationById =
  async (req, res) => {
    try {
      const automation =
        await automationService.getAutomationByIdService(
          req.params.id,
          req.user
        );

      return res.status(200).json({
        success: true,
        data: automation,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

exports.updateAutomation =
  async (req, res) => {
    try {
      const automation =
        await automationService.updateAutomationService(
          req.params.id,
          req.body,
          req.user
        );

      return res.status(200).json({
        success: true,
        message:
          "Automation updated successfully",
        data: automation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

exports.deleteAutomation =
  async (req, res) => {
    try {
      const automation =
        await automationService.deleteAutomationService(
          req.params.id,
          req.user
        );

      return res.status(200).json({
        success: true,
        message:
          "Automation deleted successfully",
        data: automation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

exports.toggleAutomation =
  async (req, res) => {
    try {
      const automation =
        await automationService.toggleAutomationService(
          req.params.id,
          req.user
        );

      return res.status(200).json({
        success: true,
        message:
          "Automation status updated",
        data: automation,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

exports.testAutomation =
  async (req, res) => {
    try {
      const result =
        await automationService.testAutomationService(
          req.body,
          req.user
        );

      return res.status(200).json({
        success: true,
        message:
          "Automation executed successfully",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };