import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { singleton } from '@/shared/decorators/singleton';
import {
  ISupportCandidateKpisApiResponse,
  ISupportCandidateKpisFilterOptionsApiResponse,
  ISupportCandidateKpisExportApiResponse,
} from '@/shared/models/api/support/kpis.api';
import { SupportKpisService } from '@/services/support/kpis.service';

@singleton
export class SupportKpisController extends BaseController {
  constructor(private readonly supportKpisService: SupportKpisService) {
    super();
  }

  /**
   * Get candidate KPIs and statistics
   */
  getCandidateKpis = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateKpisApiResponse>(
      req,
      res,
      next,
      async () => {
        const filters = req.query as any;
        const data = await this.supportKpisService.getCandidateKpis(filters);
        return { data };
      }
    );
  };

  /**
   * Get comprehensive filter options for candidate KPIs
   * Returns all available filters with hierarchical relationships
   */
  getFilterOptions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateKpisFilterOptionsApiResponse>(
      req,
      res,
      next,
      async () => {
        const data = await this.supportKpisService.getFilterOptions();
        return { data };
      }
    );
  };

  /**
   * Export candidate KPIs data as CSV
   */
  exportCandidateKpis = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<ISupportCandidateKpisExportApiResponse>(
      req,
      res,
      next,
      async () => {
        const filters = req.query as any;
        const data = await this.supportKpisService.exportCandidateKpis(filters);
        return { data };
      }
    );
  };
}
