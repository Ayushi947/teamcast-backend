import { PrismaClient, user_type } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IFeatureFlag,
  IFeatureFlagCreate,
  IFeatureFlagUpdate,
  IFeatureFlagListParams,
  IFeatureFlagDiffResult,
  IFeatureFlagPreset,
  IFeatureFlagPresetCreate,
  IFeatureFlagPresetUpdate,
  IFeatureFlagPresetItem,
  IFeatureFlagSchedule,
  IFeatureFlagScheduleCreate,
  toFeatureFlagDomain,
} from '@/shared/models/domain/support/feature.flag.domain';
import { IPaginatedResponse } from '@/shared/models/api/common/common.api';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const SORTABLE_FIELDS = [
  'key',
  'name',
  'category',
  'enabled',
  'createdAt',
  'updatedAt',
];

@singleton
export class FeatureFlagService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * List feature flags with search, filters and pagination (admin only)
   */
  async listFeatureFlags(
    params: IFeatureFlagListParams
  ): Promise<IPaginatedResponse<IFeatureFlag>> {
    try {
      const rawPage = params.page != null ? Number(params.page) : DEFAULT_PAGE;
      const rawLimit =
        params.limit != null ? Number(params.limit) : DEFAULT_LIMIT;
      const page = Number.isFinite(rawPage)
        ? Math.max(1, Math.floor(rawPage))
        : DEFAULT_PAGE;
      const limit = Number.isFinite(rawLimit)
        ? Math.min(100, Math.max(1, Math.floor(rawLimit)))
        : DEFAULT_LIMIT;
      const sortBy = SORTABLE_FIELDS.includes(params.sortBy || '')
        ? params.sortBy!
        : 'category';
      const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

      const where: Record<string, unknown> = {};

      if (params.search?.trim()) {
        const term = params.search.trim();
        where.OR = [
          { key: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ];
      }
      if (params.category?.trim()) {
        where.category = params.category.trim();
      }
      if (typeof params.enabled === 'boolean') {
        where.enabled = params.enabled;
      }

      const [flags, total] = await Promise.all([
        this.prisma.feature_flag.findMany({
          where,
          orderBy: [{ [sortBy]: sortOrder }, { key: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.feature_flag.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info({
        message: 'Listed feature flags',
        context: 'FeatureFlagService.listFeatureFlags',
        total,
        page,
        limit,
      });

      return {
        items: flags.map(toFeatureFlagDomain),
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      logger.error({
        message: 'Failed to list feature flags',
        context: 'FeatureFlagService.listFeatureFlags',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all feature flags (admin only)
   */
  async getAllFeatureFlags(): Promise<IFeatureFlag[]> {
    try {
      logger.info({
        message: 'Fetching all feature flags',
        context: 'FeatureFlagService.getAllFeatureFlags',
      });

      const flags = await this.prisma.feature_flag.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });

      return flags.map(toFeatureFlagDomain);
    } catch (error) {
      logger.error({
        message: 'Failed to get all feature flags',
        context: 'FeatureFlagService.getAllFeatureFlags',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get public feature flags (for clients)
   * Returns only key-enabled pairs, optionally filtered by client
   */
  async getPublicFeatureFlags(
    clientId?: string,
    userType?: string
  ): Promise<Record<string, boolean>> {
    try {
      logger.info({
        message: 'Fetching public feature flags',
        context: 'FeatureFlagService.getPublicFeatureFlags',
        clientId,
        userType,
      });

      // Get all enabled global flags
      const globalFlags = await this.prisma.feature_flag.findMany({
        where: {
          enabled: true,
          clientId: null,
          OR: [
            { targetUserType: null },
            { targetUserType: userType as user_type },
          ],
        },
      });

      // Get client-specific flags if clientId is provided
      let clientFlags: any[] = [];
      if (clientId) {
        clientFlags = await this.prisma.feature_flag.findMany({
          where: {
            enabled: true,
            clientId,
            OR: [
              { targetUserType: null },
              { targetUserType: userType as user_type },
            ],
          },
        });
      }

      // Merge flags (client-specific overrides global)
      const flagMap: Record<string, boolean> = {};

      // Add global flags
      globalFlags.forEach((flag) => {
        flagMap[flag.key] = flag.enabled;
      });

      // Override with client-specific flags
      clientFlags.forEach((flag) => {
        flagMap[flag.key] = flag.enabled;
      });

      logger.info({
        message: 'Retrieved public feature flags',
        context: 'FeatureFlagService.getPublicFeatureFlags',
        flagCount: Object.keys(flagMap).length,
      });

      return flagMap;
    } catch (error) {
      logger.error({
        message: 'Failed to get public feature flags',
        context: 'FeatureFlagService.getPublicFeatureFlags',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get feature flag by ID
   */
  async getFeatureFlagById(id: string): Promise<IFeatureFlag> {
    try {
      const flag = await this.prisma.feature_flag.findUnique({
        where: { id },
      });

      if (!flag) {
        throw new AppError('Feature flag not found', 404);
      }

      return toFeatureFlagDomain(flag);
    } catch (error) {
      logger.error({
        message: 'Failed to get feature flag by ID',
        context: 'FeatureFlagService.getFeatureFlagById',
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get feature flag by key (and optional clientId for scoped lookup)
   */
  async getFeatureFlagByKey(
    key: string,
    clientId?: string | null
  ): Promise<IFeatureFlag | null> {
    try {
      const flag = await this.prisma.feature_flag.findFirst({
        where: { key, clientId: clientId ?? null },
      });

      return flag ? toFeatureFlagDomain(flag) : null;
    } catch (error) {
      logger.error({
        message: 'Failed to get feature flag by key',
        context: 'FeatureFlagService.getFeatureFlagByKey',
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(
    key: string,
    clientId?: string,
    userType?: string
  ): Promise<boolean> {
    try {
      // Check client-specific flag first
      if (clientId) {
        const clientFlag = await this.prisma.feature_flag.findFirst({
          where: {
            key,
            clientId,
            enabled: true,
            OR: [
              { targetUserType: null },
              { targetUserType: userType as user_type },
            ],
          },
        });

        if (clientFlag) {
          return true;
        }
      }

      // Check global flag
      const globalFlag = await this.prisma.feature_flag.findFirst({
        where: {
          key,
          clientId: null,
          enabled: true,
          OR: [
            { targetUserType: null },
            { targetUserType: userType as user_type },
          ],
        },
      });

      return !!globalFlag;
    } catch (error) {
      logger.error({
        message: 'Failed to check if feature is enabled',
        context: 'FeatureFlagService.isFeatureEnabled',
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Return false on error to fail safely
      return false;
    }
  }

  /**
   * Create a new feature flag
   */
  async createFeatureFlag(
    data: IFeatureFlagCreate,
    userId: string
  ): Promise<IFeatureFlag> {
    try {
      logger.info({
        message: 'Creating new feature flag',
        context: 'FeatureFlagService.createFeatureFlag',
        key: data.key,
      });

      // Check if key already exists for this scope (global or client)
      const existing = await this.getFeatureFlagByKey(data.key, data.clientId);
      if (existing) {
        throw new AppError(
          'Feature flag with this key already exists for this scope (global or client)',
          400
        );
      }

      const flag = await this.prisma.feature_flag.create({
        data: {
          ...data,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      logger.info({
        message: 'Feature flag created successfully',
        context: 'FeatureFlagService.createFeatureFlag',
        flagId: flag.id,
        key: flag.key,
      });

      return toFeatureFlagDomain(flag);
    } catch (error) {
      logger.error({
        message: 'Failed to create feature flag',
        context: 'FeatureFlagService.createFeatureFlag',
        data,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update a feature flag
   */
  async updateFeatureFlag(
    id: string,
    data: IFeatureFlagUpdate,
    userId: string
  ): Promise<IFeatureFlag> {
    try {
      logger.info({
        message: 'Updating feature flag',
        context: 'FeatureFlagService.updateFeatureFlag',
        id,
      });

      // Verify flag exists
      await this.getFeatureFlagById(id);

      const flag = await this.prisma.feature_flag.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId,
        },
      });

      logger.info({
        message: 'Feature flag updated successfully',
        context: 'FeatureFlagService.updateFeatureFlag',
        flagId: flag.id,
      });

      return toFeatureFlagDomain(flag);
    } catch (error) {
      logger.error({
        message: 'Failed to update feature flag',
        context: 'FeatureFlagService.updateFeatureFlag',
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete a feature flag
   */
  async deleteFeatureFlag(id: string): Promise<void> {
    try {
      logger.info({
        message: 'Deleting feature flag',
        context: 'FeatureFlagService.deleteFeatureFlag',
        id,
      });

      // Verify flag exists
      await this.getFeatureFlagById(id);

      await this.prisma.feature_flag.delete({
        where: { id },
      });

      logger.info({
        message: 'Feature flag deleted successfully',
        context: 'FeatureFlagService.deleteFeatureFlag',
        id,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to delete feature flag',
        context: 'FeatureFlagService.deleteFeatureFlag',
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Bulk toggle feature flags
   */
  async bulkToggleFeatureFlags(
    ids: string[],
    enabled: boolean,
    userId: string
  ): Promise<IFeatureFlag[]> {
    try {
      logger.info({
        message: 'Bulk toggling feature flags',
        context: 'FeatureFlagService.bulkToggleFeatureFlags',
        count: ids.length,
        enabled,
      });

      const flags = await this.prisma.feature_flag.updateMany({
        where: {
          id: { in: ids },
        },
        data: {
          enabled,
          updatedBy: userId,
        },
      });

      // Fetch updated flags
      const updatedFlags = await this.prisma.feature_flag.findMany({
        where: {
          id: { in: ids },
        },
      });

      logger.info({
        message: 'Feature flags toggled successfully',
        context: 'FeatureFlagService.bulkToggleFeatureFlags',
        updatedCount: flags.count,
      });

      return updatedFlags.map(toFeatureFlagDomain);
    } catch (error) {
      logger.error({
        message: 'Failed to bulk toggle feature flags',
        context: 'FeatureFlagService.bulkToggleFeatureFlags',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get diff: global flags vs client overrides (for a given clientId)
   */
  async getFeatureFlagDiff(clientId: string): Promise<IFeatureFlagDiffResult> {
    try {
      const [global, clientOverrides] = await Promise.all([
        this.prisma.feature_flag.findMany({
          where: { clientId: null },
          orderBy: [{ category: 'asc' }, { key: 'asc' }],
        }),
        this.prisma.feature_flag.findMany({
          where: { clientId },
          orderBy: [{ category: 'asc' }, { key: 'asc' }],
        }),
      ]);
      return {
        global: global.map(toFeatureFlagDomain),
        clientOverrides: clientOverrides.map(toFeatureFlagDomain),
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get feature flag diff',
        context: 'FeatureFlagService.getFeatureFlagDiff',
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Copy a feature flag to selected clients (creates client-specific overrides)
   */
  async copyFeatureFlagToClients(
    flagId: string,
    clientIds: string[],
    userId: string
  ): Promise<{ created: IFeatureFlag[]; skipped: string[] }> {
    try {
      const source = await this.getFeatureFlagById(flagId);
      const created: IFeatureFlag[] = [];
      const skipped: string[] = [];

      for (const clientId of clientIds) {
        const existing = await this.getFeatureFlagByKey(source.key, clientId);
        if (existing) {
          skipped.push(clientId);
          continue;
        }
        const flag = await this.prisma.feature_flag.create({
          data: {
            key: source.key,
            name: source.name,
            description: source.description,
            enabled: source.enabled,
            category: source.category,
            targetUserType: source.targetUserType,
            targetUserRole: source.targetUserRole,
            clientId,
            rolloutPercentage: source.rolloutPercentage,
            metadata: source.metadata,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        created.push(toFeatureFlagDomain(flag));
      }

      logger.info({
        message: 'Copied feature flag to clients',
        context: 'FeatureFlagService.copyFeatureFlagToClients',
        flagId,
        key: source.key,
        createdCount: created.length,
        skippedCount: skipped.length,
      });

      return { created, skipped };
    } catch (error) {
      logger.error({
        message: 'Failed to copy feature flag to clients',
        context: 'FeatureFlagService.copyFeatureFlagToClients',
        flagId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // ---------- Presets ----------
  private toPresetDomain(raw: {
    id: string;
    name: string;
    description: string | null;
    flagConfigs: unknown;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): IFeatureFlagPreset {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      flagConfigs: (raw.flagConfigs as IFeatureFlagPresetItem[]) ?? [],
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  async listPresets(): Promise<IFeatureFlagPreset[]> {
    const list = await this.prisma.feature_flag_preset.findMany({
      orderBy: { name: 'asc' },
    });
    return list.map((p) => this.toPresetDomain(p));
  }

  async getPresetById(id: string): Promise<IFeatureFlagPreset> {
    const preset = await this.prisma.feature_flag_preset.findUnique({
      where: { id },
    });
    if (!preset) throw new AppError('Preset not found', 404);
    return this.toPresetDomain(preset);
  }

  async createPreset(
    data: IFeatureFlagPresetCreate,
    userId: string
  ): Promise<IFeatureFlagPreset> {
    const preset = await this.prisma.feature_flag_preset.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        flagConfigs: data.flagConfigs as object[],
        createdBy: userId,
      },
    });
    return this.toPresetDomain(preset);
  }

  async updatePreset(
    id: string,
    data: IFeatureFlagPresetUpdate
  ): Promise<IFeatureFlagPreset> {
    await this.getPresetById(id);
    const preset = await this.prisma.feature_flag_preset.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.flagConfigs != null && {
          flagConfigs: data.flagConfigs as object[],
        }),
      },
    });
    return this.toPresetDomain(preset);
  }

  async deletePreset(id: string): Promise<void> {
    await this.getPresetById(id);
    await this.prisma.feature_flag_preset.delete({ where: { id } });
  }

  async applyPresetToClient(
    presetId: string,
    clientId: string,
    userId: string
  ): Promise<IFeatureFlag[]> {
    const preset = await this.getPresetById(presetId);
    const created: IFeatureFlag[] = [];
    for (const config of preset.flagConfigs) {
      const existing = await this.getFeatureFlagByKey(config.key, clientId);
      if (existing) {
        await this.prisma.feature_flag.update({
          where: { id: existing.id },
          data: {
            name: config.name,
            description: config.description ?? null,
            enabled: config.enabled,
            category: config.category,
            targetUserType: config.targetUserType ?? null,
            targetUserRole: config.targetUserRole ?? null,
            rolloutPercentage: config.rolloutPercentage ?? 100,
            metadata: config.metadata ?? null,
            updatedBy: userId,
          },
        });
      } else {
        const flag = await this.prisma.feature_flag.create({
          data: {
            key: config.key,
            name: config.name,
            description: config.description ?? null,
            enabled: config.enabled,
            category: config.category,
            targetUserType: config.targetUserType ?? null,
            targetUserRole: config.targetUserRole ?? null,
            clientId,
            rolloutPercentage: config.rolloutPercentage ?? 100,
            metadata: config.metadata ?? null,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        created.push(toFeatureFlagDomain(flag));
      }
    }
    const updated = await this.prisma.feature_flag.findMany({
      where: { clientId },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
    return updated.map(toFeatureFlagDomain);
  }

  // ---------- Schedules ----------
  async createSchedule(
    data: IFeatureFlagScheduleCreate,
    userId: string
  ): Promise<IFeatureFlagSchedule> {
    await this.getFeatureFlagById(data.featureFlagId);
    const schedule = await this.prisma.feature_flag_schedule.create({
      data: {
        featureFlagId: data.featureFlagId,
        clientId: data.clientId ?? null,
        scheduledAt: data.scheduledAt,
        action: data.action,
        status: 'PENDING',
        createdBy: userId,
      },
    });
    return this.toScheduleDomain(schedule);
  }

  private toScheduleDomain(raw: {
    id: string;
    featureFlagId: string;
    clientId: string | null;
    scheduledAt: Date;
    action: string;
    status: string;
    createdBy: string | null;
    createdAt: Date;
    appliedAt: Date | null;
  }): IFeatureFlagSchedule {
    return {
      id: raw.id,
      featureFlagId: raw.featureFlagId,
      clientId: raw.clientId,
      scheduledAt: raw.scheduledAt,
      action: raw.action as 'ENABLE' | 'DISABLE',
      status: raw.status as 'PENDING' | 'APPLIED' | 'CANCELLED',
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
      appliedAt: raw.appliedAt,
    };
  }

  async listSchedules(filters?: {
    featureFlagId?: string;
    clientId?: string;
    status?: string;
  }): Promise<IFeatureFlagSchedule[]> {
    const where: Record<string, unknown> = {};
    if (filters?.featureFlagId) where.featureFlagId = filters.featureFlagId;
    if (filters?.clientId != null) where.clientId = filters.clientId;
    if (filters?.status) where.status = filters.status;
    const list = await this.prisma.feature_flag_schedule.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });
    return list.map((s) => this.toScheduleDomain(s));
  }

  async cancelSchedule(id: string): Promise<IFeatureFlagSchedule> {
    const schedule = await this.prisma.feature_flag_schedule.findUnique({
      where: { id },
    });
    if (!schedule) throw new AppError('Schedule not found', 404);
    if (schedule.status !== 'PENDING') {
      throw new AppError('Only PENDING schedules can be cancelled', 400);
    }
    const updated = await this.prisma.feature_flag_schedule.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return this.toScheduleDomain(updated);
  }

  /** Process due schedules (call from cron every minute) */
  async processDueSchedules(): Promise<{ applied: number; errors: number }> {
    const now = new Date();
    const due = await this.prisma.feature_flag_schedule.findMany({
      where: { status: 'PENDING', scheduledAt: { lte: now } },
      orderBy: { scheduledAt: 'asc' },
    });
    let applied = 0;
    let errors = 0;
    for (const schedule of due) {
      try {
        await this.prisma.feature_flag.update({
          where: { id: schedule.featureFlagId },
          data: {
            enabled: schedule.action === 'ENABLE',
            updatedBy: schedule.createdBy ?? undefined,
          },
        });
        await this.prisma.feature_flag_schedule.update({
          where: { id: schedule.id },
          data: { status: 'APPLIED', appliedAt: now },
        });
        applied++;
      } catch {
        errors++;
      }
    }
    return { applied, errors };
  }
}
