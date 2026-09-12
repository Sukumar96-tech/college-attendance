import { z } from "zod";

/**
 * Safely parse JSON request bodies.
 *
 * Returns the parsed JSON object when valid.
 * Returns null when the request body is invalid JSON.
 */
export async function parseJsonBody(
  request: Request
): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Validate a request body using a Zod schema.
 *
 * Returns:
 * - success: true + validated data
 * - success: false + validation errors
 */
export function validateBody<T>(
  schema: z.ZodType<T>,
  data: unknown
) {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false as const,
      data: null,
      errors: result.error.flatten(),
    };
  }

  return {
    success: true as const,
    data: result.data,
    errors: null,
  };
}

/**
 * Convert Zod validation errors into
 * a simple API-friendly object.
 */
export function formatValidationErrors(
  errors: z.ZodError
) {
  return errors.flatten().fieldErrors;
}

/**
 * Validate positive integer IDs.
 */
export const positiveIntSchema =
  z.coerce
    .number()
    .int()
    .positive();

/**
 * Validate a date in YYYY-MM-DD format.
 */
export const dateSchema =
  z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date must use YYYY-MM-DD format."
    );

/**
 * Validate a month in YYYY-MM format.
 */
export const monthSchema =
  z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])$/,
      "Month must use YYYY-MM format."
    );

/**
 * Trim text and reject empty values.
 */
export function requiredText(
  min: number,
  max: number
) {
  return z
    .string()
    .trim()
    .min(
      min,
      `Must contain at least ${min} characters.`
    )
    .max(
      max,
      `Must not exceed ${max} characters.`
    );
}

/**
 * Optional text field.
 *
 * Empty strings are converted to null.
 */
export function optionalText(
  max: number
) {
  return z
    .string()
    .trim()
    .max(
      max,
      `Must not exceed ${max} characters.`
    )
    .optional()
    .nullable()
    .transform(
      (value) =>
        value === "" ||
        value === undefined
          ? null
          : value
    );
}

/**
 * Validate an email address.
 */
export const emailSchema =
  z
    .string()
    .trim()
    .email("Invalid email address.")
    .max(
      254,
      "Email address is too long."
    );

/**
 * Validate a phone number.
 *
 * This accepts common Indian/international
 * numeric phone formats without storing
 * formatting characters unnecessarily.
 */
export const phoneSchema =
  z
    .string()
    .trim()
    .regex(
      /^\+?[0-9]{10,15}$/,
      "Invalid phone number."
    );

/**
 * Validate username.
 *
 * Usernames may contain letters, numbers,
 * underscores and dots.
 */
export const usernameSchema =
  z
    .string()
    .trim()
    .min(
      3,
      "Username must contain at least 3 characters."
    )
    .max(
      50,
      "Username must not exceed 50 characters."
    )
    .regex(
      /^[A-Za-z0-9_.]+$/,
      "Username contains invalid characters."
    );

/**
 * Validate passwords.
 *
 * Passwords must be reasonably strong.
 */
export const passwordSchema =
  z
    .string()
    .min(
      8,
      "Password must contain at least 8 characters."
    )
    .max(
      128,
      "Password must not exceed 128 characters."
    );