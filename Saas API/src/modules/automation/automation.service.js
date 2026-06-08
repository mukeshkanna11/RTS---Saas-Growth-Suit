const Automation = require("./automation.model");
const AutomationExecution = require("./automation-execution.model");

const ClientNotification = require(
  "../client/notifications/client-notification.model"
);

const ClientAlert = require(
  "../client/alerts/client-alert.model"
);

const { sendEmail } = require(
  "../marketing/email.service"
);

const { sendWhatsApp } = require(
  "../marketing/whatsapp.service"
);

/* =========================================
   HELPERS
========================================= */

const replaceVariables = (
  text = "",
  payload = {}
) => {
  let result = text;

  Object.keys(payload).forEach((key) => {
    result = result.replace(
      new RegExp(`{{${key}}}`, "g"),
      payload[key]
    );
  });

  return result;
};

const updateStats = async (
  automation,
  success
) => {
  automation.executionCount += 1;

  if (success) {
    automation.successCount += 1;
    automation.lastExecutionStatus =
      "success";
  } else {
    automation.failureCount += 1;
    automation.lastExecutionStatus =
      "failed";
  }

  automation.lastExecutedAt =
    new Date();

  await automation.save();
};

/* =========================================
   CREATE
========================================= */

exports.createAutomationService =
  async (data, user) => {
    if (!user?.tenantId) {
      throw new Error(
        "Tenant ID missing"
      );
    }

    return await Automation.create({
      ...data,
      tenantId: user.tenantId,
      createdBy: user._id,
    });
  };

/* =========================================
   GET ALL
========================================= */

exports.getAutomationsService =
  async (user) => {
    return await Automation.find({
      tenantId: user.tenantId,
      isDeleted: false,
    })
      .populate(
        "createdBy",
        "name email"
      )
      .sort({
        createdAt: -1,
      });
  };

/* =========================================
   GET ONE
========================================= */

exports.getAutomationByIdService =
  async (id, user) => {
    const automation =
      await Automation.findOne({
        _id: id,
        tenantId: user.tenantId,
        isDeleted: false,
      });

    if (!automation) {
      throw new Error(
        "Automation not found"
      );
    }

    return automation;
  };

/* =========================================
   UPDATE
========================================= */

exports.updateAutomationService =
  async (
    id,
    data,
    user
  ) => {
    const automation =
      await Automation.findOneAndUpdate(
        {
          _id: id,
          tenantId: user.tenantId,
          isDeleted: false,
        },
        data,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!automation) {
      throw new Error(
        "Automation not found"
      );
    }

    return automation;
  };

/* =========================================
   DELETE
========================================= */

exports.deleteAutomationService =
  async (id, user) => {
    const automation =
      await Automation.findOneAndUpdate(
        {
          _id: id,
          tenantId: user.tenantId,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
        }
      );

    if (!automation) {
      throw new Error(
        "Automation not found"
      );
    }

    return automation;
  };

/* =========================================
   TOGGLE
========================================= */

exports.toggleAutomationService =
  async (id, user) => {
    const automation =
      await Automation.findOne({
        _id: id,
        tenantId: user.tenantId,
        isDeleted: false,
      });

    if (!automation) {
      throw new Error(
        "Automation not found"
      );
    }

    automation.isActive =
      !automation.isActive;

    await automation.save();

    return automation;
  };

/* =========================================
   TEST AUTOMATION
========================================= */

exports.testAutomationService =
  async (data, user) => {
    const startTime = Date.now();

    const {
      trigger,
      payload = {},
    } = data;

    const automations =
      await Automation.find({
        "trigger.type": trigger,
        tenantId: user.tenantId,
        isActive: true,
        isDeleted: false,
      });

    let totalActions = 0;

    for (const automation of automations) {
      let automationSuccess = true;

      try {
        for (const action of automation.actions) {
          const message =
            replaceVariables(
              action.config?.message,
              payload
            );

          const subject =
            replaceVariables(
              action.config?.subject,
              payload
            );

          switch (
            action.type
          ) {
            case "email":
              if (!payload.email) {
                throw new Error(
                  "Email missing"
                );
              }

              await sendEmail({
                to: payload.email,
                subject:
                  subject ||
                  "Automation Email",
                html: message,
              });

              break;

            case "whatsapp":
              if (!payload.phone) {
                throw new Error(
                  "Phone missing"
                );
              }

              await sendWhatsApp({
                to: payload.phone,
                message,
              });

              break;

            case "notification":
              await ClientNotification.create(
                {
                  tenantId:
                    user.tenantId,
                  title:
                    subject ||
                    "Automation Notification",
                  message,
                  type:
                    "automation",
                  priority:
                    "medium",
                }
              );

              break;

            case "alert":
              await ClientAlert.create({
                tenantId:
                  user.tenantId,
                title:
                  subject ||
                  "Automation Alert",
                message,
                severity:
                  "high",
                category:
                  "automation",
                createdBy:
                  user._id,
              });

              break;

            default:
              console.log(
                `Unsupported action: ${action.type}`
              );
          }

          totalActions++;
        }

        await updateStats(
          automation,
          true
        );

        await AutomationExecution.create(
          {
            tenantId:
              user.tenantId,
            automationId:
              automation._id,
            automationName:
              automation.name,
            trigger,
            status:
              "success",
            actionsExecuted:
              automation.actions
                .length,
            executionTime:
              Date.now() -
              startTime,
            payload,
            executedBy:
              user._id,
          }
        );
      } catch (error) {
        automationSuccess = false;

        await updateStats(
          automation,
          false
        );

        await AutomationExecution.create(
          {
            tenantId:
              user.tenantId,
            automationId:
              automation._id,
            automationName:
              automation.name,
            trigger,
            status:
              "failed",
            actionsExecuted: 0,
            executionTime:
              Date.now() -
              startTime,
            errorMessage:
              error.message,
            payload,
            executedBy:
              user._id,
          }
        );

        await ClientAlert.create({
          tenantId:
            user.tenantId,
          title:
            "Automation Failed",
          message:
            error.message,
          severity:
            "high",
          category:
            "automation",
          createdBy:
            user._id,
        });

        console.error(
          error.message
        );
      }
    }

    return {
      automationsTriggered:
        automations.length,

      actionsExecuted:
        totalActions,

      generatedAt:
        new Date(),
    };
  };