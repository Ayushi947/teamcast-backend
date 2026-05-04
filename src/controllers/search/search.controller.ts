import { Request, Response, NextFunction } from 'express';
import { SearchService } from '@/services/search/search.service';
import { singleton } from '@/shared/decorators/singleton';
import {
  ISearchApiRequest,
  ISearchApiResponse,
} from '@/shared/models/api/search/search.api';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';

@singleton
export class SearchController extends BaseController {
  constructor(private searchService: SearchService) {
    super();
  }

  searchJobs = (req: Request, res: Response, next: NextFunction): void => {
    this.handleRequest<ISearchApiResponse>(req, res, next, async () => {
      const request = createIApiRequest<ISearchApiRequest>(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      return await this.searchService.searchJobs(
        request.data.query as string,
        limit,
        page
      );
    });
  };

  searchCandidates = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    this.handleRequest<ISearchApiResponse>(req, res, next, async () => {
      const request = createIApiRequest<ISearchApiRequest>(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      return await this.searchService.searchCandidates(
        request.data.query as string,
        limit,
        page
      );
    });
  };
}
