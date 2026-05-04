import { z } from 'zod';

// Custom date validator that accepts various ISO formats
const dateValidator = z.string().refine(
  (val) => {
    if (!val) return true; // Allow empty/optional values
    const date = new Date(val);
    return !isNaN(date.getTime()); // Check if it's a valid date
  },
  {
    message:
      "Invalid date format. Please use ISO 8601 format (e.g., '2024-01-01T00:00:00.000Z')",
  }
);

// Validator for candidate KPIs query parameters
export const supportCandidateKpisValidator = z.object({
  query: z.object({
    startDate: dateValidator.optional(),
    endDate: dateValidator.optional(),
    filterBy: z.string().optional(),
  }),
});

// Validator for filter options (no parameters needed)
export const supportFilterOptionsValidator = z.object({
  query: z.object({}),
});
