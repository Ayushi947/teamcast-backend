import {
  SupportTicketTypeEnum,
  SupportTicketStatusEnum,
  SupportTicketPriorityEnum,
  SupportTicketCategoryEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerTicketFilter:
 *       type: object
 *       description: Filter options for account manager ticket list
 *       properties:
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Filter by client ID
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
 *         createdFrom:
 *           type: string
 *           format: date-time
 *           description: Filter tickets created from this date
 *         createdTo:
 *           type: string
 *           format: date-time
 *           description: Filter tickets created until this date
 */
export interface IAccountManagerTicketFilter {
  clientId?: string;
  priority?: SupportTicketPriorityEnum[];
  category?: SupportTicketCategoryEnum[];
  ticketType?: SupportTicketTypeEnum[];
  assignedUserId?: string;
  status?: SupportTicketStatusEnum[];
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerTicketSort:
 *       type: object
 *       description: Sort options for account manager ticket list
 *       properties:
 *         field:
 *           type: string
 *           enum:
 *             - createdAt
 *             - updatedAt
 *             - priority
 *             - status
 *             - title
 *             - ticketNumber
 *           description: Field to sort by
 *         order:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *           description: Sort order
 *       required:
 *         - field
 *         - order
 */
export interface IAccountManagerTicketSort {
  field:
    | 'createdAt'
    | 'updatedAt'
    | 'priority'
    | 'status'
    | 'title'
    | 'ticketNumber';
  order: 'asc' | 'desc';
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerTicketPagination:
 *       type: object
 *       description: Pagination options for account manager ticket list
 *       properties:
 *         page:
 *           type: number
 *           minimum: 1
 *           description: Page number (1-based)
 *         limit:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           description: Number of items per page
 *       required:
 *         - page
 *         - limit
 */
export interface IAccountManagerTicketPagination {
  page: number;
  limit: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerTicketAssignment:
 *       type: object
 *       description: Data required for assigning or reassigning a ticket to a support user
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the ticket to assign
 *         assignedUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the support user to assign the ticket to
 *         internalNote:
 *           type: string
 *           description: Optional internal note about the assignment
 *       required:
 *         - ticketId
 *         - assignedUserId
 */
export interface IAccountManagerTicketAssignment {
  ticketId: string;
  assignedUserId: string;
  internalNote?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerTicketPriorityChange:
 *       type: object
 *       description: Data required for changing ticket priority with internal note
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the ticket to change priority for
 *         priority:
 *           $ref: '#/components/schemas/SupportTicketPriorityEnum'
 *         internalNote:
 *           type: string
 *           description: Required internal note explaining the priority change
 *       required:
 *         - ticketId
 *         - priority
 */
export interface IAccountManagerTicketPriorityChange {
  ticketId: string;
  priority: SupportTicketPriorityEnum;
  internalNote?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerTicketStatusChange:
 *       type: object
 *       description: Data required for changing ticket status with internal note
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the ticket to change status for
 *         status:
 *           $ref: '#/components/schemas/SupportTicketStatusEnum'
 *         internalNote:
 *           type: string
 *           description: Required internal note explaining the status change
 *       required:
 *         - ticketId
 *         - status
 */
export interface IAccountManagerTicketStatusChange {
  ticketId: string;
  status: SupportTicketStatusEnum;
  internalNote?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerTicketComment:
 *       type: object
 *       description: Data required for adding a comment to a ticket
 *       properties:
 *         ticketId:
 *           type: string
 *           format: uuid
 *           description: ID of the ticket to add comment to
 *         content:
 *           type: string
 *           description: Content of the comment
 *         isInternal:
 *           type: boolean
 *           description: Whether the comment is internal (not visible to customer)
 *       required:
 *         - ticketId
 *         - content
 *         - isInternal
 */
export interface IAccountManagerTicketComment {
  ticketId: string;
  content: string;
  isInternal: boolean;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerTicketStatistics:
 *       type: object
 *       description: Comprehensive ticket statistics for account managers
 *       properties:
 *         overview:
 *           $ref: '#/components/schemas/TicketStatisticsOverview'
 *         statusBreakdown:
 *           $ref: '#/components/schemas/TicketStatusBreakdown'
 *         priorityBreakdown:
 *           $ref: '#/components/schemas/TicketPriorityBreakdown'
 *         categoryBreakdown:
 *           $ref: '#/components/schemas/TicketCategoryBreakdown'
 *         clientBreakdown:
 *           $ref: '#/components/schemas/TicketClientBreakdown'
 *         assignmentBreakdown:
 *           $ref: '#/components/schemas/TicketAssignmentBreakdown'
 *         performanceMetrics:
 *           $ref: '#/components/schemas/TicketPerformanceMetrics'
 *         slaMetrics:
 *           $ref: '#/components/schemas/TicketSlaMetrics'
 *         trends:
 *           $ref: '#/components/schemas/TicketTrends'
 *         timeDistribution:
 *           $ref: '#/components/schemas/TicketTimeDistribution'
 *       required:
 *         - overview
 *         - statusBreakdown
 *         - priorityBreakdown
 *         - categoryBreakdown
 *         - clientBreakdown
 *         - assignmentBreakdown
 *         - performanceMetrics
 *         - slaMetrics
 *         - trends
 *         - timeDistribution
 */
export interface IAccountManagerTicketStatistics {
  overview: ITicketStatisticsOverview;
  statusBreakdown: ITicketStatusBreakdown;
  priorityBreakdown: ITicketPriorityBreakdown;
  categoryBreakdown: ITicketCategoryBreakdown;
  clientBreakdown: ITicketClientBreakdown;
  assignmentBreakdown: ITicketAssignmentBreakdown;
  performanceMetrics: ITicketPerformanceMetrics;
  slaMetrics: ITicketSlaMetrics;
  trends: ITicketTrends;
  timeDistribution: ITicketTimeDistribution;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketStatisticsOverview:
 *       type: object
 *       description: High-level ticket statistics overview
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
 *         totalClients:
 *           type: number
 *           description: Total number of clients with tickets
 *         satisfactionScore:
 *           type: number
 *           format: float
 *           description: Average customer satisfaction score
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
 *         - totalClients
 *         - satisfactionScore
 */
export interface ITicketStatisticsOverview {
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
  totalClients: number;
  satisfactionScore: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketStatusBreakdown:
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
export interface ITicketStatusBreakdown {
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
 *     TicketPriorityBreakdown:
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
export interface ITicketPriorityBreakdown {
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
 *     TicketCategoryBreakdown:
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
export interface ITicketCategoryBreakdown {
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
 *     ClientTicketSummary:
 *       type: object
 *       description: Ticket summary for a specific client
 *       properties:
 *         clientId:
 *           type: string
 *           format: uuid
 *         clientName:
 *           type: string
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
 *       required:
 *         - clientId
 *         - clientName
 *         - totalTickets
 *         - openTickets
 *         - highPriorityTickets
 *         - averageResolutionTime
 *         - satisfactionScore
 */
export interface IClientTicketSummary {
  clientId: string;
  clientName: string;
  totalTickets: number;
  openTickets: number;
  highPriorityTickets: number;
  averageResolutionTime: number;
  satisfactionScore: number;
  lastTicketDate?: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketClientBreakdown:
 *       type: object
 *       description: Breakdown of tickets by client
 *       properties:
 *         totalClients:
 *           type: number
 *         clients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ClientTicketSummary'
 *       required:
 *         - totalClients
 *         - clients
 */
export interface ITicketClientBreakdown {
  totalClients: number;
  clients: IClientTicketSummary[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     AssignmentSummary:
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
 */
export interface IAssignmentSummary {
  userId: string;
  userName: string;
  userEmail: string;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  workload: 'LOW' | 'MEDIUM' | 'HIGH' | 'OVERLOADED';
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketAssignmentBreakdown:
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
 *             $ref: '#/components/schemas/AssignmentSummary'
 *       required:
 *         - unassignedTickets
 *         - totalSupportUsers
 *         - assignments
 */
export interface ITicketAssignmentBreakdown {
  unassignedTickets: number;
  totalSupportUsers: number;
  assignments: IAssignmentSummary[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketPerformanceMetrics:
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
 */
export interface ITicketPerformanceMetrics {
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
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketSlaMetrics:
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
export interface ITicketSlaMetrics {
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
 *     DailyTrendData:
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
 *       required:
 *         - date
 *         - created
 *         - resolved
 *         - closed
 */
export interface IDailyTrendData {
  date: string;
  created: number;
  resolved: number;
  closed: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketTrends:
 *       type: object
 *       description: Trend analysis of tickets over time
 *       properties:
 *         last7Days:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DailyTrendData'
 *         last30Days:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DailyTrendData'
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
 *       required:
 *         - last7Days
 *         - last30Days
 *         - monthlyGrowthRate
 *         - resolutionTrend
 *         - averageTicketsPerDay
 *         - peakDayOfWeek
 *         - peakHourOfDay
 */
export interface ITicketTrends {
  last7Days: IDailyTrendData[];
  last30Days: IDailyTrendData[];
  monthlyGrowthRate: number;
  resolutionTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  averageTicketsPerDay: number;
  peakDayOfWeek: string;
  peakHourOfDay: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     TicketTimeDistribution:
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
export interface ITicketTimeDistribution {
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
 *     IAccountManagerTicketStatisticsFilter:
 *       type: object
 *       description: Filter options for ticket statistics
 *       properties:
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Filter statistics for specific client
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
export interface IAccountManagerTicketStatisticsFilter {
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  includeResolved?: boolean;
  includeClosed?: boolean;
}
