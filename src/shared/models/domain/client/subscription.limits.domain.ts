/**
 * Domain models for subscription limits functionality
 * These models represent the business logic layer for subscription limits
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitCheck:
 *       type: object
 *       properties:
 *         canCreate:
 *           type: boolean
 *           description: Whether the action is allowed
 *         errorMessage:
 *           type: string
 *           description: Error message if action is not allowed
 *         currentUsage:
 *           type: number
 *           description: Current usage count
 *         limit:
 *           type: number
 *           description: Maximum allowed limit (-1 for unlimited)
 *       required:
 *         - canCreate
 *         - currentUsage
 *         - limit
 */
export interface ISubscriptionLimitCheck {
  canCreate: boolean;
  errorMessage?: string;
  currentUsage: number;
  limit: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitCheckView:
 *       type: object
 *       properties:
 *         canView:
 *           type: boolean
 *           description: Whether the action is allowed
 *         errorMessage:
 *           type: string
 *           description: Error message if action is not allowed
 *         currentUsage:
 *           type: number
 *           description: Current usage count
 *         limit:
 *           type: number
 *           description: Maximum allowed limit (-1 for unlimited)
 *       required:
 *         - canView
 *         - currentUsage
 *         - limit
 */
export interface ISubscriptionLimitCheckView {
  canView: boolean;
  errorMessage?: string;
  currentUsage: number;
  limit: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitCheckAdd:
 *       type: object
 *       properties:
 *         canAdd:
 *           type: boolean
 *           description: Whether the action is allowed
 *         errorMessage:
 *           type: string
 *           description: Error message if action is not allowed
 *         currentUsage:
 *           type: number
 *           description: Current usage count
 *         limit:
 *           type: number
 *           description: Maximum allowed limit (-1 for unlimited)
 *       required:
 *         - canAdd
 *         - currentUsage
 *         - limit
 */
export interface ISubscriptionLimitCheckAdd {
  canAdd: boolean;
  errorMessage?: string;
  currentUsage: number;
  limit: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionUsageSummary:
 *       type: object
 *       properties:
 *         jobPostings:
 *           type: object
 *           properties:
 *             used:
 *               type: number
 *               description: Number of job postings used
 *             limit:
 *               type: number
 *               description: Maximum job postings allowed (-1 for unlimited)
 *             canCreate:
 *               type: boolean
 *               description: Whether client can create more job postings
 *           required:
 *             - used
 *             - limit
 *             - canCreate
 *         candidateViews:
 *           type: object
 *           properties:
 *             used:
 *               type: number
 *               description: Number of candidate views used
 *             limit:
 *               type: number
 *               description: Maximum candidate views allowed (-1 for unlimited)
 *             canView:
 *               type: boolean
 *               description: Whether client can view more candidate profiles
 *           required:
 *             - used
 *             - limit
 *             - canView
 *         aiAssessments:
 *           type: object
 *           properties:
 *             used:
 *               type: number
 *               description: Number of AI assessments used
 *             limit:
 *               type: number
 *               description: Maximum AI assessments allowed (-1 for unlimited)
 *             canCreate:
 *               type: boolean
 *               description: Whether client can create more AI assessments
 *           required:
 *             - used
 *             - limit
 *             - canCreate
 *         seats:
 *           type: object
 *           properties:
 *             used:
 *               type: number
 *               description: Number of seats used
 *             limit:
 *               type: number
 *               description: Maximum seats allowed (-1 for unlimited)
 *             canAdd:
 *               type: boolean
 *               description: Whether client can add more team members
 *           required:
 *             - used
 *             - limit
 *             - canAdd
 *       required:
 *         - jobPostings
 *         - candidateViews
 *         - aiAssessments
 *         - seats
 */
export interface ISubscriptionUsageSummary {
  jobPostings: {
    used: number;
    limit: number;
    canCreate: boolean;
  };
  candidateViews: {
    used: number;
    limit: number;
    canView: boolean;
  };
  aiAssessments: {
    used: number;
    limit: number;
    canCreate: boolean;
  };
  seats: {
    used: number;
    limit: number;
    canAdd: boolean;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitType:
 *       type: object
 *       properties:
 *         JOB_POSTINGS:
 *           type: string
 *           description: Job postings limit type
 *         CANDIDATE_VIEWS:
 *           type: string
 *           description: Candidate views limit type
 *         AI_ASSESSMENTS:
 *           type: string
 *           description: AI assessments limit type
 *         SEATS:
 *           type: string
 *           description: Seats limit type
 */
export interface ISubscriptionLimitType {
  JOB_POSTINGS: 'jobPostings';
  CANDIDATE_VIEWS: 'candidateViews';
  AI_ASSESSMENTS: 'aiAssessments';
  SEATS: 'seats';
}

export const SUBSCRIPTION_LIMIT_TYPES: ISubscriptionLimitType = {
  JOB_POSTINGS: 'jobPostings',
  CANDIDATE_VIEWS: 'candidateViews',
  AI_ASSESSMENTS: 'aiAssessments',
  SEATS: 'seats',
} as const;

export type SubscriptionLimitType =
  (typeof SUBSCRIPTION_LIMIT_TYPES)[keyof typeof SUBSCRIPTION_LIMIT_TYPES];

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitError:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: Type of limit that was exceeded
 *         message:
 *           type: string
 *           description: Error message
 *         currentUsage:
 *           type: number
 *           description: Current usage count
 *         limit:
 *           type: number
 *           description: Maximum allowed limit
 *         code:
 *           type: string
 *           enum: [SUBSCRIPTION_LIMIT_REACHED, SUBSCRIPTION_REQUIRED, SUBSCRIPTION_INACTIVE]
 *           description: Error code
 *       required:
 *         - type
 *         - message
 *         - currentUsage
 *         - limit
 *         - code
 */
export interface ISubscriptionLimitError {
  type: SubscriptionLimitType;
  message: string;
  currentUsage: number;
  limit: number;
  code:
    | 'SUBSCRIPTION_LIMIT_REACHED'
    | 'SUBSCRIPTION_REQUIRED'
    | 'SUBSCRIPTION_INACTIVE';
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISubscriptionLimitValidation:
 *       type: object
 *       properties:
 *         isValid:
 *           type: boolean
 *           description: Whether the validation passed
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ISubscriptionLimitError'
 *           description: List of validation errors
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *           description: List of validation warnings
 *       required:
 *         - isValid
 *         - errors
 *         - warnings
 */
export interface ISubscriptionLimitValidation {
  isValid: boolean;
  errors: ISubscriptionLimitError[];
  warnings: string[];
}

/**
 * Utility functions for subscription limits
 */

/**
 * Check if a limit is unlimited (-1)
 * @param limit - The limit value to check
 * @returns True if the limit is unlimited
 */
export const isUnlimited = (limit: number): boolean => {
  return limit === -1;
};

/**
 * Check if current usage has reached the limit
 * @param currentUsage - Current usage count
 * @param limit - Maximum allowed limit
 * @returns True if the limit has been reached
 */
export const hasReachedLimit = (
  currentUsage: number,
  limit: number
): boolean => {
  if (isUnlimited(limit)) {
    return false;
  }
  return currentUsage >= limit;
};

/**
 * Calculate remaining quota
 * @param currentUsage - Current usage count
 * @param limit - Maximum allowed limit
 * @returns Remaining quota (-1 for unlimited)
 */
export const getRemainingQuota = (
  currentUsage: number,
  limit: number
): number => {
  if (isUnlimited(limit)) {
    return -1; // Unlimited
  }
  return Math.max(0, limit - currentUsage);
};

/**
 * Calculate usage percentage
 * @param currentUsage - Current usage count
 * @param limit - Maximum allowed limit
 * @returns Usage percentage (0-100)
 */
export const getUsagePercentage = (
  currentUsage: number,
  limit: number
): number => {
  if (isUnlimited(limit)) {
    return 0; // No percentage for unlimited
  }
  if (limit === 0) {
    return 100; // If limit is 0, usage is 100%
  }
  return Math.min(100, (currentUsage / limit) * 100);
};

/**
 * Format a user-friendly limit message
 * @param limitType - Type of limit being checked
 * @param currentUsage - Current usage count
 * @param limit - Maximum allowed limit
 * @returns Formatted message for the user
 */
export const formatLimitMessage = (
  limitType: SubscriptionLimitType,
  currentUsage: number,
  limit: number
): string => {
  const typeLabels = {
    [SUBSCRIPTION_LIMIT_TYPES.JOB_POSTINGS]: 'job postings',
    [SUBSCRIPTION_LIMIT_TYPES.CANDIDATE_VIEWS]: 'candidate views',
    [SUBSCRIPTION_LIMIT_TYPES.AI_ASSESSMENTS]: 'AI assessments',
    [SUBSCRIPTION_LIMIT_TYPES.SEATS]: 'team members',
  };

  const label = typeLabels[limitType];

  if (isUnlimited(limit)) {
    return `You have unlimited ${label} available.`;
  }

  const remaining = getRemainingQuota(currentUsage, limit);
  const percentage = getUsagePercentage(currentUsage, limit);

  if (remaining === 0) {
    return `You have reached your ${label} limit of ${limit}. Please upgrade your subscription to continue.`;
  }

  return `You have ${remaining} ${label} remaining out of ${limit} (${percentage.toFixed(1)}% used).`;
};
