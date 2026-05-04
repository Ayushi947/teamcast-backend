import { Request, Response, NextFunction } from 'express';
import { singleton } from '@/shared/decorators/singleton';
import { BaseController } from '../common/base.controller';
import { FeatureFlagService } from '@/services/support/feature.flag.service';
import {
  IFeatureFlagListApiResponse,
  IFeatureFlagPaginatedListApiResponse,
  IFeatureFlagGetApiResponse,
  IFeatureFlagCreateApiResponse,
  IFeatureFlagUpdateApiResponse,
  IFeatureFlagDeleteApiResponse,
  IFeatureFlagPublicApiResponse,
  IFeatureFlagCopyToClientsApiResponse,
} from '@/shared/models/api/support/feature.flag.api';

@singleton
export class FeatureFlagController extends BaseController {
  constructor(private readonly featureFlagService: FeatureFlagService) {
    super();
  }

  /**
   * Get feature flags: list with filters when any list param is present, else all (admin only)
   */
  getAllFeatureFlags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const hasSearch = req.query.search !== undefined && req.query.search !== '';
    const hasCategory =
      req.query.category !== undefined && req.query.category !== '';
    const hasEnabled = req.query.enabled !== undefined;
    const hasSortBy = req.query.sortBy !== undefined && req.query.sortBy !== '';
    const hasSortOrder = req.query.sortOrder !== undefined;
    const hasPage = req.query.page !== undefined;
    const hasLimit = req.query.limit !== undefined;

    const useListMode =
      hasPage ||
      hasLimit ||
      hasSearch ||
      hasCategory ||
      hasEnabled ||
      hasSortBy ||
      hasSortOrder;

    if (useListMode) {
      this.handleRequest<IFeatureFlagPaginatedListApiResponse>(
        req,
        res,
        next,
        async () => {
          const rawPage = req.query.page;
          const rawLimit = req.query.limit;
          const page =
            rawPage != null && Number.isFinite(Number(rawPage))
              ? Math.max(1, Math.floor(Number(rawPage)))
              : undefined;
          const limit =
            rawLimit != null && Number.isFinite(Number(rawLimit))
              ? Math.min(100, Math.max(1, Math.floor(Number(rawLimit))))
              : undefined;

          const search =
            typeof req.query.search === 'string' ? req.query.search : undefined;
          const category =
            typeof req.query.category === 'string'
              ? req.query.category
              : undefined;
          const enabledParam = req.query.enabled;
          const enabled =
            enabledParam === 'true'
              ? true
              : enabledParam === 'false'
                ? false
                : undefined;
          const sortBy =
            typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
          const sortOrder =
            req.query.sortOrder === 'asc' || req.query.sortOrder === 'desc'
              ? req.query.sortOrder
              : undefined;

          return await this.featureFlagService.listFeatureFlags({
            page,
            limit,
            search,
            category,
            enabled,
            sortBy,
            sortOrder,
          });
        }
      );
      return;
    }

    this.handleRequest<IFeatureFlagListApiResponse>(
      req,
      res,
      next,
      async () => {
        const flags = await this.featureFlagService.getAllFeatureFlags();
        return flags;
      }
    );
  };

  /**
   * Get public feature flags (for clients)
   */
  getPublicFeatureFlags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeatureFlagPublicApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.query.clientId as string | undefined;
        const userType = req.query.userType as string | undefined;
        const flags = await this.featureFlagService.getPublicFeatureFlags(
          clientId,
          userType
        );
        return flags;
      }
    );
  };

  /**
   * Get feature flag by ID
   */
  getFeatureFlagById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeatureFlagGetApiResponse>(req, res, next, async () => {
      const { id } = req.params;
      return await this.featureFlagService.getFeatureFlagById(id);
    });
  };

  /**
   * Get diff: global vs client overrides for a client
   */
  getFeatureFlagDiff = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const clientId = req.query.clientId as string;
      if (!clientId) {
        return { global: [], clientOverrides: [] };
      }
      return await this.featureFlagService.getFeatureFlagDiff(clientId);
    });
  };

  /**
   * Create a new feature flag
   */
  createFeatureFlag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeatureFlagCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const data = req.body.data;
        const userId = req.user?.id || 'system';
        return await this.featureFlagService.createFeatureFlag(data, userId);
      }
    );
  };

  /**
   * Update a feature flag
   */
  updateFeatureFlag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeatureFlagUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const data = req.body.data;
        const userId = req.user?.id || 'system';
        return await this.featureFlagService.updateFeatureFlag(
          id,
          data,
          userId
        );
      }
    );
  };

  /**
   * Delete a feature flag
   */
  deleteFeatureFlag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeatureFlagDeleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        await this.featureFlagService.deleteFeatureFlag(id);
        return { success: true };
      }
    );
  };

  /**
   * Bulk toggle feature flags
   */
  bulkToggleFeatureFlags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeatureFlagListApiResponse>(
      req,
      res,
      next,
      async () => {
        const { ids, enabled } = req.body;
        const userId = req.user?.id || 'system';
        return await this.featureFlagService.bulkToggleFeatureFlags(
          ids,
          enabled,
          userId
        );
      }
    );
  };

  /** List presets */
  listPresets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      return await this.featureFlagService.listPresets();
    });
  };

  /** Get preset by ID */
  getPresetById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { id } = req.params;
      return await this.featureFlagService.getPresetById(id);
    });
  };

  /** Create preset */
  createPreset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const data = req.body.data ?? req.body;
      const userId = req.user?.id || 'system';
      return await this.featureFlagService.createPreset(data, userId);
    });
  };

  /** Update preset */
  updatePreset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { id } = req.params;
      const data = req.body.data ?? req.body;
      return await this.featureFlagService.updatePreset(id, data);
    });
  };

  /** Delete preset */
  deletePreset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { id } = req.params;
      await this.featureFlagService.deletePreset(id);
      return { success: true };
    });
  };

  /** Apply preset to client */
  applyPresetToClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { presetId } = req.params;
      const { clientId } = req.body;
      const userId = req.user?.id || 'system';
      return await this.featureFlagService.applyPresetToClient(
        presetId,
        clientId,
        userId
      );
    });
  };

  /** Create schedule */
  createSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const data = req.body.data ?? req.body;
      const userId = req.user?.id || 'system';
      return await this.featureFlagService.createSchedule(data, userId);
    });
  };

  /** List schedules */
  listSchedules = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const featureFlagId = req.query.featureFlagId as string | undefined;
      const clientId = req.query.clientId as string | undefined;
      const status = req.query.status as string | undefined;
      return await this.featureFlagService.listSchedules({
        featureFlagId,
        clientId,
        status,
      });
    });
  };

  /** Cancel schedule */
  cancelSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      const { id } = req.params;
      return await this.featureFlagService.cancelSchedule(id);
    });
  };

  /** Process due schedules (for cron) */
  processDueSchedules = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest(req, res, next, async () => {
      return await this.featureFlagService.processDueSchedules();
    });
  };

  /**
   * Copy a feature flag to selected clients
   */
  copyFeatureFlagToClients = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IFeatureFlagCopyToClientsApiResponse>(
      req,
      res,
      next,
      async () => {
        const { id } = req.params;
        const { clientIds } = req.body;
        const userId = req.user?.id || 'system';
        return await this.featureFlagService.copyFeatureFlagToClients(
          id,
          clientIds ?? [],
          userId
        );
      }
    );
  };
}
