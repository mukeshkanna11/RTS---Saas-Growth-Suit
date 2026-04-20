const { z } = require("zod");

// --------------------------------------
// 🔥 COMMON FIELDS
// --------------------------------------

const email = z
  .string()
  .email("Invalid email format")
  .transform((val) => val.toLowerCase().trim());

const password = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(50, "Password too long")
  .regex(/[A-Z]/, "Must include at least one uppercase letter")
  .regex(/[0-9]/, "Must include at least one number");

const name = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name too long")
  .trim();

const companyName = z
  .string()
  .min(2, "Company name must be at least 2 characters")
  .max(100, "Company name too long")
  .trim();

const role = z.enum(["admin", "manager", "employee"]);


// --------------------------------------
// 📝 REGISTER (FIRST USER → ADMIN)
// --------------------------------------

exports.signupSchema = z.object({
  name,
  email,
  password,
  companyName, // ✅ instead of tenantId
})
.strict();


// --------------------------------------
// 🔐 LOGIN
// --------------------------------------

exports.loginSchema = z.object({
  email,
  password,
}).strict();


// --------------------------------------
// 👤 CREATE USER (ADMIN ONLY)
// --------------------------------------

exports.createUserSchema = z.object({
  name,
  email,
  password,
  role,
})
.strict()
.refine((data) => data.role !== "admin", {
  message: "Cannot create admin user",
  path: ["role"],
});


// --------------------------------------
// 🔄 UPDATE USER
// --------------------------------------

exports.updateUserSchema = z.object({
  name: name.optional(),
  email: email.optional(),
  role: role.optional(),
  isActive: z.boolean().optional(),
})
.strict()
.refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});