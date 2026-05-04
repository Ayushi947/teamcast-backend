import {
  SupportTicketTypeEnum,
  SupportTicketStatusEnum,
  SupportTicketPriorityEnum,
  SupportTicketEntityTypeEnum,
  SupportTicketCategoryEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketStatisticsFilter:
 *       type: object
 *       description: Filter options for comprehensive support ticket statistics
 *       properties:
 *         entityType:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *           description: Filter by entity types
 *         targetId:
 *           type: string
 *           format: uuid
 *           description: Filter by specific target entity ID
 *         priority:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *           description: Filter by priority levels
 *         category:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketCategoryEnum'
 *           description: Filter by categories
 *         ticketType:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketTypeEnum'
 *           description: Filter by ticket types
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: Filter by assigned user ID
 *         status:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketStatusEnum'
 *           description: Filter by status
 *         search:
 *           type: string
 *           description: Search query for tickets
 *         dateFrom:
 *           type: string
 *           format: date-time
 *           description: Start date for statistics calculation
 *         dateTo:
 *           type: string
 *           format: date-time
 *           description: End date for statistics calculation
 *         includeResolved:
 *           type: boolean
 *           description: Include resolved tickets in statistics
 *         includeClosed:
 *           type: boolean
 *           description: Include closed tickets in statistics
 */
export interface ISupportTicketStatisticsFilter {
  entityType?: SupportTicketEntityTypeEnum[];
  targetId?: string;
  priority?: SupportTicketPriorityEnum[];
  category?: SupportTicketCategoryEnum[];
  ticketType?: SupportTicketTypeEnum[];
  assignedUserId?: string;
  status?: SupportTicketStatusEnum[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  includeResolved?: boolean;
  includeClosed?: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportTicketStatistics:
 *       type: object
 *       description: Comprehensive support ticket statistics for all entity types
 *       properties:
 *         overview:
 *           $ref: '#/components/schemas/SupportTicketStatisticsOverview'
 *         statusBreakdown:
 *           $ref: '#/components/schemas/SupportTicketStatusBreakdown'
 *         priorityBreakdown:
 *           $ref: '#/components/schemas/SupportTicketPriorityBreakdown'
 *         categoryBreakdown:
 *           $ref: '#/components/schemas/SupportTicketCategoryBreakdown'
 *         entityTypeBreakdown:
 *           $ref: '#/components/schemas/SupportTicketEntityTypeBreakdown'
 *         assignmentBreakdown:
 *           $ref: '#/components/schemas/SupportTicketAssignmentBreakdown'
 *         performanceMetrics:
 *           $ref: '#/components/schemas/SupportTicketPerformanceMetrics'
 *         slaMetrics:
 *           $ref: '#/components/schemas/SupportTicketSlaMetrics'
 *         trends:
 *           $ref: '#/components/schemas/SupportTicketTrends'
 *         timeDistribution:
 *           $ref: '#/components/schemas/SupportTicketTimeDistribution'
 *         entityBreakdown:
 *           $ref: '#/components/schemas/SupportTicketEntityBreakdown'
 *         supportTeamMetrics:
 *           $ref: '#/components/schemas/SupportTicketSupportTeamMetrics'
 *       required:
 *         - overview
 *         - statusBreakdown
 *         - priorityBreakdown
 *         - categoryBreakdown
 *         - entityTypeBreakdown
 *         - assignmentBreakdown
 *         - performanceMetrics
 *         - slaMetrics
 *         - trends
 *         - timeDistribution
 *         - entityBreakdown
 *         - supportTeamMetrics
 */
export interface ISupportTicketStatistics {
  overview: ISupportTicketStatisticsOverview;
  statusBreakdown: ISupportTicketStatusBreakdown;
  priorityBreakdown: ISupportTicketPriorityBreakdown;
  categoryBreakdown: ISupportTicketCategoryBreakdown;
  entityTypeBreakdown: ISupportTicketEntityTypeBreakdown;
  assignmentBreakdown: ISupportTicketAssignmentBreakdown;
  performanceMetrics: ISupportTicketPerformanceMetrics;
  slaMetrics: ISupportTicketSlaMetrics;
  trends: ISupportTicketTrends;
  timeDistribution: ISupportTicketTimeDistribution;
  entityBreakdown: ISupportTicketEntityBreakdown;
  supportTeamMetrics: ISupportTicketSupportTeamMetrics;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketStatisticsOverview:
 *       type: object
 *       description: High-level support ticket statistics overview
 *       properties:
 *         totalTickets:
 *           type: number
 *           description: Total number of tickets
 *         openTickets:
 *           type: number
 *           description: Number of open tickets
 *         inProgressTickets:
 *           type: number
 *           description: Number of tickets in progress
 *         resolvedTickets:
 *           type: number
 *           description: Number of resolved tickets
 *         closedTickets:
 *           type: number
 *           description: Number of closed tickets
 *         overDueTickets:
 *           type: number
 *           description: Number of overdue tickets
 *         unassignedTickets:
 *           type: number
 *           description: Number of unassigned tickets
 *         highPriorityTickets:
 *           type: number
 *           description: Number of high priority tickets (HIGH, URGENT, CRITICAL)
 *         averageResolutionTime:
 *           type: number
 *           description: Average resolution time in hours
 *         averageResponseTime:
 *           type: number
 *           description: Average first response time in hours
 *         totalEntities:
 *           type: number
 *           description: Total number of entities with tickets
 *         satisfactionScore:
 *           type: number
 *           format: float
 *           description: Average customer satisfaction score
 *         escalationRate:
 *           type: number
 *           format: float
 *           description: Percentage of tickets that were escalated
 *         slaComplianceRate:
 *           type: number
 *           format: float
 *           description: SLA compliance rate percentage
 *       required:
 *         - totalTickets
 *         - openTickets
 *         - inProgressTickets
 *         - resolvedTickets
 *         - closedTickets
 *         - overDueTickets
 *         - unassignedTickets
 *         - highPriorityTickets
 *         - averageResolutionTime
 *         - averageResponseTime
 *         - totalEntities
 *         - satisfactionScore
 *         - escalationRate
 *         - slaComplianceRate
 */
export interface ISupportTicketStatisticsOverview {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  overDueTickets: number;
  unassignedTickets: number;
  highPriorityTickets: number;
  averageResolutionTime: number;
  averageResponseTime: number;
  totalEntities: number;
  satisfactionScore: number;
  escalationRate: number;
  slaComplianceRate: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketStatusBreakdown:
 *       type: object
 *       description: Breakdown of tickets by status
 *       properties:
 *         open:
 *           type: number
 *         assigned:
 *           type: number
 *         inProgress:
 *           type: number
 *         pending:
 *           type: number
 *         resolved:
 *           type: number
 *         closed:
 *           type: number
 *         cancelled:
 *           type: number
 *         reopened:
 *           type: number
 *       required:
 *         - open
 *         - assigned
 *         - inProgress
 *         - pending
 *         - resolved
 *         - closed
 *         - cancelled
 *         - reopened
 */
export interface ISupportTicketStatusBreakdown {
  open: number;
  assigned: number;
  inProgress: number;
  pending: number;
  resolved: number;
  closed: number;
  cancelled: number;
  reopened: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketPriorityBreakdown:
 *       type: object
 *       description: Breakdown of tickets by priority
 *       properties:
 *         low:
 *           type: number
 *         medium:
 *           type: number
 *         high:
 *           type: number
 *         urgent:
 *           type: number
 *         critical:
 *           type: number
 *       required:
 *         - low
 *         - medium
 *         - high
 *         - urgent
 *         - critical
 */
export interface ISupportTicketPriorityBreakdown {
  low: number;
  medium: number;
  high: number;
  urgent: number;
  critical: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketCategoryBreakdown:
 *       type: object
 *       description: Breakdown of tickets by category
 *       properties:
 *         technical:
 *           type: number
 *         billing:
 *           type: number
 *         account:
 *           type: number
 *         feature:
 *           type: number
 *         bug:
 *           type: number
 *         general:
 *           type: number
 *         integration:
 *           type: number
 *         security:
 *           type: number
 *       required:
 *         - technical
 *         - billing
 *         - account
 *         - feature
 *         - bug
 *         - general
 *         - integration
 *         - security
 */
export interface ISupportTicketCategoryBreakdown {
  technical: number;
  billing: number;
  account: number;
  feature: number;
  bug: number;
  general: number;
  integration: number;
  security: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketEntityTypeBreakdown:
 *       type: object
 *       description: Breakdown of tickets by entity type
 *       properties:
 *         candidate:
 *           type: number
 *         client:
 *           type: number
 *         partner:
 *           type: number
 *         support:
 *           type: number
 *       required:
 *         - candidate
 *         - client
 *         - partner
 *         - support
 */
export interface ISupportTicketEntityTypeBreakdown {
  candidate: number;
  client: number;
  partner: number;
  support: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     EntityTicketSummary:
 *       type: object
 *       description: Ticket summary for a specific entity
 *       properties:
 *         entityId:
 *           type: string
 *           format: uuid
 *         entityName:
 *           type: string
 *         entityType:
 *           $ref: '#/components/schemas/SupportTicketEntityTypeEnum'
 *         totalTickets:
 *           type: number
 *         openTickets:
 *           type: number
 *         highPriorityTickets:
 *           type: number
 *         averageResolutionTime:
 *           type: number
 *         satisfactionScore:
 *           type: number
 *           format: float
 *         lastTicketDate:
 *           type: string
 *           format: date-time
 *         escalationCount:
 *           type: number
 *         slaBreachCount:
 *           type: number
 *       required:
 *         - entityId
 *         - entityName
 *         - entityType
 *         - totalTickets
 *         - openTickets
 *         - highPriorityTickets
 *         - averageResolutionTime
 *         - satisfactionScore
 *         - escalationCount
 *         - slaBreachCount
 */
export interface IEntityTicketSummary {
  entityId: string;
  entityName: string;
  entityType: SupportTicketEntityTypeEnum;
  totalTickets: number;
  openTickets: number;
  highPriorityTickets: number;
  averageResolutionTime: number;
  satisfactionScore: number;
  lastTicketDate?: Date;
  escalationCount: number;
  slaBreachCount: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketEntityBreakdown:
 *       type: object
 *       description: Breakdown of tickets by individual entities
 *       properties:
 *         totalEntities:
 *           type: number
 *         entities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EntityTicketSummary'
 *       required:
 *         - totalEntities
 *         - entities
 */
export interface ISupportTicketEntityBreakdown {
  totalEntities: number;
  entities: IEntityTicketSummary[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketAssignmentSummary:
 *       type: object
 *       description: Assignment summary for a support user
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         userName:
 *           type: string
 *         userEmail:
 *           type: string
 *         totalTickets:
 *           type: number
 *         openTickets:
 *           type: number
 *         inProgressTickets:
 *           type: number
 *         resolvedTickets:
 *           type: number
 *         averageResolutionTime:
 *           type: number
 *         workload:
 *           type: string
 *           enum:
 *             - LOW
 *             - MEDIUM
 *             - HIGH
 *             - OVERLOADED
 *         satisfactionScore:
 *           type: number
 *           format: float
 *         escalationCount:
 *           type: number
 *         slaBreachCount:
 *           type: number
 *       required:
 *         - userId
 *         - userName
 *         - userEmail
 *         - totalTickets
 *         - openTickets
 *         - inProgressTickets
 *         - resolvedTickets
 *         - averageResolutionTime
 *         - workload
 *         - satisfactionScore
 *         - escalationCount
 *         - slaBreachCount
 */
export interface ISupportTicketAssignmentSummary {
  userId: string;
  userName: string;
  userEmail: string;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  workload: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERLOADED';
  satisfactionScore: number;
  escalationCount: number;
  slaBreachCount: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketAssignmentBreakdown:
 *       type: object
 *       description: Breakdown of tickets by assignment
 *       properties:
 *         unassignedTickets:
 *           type: number
 *         totalSupportUsers:
 *           type: number
 *         assignments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketAssignmentSummary'
 *       required:
 *         - unassignedTickets
 *         - totalSupportUsers
 *         - assignments
 */
export interface ISupportTicketAssignmentBreakdown {
  unassignedTickets: number;
  totalSupportUsers: number;
  assignments: ISupportTicketAssignmentSummary[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketPerformanceMetrics:
 *       type: object
 *       description: Performance metrics for ticket handling
 *       properties:
 *         averageFirstResponseTime:
 *           type: number
 *           description: Average first response time in hours
 *         averageResolutionTime:
 *           type: number
 *           description: Average resolution time in hours
 *         medianResolutionTime:
 *           type: number
 *           description: Median resolution time in hours
 *         resolutionRate:
 *           type: number
 *           format: float
 *           description: Percentage of tickets resolved within SLA
 *         firstCallResolutionRate:
 *           type: number
 *           format: float
 *           description: Percentage of tickets resolved on first interaction
 *         reopenRate:
 *           type: number
 *           format: float
 *           description: Percentage of tickets that were reopened
 *         escalationRate:
 *           type: number
 *           format: float
 *           description: Percentage of tickets that were escalated
 *         customerSatisfactionScore:
 *           type: number
 *           format: float
 *           description: Average customer satisfaction score
 *         totalResponseCount:
 *           type: number
 *           description: Total number of responses sent
 *         averageResponsesPerTicket:
 *           type: number
 *           format: float
 *           description: Average number of responses per ticket
 *         slaComplianceRate:
 *           type: number
 *           format: float
 *           description: SLA compliance rate percentage
 *       required:
 *         - averageFirstResponseTime
 *         - averageResolutionTime
 *         - medianResolutionTime
 *         - resolutionRate
 *         - firstCallResolutionRate
 *         - reopenRate
 *         - escalationRate
 *         - customerSatisfactionScore
 *         - totalResponseCount
 *         - averageResponsesPerTicket
 *         - slaComplianceRate
 */
export interface ISupportTicketPerformanceMetrics {
  averageFirstResponseTime: number;
  averageResolutionTime: number;
  medianResolutionTime: number;
  resolutionRate: number;
  firstCallResolutionRate: number;
  reopenRate: number;
  escalationRate: number;
  customerSatisfactionScore: number;
  totalResponseCount: number;
  averageResponsesPerTicket: number;
  slaComplianceRate: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketSlaMetrics:
 *       type: object
 *       description: SLA-related metrics for tickets
 *       properties:
 *         totalTicketsWithSla:
 *           type: number
 *           description: Total number of tickets with SLA policies
 *         ticketsWithinSla:
 *           type: number
 *           description: Number of tickets resolved within SLA
 *         ticketsBreachingSla:
 *           type: number
 *           description: Number of tickets that breached SLA
 *         slaComplianceRate:
 *           type: number
 *           format: float
 *           description: SLA compliance rate percentage
 *         averageSlaBreachTime:
 *           type: number
 *           description: Average time by which SLA was breached (in hours)
 *         ticketsAtRisk:
 *           type: number
 *           description: Number of tickets at risk of breaching SLA
 *         slaBreakdownByPriority:
 *           type: object
 *           properties:
 *             low:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 compliant:
 *                   type: number
 *                 breached:
 *                   type: number
 *             medium:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 compliant:
 *                   type: number
 *                 breached:
 *                   type: number
 *             high:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 compliant:
 *                   type: number
 *                 breached:
 *                   type: number
 *             urgent:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 compliant:
 *                   type: number
 *                 breached:
 *                   type: number
 *             critical:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 compliant:
 *                   type: number
 *                 breached:
 *                   type: number
 *       required:
 *         - totalTicketsWithSla
 *         - ticketsWithinSla
 *         - ticketsBreachingSla
 *         - slaComplianceRate
 *         - averageSlaBreachTime
 *         - ticketsAtRisk
 *         - slaBreakdownByPriority
 */
export interface ISupportTicketSlaMetrics {
  totalTicketsWithSla: number;
  ticketsWithinSla: number;
  ticketsBreachingSla: number;
  slaComplianceRate: number;
  averageSlaBreachTime: number;
  ticketsAtRisk: number;
  slaBreakdownByPriority: {
    low: { total: number; compliant: number; breached: number };
    medium: { total: number; compliant: number; breached: number };
    high: { total: number; compliant: number; breached: number };
    urgent: { total: number; compliant: number; breached: number };
    critical: { total: number; compliant: number; breached: number };
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketDailyTrendData:
 *       type: object
 *       description: Daily trend data point
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *         created:
 *           type: number
 *         resolved:
 *           type: number
 *         closed:
 *           type: number
 *         escalated:
 *           type: number
 *       required:
 *         - date
 *         - created
 *         - resolved
 *         - closed
 *         - escalated
 */
export interface ISupportTicketDailyTrendData {
  date: string;
  created: number;
  resolved: number;
  closed: number;
  escalated: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketTrends:
 *       type: object
 *       description: Trend analysis of tickets over time
 *       properties:
 *         last7Days:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketDailyTrendData'
 *         last30Days:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SupportTicketDailyTrendData'
 *         monthlyGrowthRate:
 *           type: number
 *           format: float
 *           description: Monthly growth rate of ticket creation
 *         resolutionTrend:
 *           type: string
 *           enum:
 *             - IMPROVING
 *             - STABLE
 *             - DECLINING
 *           description: Overall resolution trend
 *         averageTicketsPerDay:
 *           type: number
 *           format: float
 *           description: Average tickets created per day
 *         peakDayOfWeek:
 *           type: string
 *           description: Day of week with highest ticket volume
 *         peakHourOfDay:
 *           type: number
 *           description: Hour of day with highest ticket volume (0-23)
 *         escalationTrend:
 *           type: string
 *           enum:
 *             - IMPROVING
 *             - STABLE
 *             - DECLINING
 *           description: Overall escalation trend
 *       required:
 *         - last7Days
 *         - last30Days
 *         - monthlyGrowthRate
 *         - resolutionTrend
 *         - averageTicketsPerDay
 *         - peakDayOfWeek
 *         - peakHourOfDay
 *         - escalationTrend
 */
export interface ISupportTicketTrends {
  last7Days: ISupportTicketDailyTrendData[];
  last30Days: ISupportTicketDailyTrendData[];
  monthlyGrowthRate: number;
  resolutionTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  averageTicketsPerDay: number;
  peakDayOfWeek: string;
  peakHourOfDay: number;
  escalationTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketTimeDistribution:
 *       type: object
 *       description: Time-based distribution of tickets
 *       properties:
 *         byHour:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               hour:
 *                 type: number
 *               count:
 *                 type: number
 *         byDayOfWeek:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               dayOfWeek:
 *                 type: string
 *               count:
 *                 type: number
 *         byMonth:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *               count:
 *                 type: number
 *         businessHours:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             percentage:
 *               type: number
 *               format: float
 *         afterHours:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             percentage:
 *               type: number
 *               format: float
 *       required:
 *         - byHour
 *         - byDayOfWeek
 *         - byMonth
 *         - businessHours
 *         - afterHours
 */
export interface ISupportTicketTimeDistribution {
  byHour: Array<{ hour: number; count: number }>;
  byDayOfWeek: Array<{ dayOfWeek: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  businessHours: { total: number; percentage: number };
  afterHours: { total: number; percentage: number };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     SupportTicketSupportTeamMetrics:
 *       type: object
 *       description: Support team performance metrics
 *       properties:
 *         totalSupportUsers:
 *           type: number
 *           description: Total number of support users
 *         activeSupportUsers:
 *           type: number
 *           description: Number of support users with active tickets
 *         averageTicketsPerUser:
 *           type: number
 *           format: float
 *           description: Average tickets assigned per support user
 *         topPerformers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               userName:
 *                 type: string
 *               resolvedTickets:
 *                 type: number
 *               averageResolutionTime:
 *                 type: number
 *               satisfactionScore:
 *                 type: number
 *               format: float
 *         workloadDistribution:
 *           type: object
 *           properties:
 *             underUtilized:
 *               type: number
 *               description: Users with less than 5 tickets
 *             balanced:
 *               type: number
 *               description: Users with 5-15 tickets
 *             highWorkload:
 *               type: number
 *               description: Users with 15-25 tickets
 *             overloaded:
 *               type: number
 *               description: Users with more than 25 tickets
 *         teamSatisfactionScore:
 *           type: number
 *           format: float
 *           description: Average satisfaction score across all support users
 *         teamEscalationRate:
 *           type: number
 *           format: float
 *           description: Average escalation rate across all support users
 *       required:
 *         - totalSupportUsers
 *         - activeSupportUsers
 *         - averageTicketsPerUser
 *         - topPerformers
 *         - workloadDistribution
 *         - teamSatisfactionScore
 *         - teamEscalationRate
 */
export interface ISupportTicketSupportTeamMetrics {
  totalSupportUsers: number;
  activeSupportUsers: number;
  averageTicketsPerUser: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    resolvedTickets: number;
    averageResolutionTime: number;
    satisfactionScore: number;
  }>;
  workloadDistribution: {
    underUtilized: number;
    balanced: number;
    highWorkload: number;
    overloaded: number;
  };
  teamSatisfactionScore: number;
  teamEscalationRate: number;
}
