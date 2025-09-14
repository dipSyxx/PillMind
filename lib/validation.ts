import { z } from "zod"

// Individual field schemas for real-time validation
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(100, "Email must be less than 100 characters")
  .toLowerCase()

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
  .regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
  .regex(/^(?=.*\d)/, "Password must contain at least one number")
  .regex(/^(?=.*[@$!%*?&])/, "Password must contain at least one special character (@$!%*?&)")

export const confirmPasswordSchema = z.string().min(1, "Please confirm your password")

// Complete registration schema with cross-field validation
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
})

// Individual field schemas for password change
export const currentPasswordSchema = z
  .string()
  .min(1, "Current password is required")
  .min(8, "Current password must be at least 8 characters")

export const newPasswordSchema = z
  .string()
  .min(1, "New password is required")
  .min(8, "New password must be at least 8 characters")
  .max(100, "New password must be less than 100 characters")
  .regex(/^(?=.*[a-z])/, "New password must contain at least one lowercase letter")
  .regex(/^(?=.*[A-Z])/, "New password must contain at least one uppercase letter")
  .regex(/^(?=.*\d)/, "New password must contain at least one number")
  .regex(/^(?=.*[@$!%*?&])/, "New password must contain at least one special character (@$!%*?&)")

export const confirmNewPasswordSchema = z.string().min(1, "Please confirm your new password")

// Complete password change schema with cross-field validation
export const changePasswordSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: newPasswordSchema,
  confirmNewPassword: confirmNewPasswordSchema,
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
})

// Password strength calculation
export function calculatePasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  }

  score = Object.values(checks).filter(Boolean).length

  if (score <= 2) return { score, label: "Weak", color: "text-red-500" }
  if (score <= 3) return { score, label: "Fair", color: "text-orange-500" }
  if (score <= 4) return { score, label: "Good", color: "text-yellow-500" }
  return { score, label: "Strong", color: "text-green-500" }
}
