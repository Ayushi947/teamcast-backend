import {
  UserTourStatusEnum,
  TourActionEnum,
  TourStepTypeEnum,
  TourTriggerTypeEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '../../common/enums';

// Tour Step Definition
export interface ITourStep {
  id: string;
  title: string;
  content: string;
  stepType: TourStepTypeEnum;
  targetSelector?: string; // CSS selector for element targeting
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showSkip?: boolean;
  showNext?: boolean;
  showPrevious?: boolean;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number; // milliseconds
  isRequired?: boolean;
  prerequisites?: string[]; // Step IDs that must be completed first
  actionRequired?: {
    type: 'click' | 'input' | 'navigate' | 'upload' | 'submit';
    selector?: string;
    value?: string;
    url?: string;
  };
  mediaUrl?: string; // For video or image content
  customData?: Record<string, any>;
}

// Tour Definition
export interface ITourDefinition {
  id: string;
  tourKey: string;
  name: string;
  description?: string;
  userType: UserTypeEnum;
  userRole?: UserRoleEnum;
  isActive: boolean;
  priority: number;
  version: string;
  triggerConditions: ITourTriggerConditions;
  tourSteps: ITourStep[];
  tourSettings: ITourSettings;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tour Trigger Conditions
export interface ITourTriggerConditions {
  triggerType: TourTriggerTypeEnum;
  conditions: {
    // Page-based conditions
    pageUrl?: string;
    pagePattern?: string;

    // User state conditions
    profileCompleted?: boolean;
    assessmentCompleted?: boolean;
    resumeUploaded?: boolean;
    jobPosted?: boolean;
    applicationSubmitted?: boolean;

    // Time-based conditions
    daysAfterSignup?: number;
    specificDate?: string;

    // Feature usage conditions
    featureUsed?: string[];
    featureNotUsed?: string[];

    // Custom conditions
    customConditions?: Record<string, any>;
  };
  excludeConditions?: {
    tourCompleted?: string[]; // Don't show if these tours are completed
    userType?: UserTypeEnum[];
    userRole?: UserRoleEnum[];
  };
}

// Tour Settings
export interface ITourSettings {
  allowSkip: boolean;
  allowPause: boolean;
  showProgress: boolean;
  autoStart: boolean;
  backdrop: boolean;
  highlightClass?: string;
  theme: 'light' | 'dark' | 'auto';
  position: 'fixed' | 'absolute';
  zIndex: number;
  animation: 'fade' | 'slide' | 'zoom' | 'none';
  restartable: boolean;
  maxDismissals: number;
  customCSS?: string;
}

// User Tour Progress
export interface IUserTourProgress {
  id: string;
  userId: string;
  tourId: string;
  tourKey: string;
  stepId?: string;
  currentStepIndex: number;
  status: UserTourStatusEnum;
  isCompleted: boolean;
  isPaused: boolean;
  isDismissed: boolean;
  dismissCount: number;
  completedSteps: string[];
  skippedSteps: string[];
  tourSettings?: Partial<ITourSettings>;
  currentPage?: string;
  lastStepCompletedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tour Analytics
export interface ITourAnalytics {
  id: string;
  userId: string;
  tourId: string;
  stepId: string;
  action: TourActionEnum;
  metadata?: {
    timeSpent?: number;
    errorEncountered?: boolean;
    helpRequested?: boolean;
    skipReason?: string;
    customData?: Record<string, any>;
  };
  timestamp: Date;
}

// API Request/Response Models
export interface IStartTourRequest {
  tourKey: string;
  customSettings?: Partial<ITourSettings>;
  currentPage?: string;
}

export interface IUpdateTourProgressRequest {
  tourId: string;
  stepId?: string;
  action: TourActionEnum;
  metadata?: Record<string, any>;
}

export interface IGetUserToursResponse {
  availableTours: ITourDefinition[];
  activeTours: IUserTourProgress[];
  completedTours: IUserTourProgress[];
  suggestedTours: ITourDefinition[];
}

export interface ITourStepResponse {
  currentStep: ITourStep;
  progress: {
    currentStepIndex: number;
    totalSteps: number;
    completedSteps: number;
    percentComplete: number;
  };
  navigation: {
    canGoNext: boolean;
    canGoPrevious: boolean;
    canSkip: boolean;
    canPause: boolean;
  };
  tour: {
    id: string;
    name: string;
    settings: ITourSettings;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TourStatusResponse:
 *       type: object
 *       properties:
 *         tourKey:
 *           type: string
 *           description: The key of the tour
 *         status:
 *           type: string
 *           description: The status of the tour
 *         isCompleted:
 *           type: boolean
 *           description: Whether the tour is completed
 *         isPaused:
 *           type: boolean
 *           description: Whether the tour is paused
 *         isDismissed:
 *           type: boolean
 *           description: Whether the tour is dismissed
 *         currentStepIndex:
 *           type: number
 *           description: The index of the current step
 *         completedSteps:
 *           type: array
 *           description: The steps that have been completed
 *         skippedSteps:
 *           type: array
 *           description: The steps that have been skipped
 *         progress:
 *           $ref: '#/components/schemas/UserTourProgressResponse'
 */
export interface ITourStatusResponse {
  tourKey: string;
  status: string;
  isCompleted: boolean;
  isPaused: boolean;
  isDismissed: boolean;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  progress?: IUserTourProgress;
}
