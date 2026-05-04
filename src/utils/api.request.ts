import { IApiRequest } from '@/shared/models/api/common/common.api';
import { Request } from 'express';

/**
 * Constructs a standardized API request object from separate components
 * @param data Request data/body
 * @param filters Request filters/query parameters
 * @param params Request path parameters
 * @returns Standardized API request object
 */
export function createIApiRequest<T extends IApiRequest>(req: Request): T {
  const pagination = req.query as T['pagination'];
  if (pagination.page) {
    pagination.page = Number(pagination.page);
  }
  if (pagination.limit) {
    pagination.limit = Number(pagination.limit);
  }
  return {
    data: req.body as T['data'],
    filters: req.query as T['filters'],
    params: req.params as T['params'],
    pagination: pagination,
  } as T;
}
