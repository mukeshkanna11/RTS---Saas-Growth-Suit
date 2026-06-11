const Integration = require("./integration.model");

/*
================================
SUPPORTED PROVIDERS
================================
*/
const PROVIDERS = Object.freeze([
  "whatsapp",
  "email",
  "instagram",
]);

/*
================================
UTILITY: SAFE ERROR
================================
*/
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/*
================================
CONNECT INTEGRATION
================================
*/
exports.connect = async (tenantId, provider, credentials) => {
  if (!PROVIDERS.includes(provider)) {
    throw createError("Invalid provider", 400);
  }

  if (!tenantId) {
    throw createError("Tenant ID is required", 400);
  }

  if (!credentials || typeof credentials !== "object") {
    throw createError("Invalid credentials format", 400);
  }

  const integration = await Integration.findOneAndUpdate(
    { tenantId, provider },
    {
      tenantId,
      provider,
      connected: true,
      credentials,
      status: "connected",
      connectedAt: new Date(),
      lastSync: new Date(),
      disconnectedAt: null,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return {
    success: true,
    message: "Integration connected successfully",
    data: integration,
  };
};

/*
================================
DISCONNECT INTEGRATION (SOFT DISCONNECT)
================================
*/
exports.disconnect = async (tenantId, provider) => {
  if (!PROVIDERS.includes(provider)) {
    throw createError("Invalid provider", 400);
  }

  const integration = await Integration.findOneAndUpdate(
    { tenantId, provider },
    {
      connected: false,
      status: "disconnected",
      disconnectedAt: new Date(),
    },
    { new: true }
  );

  if (!integration) {
    throw createError("Integration not found", 404);
  }

  return {
    success: true,
    message: "Integration disconnected successfully",
    data: integration,
  };
};

/*
================================
GET ALL INTEGRATIONS
================================
*/
exports.getAll = async (tenantId) => {
  if (!tenantId) {
    throw createError("Tenant ID is required", 400);
  }

  const integrations = await Integration.find({ tenantId }).sort({
    createdAt: -1,
  });

  return {
    success: true,
    data: integrations,
  };
};

/*
================================
GET SINGLE INTEGRATION
================================
*/
exports.getOne = async (tenantId, provider) => {
  if (!PROVIDERS.includes(provider)) {
    throw createError("Invalid provider", 400);
  }

  const integration = await Integration.findOne({
    tenantId,
    provider,
  });

  if (!integration) {
    throw createError("Integration not found", 404);
  }

  return {
    success: true,
    data: integration,
  };
};

/*
================================
TEST CONNECTION
================================
*/
exports.testConnection = async (tenantId, provider) => {
  const integration = await Integration.findOne({
    tenantId,
    provider,
  });

  if (!integration) {
    throw createError("Integration not found", 404);
  }

  const isHealthy = integration.connected === true;

  return {
    success: true,
    data: {
      provider,
      status: isHealthy ? "connected" : "disconnected",
      healthy: isHealthy,
      lastSync: integration.lastSync || null,
    },
  };
};

/*
================================
INCREMENT USAGE (SAFE + NON-BLOCKING)
================================
*/
exports.incrementUsage = async (tenantId, provider) => {
  if (!tenantId || !provider) return;

  if (!PROVIDERS.includes(provider)) return;

  return Integration.findOneAndUpdate(
    { tenantId, provider },
    {
      $inc: { usageCount: 1 },
      lastSync: new Date(),
    },
    { new: true }
  );
};

/*
================================
VALIDATE PROVIDER (EXPORTABLE)
================================
*/
exports.isValidProvider = (provider) => {
  return PROVIDERS.includes(provider);
};

/*
================================
EXPORT PROVIDERS (FOR FRONTEND USE)
================================
*/
exports.PROVIDERS = PROVIDERS;