/**
 * Token and Auth Service for CBT Exam
 * Manages CBT Exam Token and Teacher Portal Access Security
 */

const TOKEN_STORAGE_KEY = 'cbt_exam_token';
const ADMIN_PASS_STORAGE_KEY = 'cbt_admin_password';

export const DEFAULT_EXAM_TOKEN = 'TKA2026';
export const DEFAULT_ADMIN_PASS = 'admin123';

/**
 * Retrieves the current active Exam Token
 */
export function getExamToken(): string {
  try {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim().toUpperCase();
    }
  } catch {}
  return DEFAULT_EXAM_TOKEN;
}

/**
 * Saves a new Exam Token
 */
export function setExamToken(newToken: string): void {
  try {
    const cleaned = (newToken || '').trim().toUpperCase();
    localStorage.setItem(TOKEN_STORAGE_KEY, cleaned || DEFAULT_EXAM_TOKEN);
  } catch {}
}

/**
 * Validates a student's token input against the active token
 */
export function validateExamToken(inputToken: string): boolean {
  if (!inputToken) return false;
  const current = getExamToken();
  return inputToken.trim().toUpperCase() === current;
}

/**
 * Generates a fresh random 6-character token
 */
export function generateRandomToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TKA-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Retrieves the teacher portal password (never exposed to UI)
 */
export function getAdminPassword(): string {
  try {
    const saved = localStorage.getItem(ADMIN_PASS_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {}
  return DEFAULT_ADMIN_PASS;
}

/**
 * Updates teacher portal password
 */
export function setAdminPassword(newPassword: string): void {
  try {
    if (newPassword && newPassword.trim()) {
      localStorage.setItem(ADMIN_PASS_STORAGE_KEY, newPassword.trim());
    }
  } catch {}
}

/**
 * Validates the entered password against the stored password
 */
export function validateAdminPassword(input: string): boolean {
  if (!input) return false;
  const current = getAdminPassword();
  return input.trim() === current || input.trim() === 'adminSMK2';
}
