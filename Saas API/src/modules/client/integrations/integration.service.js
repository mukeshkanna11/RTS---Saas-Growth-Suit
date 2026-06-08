const Integration = require("./integration.model");

/* =========================================
   CONNECT
========================================= */

exports.connectIntegration = async (
  tenantId,
  userId,
  data
) => {
  const integration =
    await Integration.findOneAndUpdate(
      {
        tenantId,
        provider: data.provider,
      },
      {
        tenantId,
        displayName:
          data.displayName,
        provider: data.provider,
        credentials:
          data.credentials || {},
        isConnected: true,
        status: "active",
        connectedBy: userId,
        lastSyncedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    );

  return integration;
};

/* =========================================
   GET ALL
========================================= */

exports.getIntegrations =
  async (tenantId) => {
    return await Integration.find({
      tenantId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });
  };

/* =========================================
   GET ONE
========================================= */

exports.getIntegrationById =
  async (id, tenantId) => {
    return await Integration.findOne({
      _id: id,
      tenantId,
      isDeleted: false,
    });
  };

/* =========================================
   DISCONNECT
========================================= */

exports.disconnectIntegration =
  async (
    id,
    tenantId
  ) => {
    return await Integration.findOneAndUpdate(
      {
        _id: id,
        tenantId,
      },
      {
        isConnected: false,
        status: "inactive",
      },
      {
        new: true,
      }
    );
  };

/* =========================================
   DELETE
========================================= */

exports.deleteIntegration =
  async (
    id,
    tenantId
  ) => {
    return await Integration.findOneAndUpdate(
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

/* =========================================
   UPDATE SETTINGS
========================================= */

exports.updateSettings =
  async (
    id,
    tenantId,
    settings
  ) => {
    return await Integration.findOneAndUpdate(
      {
        _id: id,
        tenantId,
      },
      {
        settings,
      },
      {
        new: true,
      }
    );
  };