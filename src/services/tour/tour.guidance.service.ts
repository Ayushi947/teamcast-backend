import { PrismaClient } from '@prisma/client';
import { singleton } from '../../shared/decorators/singleton';
import { AppError } from '../../utils/app.error';
import { ErrorCode } from '../../utils/error.codes';
import {
  ITourDefinition,
  IUserTourProgress,
  ITourAnalytics,
  IUpdateTourProgressRequest,
  IGetUserToursResponse,
  ITourStepResponse,
  ITourStep,
  ITourStatusResponse,
} from '../../shared/models/domain/tour/tour.guidance.domain';
import {
  TourActionEnum,
  UserTypeEnum,
  UserRoleEnum,
} from '../../shared/models/common/enums';
import { logger } from '../../shared/utils/logger';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../shared/models/api/common/common.api';
import { getPaginationInfo } from '../../utils/pagination';
import { ENV } from '../../config/env';

@singleton
export class TourGuidanceService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get tour progress by tour key
   */
  async getTourProgressByKey(
    userId: string,
    tourKey: string
  ): Promise<IUserTourProgress | null> {
    try {
      const tourProgress = await this.prisma.user_tour_progress.findUnique({
        where: {
          userId_tourKey: {
            userId,
            tourKey,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, type: true, role: true },
          },
        },
      });

      return tourProgress
        ? this.mapUserTourProgressToDomain(tourProgress)
        : null;
    } catch (error) {
      logger.error('Error getting tour progress by key:', error);
      throw new AppError(
        'Failed to get tour progress',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get tour status by tour key
   */
  async getTourStatusByKey(
    userId: string,
    tourKey: string
  ): Promise<ITourStatusResponse> {
    try {
      logger.info('Getting tour status by key:', { userId, tourKey });

      const tourProgress = await this.prisma.user_tour_progress.findUnique({
        where: {
          userId_tourKey: {
            userId,
            tourKey,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, type: true, role: true },
          },
        },
      });

      if (!tourProgress) {
        logger.info('Tour progress not found, returning default status:', {
          userId,
          tourKey,
        });
        // Return default status when no tour progress exists
        return {
          tourKey,
          status: 'NOT_STARTED',
          isCompleted: false,
          isPaused: false,
          isDismissed: false,
          currentStepIndex: 0,
          completedSteps: [],
          skippedSteps: [],
          progress: undefined,
        };
      }

      const status = {
        tourKey,
        status: tourProgress.status,
        isCompleted: tourProgress.isCompleted,
        isPaused: tourProgress.isPaused,
        isDismissed: tourProgress.isDismissed || false,
        currentStepIndex: tourProgress.currentStepIndex || 0,
        completedSteps: (tourProgress.completedSteps as string[]) || [],
        skippedSteps: (tourProgress.skippedSteps as string[]) || [],
        progress: this.mapUserTourProgressToDomain(tourProgress),
      };

      logger.info('Tour status retrieved:', status);
      return status;
    } catch (error) {
      logger.error('Error getting tour status by key:', error);
      throw new AppError(
        'Failed to get tour status',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get tour definition by tour key
   */
  async getTourDefinition(tourKey: string): Promise<ITourDefinition | null> {
    try {
      const tourDefinition = await this.prisma.tour_definition.findUnique({
        where: { tourKey },
      });

      return tourDefinition
        ? this.mapTourDefinitionToDomain(tourDefinition)
        : null;
    } catch (error) {
      logger.error('Error getting tour definition:', error);
      throw new AppError(
        'Failed to get tour definition',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get available, active, completed, and suggested tours for a user
   */
  async getUserTours(
    userId: string,
    userType: UserTypeEnum,
    userRole?: UserRoleEnum
  ): Promise<IGetUserToursResponse> {
    try {
      // Get all tour definitions for user type/role
      const availableTours = await this.prisma.tour_definition.findMany({
        where: {
          isActive: true,
          userType: userType as any,
          ...(userRole ? { userRole: userRole as any } : {}),
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      // Get user's tour progress
      const userProgress = await this.prisma.user_tour_progress.findMany({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, type: true, role: true },
          },
        },
      });

      // Categorize tours
      const activeTours = userProgress.filter(
        (p: any) => p.status === 'IN_PROGRESS' || p.status === 'PAUSED'
      );

      const completedTours = userProgress.filter(
        (p: any) => p.status === 'COMPLETED'
      );

      // Get suggested tours based on user state and progress
      const suggestedTours = await this.getSuggestedTours(
        availableTours,
        userProgress
      );

      return {
        availableTours: availableTours.map(this.mapTourDefinitionToDomain),
        activeTours: activeTours.map(this.mapUserTourProgressToDomain),
        completedTours: completedTours.map(this.mapUserTourProgressToDomain),
        suggestedTours: suggestedTours.map(this.mapTourDefinitionToDomain),
      };
    } catch (error) {
      logger.error('Error getting user tours:', error);
      throw new AppError(
        'Failed to get user tours',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Start a tour for a user
   */
  async startTour(
    userId: string,
    tourKey: string,
    customSettings?: any,
    currentPage?: string
  ): Promise<IUserTourProgress> {
    try {
      logger.info('Starting tour process', {
        userId,
        tourKey,
        customSettings,
        currentPage,
      });

      // Get tour definition
      const tourDefinition = await this.prisma.tour_definition.findUnique({
        where: { tourKey },
      });

      if (!tourDefinition || !tourDefinition.isActive) {
        logger.warn('Tour not found or inactive', {
          tourKey,
          found: !!tourDefinition,
          isActive: tourDefinition?.isActive,
        });
        throw new AppError(
          'Tour not found or inactive',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Check if user already has this tour
      logger.debug('Checking existing tour progress', {
        userId,
        tourKey,
        tourId: tourDefinition.id,
      });
      const existingProgress = await this.prisma.user_tour_progress.findUnique({
        where: {
          userId_tourKey: {
            userId,
            tourKey,
          },
        },
        include: {
          user: {
            select: { id: true, name: true, type: true, role: true },
          },
        },
      });

      logger.debug('Existing progress result', {
        found: !!existingProgress,
        status: existingProgress?.status,
        isCompleted: existingProgress?.isCompleted,
        isPaused: existingProgress?.isPaused,
      });

      // If tour is already completed, don't restart
      if (existingProgress?.status === 'COMPLETED') {
        logger.info('Tour already completed, not restarting', {
          userId,
          tourKey,
          progressId: existingProgress.id,
        });
        return this.mapUserTourProgressToDomain(existingProgress);
      }

      // If tour exists but not completed, update it to IN_PROGRESS
      if (existingProgress) {
        const updatedProgress = await this.prisma.user_tour_progress.update({
          where: { id: existingProgress.id },
          data: {
            status: 'IN_PROGRESS',
            isPaused: false,
            currentPage: currentPage || existingProgress.currentPage,
            lastActiveAt: new Date(),
            startedAt: existingProgress.startedAt || new Date(),
          },
          include: {
            user: {
              select: { id: true, name: true, type: true, role: true },
            },
          },
        });

        return this.mapUserTourProgressToDomain(updatedProgress);
      }

      // Create new tour progress
      logger.debug('Creating new tour progress', {
        userId,
        tourKey,
        tourId: tourDefinition.id,
        customSettings: !!customSettings,
        defaultSettings: !!tourDefinition.tourSettings,
      });

      const tourSteps = tourDefinition.tourSteps as unknown as ITourStep[];
      const firstStepId = tourSteps.length > 0 ? tourSteps[0].id : null;

      const tourProgressData = {
        userId,
        tourId: tourDefinition.id,
        tourKey,
        stepId: firstStepId,
        currentStepIndex: 0,
        status: 'IN_PROGRESS' as const,
        isCompleted: false,
        isPaused: false,
        isDismissed: false,
        dismissCount: 0,
        currentPage,
        startedAt: new Date(),
        lastActiveAt: new Date(),
        tourSettings: customSettings || tourDefinition.tourSettings,
        completedSteps: [],
        skippedSteps: [],
      };

      logger.debug('Tour progress data to create', tourProgressData);

      const tourProgress = await this.prisma.user_tour_progress.create({
        data: tourProgressData,
        include: {
          user: {
            select: { id: true, name: true, type: true, role: true },
          },
        },
      });

      logger.info('Tour progress created successfully', {
        progressId: tourProgress.id,
        userId: tourProgress.userId,
        tourKey: tourProgress.tourKey,
        tourId: tourProgress.tourId,
      });

      // Log tour start action
      await this.logTourAction(
        userId,
        tourDefinition.id,
        firstStepId || '',
        'START' as any
      );

      logger.info('Tour started successfully', {
        userId,
        tourKey,
        progressId: tourProgress.id,
      });
      return this.mapUserTourProgressToDomain(tourProgress);
    } catch (error) {
      logger.error('Error starting tour - detailed error:', {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
        userId,
        tourKey,
        customSettings: !!customSettings,
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to start tour',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current tour step for a user
   */
  async getTourStep(
    userId: string,
    tourId: string
  ): Promise<ITourStepResponse> {
    try {
      const tourProgress = await this.prisma.user_tour_progress.findUnique({
        where: {
          userId_tourId: {
            userId,
            tourId,
          },
        },
      });

      if (!tourProgress) {
        throw new AppError('Tour progress not found', 404, ErrorCode.NOT_FOUND);
      }

      const tourDefinition = await this.prisma.tour_definition.findUnique({
        where: { id: tourId },
      });

      if (!tourDefinition) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const tourSteps = tourDefinition.tourSteps as unknown as ITourStep[];
      const currentStepIndex = tourSteps.findIndex(
        (step) => step.id === tourProgress.stepId
      );

      let currentStep: ITourStep | null = null;

      if (currentStepIndex >= 0) {
        currentStep = tourSteps[currentStepIndex];
      } else if (tourSteps.length > 0) {
        // If no current step, start with the first step
        currentStep = tourSteps[0];
      }

      return {
        currentStep: currentStep!,
        progress: {
          currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : 0,
          totalSteps: tourSteps.length,
          completedSteps: ((tourProgress.completedSteps as string[]) || [])
            .length,
          percentComplete: Math.round(
            (((tourProgress.completedSteps as string[]) || []).length /
              tourSteps.length) *
              100
          ),
        },
        navigation: {
          canGoNext: currentStepIndex < tourSteps.length - 1,
          canGoPrevious: currentStepIndex > 0,
          canSkip:
            (tourDefinition.tourSettings as any)?.allowSkip ||
            currentStep?.showSkip ||
            false,
          canPause: (tourDefinition.tourSettings as any)?.allowPause || false,
        },
        tour: {
          id: tourDefinition.id,
          name: tourDefinition.name,
          settings: tourDefinition.tourSettings as any,
        },
      };
    } catch (error) {
      logger.error('Error getting tour step:', error);
      throw new AppError(
        'Failed to get tour step',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update tour progress (next step, previous step, skip step, etc.)
   */
  async updateTourProgress(
    userId: string,
    request: IUpdateTourProgressRequest
  ): Promise<IUserTourProgress> {
    try {
      const { tourId, action, stepId, metadata } = request;

      const tourProgress = await this.prisma.user_tour_progress.findUnique({
        where: {
          userId_tourId: {
            userId,
            tourId,
          },
        },
      });

      if (!tourProgress) {
        throw new AppError('Tour progress not found', 404, ErrorCode.NOT_FOUND);
      }

      const tourDefinition = await this.prisma.tour_definition.findUnique({
        where: { id: tourId },
      });

      if (!tourDefinition) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const tourSteps = tourDefinition.tourSteps as unknown as ITourStep[];
      let newStatus = tourProgress.status;
      let newStepId = tourProgress.stepId;
      let newStepIndex = tourProgress.currentStepIndex || 0;
      const initialCompletedSteps =
        (tourProgress.completedSteps as string[]) || [];
      const initialSkippedSteps = (tourProgress.skippedSteps as string[]) || [];
      let completedSteps = [...initialCompletedSteps];
      let skippedSteps = [...initialSkippedSteps];

      // Handle different actions
      switch (action) {
        case 'NEXT_STEP': {
          const currentIndex = tourSteps.findIndex(
            (step) => step.id === stepId
          );
          if (currentIndex >= 0 && currentIndex < tourSteps.length - 1) {
            newStepId = tourSteps[currentIndex + 1].id;
            newStepIndex = currentIndex + 1;
            if (stepId && !completedSteps.includes(stepId)) {
              completedSteps = [...completedSteps, stepId];
            }
          } else if (currentIndex === tourSteps.length - 1) {
            // Last step completed
            newStatus = 'COMPLETED';
            newStepId = stepId || null;
            newStepIndex = currentIndex;
            if (stepId && !completedSteps.includes(stepId)) {
              completedSteps = [...completedSteps, stepId];
            }
          }
          break;
        }

        case 'PREVIOUS_STEP': {
          const currentStepIndex = tourSteps.findIndex(
            (step) => step.id === stepId
          );
          if (currentStepIndex > 0) {
            newStepId = tourSteps[currentStepIndex - 1].id;
            newStepIndex = currentStepIndex - 1;
          }
          break;
        }

        case 'SKIP_STEP': {
          if (stepId && !skippedSteps.includes(stepId)) {
            skippedSteps = [...skippedSteps, stepId];
          }
          // Move to next step
          const skipIndex = tourSteps.findIndex((step) => step.id === stepId);
          if (skipIndex >= 0 && skipIndex < tourSteps.length - 1) {
            newStepId = tourSteps[skipIndex + 1].id;
            newStepIndex = skipIndex + 1;
          } else if (skipIndex === tourSteps.length - 1) {
            newStatus = 'COMPLETED';
            newStepId = stepId || null;
            newStepIndex = skipIndex;
          }
          break;
        }

        case 'SKIP_TOUR': {
          // Skip the entire tour - mark as completed with all steps skipped
          newStatus = 'COMPLETED';
          newStepId = null;
          newStepIndex = tourSteps.length - 1;
          // Mark all remaining steps as skipped
          const currentStepIndex = tourSteps.findIndex(
            (step) => step.id === stepId
          );
          if (currentStepIndex >= 0) {
            for (let i = currentStepIndex; i < tourSteps.length; i++) {
              const stepToSkip = tourSteps[i].id;
              if (!skippedSteps.includes(stepToSkip)) {
                skippedSteps = [...skippedSteps, stepToSkip];
              }
            }
          }
          break;
        }

        case 'COMPLETE':
          newStatus = 'COMPLETED';
          newStepId = stepId || null;
          if (stepId && !completedSteps.includes(stepId)) {
            completedSteps = [...completedSteps, stepId];
          }
          break;

        case 'DISMISS':
          newStatus = 'DISMISSED';
          break;

        default:
          throw new AppError('Invalid action', 400, ErrorCode.INVALID_REQUEST);
      }

      // Update tour progress
      const updatedProgress = await this.prisma.user_tour_progress.update({
        where: {
          userId_tourId: {
            userId,
            tourId,
          },
        },
        data: {
          status: newStatus,
          stepId: newStepId,
          currentStepIndex: newStepIndex,
          completedSteps,
          skippedSteps,
          isCompleted: newStatus === 'COMPLETED',
          completedAt: newStatus === 'COMPLETED' ? new Date() : null,
          lastActiveAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, type: true, role: true },
          },
        },
      });

      // Log the action
      await this.logTourAction(userId, tourId, stepId || '', action, metadata);

      return this.mapUserTourProgressToDomain(updatedProgress);
    } catch (error) {
      logger.error('Error updating tour progress:', error);
      throw new AppError(
        'Failed to update tour progress',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Pause a tour
   */
  async pauseTour(userId: string, tourId: string): Promise<IUserTourProgress> {
    return this.updateTourStatus(userId, tourId, 'PAUSED', {
      isPaused: true,
    });
  }

  /**
   * Resume a paused tour
   */
  async resumeTour(userId: string, tourId: string): Promise<IUserTourProgress> {
    return this.updateTourStatus(userId, tourId, 'IN_PROGRESS', {
      isPaused: false,
    });
  }

  /**
   * Complete a tour
   */
  async completeTour(
    userId: string,
    tourId: string
  ): Promise<IUserTourProgress> {
    logger.debug('Completing tour:', { userId, tourId });
    return this.updateTourStatus(userId, tourId, 'COMPLETED', {
      isCompleted: true,
      completedAt: new Date(),
    });
  }

  /**
   * Dismiss a tour
   * If the tour belongs to a group, dismiss all tours in that group
   */
  async dismissTour(
    userId: string,
    tourId: string
  ): Promise<IUserTourProgress> {
    try {
      // Get the tour definition to check for tourGroup
      const tourDefinition = await this.prisma.tour_definition.findUnique({
        where: { id: tourId },
      });

      if (!tourDefinition) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // If tour has a group, dismiss all tours in that group
      if (tourDefinition.tourGroup) {
        return await this.dismissTourGroup(userId, tourDefinition.tourGroup);
      }

      // Otherwise, just dismiss this single tour
      return this.updateTourStatus(userId, tourId, 'DISMISSED');
    } catch (error) {
      logger.error('Error dismissing tour:', error);
      throw new AppError(
        'Failed to dismiss tour',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Dismiss all tours in a group
   */
  private async dismissTourGroup(
    userId: string,
    tourGroup: string
  ): Promise<IUserTourProgress> {
    try {
      // Find all tours in the group
      const toursInGroup = await this.prisma.tour_definition.findMany({
        where: {
          tourGroup,
          isActive: true,
        },
        select: {
          id: true,
          tourKey: true,
        },
      });

      if (toursInGroup.length === 0) {
        throw new AppError('No tours found in group', 404, ErrorCode.NOT_FOUND);
      }

      // Dismiss all tours in the group
      const dismissedTours: IUserTourProgress[] = [];
      for (const tour of toursInGroup) {
        try {
          // Check if tour progress exists
          const tourProgress = await this.prisma.user_tour_progress.findUnique({
            where: {
              userId_tourId: {
                userId,
                tourId: tour.id,
              },
            },
          });

          // Only dismiss if progress exists and not already dismissed
          if (tourProgress && tourProgress.status !== 'DISMISSED') {
            const dismissed = await this.updateTourStatus(
              userId,
              tour.id,
              'DISMISSED'
            );
            dismissedTours.push(dismissed);
          }
        } catch (error) {
          // Continue with other tours even if one fails
          logger.warn(`Failed to dismiss tour ${tour.tourKey}:`, error);
        }
      }

      // Return the first dismissed tour (or the original one if available)
      return (
        dismissedTours[0] ||
        (await this.updateTourStatus(userId, toursInGroup[0].id, 'DISMISSED'))
      );
    } catch (error) {
      logger.error('Error dismissing tour group:', error);
      throw new AppError(
        'Failed to dismiss tour group',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Skip the entire tour
   * If the tour belongs to a group, skip all tours in that group
   */
  async skipTour(
    userId: string,
    tourId: string,
    stepId?: string
  ): Promise<IUserTourProgress> {
    try {
      const tourProgress = await this.prisma.user_tour_progress.findUnique({
        where: {
          userId_tourId: {
            userId,
            tourId,
          },
        },
      });

      if (!tourProgress) {
        throw new AppError('Tour progress not found', 404, ErrorCode.NOT_FOUND);
      }

      const tourDefinition = await this.prisma.tour_definition.findUnique({
        where: { id: tourId },
      });

      if (!tourDefinition) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // If tour has a group, skip all tours in that group
      if (tourDefinition.tourGroup) {
        return await this.skipTourGroup(
          userId,
          tourDefinition.tourGroup,
          tourId,
          stepId
        );
      }

      // Otherwise, just skip this single tour
      return await this.skipSingleTour(
        userId,
        tourId,
        tourProgress,
        tourDefinition,
        stepId
      );
    } catch (error) {
      logger.error('Error skipping tour:', error);
      throw new AppError(
        'Failed to skip tour',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Skip a single tour (helper method)
   */
  private async skipSingleTour(
    userId: string,
    tourId: string,
    tourProgress: any,
    tourDefinition: any,
    stepId?: string
  ): Promise<IUserTourProgress> {
    const tourSteps = tourDefinition.tourSteps as unknown as ITourStep[];
    const currentStepIndex = tourSteps.findIndex(
      (step) => step.id === (stepId || tourProgress.stepId)
    );

    // Mark all remaining steps as skipped
    const initialSkippedSteps = (tourProgress.skippedSteps as string[]) || [];
    let skippedSteps = [...initialSkippedSteps];

    if (currentStepIndex >= 0) {
      for (let i = currentStepIndex; i < tourSteps.length; i++) {
        const stepToSkip = tourSteps[i].id;
        if (!skippedSteps.includes(stepToSkip)) {
          skippedSteps = [...skippedSteps, stepToSkip];
        }
      }
    }

    // Update tour progress to completed with all remaining steps skipped
    const updatedProgress = await this.prisma.user_tour_progress.update({
      where: {
        userId_tourId: {
          userId,
          tourId,
        },
      },
      data: {
        status: 'COMPLETED',
        stepId: null,
        currentStepIndex: tourSteps.length - 1,
        completedSteps: tourProgress.completedSteps || [],
        skippedSteps,
        isCompleted: true,
        completedAt: new Date(),
        lastActiveAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, type: true, role: true },
        },
      },
    });

    // Log the skip tour action
    await this.logTourAction(
      userId,
      tourId,
      stepId || '',
      'SKIP_TOUR' as TourActionEnum,
      { reason: 'User chose to skip entire tour' }
    );

    return this.mapUserTourProgressToDomain(updatedProgress);
  }

  /**
   * Skip all tours in a group
   */
  private async skipTourGroup(
    userId: string,
    tourGroup: string,
    originalTourId: string,
    stepId?: string
  ): Promise<IUserTourProgress> {
    try {
      // Find all tours in the group
      const toursInGroup = await this.prisma.tour_definition.findMany({
        where: {
          tourGroup,
          isActive: true,
        },
        select: {
          id: true,
          tourKey: true,
          tourSteps: true,
        },
      });

      if (toursInGroup.length === 0) {
        throw new AppError('No tours found in group', 404, ErrorCode.NOT_FOUND);
      }

      // Skip all tours in the group
      const skippedTours: IUserTourProgress[] = [];
      for (const tour of toursInGroup) {
        try {
          // Check if tour progress exists
          const tourProgress = await this.prisma.user_tour_progress.findUnique({
            where: {
              userId_tourId: {
                userId,
                tourId: tour.id,
              },
            },
          });

          // Only skip if progress exists and not already completed
          if (tourProgress && tourProgress.status !== 'COMPLETED') {
            const skipped = await this.skipSingleTour(
              userId,
              tour.id,
              tourProgress,
              tour,
              stepId
            );
            skippedTours.push(skipped);
          } else if (!tourProgress) {
            // If no progress exists, create a completed progress record
            const tourSteps = tour.tourSteps as unknown as ITourStep[];
            const allStepIds = tourSteps.map((step) => step.id);

            const newProgress = await this.prisma.user_tour_progress.create({
              data: {
                userId,
                tourId: tour.id,
                tourKey: tour.tourKey,
                status: 'COMPLETED',
                stepId: null,
                currentStepIndex: tourSteps.length - 1,
                completedSteps: [],
                skippedSteps: allStepIds,
                isCompleted: true,
                completedAt: new Date(),
                lastActiveAt: new Date(),
              },
              include: {
                user: {
                  select: { id: true, name: true, type: true, role: true },
                },
              },
            });

            // Log the skip tour action
            await this.logTourAction(
              userId,
              tour.id,
              stepId || '',
              'SKIP_TOUR' as TourActionEnum,
              { reason: 'User chose to skip entire tour group' }
            );

            skippedTours.push(this.mapUserTourProgressToDomain(newProgress));
          }
        } catch (error) {
          // Continue with other tours even if one fails
          logger.warn(`Failed to skip tour ${tour.tourKey}:`, error);
        }
      }

      // Return the original tour's progress if available, otherwise return the first skipped tour
      const originalProgress = skippedTours.find(
        (t) => t.tourId === originalTourId
      );
      return (
        originalProgress ||
        skippedTours[0] ||
        (await this.skipSingleTour(
          userId,
          originalTourId,
          await this.prisma.user_tour_progress.findUniqueOrThrow({
            where: {
              userId_tourId: {
                userId,
                tourId: originalTourId,
              },
            },
          }),
          await this.prisma.tour_definition.findUniqueOrThrow({
            where: { id: originalTourId },
          }),
          stepId
        ))
      );
    } catch (error) {
      logger.error('Error skipping tour group:', error);
      throw new AppError(
        'Failed to skip tour group',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Reset a tour (start over)
   */
  async resetTour(userId: string, tourId: string): Promise<IUserTourProgress> {
    return this.updateTourStatus(userId, tourId, 'NOT_STARTED', {
      stepId: null,
      completedSteps: [],
      skippedSteps: [],
      isCompleted: false,
      isPaused: false,
      startedAt: null,
      completedAt: null,
    });
  }

  /**
   * Get tour analytics
   */
  async getTourAnalytics(
    filters: any,
    paginationRequest: IPaginationRequest
  ): Promise<IPaginatedResponse<ITourAnalytics>> {
    try {
      const paginationInfo = getPaginationInfo(paginationRequest);
      const where: any = {};

      // Apply filters
      if (filters.userId) where.userId = filters.userId;
      if (filters.tourId) where.tourId = filters.tourId;
      if (filters.action) where.action = filters.action;
      if (filters.startDate)
        where.timestamp = { gte: new Date(filters.startDate) };
      if (filters.endDate)
        where.timestamp = {
          ...where.timestamp,
          lte: new Date(filters.endDate),
        };

      const total = await this.prisma.tour_analytics.count({ where });

      const analytics = await this.prisma.tour_analytics.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: paginationInfo.skip,
        take: paginationInfo.take,
        include: {
          user: {
            select: { id: true, name: true, type: true, role: true },
          },
        },
      });

      return {
        items: analytics.map(this.mapTourAnalyticsToDomain),
        pagination: {
          total,
          page: paginationRequest.page ?? ENV.DEFAULT_PAGE,
          limit: paginationRequest.limit ?? ENV.DEFAULT_LIMIT,
          totalPages: Math.ceil(
            total / (paginationRequest.limit ?? ENV.DEFAULT_LIMIT)
          ),
        },
      };
    } catch (error) {
      logger.error('Error getting tour analytics:', error);
      throw new AppError(
        'Failed to get tour analytics',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update tour status
   */
  private async updateTourStatus(
    userId: string,
    tourId: string,
    status: string,
    additionalData: any = {}
  ): Promise<IUserTourProgress> {
    try {
      const updatedProgress = await this.prisma.user_tour_progress.update({
        where: {
          userId_tourId: {
            userId,
            tourId,
          },
        },
        data: {
          status,
          lastActiveAt: new Date(),
          ...additionalData,
        },
        include: {
          user: {
            select: { id: true, name: true, type: true, role: true },
          },
        },
      });

      // Log the status change
      let action: TourActionEnum;
      switch (status) {
        case TourActionEnum.PAUSE:
          action = TourActionEnum.PAUSE;
          break;
        case TourActionEnum.RESUME:
          action = TourActionEnum.RESUME;
          break;
        case TourActionEnum.COMPLETE:
          action = TourActionEnum.COMPLETE;
          break;
        case TourActionEnum.DISMISS:
          action = TourActionEnum.DISMISS;
          break;
        default:
          action = TourActionEnum.START;
      }

      await this.logTourAction(userId, tourId, '', action);

      return this.mapUserTourProgressToDomain(updatedProgress);
    } catch (error) {
      logger.error('Error updating tour status:', error);
      throw new AppError(
        'Failed to update tour status',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Log tour action for analytics
   */
  private async logTourAction(
    userId: string,
    tourId: string,
    stepId: string,
    action: TourActionEnum,
    metadata?: any
  ): Promise<void> {
    try {
      await this.prisma.tour_analytics.create({
        data: {
          userId,
          tourId,
          stepId,
          action,
          metadata,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error logging tour action:', error);
      // Don't throw error for analytics logging failures
    }
  }

  /**
   * Get suggested tours based on user state and progress
   */
  private async getSuggestedTours(
    availableTours: any[],
    userProgress: any[]
  ): Promise<any[]> {
    // Filter out tours that user has already completed or dismissed
    const completedTourIds = userProgress
      .filter((p) => p.status === 'COMPLETED' || p.status === 'DISMISSED')
      .map((p) => p.tourId);

    return availableTours.filter((tour) => !completedTourIds.includes(tour.id));
  }

  /**
   * Check if tour trigger conditions are met
   */
  private async checkTourTriggerConditions(
    _userId: string,
    _tourDefinition: any
  ): Promise<boolean> {
    // Implement trigger condition logic based on tourDefinition.triggerConditions
    // This could check user state, page visits, feature usage, etc.
    return true; // Default to true for now
  }

  /**
   * Map tour definition to domain model
   */
  private mapTourDefinitionToDomain(tour: any): ITourDefinition {
    return {
      id: tour.id,
      tourKey: tour.tourKey,
      name: tour.name,
      description: tour.description,
      userType: tour.userType,
      userRole: tour.userRole,
      isActive: tour.isActive,
      priority: tour.priority,
      version: tour.version,
      triggerConditions: tour.triggerConditions,
      tourSteps: tour.tourSteps,
      tourSettings: tour.tourSettings,
      createdBy: tour.createdBy,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
    };
  }

  /**
   * Map user tour progress to domain model
   */
  private mapUserTourProgressToDomain(progress: any): IUserTourProgress {
    return {
      id: progress.id,
      userId: progress.userId,
      tourId: progress.tourId,
      tourKey: progress.tourKey,
      stepId: progress.stepId,
      currentStepIndex: progress.currentStepIndex || 0,
      status: progress.status,
      isCompleted: progress.isCompleted,
      isPaused: progress.isPaused,
      isDismissed: progress.isDismissed || false,
      dismissCount: progress.dismissCount || 0,
      completedSteps: progress.completedSteps || [],
      skippedSteps: progress.skippedSteps || [],
      tourSettings: progress.tourSettings,
      currentPage: progress.currentPage,
      lastStepCompletedAt: progress.lastStepCompletedAt,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      pausedAt: progress.pausedAt,
      resumedAt: progress.resumedAt,
      lastActiveAt: progress.lastActiveAt,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
    };
  }

  /**
   * Map tour analytics to domain model
   */
  private mapTourAnalyticsToDomain(analytics: any): ITourAnalytics {
    return {
      id: analytics.id,
      userId: analytics.userId,
      tourId: analytics.tourId,
      stepId: analytics.stepId,
      action: analytics.action,
      metadata: analytics.metadata,
      timestamp: analytics.timestamp,
    };
  }
}
