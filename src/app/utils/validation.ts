// ─── Registration Validation ─────────────────────────────────────────────────
// Pure utility – no React imports, no side effects.

export const VALID_REGIONS = ['Luzon', 'Visayas', 'Mindanao', 'Other'] as const;
export type ValidRegion = (typeof VALID_REGIONS)[number];

// ─── Individual field validators ─────────────────────────────────────────────
// Each returns an error message string, or null if valid.

/**
 * Full name: required, ≥3 chars, letters/spaces/hyphens/apostrophes/periods only.
 */
export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 3) return 'Name must be at least 3 characters.';
  if (/\d/.test(trimmed)) return 'Name should not contain numbers.';
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-\.]+$/.test(trimmed)) {
    return 'Name may only contain letters, spaces, hyphens, apostrophes, and periods.';
  }
  return null;
}

/**
 * Email: required, basic RFC-5322-ish format check.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  // Intentionally simple – Supabase does the authoritative check on signup.
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

/**
 * Password: required, ≥8 chars, at least 1 letter + 1 number.
 */
export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(password)) return 'Password must include at least one letter.';
  if (!/\d/.test(password)) return 'Password must include at least one number.';
  return null;
}

/**
 * Region: required, must be one of the allowed values.
 */
export function validateRegion(region: string): string | null {
  if (!region) return 'Please select a region.';
  if (!(VALID_REGIONS as readonly string[]).includes(region)) {
    return `Region must be one of: ${VALID_REGIONS.join(', ')}.`;
  }
  return null;
}

// ─── Combined form validator ─────────────────────────────────────────────────

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  region: string;
}

/**
 * Validate all signup fields at once.
 * Returns a map of field name → error message. An empty object means all valid.
 */
export function validateSignupForm(form: SignupFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  const nameErr = validateFullName(form.name);
  if (nameErr) errors.name = nameErr;

  const emailErr = validateEmail(form.email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(form.password);
  if (passErr) errors.password = passErr;

  const regionErr = validateRegion(form.region);
  if (regionErr) errors.region = regionErr;

  return errors;
}
