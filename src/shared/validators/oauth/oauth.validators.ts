import { z } from 'zod';

// ============================================================================
// OAuth Provider Validation
// ============================================================================

export const oauthProviderSchema = z.enum(['GOOGLE', 'GITHUB'], {
  errorMap: () => ({ message: "Provider must be either 'google' or 'github'" }),
});

// ============================================================================
// User Type Validation (including support)
// ============================================================================

export const oauthUserTypeSchema = z
  .enum(['candidate', 'client', 'partner', 'support'], {
    errorMap: () => ({
      message: 'User type must be one of: candidate, client, partner, support',
    }),
  })
  .optional();

// ============================================================================
// OAuth Providers Request Validation
// ============================================================================

export const oauthProvidersValidator = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

// ============================================================================
// OAuth Auth URL Request Validation
// ============================================================================

export const oauthAuthUrlValidator = z.object({
  params: z.object({
    provider: z
      .string()
      .min(1, 'Provider is required')
      .transform((val) => val.toUpperCase())
      .refine(
        (val) => ['GOOGLE', 'GITHUB'].includes(val),
        "Provider must be either 'google' or 'github'"
      ),
  }),
  query: z.object({
    userType: oauthUserTypeSchema,
    returnUrl: z.string().optional(),
    state: z.string().optional(),
  }),
  body: z.object({}).optional(),
});

// ============================================================================
// OAuth Callback Request Validation
// ============================================================================

export const oauthCallbackValidator = z.object({
  params: z.object({
    provider: z
      .string()
      .min(1, 'Provider is required')
      .transform((val) => val.toUpperCase())
      .refine(
        (val) => ['GOOGLE', 'GITHUB'].includes(val),
        "Provider must be either 'google' or 'github'"
      ),
  }),
  query: z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }),
  body: z.object({}).optional(),
});

// ============================================================================
// Backward Compatibility - Candidate OAuth Validators
// ============================================================================

export const candidateOauthProvidersValidator = z.object({
  query: z.object({}).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const candidateOauthAuthUrlValidator = z.object({
  params: z.object({
    provider: z
      .string()
      .min(1, 'Provider is required')
      .transform((val) => val.toUpperCase())
      .refine(
        (val) => ['GOOGLE', 'GITHUB'].includes(val),
        "Provider must be either 'google' or 'github'"
      ),
  }),
  query: z.object({
    returnUrl: z.string().url('Return URL must be a valid URL').optional(),
    state: z.string().optional(),
  }),
  body: z.object({}).optional(),
});

export const candidateOauthCallbackValidator = z.object({
  params: z.object({
    provider: z
      .string()
      .min(1, 'Provider is required')
      .transform((val) => val.toUpperCase())
      .refine(
        (val) => ['GOOGLE', 'GITHUB'].includes(val),
        "Provider must be either 'google' or 'github'"
      ),
  }),
  query: z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }),
  body: z.object({}).optional(),
});

// ============================================================================
// Collection of OAuth validators
// ============================================================================

export const oauthValidators = {
  getAuthUrl: oauthAuthUrlValidator,
  handleCallback: oauthCallbackValidator,
};

// Export schemas for direct use
export const getAuthUrlSchema = oauthAuthUrlValidator;
export const handleCallbackSchema = oauthCallbackValidator;
