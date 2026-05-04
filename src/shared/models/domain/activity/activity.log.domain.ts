import { ActivityModuleEnum, ActivityEntityTypeEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IActivityLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the activity log
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who performed the action
 *         module:
 *           $ref: '#/components/schemas/ActivityModuleEnum'
 *         action:
 *           type: string
 *           description: Action that was performed
 *           example: "UPDATE_PROFILE"
 *         entityId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the affected entity, if any
 *         entityType:
 *           $ref: '#/components/schemas/ActivityEntityTypeEnum'
 *           nullable: true
 *         description:
 *           type: string
 *           description: Human-readable description of the action
 *           example: "Candidate updated personal information"
 *         metadata:
 *           type: object
 *           nullable: true
 *           description: Additional metadata for the action
 *           example:
 *             changes: ["email", "phoneNumber"]
 *         userAgent:
 *           type: string
 *           nullable: true
 *           description: User agent string of the client
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the action was performed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the record was last updated
 */
export interface IActivityLog {
  id: string;
  userId: string;
  module: ActivityModuleEnum;
  action: string;
  entityId?: string;
  entityType?: ActivityEntityTypeEnum;
  description: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  userName?: string;
  userType?: string;
  userEmail?: string;
  userRole?: string;
  /** Client or partner company name when user is CLIENT/PARTNER */
  userCompanyName?: string;
  ipAddress?: string;
  /** Short device/browser label parsed from userAgent */
  deviceLabel?: string;
  /** When support impersonated another user */
  impersonatedUserId?: string;
  impersonatedUserName?: string;
  /** Human-readable entity name (e.g. job title, candidate name) */
  entityName?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IActivityLogCreate:
 *       type: object
 *       required:
 *         - module
 *         - action
 *         - description
 *       properties:
 *         module:
 *           $ref: '#/components/schemas/ActivityModuleEnum'
 *         action:
 *           type: string
 *           description: Action that was performed
 *           example: "UPDATE_PROFILE"
 *         entityId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the affected entity, if any
 *         entityType:
 *           $ref: '#/components/schemas/ActivityEntityTypeEnum'
 *           nullable: true
 *         description:
 *           type: string
 *           description: Human-readable description of the action
 *           example: "Candidate updated personal information"
 *         metadata:
 *           type: object
 *           nullable: true
 *           description: Additional metadata for the action
 *           example:
 *             changes: ["email", "phoneNumber"]
 */
export interface IActivityLogCreate {
  module: ActivityModuleEnum;
  action: string;
  entityId?: string;
  entityType?: ActivityEntityTypeEnum;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IActivityLogFilters:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Filter by user ID
 *         module:
 *           $ref: '#/components/schemas/ActivityModuleEnum'
 *           description: Filter by module
 *         action:
 *           oneOf:
 *             - type: string
 *               description: Filter by single action
 *             - type: array
 *               items:
 *                 type: string
 *               description: Filter by multiple actions
 *           description: Filter by action(s)
 *           example: ["UPDATE_PROFILE", "LOGIN"]
 *         entityId:
 *           type: string
 *           format: uuid
 *           description: Filter by entity ID
 *         entityType:
 *           $ref: '#/components/schemas/ActivityEntityTypeEnum'
 *           description: Filter by entity type
 *         fromDate:
 *           type: string
 *           format: date-time
 *           description: Filter logs from this date
 *         toDate:
 *           type: string
 *           format: date-time
 *           description: Filter logs until this date
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: Filter logs to only those by users belonging to this client (client scope)
 */
export interface IActivityLogFilters {
  userId?: string;
  module?: ActivityModuleEnum;
  action?: string | string[];
  entityId?: string;
  entityType?: ActivityEntityTypeEnum;
  fromDate?: Date;
  toDate?: Date;
  clientId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IActivityLogCreated:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Activity logged successfully"
 *         activityLog:
 *           $ref: '#/components/schemas/IActivityLog'
 */
export interface IActivityLogCreated {
  message: string;
  activityLog: IActivityLog;
}

/** Parse userAgent to a short device/browser label for display */
function parseUserAgentLabel(
  ua: string | null | undefined
): string | undefined {
  if (!ua || typeof ua !== 'string') return undefined;
  const s = ua.substring(0, 400);
  const browser = /Edg\//.test(s)
    ? 'Edge'
    : /Chrome\//.test(s) && !/Edg/.test(s)
      ? 'Chrome'
      : /Firefox\//.test(s)
        ? 'Firefox'
        : /Safari\//.test(s) && !/Chrome/.test(s)
          ? 'Safari'
          : /OPR\//.test(s)
            ? 'Opera'
            : undefined;
  const os = /Windows NT/.test(s)
    ? 'Windows'
    : /Mac OS X/.test(s)
      ? 'macOS'
      : /Android/.test(s)
        ? 'Android'
        : /iPhone|iPad/.test(s)
          ? 'iOS'
          : undefined;
  const parts = [browser, os].filter(Boolean);
  return parts.length ? parts.join(' • ') : undefined;
}

// Transform function from Prisma to domain
export const toActivityLogDomain = (activityLog: any): IActivityLog => {
  const metadata = activityLog.metadata as
    | Record<string, unknown>
    | null
    | undefined;
  const userCompanyName =
    activityLog.user?.clientUser?.client?.company?.name ??
    activityLog.user?.partnerUser?.partner?.company?.name;
  return {
    id: activityLog.id,
    userId: activityLog.userId,
    module: activityLog.module,
    action: activityLog.action,
    entityId: activityLog.entityId,
    entityType: activityLog.entityType,
    description: activityLog.description,
    metadata: activityLog.metadata,
    userAgent: activityLog.userAgent,
    timestamp: activityLog.timestamp,
    createdAt: activityLog.createdAt,
    updatedAt: activityLog.updatedAt,
    userName: activityLog.user?.name ?? undefined,
    userType: activityLog.user?.type ?? undefined,
    userEmail: activityLog.user?.email ?? undefined,
    userRole: activityLog.user?.role ?? undefined,
    userCompanyName: userCompanyName ?? undefined,
    ipAddress: activityLog.ipAddress ?? undefined,
    deviceLabel: parseUserAgentLabel(activityLog.userAgent),
    impersonatedUserId: metadata?.impersonatedUserId as string | undefined,
    impersonatedUserName: metadata?.impersonatedUserName as string | undefined,
    entityName: (metadata?.entityName as string) ?? undefined,
  };
};
