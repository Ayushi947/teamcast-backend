/**
 * Safely format any "name" field (for signup, profile, etc.)
 * - Converts underscores to spaces
 * - Collapses multiple spaces
 * - Handles acronyms/initials (JD, AI, ML)
 * - Capitalizes normal words (John, Dames)
 * - Returns safe fallback (empty string if invalid)
 */
export function formatName(input: unknown): string {
  if (typeof input !== 'string') return '';

  const name = input
    .replace(/_/g, ' ') // underscores → spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();

  if (!name) return '';

  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      // Acronym check: only if it's all uppercase already, and <= 3 letters
      if (/^[A-Z]{1,3}$/.test(word) && word.length <= 3) {
        return word;
      }

      // Capitalize only the first letter, leave rest untouched
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function formatEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim().toLowerCase();
}
