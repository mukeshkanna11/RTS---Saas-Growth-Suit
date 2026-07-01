// Protects against prompt injection and jailbreak attempts in AI input fields.
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+|previous\s+|above\s+)?instructions/i,
  /forget\s+(all\s+|your\s+|previous\s+)?instructions/i,
  /you\s+are\s+now\s+(a\s+|an\s+)?/i,
  /act\s+as\s+(a\s+|an\s+)?(different|evil|unrestricted|uncensored)/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /<\|system\|>/i,
  /###\s*(system|instruction)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /override\s+your\s+(programming|training|instructions)/i,
  /disregard\s+(all\s+|previous\s+)?instructions/i,
  /pretend\s+(you\s+are|to\s+be)\s+(a\s+|an\s+)?(?!professional|expert|writer)/i,
];

const TEXT_FIELDS = ["topic", "keyword", "product", "context", "outline", "goal", "targetAudience", "title", "platform"];
const MAX_FIELD_LENGTH = 2000;

function detectInjection(value) {
  if (typeof value !== "string") return false;
  return INJECTION_PATTERNS.some((p) => p.test(value));
}

const sanitizePromptInputs = (req, res, next) => {
  for (const field of TEXT_FIELDS) {
    const value = req.body[field];
    if (!value) continue;

    if (typeof value === "string" && value.length > MAX_FIELD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Field '${field}' exceeds maximum allowed length of ${MAX_FIELD_LENGTH} characters.`,
        data: null,
        errors: [{ field, message: "Input too long" }],
        timestamp: new Date().toISOString(),
      });
    }

    if (detectInjection(value)) {
      console.warn(`[PromptSanitizer] Injection attempt detected — field: ${field}, userId: ${req.user?.id}, tenantId: ${req.user?.tenantId}`);
      return res.status(400).json({
        success: false,
        message: "Input contains disallowed content. Please revise your request.",
        data: null,
        errors: [{ field, message: "Prompt injection pattern detected" }],
        timestamp: new Date().toISOString(),
      });
    }
  }

  next();
};

module.exports = { sanitizePromptInputs };
