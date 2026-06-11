const integrationService = require("./integration.service");

const SUPPORTED_PROVIDERS = [
  "whatsapp",
  "email",
  "instagram",
];

/*
=========================================
CONNECT INTEGRATION
=========================================
*/

exports.connect = async (
  req,
  res,
  next
) => {
  try {
    const {
      provider,
      credentials = {},
      displayName,
    } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: "Provider is required",
      });
    }

    if (
      !SUPPORTED_PROVIDERS.includes(
        provider.toLowerCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported integration provider",
      });
    }

    const integration =
      await integrationService.connect(
        req.user.tenantId,
        {
          provider,
          displayName,
          credentials,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        `${provider} connected successfully`,
      data: integration,
    });

  } catch (err) {
    next(err);
  }
};

/*
=========================================
DISCONNECT
=========================================
*/

exports.disconnect = async (
  req,
  res,
  next
) => {
  try {
    const { provider } = req.params;

    const integration =
      await integrationService.disconnect(
        req.user.tenantId,
        provider
      );

    return res.status(200).json({
      success: true,
      message:
        `${provider} disconnected successfully`,
      data: integration,
    });

  } catch (err) {
    next(err);
  }
};

/*
=========================================
GET ALL
=========================================
*/

exports.getAll = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await integrationService.getAll(
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });

  } catch (err) {
    next(err);
  }
};

/*
=========================================
GET SINGLE
=========================================
*/

exports.getOne = async (
  req,
  res,
  next
) => {
  try {
    const data =
      await integrationService.getOne(
        req.user.tenantId,
        req.params.provider
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message:
          "Integration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (err) {
    next(err);
  }
};

/*
=========================================
TEST CONNECTION
=========================================
*/

exports.testConnection = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await integrationService.testConnection(
        req.user.tenantId,
        req.params.provider
      );

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (err) {
    next(err);
  }
};

/*
=========================================
WHATSAPP TEST MESSAGE
=========================================
*/

exports.sendWhatsAppTest =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        phone,
        message,
      } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number required",
        });
      }

      const result =
        await integrationService.sendWhatsAppTest(
          req.user.tenantId,
          {
            phone,
            message:
              message ||
              "Hello from ReadyTech SaaS 🚀",
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "WhatsApp message sent",
        data: result,
      });

    } catch (err) {
      next(err);
    }
  };

/*
=========================================
EMAIL TEST
=========================================
*/

exports.sendEmailTest =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        email,
        subject,
        message,
      } = req.body;

      const result =
        await integrationService.sendEmailTest(
          req.user.tenantId,
          {
            email,
            subject:
              subject ||
              "ReadyTech Test Email",
            message:
              message ||
              "Email integration working successfully",
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Email sent successfully",
        data: result,
      });

    } catch (err) {
      next(err);
    }
  };

/*
=========================================
INTEGRATION STATS
=========================================
*/

exports.stats = async (
  req,
  res,
  next
) => {
  try {
    const stats =
      await integrationService.stats(
        req.user.tenantId
      );

    return res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (err) {
    next(err);
  }
};