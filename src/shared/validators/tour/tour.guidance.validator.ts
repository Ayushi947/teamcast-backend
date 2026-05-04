import { z } from 'zod';
import {
  TourActionEnum,
  TourStepTypeEnum,
  TourTriggerTypeEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '../../../shared/models/common/enums';

// Tour Step Validator
export const tourStepValidator = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  stepType: z.nativeEnum(TourStepTypeEnum),
  targetSelector: z.string().optional(),
  placement: z.enum(['top', 'bottom', 'left', 'right', 'center']).optional(),
  showSkip: z.boolean().optional(),
  showNext: z.boolean().optional(),
  showPrevious: z.boolean().optional(),
  autoAdvance: z.boolean().optional(),
  autoAdvanceDelay: z.number().min(0).max(30000).optional(),
  isRequired: z.boolean().optional(),
  prerequisites: z.array(z.string()).optional(),
  actionRequired: z
    .object({
      type: z.enum(['click', 'input', 'navigate', 'upload', 'submit']),
      selector: z.string().optional(),
      value: z.string().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
  mediaUrl: z.string().url().optional(),
  customData: z.record(z.any()).optional(),
});

// Tour Settings Validator
export const tourSettingsValidator = z.object({
  allowSkip: z.boolean(),
  allowPause: z.boolean(),
  showProgress: z.boolean(),
  autoStart: z.boolean(),
  backdrop: z.boolean(),
  highlightClass: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']),
  position: z.enum(['fixed', 'absolute']),
  zIndex: z.number().min(0).max(10000),
  animation: z.enum(['fade', 'slide', 'zoom', 'none']),
  restartable: z.boolean(),
  maxDismissals: z.number().min(0).max(10),
  customCSS: z.string().optional(),
});

// Tour Trigger Conditions Validator
export const tourTriggerConditionsValidator = z.object({
  triggerType: z.nativeEnum(TourTriggerTypeEnum),
  conditions: z.object({
    pageUrl: z.string().optional(),
    pagePattern: z.string().optional(),
    profileCompleted: z.boolean().optional(),
    assessmentCompleted: z.boolean().optional(),
    resumeUploaded: z.boolean().optional(),
    jobPosted: z.boolean().optional(),
    applicationSubmitted: z.boolean().optional(),
    daysAfterSignup: z.number().min(0).max(365).optional(),
    specificDate: z.string().optional(),
    featureUsed: z.array(z.string()).optional(),
    featureNotUsed: z.array(z.string()).optional(),
    customConditions: z.record(z.any()).optional(),
  }),
  excludeConditions: z
    .object({
      tourCompleted: z.array(z.string()).optional(),
      userType: z.array(z.nativeEnum(UserTypeEnum)).optional(),
      userRole: z.array(z.nativeEnum(UserRoleEnum)).optional(),
    })
    .optional(),
});

// Start Tour Validator
export const startTourValidator = z.object({
  body: z.object({
    tourKey: z
      .string()
      .min(1)
      .max(100, { message: 'Tour key must be at most 100 characters' }),
    customSettings: tourSettingsValidator.partial().optional(),
    currentPage: z.string().optional(),
  }),
});

// Update Tour Progress Validator
export const updateTourProgressValidator = z.object({
  body: z.object({
    tourId: z.string().uuid({ message: 'Invalid tour ID format' }),
    stepId: z.string().min(1).max(50).optional(),
    action: z.nativeEnum(TourActionEnum, { message: 'Invalid tour action' }),
    metadata: z.record(z.any()).optional(),
  }),
});

// Tour ID Parameter Validator
export const tourIdValidator = z.object({
  params: z.object({
    tourId: z.string().uuid({ message: 'Invalid tour ID format' }),
  }),
});

// Create Tour Definition Validator
export const createTourDefinitionValidator = z.object({
  body: z.object({
    tourKey: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9_]+$/, {
        message:
          'Tour key must contain only lowercase letters, numbers, and underscores',
      }),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    userType: z.nativeEnum(UserTypeEnum),
    userRole: z.nativeEnum(UserRoleEnum).optional(),
    isActive: z.boolean().default(true),
    priority: z.number().min(0).max(100).default(0),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, { message: 'Version must be in format x.y.z' }),
    triggerConditions: tourTriggerConditionsValidator,
    tourSteps: z
      .array(tourStepValidator)
      .min(1, { message: 'Tour must have at least one step' }),
    tourSettings: tourSettingsValidator,
  }),
});

// Update Tour Definition Validator
export const updateTourDefinitionValidator = z.object({
  params: z.object({
    tourId: z.string().uuid({ message: 'Invalid tour ID format' }),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
    priority: z.number().min(0).max(100).optional(),
    triggerConditions: tourTriggerConditionsValidator.optional(),
    tourSteps: z.array(tourStepValidator).min(1).optional(),
    tourSettings: tourSettingsValidator.optional(),
  }),
});

// Get Tour Analytics Validator
export const getTourAnalyticsValidator = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    tourId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    action: z.nativeEnum(TourActionEnum).optional(),
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
});

// Get All Tours Validator
export const getAllToursValidator = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    userType: z.nativeEnum(UserTypeEnum).optional(),
    userRole: z.nativeEnum(UserRoleEnum).optional(),
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
});
