/**
 * String utility functions for handling Spanish text normalization
 */

/**
 * Normalize a string by removing accents and converting to lowercase
 * This helps match Spanish text with or without accents
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .trim();
}

/**
 * Create a slug from a string (for database storage)
 * Similar to normalizeString but also handles special characters
 */
export function createSlug(str: string): string {
  return normalizeString(str)
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if two strings are equivalent when normalized
 * Useful for case-insensitive, accent-insensitive comparison
 */
export function stringsMatch(str1: string, str2: string): boolean {
  return normalizeString(str1) === normalizeString(str2);
}

/**
 * Spanish accent mapping for common replacements
 */
export const SPANISH_ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a',
  'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
  'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
  'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o',
  'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
  'ñ': 'n',
  'ç': 'c'
};