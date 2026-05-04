import {
  IApiRequest,
  IApiResponse,
  IPaginatedResponse,
} from '../common/common.api';
import {
  ITourDefinition,
  IUserTourProgress,
  ITourAnalytics,
  IStartTourRequest,
  IUpdateTourProgressRequest,
  IGetUserToursResponse,
  ITourStepResponse,
  ITourStatusResponse,
} from '../../domain/tour/tour.guidance.domain';

// Get User Tours
export type IGetUserToursApiRequest = IApiRequest<void>;
export type IGetUserToursApiResponse = IApiResponse<IGetUserToursResponse>;

// Start Tour
export type IStartTourApiRequest = IApiRequest<IStartTourRequest>;
export type IStartTourApiResponse = IApiResponse<IUserTourProgress>;

// Get Current Tour Step
export type IGetTourStepApiRequest = IApiRequest<
  void,
  void,
  { tourId: string }
>;
export type IGetTourStepApiResponse = IApiResponse<ITourStepResponse>;

// Update Tour Progress
export type IUpdateTourProgressApiRequest =
  IApiRequest<IUpdateTourProgressRequest>;
export type IUpdateTourProgressApiResponse = IApiResponse<IUserTourProgress>;

// Pause Tour
export type IPauseTourApiRequest = IApiRequest<void, void, { tourId: string }>;
export type IPauseTourApiResponse = IApiResponse<IUserTourProgress>;

// Resume Tour
export type IResumeTourApiRequest = IApiRequest<void, void, { tourId: string }>;
export type IResumeTourApiResponse = IApiResponse<IUserTourProgress>;

// Complete Tour
export type ICompleteTourApiRequest = IApiRequest<
  void,
  void,
  { tourId: string }
>;
export type ICompleteTourApiResponse = IApiResponse<IUserTourProgress>;

// Dismiss Tour
export type IDismissTourApiRequest = IApiRequest<
  void,
  void,
  { tourId: string }
>;
export type IDismissTourApiResponse = IApiResponse<IUserTourProgress>;

// Skip Tour
export type ISkipTourApiRequest = IApiRequest<
  void,
  { stepId?: string },
  { tourId: string }
>;
export type ISkipTourApiResponse = IApiResponse<IUserTourProgress>;

// Reset Tour
export type IResetTourApiRequest = IApiRequest<void, void, { tourId: string }>;
export type IResetTourApiResponse = IApiResponse<IUserTourProgress>;

// Get Tour Analytics (Admin only)
export type IGetTourAnalyticsApiRequest = IApiRequest<
  void,
  {
    tourId?: string;
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }
>;
export type IGetTourAnalyticsApiResponse = IPaginatedResponse<ITourAnalytics>;

// Admin: Create Tour Definition
export type ICreateTourDefinitionApiRequest = IApiRequest<
  Omit<ITourDefinition, 'id' | 'createdAt' | 'updatedAt'>
>;
export type ICreateTourDefinitionApiResponse = IApiResponse<ITourDefinition>;

// Admin: Update Tour Definition
export type IUpdateTourDefinitionApiRequest = IApiRequest<
  Partial<ITourDefinition>,
  void,
  { tourId: string }
>;
export type IUpdateTourDefinitionApiResponse = IApiResponse<ITourDefinition>;

// Admin: Get All Tours
export type IGetAllToursApiRequest = IApiRequest<
  void,
  {
    userType?: string;
    userRole?: string;
    isActive?: boolean;
  }
>;
export type IGetAllToursApiResponse = IPaginatedResponse<ITourDefinition>;

// Get Tour Progress
export type IGetTourProgressApiRequest = IApiRequest<
  void,
  void,
  { tourKey: string }
>;
export type IGetTourProgressApiResponse = IApiResponse<IUserTourProgress>;

// Get Tour Status
export type IGetTourStatusApiRequest = IApiRequest<
  void,
  void,
  { tourKey: string }
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     TourStatusApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/TourStatusResponse'
 */
export type IGetTourStatusApiResponse = IApiResponse<ITourStatusResponse>;
