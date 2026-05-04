import { JobParsingTaskStatusEnum } from '../../common/enums';
import { JobParsingMode } from './job.parsing.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobPublicParsingTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         status:
 *           $ref: '#/components/schemas/JobParsingTaskStatusEnum'
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         fileUrl:
 *           type: string
 *           description: URL of the uploaded job description file
 *         fileName:
 *           type: string
 *           description: Original filename of the uploaded job description
 *         mode:
 *           $ref: '#/components/schemas/JobParsingMode'
 *           description: The parsing mode used
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IJobPublicParsingTask {
  id: string;
  status: JobParsingTaskStatusEnum;
  error?: string;
  fileUrl?: string;
  fileName: string;
  mode: JobParsingMode;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to convert database model to domain model
 */
export function toJobPublicParsingTaskDomain(task: any): IJobPublicParsingTask {
  return {
    id: task.id,
    status: task.status as JobParsingTaskStatusEnum,
    error: task.error,
    fileUrl: task.fileUrl,
    fileName: task.fileName,
    mode: task.mode as JobParsingMode,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
