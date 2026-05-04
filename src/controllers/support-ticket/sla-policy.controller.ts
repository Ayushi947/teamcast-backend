import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { SlaPolicyService } from '@/services/support-ticket/sla-policy.service';
import { BaseController } from '../common/base.controller';
import {
  ISlaPolicyCreateApiRequest,
  ISlaPolicyUpdateApiRequest,
  ISlaPolicyGetApiResponse,
  ISlaPolicyCreateApiResponse,
  ISlaPolicyUpdateApiResponse,
  ISlaPolicyListApiResponse,
  ISlaPolicyDeleteApiResponse,
  ISlaPolicyStatisticsApiResponse,
  ISlaPolicyMatchApiRequest,
  ISlaPolicyMatchApiResponse,
} from '@/shared/models/api/support-ticket/sla-policy.api';
import {
  ISlaPolicyCreate,
  ISlaPolicyUpdate,
  ISlaPolicyFilter,
  ISlaPolicySort,
  ISlaPolicyPagination,
  ISlaPolicyMatchCriteria,
} from '@/shared/models/domain/support-ticket/sla-policy.domain';

/**
 * SLA Policy Controller
 * Handles HTTP requests for SLA policy operations
 */
@singleton
export class SlaPolicyController extends BaseController {
  private readonly slaPolicyService: SlaPolicyService;

  constructor() {
    super();
    this.slaPolicyService = new SlaPolicyService();
  }

  /**
   * Create a new SLA policy
   */
  createPolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISlaPolicyCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { data }: ISlaPolicyCreateApiRequest = req.body;

        const policyData: ISlaPolicyCreate = {
          name: data.name,
          description: data.description,
          entityType: data.entityType,
          category: data.category,
          priority: data.priority,
          responseTime: data.responseTime,
          resolutionTime: data.resolutionTime,
          escalationTime: data.escalationTime,
          businessHoursOnly: data.businessHoursOnly,
          workingDaysOnly: data.workingDaysOnly,
          excludeHolidays: data.excludeHolidays,
          isActive: data.isActive,
          isDefault: data.isDefault,
        };

        const policy = await this.slaPolicyService.createPolicy(policyData);

        return {
          data: policy,
        };
      }
    );
  };

  /**
   * Get an SLA policy by ID
   */
  getPolicyById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISlaPolicyGetApiResponse>(req, res, next, async () => {
      const { id } = req.params;

      const policy = await this.slaPolicyService.getPolicyById(id);

      if (!policy) {
        throw new Error('SLA policy not found');
      }

      return {
        data: policy,
      };
    });
  };

  /**
   * Update an SLA policy
   */
  updatePolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISlaPolicyUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const { data }: ISlaPolicyUpdateApiRequest = req.body;

        const updateData: ISlaPolicyUpdate = {
          name: data.name,
          description: data.description,
          entityType: data.entityType,
          category: data.category,
          priority: data.priority,
          responseTime: data.responseTime,
          resolutionTime: data.resolutionTime,
          escalationTime: data.escalationTime,
          businessHoursOnly: data.businessHoursOnly,
          workingDaysOnly: data.workingDaysOnly,
          excludeHolidays: data.excludeHolidays,
          isActive: data.isActive,
          isDefault: data.isDefault,
        };

        const policy = await this.slaPolicyService.updatePolicy(id, updateData);

        return {
          data: policy,
        };
      }
    );
  };

  /**
   * Delete an SLA policy
   */
  deletePolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISlaPolicyDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;

        await this.slaPolicyService.deletePolicy(id);

        return {
          data: {
            success: true,
          },
        };
      }
    );
  };

  /**
   * List SLA policies with filtering, sorting, and pagination
   */
  listPolicies = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISlaPolicyListApiResponse>(req, res, next, async () => {
      const { page = 1, limit = 20, filters, sort } = req.query as any;

      const filterData: ISlaPolicyFilter = {
        entityType: filters?.entityType,
        category: filters?.category,
        priority: filters?.priority,
        isActive: filters?.isActive,
        isDefault: filters?.isDefault,
        search: filters?.search,
      };

      const sortData: ISlaPolicySort = {
        field: sort?.field || 'name',
        direction: sort?.direction || 'asc',
      };

      const paginationData: ISlaPolicyPagination = {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
      };

      const result = await this.slaPolicyService.listPolicies(
        filterData,
        sortData,
        paginationData
      );

      return {
        data: {
          items: result.policies,
          pagination: {
            total: result.pagination.total || 0,
            page: result.pagination.page,
            limit: result.pagination.limit,
            totalPages: result.pagination.totalPages || 0,
          },
        },
      };
    });
  };

  /**
   * Find matching SLA policy for given criteria
   */
  findMatchingPolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISlaPolicyMatchApiResponse>(req, res, next, async () => {
      const { data }: ISlaPolicyMatchApiRequest = req.body;

      const criteria: ISlaPolicyMatchCriteria = {
        entityType: data.entityType,
        category: data.category,
        priority: data.priority,
      };

      const policy = await this.slaPolicyService.findMatchingPolicy(criteria);

      return {
        data: {
          matchedPolicy: policy,
          isDefault: policy?.isDefault || false,
        },
      };
    });
  };

  /**
   * Get SLA policy statistics
   */
  getPolicyStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISlaPolicyStatisticsApiResponse>(
      req,
      res,
      next,
      async () => {
        const statistics = await this.slaPolicyService.getPolicyStatistics();

        return {
          data: statistics,
        };
      }
    );
  };
}
