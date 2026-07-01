// Structured AI request logger — attaches timing and result metadata to each AI endpoint response.
const aiRequestLogger = (req, res, next) => {
  const startedAt = Date.now();
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const durationMs = Date.now() - startedAt;
    const logEntry = {
      type: "AI_REQUEST",
      method: req.method,
      path: req.path,
      feature: req.body?.feature || null,
      userId: req.user?.id || null,
      tenantId: req.user?.tenantId || null,
      success: body?.success ?? null,
      statusCode: res.statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
    };

    if (!body?.success) {
      logEntry.errorMessage = body?.message || null;
    }

    console.log(JSON.stringify(logEntry));
    return originalJson(body);
  };

  next();
};

module.exports = { aiRequestLogger };
