import { PrismaClient } from '@prisma/client';
import {
  ISlaPolicy,
  ISlaPolicyCreate,
  ISlaPolicyUpdate,
  ISlaPolicyFilter,
  ISlaPolicySort,
  ISlaPolicyPagination,
  ISlaPolicyListResponse,
  ISlaPolicyMatchCriteria,
} from '@/shared/models/domain/support-ticket/sla-policy.domain';
import {
  SupportTicketEntityTypeEnum,
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
  SupportClientTicketCategoryEnum,
} from '@/shared/models/common/enums';
import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { ISlaPolicyAssignmentApiResponse } from '@/shared/models/api/support-ticket/sla-policy.api';

/**
 * SLA Policy Service
 * Handles all CRUD operations for SLA policies and automatic assignment logic
 */
@singleton
export class SlaPolicyService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new SLA policy
   */
  async createPolicy(policyData: ISlaPolicyCreate): Promise<ISlaPolicy> {
    try {
      // If this is set as default, unset other defaults for the same combination
      if (policyData.isDefault) {
        await this.unsetDefaultPolicies(
          policyData.entityType as SupportTicketEntityTypeEnum,
          policyData.category as SupportTicketCategoryEnum,
          policyData.priority as SupportTicketPriorityEnum
        );
      }

      const policy = await this.prisma.support_sla_policy.create({
        data: {
          name: policyData.name,
          description: policyData.description,
          entityType: policyData.entityType,
          category: policyData.category,
          priority: policyData.priority,
          responseTime: policyData.responseTime,
          resolutionTime: policyData.resolutionTime,
          escalationTime: policyData.escalationTime,
          businessHoursOnly: policyData.businessHoursOnly || false,
          workingDaysOnly: policyData.workingDaysOnly || false,
          excludeHolidays: policyData.excludeHolidays !== false, // Default to true
          isActive: policyData.isActive !== false, // Default to true
          isDefault: policyData.isDefault || false,
        },
      });

      logger.info('SLA policy created successfully', {
        policyId: policy.id,
        name: policy.name,
      });

      return this.mapDataToDomain(policy);
    } catch (error) {
      logger.error('Failed to create SLA policy', {
        error,
        policyData,
      });
      throw error;
    }
  }

  /**
   * Get an SLA policy by ID
   */
  async getPolicyById(policyId: string): Promise<ISlaPolicy | null> {
    try {
      const policy = await this.prisma.support_sla_policy.findUnique({
        where: { id: policyId },
      });

      if (!policy) {
        return null;
      }

      return this.mapDataToDomain(policy);
    } catch (error) {
      logger.error('Failed to get SLA policy by ID', {
        error,
        policyId,
      });
      throw error;
    }
  }

  /**
   * Update an SLA policy
   */
  async updatePolicy(
    policyId: string,
    updateData: ISlaPolicyUpdate
  ): Promise<ISlaPolicy> {
    try {
      // If this is set as default, unset other defaults for the same combination
      if (updateData.isDefault) {
        const currentPolicy = await this.prisma.support_sla_policy.findUnique({
          where: { id: policyId },
        });

        if (currentPolicy) {
          await this.unsetDefaultPolicies(
            (updateData.entityType ||
              currentPolicy.entityType) as SupportTicketEntityTypeEnum,
            (updateData.category ||
              currentPolicy.category) as SupportTicketCategoryEnum,
            (updateData.priority ||
              currentPolicy.priority) as SupportTicketPriorityEnum
          );
        }
      }

      const policy = await this.prisma.support_sla_policy.update({
        where: { id: policyId },
        data: updateData,
      });

      logger.info('SLA policy updated successfully', {
        policyId,
      });

      return this.mapDataToDomain(policy);
    } catch (error) {
      logger.error('Failed to update SLA policy', {
        error,
        policyId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete an SLA policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      // Check if policy is in use
      const ticketsUsingPolicy = await this.prisma.support_ticket.count({
        where: { slaPolicyId: policyId },
      });

      if (ticketsUsingPolicy > 0) {
        throw new Error(
          `Cannot delete SLA policy. It is currently assigned to ${ticketsUsingPolicy} ticket(s).`
        );
      }

      await this.prisma.support_sla_policy.delete({
        where: { id: policyId },
      });

      logger.info('SLA policy deleted successfully', {
        policyId,
      });
    } catch (error) {
      logger.error('Failed to delete SLA policy', {
        error,
        policyId,
      });
      throw error;
    }
  }

  /**
   * List SLA policies with filtering, sorting, and pagination
   */
  async listPolicies(
    filters: ISlaPolicyFilter = {},
    sort: ISlaPolicySort = { field: 'name', direction: 'asc' },
    pagination: ISlaPolicyPagination = { page: 1, limit: 20 }
  ): Promise<ISlaPolicyListResponse> {
    try {
      const where = this.buildWhereClause(filters);
      const orderBy = this.buildOrderByClause(sort);
      const skip = (pagination.page - 1) * pagination.limit;

      const [policies, total] = await Promise.all([
        this.prisma.support_sla_policy.findMany({
          where,
          orderBy,
          skip,
          take: pagination.limit,
        }),
        this.prisma.support_sla_policy.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        policies: policies.map((policy) => this.mapDataToDomain(policy)),
        pagination: {
          ...pagination,
          total,
          totalPages,
        },
        filters,
        sort,
      };
    } catch (error) {
      logger.error('Failed to list SLA policies', {
        error,
        filters,
        sort,
        pagination,
      });
      throw error;
    }
  }

  /**
   * Find the best matching SLA policy for a ticket
   */
  async findMatchingPolicy(
    criteria: ISlaPolicyMatchCriteria
  ): Promise<ISlaPolicy | null> {
    try {
      // First, try to find an exact match
      let policy = await this.prisma.support_sla_policy.findFirst({
        where: {
          entityType: criteria.entityType,
          category: criteria.category,
          priority: criteria.priority,
          isActive: true,
        },
        orderBy: [
          { isDefault: 'desc' }, // Prefer default policies
          { createdAt: 'asc' }, // If multiple, prefer older ones
        ],
      });

      // If no exact match, try to find a default policy for the entity type
      if (!policy) {
        policy = await this.prisma.support_sla_policy.findFirst({
          where: {
            entityType: criteria.entityType,
            isDefault: true,
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      // If still no match, try to find any active policy for the entity type
      if (!policy) {
        policy = await this.prisma.support_sla_policy.findFirst({
          where: {
            entityType: criteria.entityType,
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      return policy ? this.mapDataToDomain(policy) : null;
    } catch (error) {
      logger.error('Failed to find matching SLA policy', {
        error,
        criteria,
      });
      throw error;
    }
  }

  /**
   * Determine priority from SLA policy based on entity type and category
   * This method finds the appropriate priority level based on business rules
   */
  async determinePriorityFromSlaPolicy(
    entityType: SupportTicketEntityTypeEnum,
    category: SupportTicketCategoryEnum | SupportClientTicketCategoryEnum
  ): Promise<SupportTicketPriorityEnum> {
    try {
      // First, try to find a default policy for the entity type and category
      let policy = await this.prisma.support_sla_policy.findFirst({
        where: {
          entityType: entityType,
          category: category,
          isDefault: true,
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // If no default policy found, try to find any active policy for the entity type and category
      if (!policy) {
        policy = await this.prisma.support_sla_policy.findFirst({
          where: {
            entityType: entityType,
            category: category,
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      // If still no policy found, try to find a default policy for just the entity type
      if (!policy) {
        policy = await this.prisma.support_sla_policy.findFirst({
          where: {
            entityType: entityType,
            isDefault: true,
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      // If policy found, return its priority
      if (policy) {
        logger.info('Priority determined from SLA policy', {
          entityType,
          category,
          priority: policy.priority,
          policyId: policy.id,
        });
        return policy.priority as SupportTicketPriorityEnum;
      }

      // If no policy found, apply business logic for priority determination
      const priority = this.determinePriorityByBusinessRules(
        entityType,
        category
      );

      logger.info('Priority determined by business rules', {
        entityType,
        category,
        priority,
      });

      return priority;
    } catch (error) {
      logger.error('Failed to determine priority from SLA policy', {
        error,
        entityType,
        category,
      });

      // Fallback to business rules
      return this.determinePriorityByBusinessRules(entityType, category);
    }
  }

  /**
   * Determine priority based on business rules when no SLA policy is found
   */
  private determinePriorityByBusinessRules(
    entityType: SupportTicketEntityTypeEnum,
    category: SupportTicketCategoryEnum | SupportClientTicketCategoryEnum
  ): SupportTicketPriorityEnum {
    // High priority for security and billing issues
    if (category === SupportTicketCategoryEnum.SECURITY) {
      return SupportTicketPriorityEnum.HIGH;
    }

    if (category === SupportTicketCategoryEnum.BILLING) {
      return SupportTicketPriorityEnum.HIGH;
    }

    // Critical priority for client issues that affect business operations
    if (entityType === SupportTicketEntityTypeEnum.CLIENT) {
      if (
        category === SupportTicketCategoryEnum.TECHNICAL ||
        category === SupportTicketCategoryEnum.INTEGRATION
      ) {
        return SupportTicketPriorityEnum.CRITICAL;
      }
      return SupportTicketPriorityEnum.HIGH;
    }

    // Medium priority for general support and feature requests
    if (
      category === SupportTicketCategoryEnum.FEATURE ||
      category === SupportTicketCategoryEnum.GENERAL
    ) {
      return SupportTicketPriorityEnum.MEDIUM;
    }

    // Default to medium priority
    return SupportTicketPriorityEnum.MEDIUM;
  }

  /**
   * Assign SLA policy to a ticket and calculate SLA breach time
   */
  async assignPolicyToTicket(
    ticketId: string,
    policyId: string
  ): Promise<ISlaPolicyAssignmentApiResponse> {
    try {
      const policy = await this.getPolicyById(policyId);
      if (!policy) {
        throw new Error('SLA policy not found');
      }

      const now = new Date();
      const slaBreachAt = this.calculateSlaBreachTime(now, policy);
      const slaDuration = policy.resolutionTime;

      // Update the ticket with SLA information
      await this.prisma.support_ticket.update({
        where: { id: ticketId },
        data: {
          slaPolicyId: policyId,
          slaBreachAt,
          slaDuration,
          slaStartedAt: now,
          isSlaBreach: false,
        },
      });

      logger.info('SLA policy assigned to ticket successfully', {
        ticketId,
        policyId,
        slaBreachAt,
      });

      return {
        success: true,
        data: {
          policyId,
          policy,
          slaBreachAt,
          slaDuration,
          slaStartedAt: now,
        },
      };
    } catch (error) {
      logger.error('Failed to assign SLA policy to ticket', {
        error,
        ticketId,
        policyId,
      });
      throw error;
    }
  }

  /**
   * Automatically assign SLA policy to a ticket based on criteria
   */
  async autoAssignPolicyToTicket(
    ticketId: string,
    criteria: ISlaPolicyMatchCriteria
  ): Promise<ISlaPolicyAssignmentApiResponse | null> {
    try {
      const policy = await this.findMatchingPolicy(criteria);
      if (!policy) {
        logger.warn('No matching SLA policy found for ticket', {
          ticketId,
          criteria,
        });
        return null;
      }

      return await this.assignPolicyToTicket(ticketId, policy.id);
    } catch (error) {
      logger.error('Failed to auto-assign SLA policy to ticket', {
        error,
        ticketId,
        criteria,
      });
      throw error;
    }
  }

  /**
   * Get SLA policy statistics
   */
  async getPolicyStatistics(): Promise<any> {
    try {
      const [
        totalPolicies,
        activePolicies,
        defaultPolicies,
        policiesByEntityType,
        policiesByCategory,
        policiesByPriority,
      ] = await Promise.all([
        this.prisma.support_sla_policy.count(),
        this.prisma.support_sla_policy.count({ where: { isActive: true } }),
        this.prisma.support_sla_policy.count({ where: { isDefault: true } }),
        this.prisma.support_sla_policy.groupBy({
          by: ['entityType'],
          _count: { entityType: true },
        }),
        this.prisma.support_sla_policy.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        this.prisma.support_sla_policy.groupBy({
          by: ['priority'],
          _count: { priority: true },
        }),
      ]);

      return {
        totalPolicies,
        activePolicies,
        defaultPolicies,
        policiesByEntityType: this.formatGroupByResult(
          policiesByEntityType,
          'entityType'
        ),
        policiesByCategory: this.formatGroupByResult(
          policiesByCategory,
          'category'
        ),
        policiesByPriority: this.formatGroupByResult(
          policiesByPriority,
          'priority'
        ),
      };
    } catch (error) {
      logger.error('Failed to get SLA policy statistics', {
        error,
      });
      throw error;
    }
  }

  /**
   * Calculate SLA breach time based on policy settings
   */
  private calculateSlaBreachTime(startTime: Date, policy: ISlaPolicy): Date {
    const breachTime = new Date(startTime);
    const minutesToAdd = policy.resolutionTime;

    if (policy.businessHoursOnly) {
      // Add business hours logic here
      // For now, just add the minutes directly
      breachTime.setMinutes(breachTime.getMinutes() + minutesToAdd);
    } else if (policy.workingDaysOnly) {
      // Add working days logic here (exclude weekends)
      // For now, just add the minutes directly
      breachTime.setMinutes(breachTime.getMinutes() + minutesToAdd);
    } else {
      // Add minutes directly
      breachTime.setMinutes(breachTime.getMinutes() + minutesToAdd);
    }

    return breachTime;
  }

  /**
   * Unset default policies for a specific combination
   */
  private async unsetDefaultPolicies(
    entityType: SupportTicketEntityTypeEnum,
    category: SupportTicketCategoryEnum,
    priority: SupportTicketPriorityEnum
  ): Promise<void> {
    await this.prisma.support_sla_policy.updateMany({
      where: {
        entityType: entityType as any,
        category: category as any,
        priority: priority as any,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }

  /**
   * Build where clause for filtering
   */
  private buildWhereClause(filters: ISlaPolicyFilter): any {
    const where: any = {};

    if (filters.entityType && filters.entityType.length > 0) {
      where.entityType = { in: filters.entityType };
    }

    if (filters.category && filters.category.length > 0) {
      where.category = { in: filters.category };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isDefault !== undefined) {
      where.isDefault = filters.isDefault;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Build order by clause for sorting
   */
  private buildOrderByClause(sort: ISlaPolicySort): any {
    return {
      [sort.field]: sort.direction,
    };
  }

  /**
   * Format group by results
   */
  private formatGroupByResult(
    results: any[],
    field: string
  ): Record<string, number> {
    const formatted: Record<string, number> = {};
    results.forEach((result) => {
      formatted[result[field]] = result._count[field];
    });
    return formatted;
  }

  /**
   * Map data model to domain model
   */
  private mapDataToDomain(policy: any): ISlaPolicy {
    return {
      id: policy.id,
      name: policy.name,
      description: policy.description,
      entityType: policy.entityType,
      category: policy.category,
      priority: policy.priority,
      responseTime: policy.responseTime,
      resolutionTime: policy.resolutionTime,
      escalationTime: policy.escalationTime,
      businessHoursOnly: policy.businessHoursOnly,
      workingDaysOnly: policy.workingDaysOnly,
      excludeHolidays: policy.excludeHolidays,
      isActive: policy.isActive,
      isDefault: policy.isDefault,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }
}
