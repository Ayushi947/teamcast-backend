import { PrismaClient } from '@prisma/client';
import { singleton } from '../../shared/decorators/singleton';
import { AppError } from '../../utils/app.error';
import { ErrorCode } from '../../utils/error.codes';
import { logger } from '../../shared/utils/logger';
import {
  IPaginationRequest,
  IPaginatedResponse,
} from '../../shared/models/api/common/common.api';
import { getPaginationInfo } from '../../utils/pagination';
import { ITourDefinitionExtended } from '../../shared/models/api/support/tour.definition.management.api';

@singleton
export class TourDefinitionManagementService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all tour definitions with pagination
   */
  async getAllTourDefinitions(
    paginationRequest: IPaginationRequest,
    filters?: {
      userType?: string;
      userRole?: string;
      isActive?: boolean;
      tourGroup?: string;
      search?: string;
    }
  ): Promise<IPaginatedResponse<ITourDefinitionExtended>> {
    try {
      const paginationInfo = getPaginationInfo(paginationRequest);
      const where: any = {};

      // Apply filters
      if (filters?.userType) {
        where.userType = filters.userType;
      }
      if (filters?.userRole) {
        where.userRole = filters.userRole;
      }
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      if (filters?.tourGroup) {
        where.tourGroup = filters.tourGroup;
      }
      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { tourKey: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [total, tourDefinitions] = await Promise.all([
        this.prisma.tour_definition.count({ where }),
        this.prisma.tour_definition.findMany({
          where,
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          skip: paginationInfo.skip,
          take: paginationInfo.take,
        }),
      ]);

      return {
        items: tourDefinitions.map(this.mapTourDefinitionToDomain),
        pagination: {
          total,
          page: paginationRequest.page || 1,
          limit: paginationRequest.limit || 10,
          totalPages: Math.ceil(total / (paginationRequest.limit || 10)),
        },
      };
    } catch (error) {
      logger.error('Error getting all tour definitions:', error);
      throw new AppError(
        'Failed to get tour definitions',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a single tour definition by ID
   */
  async getTourDefinitionById(
    tourId: string
  ): Promise<ITourDefinitionExtended> {
    try {
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

      return this.mapTourDefinitionToDomain(tourDefinition);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting tour definition by ID:', error);
      throw new AppError(
        'Failed to get tour definition',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a single tour definition by tour key
   */
  async getTourDefinitionByKey(
    tourKey: string
  ): Promise<ITourDefinitionExtended> {
    try {
      const tourDefinition = await this.prisma.tour_definition.findUnique({
        where: { tourKey },
      });

      if (!tourDefinition) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      return this.mapTourDefinitionToDomain(tourDefinition);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting tour definition by key:', error);
      throw new AppError(
        'Failed to get tour definition',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a new tour definition
   */
  async createTourDefinition(
    data: Omit<ITourDefinitionExtended, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy?: string
  ): Promise<ITourDefinitionExtended> {
    try {
      // Check if tour key already exists
      const existingTour = await this.prisma.tour_definition.findUnique({
        where: { tourKey: data.tourKey },
      });

      if (existingTour) {
        throw new AppError(
          'Tour definition with this key already exists',
          409,
          ErrorCode.CONFLICT
        );
      }

      const tourDefinition = await this.prisma.tour_definition.create({
        data: {
          tourKey: data.tourKey,
          name: data.name,
          description: data.description || null,
          userType: data.userType,
          userRole: data.userRole ? data.userRole : null,
          isActive: data.isActive,
          priority: data.priority,
          version: data.version,
          pagePattern: data.pagePattern,
          targetPages: data.targetPages,
          triggerConditions: data.triggerConditions as any,
          tourSteps: data.tourSteps as any,
          tourSettings: data.tourSettings as any,
          tourGroup: data.tourGroup || null,
          autoStart: data.autoStart || false,
          restartOnPageChange: data.restartOnPageChange || false,
          createdBy: createdBy || null,
        },
      });

      logger.info('Tour definition created successfully', {
        tourKey: tourDefinition.tourKey,
        id: tourDefinition.id,
      });

      return this.mapTourDefinitionToDomain(tourDefinition);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating tour definition:', error);
      throw new AppError(
        'Failed to create tour definition',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update an existing tour definition
   */
  async updateTourDefinition(
    tourId: string,
    data: Partial<
      Omit<
        ITourDefinitionExtended,
        'id' | 'tourKey' | 'createdAt' | 'updatedAt'
      >
    >,
    _updatedBy?: string
  ): Promise<ITourDefinitionExtended> {
    try {
      // Check if tour definition exists
      const existingTour = await this.prisma.tour_definition.findUnique({
        where: { id: tourId },
      });

      if (!existingTour) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // Note: tourKey cannot be updated once created

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.userType !== undefined) updateData.userType = data.userType;
      if (data.userRole !== undefined) updateData.userRole = data.userRole;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.version !== undefined) updateData.version = data.version;
      if (data.pagePattern !== undefined)
        updateData.pagePattern = data.pagePattern;
      if (data.targetPages !== undefined)
        updateData.targetPages = data.targetPages;
      if (data.triggerConditions !== undefined)
        updateData.triggerConditions = data.triggerConditions;
      if (data.tourSteps !== undefined) updateData.tourSteps = data.tourSteps;
      if (data.tourSettings !== undefined)
        updateData.tourSettings = data.tourSettings;
      if (data.tourGroup !== undefined) updateData.tourGroup = data.tourGroup;
      if (data.autoStart !== undefined) updateData.autoStart = data.autoStart;
      if (data.restartOnPageChange !== undefined)
        updateData.restartOnPageChange = data.restartOnPageChange;

      const tourDefinition = await this.prisma.tour_definition.update({
        where: { id: tourId },
        data: updateData,
      });

      logger.info('Tour definition updated successfully', {
        tourKey: tourDefinition.tourKey,
        id: tourDefinition.id,
      });

      return this.mapTourDefinitionToDomain(tourDefinition);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating tour definition:', error);
      throw new AppError(
        'Failed to update tour definition',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a tour definition
   */
  async deleteTourDefinition(tourId: string): Promise<void> {
    try {
      const existingTour = await this.prisma.tour_definition.findUnique({
        where: { id: tourId },
      });

      if (!existingTour) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      await this.prisma.tour_definition.delete({
        where: { id: tourId },
      });

      logger.info('Tour definition deleted successfully', {
        tourKey: existingTour.tourKey,
        id: tourId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deleting tour definition:', error);
      throw new AppError(
        'Failed to delete tour definition',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Toggle tour definition active status
   */
  async toggleTourDefinitionStatus(
    tourId: string
  ): Promise<ITourDefinitionExtended> {
    try {
      const existingTour = await this.prisma.tour_definition.findUnique({
        where: { id: tourId },
      });

      if (!existingTour) {
        throw new AppError(
          'Tour definition not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const tourDefinition = await this.prisma.tour_definition.update({
        where: { id: tourId },
        data: { isActive: !existingTour.isActive },
      });

      logger.info('Tour definition status toggled', {
        tourKey: tourDefinition.tourKey,
        id: tourDefinition.id,
        isActive: tourDefinition.isActive,
      });

      return this.mapTourDefinitionToDomain(tourDefinition);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error toggling tour definition status:', error);
      throw new AppError(
        'Failed to toggle tour definition status',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all unique tour groups
   */
  async getTourGroups(): Promise<string[]> {
    try {
      const tourGroups = await this.prisma.tour_definition.findMany({
        where: {
          tourGroup: { not: null },
        },
        select: {
          tourGroup: true,
        },
        distinct: ['tourGroup'],
      });

      return tourGroups
        .map((t) => t.tourGroup)
        .filter((group): group is string => group !== null);
    } catch (error) {
      logger.error('Error getting tour groups:', error);
      throw new AppError(
        'Failed to get tour groups',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Map Prisma tour definition to extended domain model
   */
  private mapTourDefinitionToDomain(
    tourDefinition: any
  ): ITourDefinitionExtended {
    return {
      id: tourDefinition.id,
      tourKey: tourDefinition.tourKey,
      name: tourDefinition.name,
      description: tourDefinition.description || undefined,
      userType: tourDefinition.userType,
      userRole: tourDefinition.userRole || undefined,
      isActive: tourDefinition.isActive,
      priority: tourDefinition.priority,
      version: tourDefinition.version,
      triggerConditions: tourDefinition.triggerConditions,
      tourSteps: tourDefinition.tourSteps || [],
      tourSettings: tourDefinition.tourSettings || {},
      createdBy: tourDefinition.createdBy || undefined,
      createdAt: tourDefinition.createdAt,
      updatedAt: tourDefinition.updatedAt,
      // Extended fields
      pagePattern: tourDefinition.pagePattern || undefined,
      targetPages: tourDefinition.targetPages || undefined,
      tourGroup: tourDefinition.tourGroup || undefined,
      autoStart: tourDefinition.autoStart || false,
      restartOnPageChange: tourDefinition.restartOnPageChange || false,
    };
  }
}
