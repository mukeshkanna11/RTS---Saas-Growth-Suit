const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "ReadyTech Growth Suite — AI & SEO API",
    version: "2.0.0",
    description:
      "Production-grade AI content generation and SEO optimization API. All protected routes require a Bearer JWT token obtained from POST /api/v1/auth/login.",
    contact: { name: "ReadyTech Solutions", email: "quries.readytechsolutions@gmail.com" },
  },
  servers: [
    { url: "http://localhost:5000", description: "Local Development" },
    { url: "https://your-render-url.onrender.com", description: "Production (Render)" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token from POST /api/v1/auth/login",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { nullable: true },
          errors: { type: "array", items: { type: "object", properties: { field: { type: "string" }, message: { type: "string" } } }, nullable: true },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      TokenUsage: {
        type: "object",
        properties: {
          inputTokens: { type: "integer" },
          outputTokens: { type: "integer" },
          totalTokens: { type: "integer" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── Auth ────────────────────────────────────────────────────────────────
    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login and get JWT token",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email", example: "admin@yourcompany.com" }, password: { type: "string", example: "Admin123" } } },
            },
          },
        },
        responses: {
          200: { description: "Login successful — token in data.token", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          400: { description: "Validation error" },
          401: { description: "Invalid credentials" },
          429: { description: "Too many login attempts (5 per 10 min)" },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new tenant and admin account",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["name", "email", "password", "companyName"], properties: { name: { type: "string", example: "John Admin" }, email: { type: "string", example: "admin@yourcompany.com" }, password: { type: "string", example: "Admin123" }, companyName: { type: "string", example: "Your Company Ltd" } } } } },
        },
        responses: { 201: { description: "Account created" }, 400: { description: "Validation error or email already exists" } },
      },
    },

    // ── Marketing AI (Simple) ───────────────────────────────────────────────
    "/api/v1/marketing/ai-content": {
      post: {
        tags: ["Marketing AI"],
        summary: "Generate marketing content (blog, email, social, ad)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["topic"],
                properties: {
                  topic: { type: "string", minLength: 3, maxLength: 300, example: "How AI is transforming small business marketing in 2026" },
                  contentType: { type: "string", enum: ["blog", "email", "social", "ad", "general"], default: "general" },
                  tone: { type: "string", default: "Professional", example: "Professional" },
                  context: { type: "string", maxLength: 500, example: "Focus on practical tools and ROI" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Content generated", content: { "application/json": { example: { success: true, message: "Content generated successfully", data: { content: "Blog post text here...", usage: { inputTokens: 120, outputTokens: 800, totalTokens: 920 } }, errors: null, timestamp: "2026-07-01T10:00:00.000Z" } } } },
          400: { description: "Validation error or prompt injection detected" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/marketing/seo-title": {
      post: {
        tags: ["Marketing AI"],
        summary: "Generate SEO title tags or meta descriptions",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["keyword"],
                properties: {
                  keyword: { type: "string", minLength: 2, maxLength: 150, example: "best CRM software for small business" },
                  tone: { type: "string", default: "Professional" },
                  targetAudience: { type: "string", example: "small business owners" },
                  type: { type: "string", enum: ["seo_title", "meta_description"], description: "Omit for SEO titles. Set to meta_description for meta descriptions." },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "5 SEO titles or 3 meta descriptions returned in data.result" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ── AI Module (Full) ────────────────────────────────────────────────────
    "/api/v1/ai/generate": {
      post: {
        tags: ["AI Module"],
        summary: "Generate AI content with history tracking and plan-based rate limiting",
        description: "Supports 8 features: seo_title, meta_description, blog_outline, blog, email_subject, email, social, ad_copy. Results are saved to AIHistory. Plan limits: starter=50/mo, growth=200/mo, enterprise=unlimited.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              examples: {
                seo_title: { summary: "SEO Title Tags", value: { feature: "seo_title", keyword: "project management software for remote teams", tone: "professional", targetAudience: "remote team managers" } },
                meta_description: { summary: "Meta Descriptions", value: { feature: "meta_description", keyword: "project management software", title: "Best Project Management Software 2026", tone: "professional" } },
                blog_outline: { summary: "Blog Outline", value: { feature: "blog_outline", topic: "How to build a remote sales team", tone: "professional", targetAudience: "sales managers", wordCount: 2000 } },
                blog: { summary: "Full Blog Post", value: { feature: "blog", topic: "How to build a remote sales team", tone: "professional", wordCount: 1500 } },
                email_subject: { summary: "Email Subject Lines", value: { feature: "email_subject", topic: "New AI lead scoring feature launch", tone: "professional", targetAudience: "existing customers" } },
                email: { summary: "Email Body", value: { feature: "email", topic: "New AI lead scoring feature launch", goal: "Drive plan upgrades", tone: "professional" } },
                social: { summary: "Social Media Posts", value: { feature: "social", topic: "We just hit 1000 customers!", platform: "LinkedIn", tone: "authentic", includeHashtags: true } },
                ad_copy: { summary: "Ad Copy", value: { feature: "ad_copy", product: "ReadyTech Growth Suite", platform: "Google Ads", goal: "Drive free trial signups", tone: "persuasive" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Generated content + historyId", content: { "application/json": { example: { success: true, message: "Content generated successfully", data: { output: "1. Best Project Management...", historyId: "64f1a2b3c4d5e6f7a8b9c0d2", cached: false, usage: { inputTokens: 180, outputTokens: 220, totalTokens: 400 } }, errors: null, timestamp: "2026-07-01T10:00:00.000Z" } } } },
          400: { description: "Validation error, unknown feature, or injection detected" },
          401: { description: "Unauthorized" },
          429: { description: "Monthly plan limit reached" },
        },
      },
    },
    "/api/v1/ai/history": {
      get: {
        tags: ["AI Module"],
        summary: "Get AI generation history (paginated)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "feature", in: "query", schema: { type: "string", enum: ["seo_title", "meta_description", "blog", "email", "social", "ad_copy"] } },
        ],
        responses: { 200: { description: "Paginated history list" }, 401: { description: "Unauthorized" } },
      },
    },
    "/api/v1/ai/history/{id}": {
      delete: {
        tags: ["AI Module"],
        summary: "Soft-delete an AI history item",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "AIHistory MongoDB _id" }],
        responses: { 200: { description: "Item soft-deleted" }, 401: { description: "Unauthorized" } },
      },
    },
    "/api/v1/ai/usage": {
      get: {
        tags: ["AI Module"],
        summary: "Get current month AI usage (admin/manager only)",
        responses: { 200: { description: "Monthly usage breakdown with token counts" }, 403: { description: "Forbidden — employees and clients cannot access" } },
      },
    },

    // ── Analytics ───────────────────────────────────────────────────────────
    "/api/v1/ai/analytics/summary": {
      get: {
        tags: ["AI Analytics"],
        summary: "Current month summary — requests, tokens, cost estimate",
        responses: { 200: { description: "Summary with estimatedCostUSD" }, 403: { description: "Admin/Manager only" } },
      },
    },
    "/api/v1/ai/analytics/daily": {
      get: {
        tags: ["AI Analytics"],
        summary: "Daily request breakdown by feature",
        parameters: [{ name: "days", in: "query", schema: { type: "integer", default: 7, maximum: 90 } }],
        responses: { 200: { description: "Array of { date, feature, count }" } },
      },
    },
    "/api/v1/ai/analytics/features": {
      get: {
        tags: ["AI Analytics"],
        summary: "Top features by total usage count",
        responses: { 200: { description: "Array of { feature, count } sorted desc" } },
      },
    },
    "/api/v1/ai/analytics/users": {
      get: {
        tags: ["AI Analytics"],
        summary: "Top users by AI generation count",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } }],
        responses: { 200: { description: "Array of { name, email, count, tokensUsed }" } },
      },
    },
    "/api/v1/ai/analytics/cost": {
      get: {
        tags: ["AI Analytics"],
        summary: "Cost breakdown by month (up to 12 months)",
        parameters: [{ name: "months", in: "query", schema: { type: "integer", default: 3, maximum: 12 } }],
        responses: { 200: { description: "Per-month cost at Claude Sonnet 4.6 rates ($3/1M input, $15/1M output)" } },
      },
    },

    // ── SEO Legacy ──────────────────────────────────────────────────────────
    "/api/v1/seo/seo-title": {
      post: {
        tags: ["SEO Legacy"],
        summary: "Generate a single SEO title (public — no auth, 20 req/15min per IP)",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["keyword"], properties: { keyword: { type: "string", minLength: 2, maxLength: 150, example: "email marketing automation" } } } } },
        },
        responses: {
          200: { description: "Single best SEO title", content: { "application/json": { example: { success: true, message: "SEO title generated", data: { title: "Best Email Marketing Automation Tools in 2026", keyword: "email marketing automation" }, errors: null, timestamp: "2026-07-01T10:00:00.000Z" } } } },
          400: { description: "Validation error or injection detected" },
          429: { description: "IP rate limit exceeded (20 req/15 min)" },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
