import {
  SupportTicketEntityTypeEnum,
  SupportTicketCategoryEnum,
  SupportClientTicketCategoryEnum,
  SupportTicketPriorityEnum,
} from '../../common/enums';

/**
 * SLA Policy Domain Model
 */
export interface ISlaPolicy {
  id: string;
  name: string;
  description?: string;
  entityType: SupportTicketEntityTypeEnum;
  category: SupportTicketCategoryEnum | SupportClientTicketCategoryEnum;
  priority: SupportTicketPriorityEnum;
  responseTime: number; // Time to first response in minutes
  resolutionTime: number; // Time to resolution in minutes
  escalationTime?: number; // Time before escalation in minutes
  businessHoursOnly: boolean;
  workingDaysOnly: boolean; // Exclude weekends
  excludeHolidays: boolean; // Exclude public holidays
  isActive: boolean;
  isDefault: boolean; // Default policy for entity type/category/priority
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SLA Policy Create Data
 */
export interface ISlaPolicyCreate {
  name: string;
  description?: string;
  entityType: SupportTicketEntityTypeEnum;
  category: SupportTicketCategoryEnum | SupportClientTicketCategoryEnum;
  priority: SupportTicketPriorityEnum;
  responseTime: number;
  resolutionTime: number;
  escalationTime?: number;
  businessHoursOnly?: boolean;
  workingDaysOnly?: boolean;
  excludeHolidays?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
}

/**
 * SLA Policy Update Data
 */
export interface ISlaPolicyUpdate {
  name?: string;
  description?: string;
  entityType?: SupportTicketEntityTypeEnum;
  category?: SupportTicketCategoryEnum | SupportClientTicketCategoryEnum;
  priority?: SupportTicketPriorityEnum;
  responseTime?: number;
  resolutionTime?: number;
  escalationTime?: number;
  businessHoursOnly?: boolean;
  workingDaysOnly?: boolean;
  excludeHolidays?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
}

/**
 * SLA Policy Filter Options
 */
export interface ISlaPolicyFilter {
  entityType?: SupportTicketEntityTypeEnum[];
  category?: (SupportTicketCategoryEnum | SupportClientTicketCategoryEnum)[];
  priority?: SupportTicketPriorityEnum[];
  isActive?: boolean;
  isDefault?: boolean;
  search?: string;
}

/**
 * SLA Policy Sort Options
 */
export interface ISlaPolicySort {
  field: 'name' | 'createdAt' | 'updatedAt' | 'responseTime' | 'resolutionTime';
  direction: 'asc' | 'desc';
}

/**
 * SLA Policy Pagination Options
 */
export interface ISlaPolicyPagination {
  page: number;
  limit: number;
}

/**
 * SLA Policy List Response
 */
export interface ISlaPolicyListResponse {
  policies: ISlaPolicy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ISlaPolicyFilter;
  sort: ISlaPolicySort;
}

/**
 * SLA Policy Match Criteria
 */
export interface ISlaPolicyMatchCriteria {
  entityType: SupportTicketEntityTypeEnum;
  category: SupportTicketCategoryEnum | SupportClientTicketCategoryEnum;
  priority: SupportTicketPriorityEnum;
}

/**
 * SLA Policy Statistics
 */
export interface ISlaPolicyStatistics {
  totalPolicies: number;
  activePolicies: number;
  defaultPolicies: number;
  policiesByEntityType: Record<SupportTicketEntityTypeEnum, number>;
  policiesByCategory: Record<
    SupportTicketCategoryEnum | SupportClientTicketCategoryEnum,
    number
  >;
  policiesByPriority: Record<SupportTicketPriorityEnum, number>;
}

/**
 * SLA Policy Match/Assignment Result
 * (unified version instead of having duplicates)
 */
export interface ISlaPolicyResult {
  policyId: string;
  policy: ISlaPolicy;
  slaBreachAt: Date;
  slaDuration: number;
  slaStartedAt: Date;
}
