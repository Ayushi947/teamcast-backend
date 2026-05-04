import { JobParsingTaskStatusEnum } from '../../common/enums';
import { IClientJobPosting } from './job.postings.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     JobParsingMode:
 *       type: string
 *       enum: [STRICT, INFERRED, GENERATIVE]
 *       description: The mode of the job parsing task
 */
export enum JobParsingMode {
  STRICT = 'STRICT',
  INFERRED = 'INFERRED',
  GENERATIVE = 'GENERATIVE',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobParsingTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         jobPostingId:
 *           type: string
 *           description: The job posting ID
 *         status:
 *           $ref: '#/components/schemas/JobParsingTaskStatusEnum'
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         fileUrl:
 *           type: string
 *           description: URL of the uploaded job description file
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IJobParsingTask {
  id: string;
  jobPostingId: string;
  status: JobParsingTaskStatusEnum;
  error?: string;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IJobParsed:
 *       type: object
 *       properties:
 *         confidenceScore:
 *           type: number
 *           description: Confidence score of the parsed job description
 *         parsedJob:
 *           $ref: '#/components/schemas/IJobPosting'
 */
export type IJobParsed = {
  confidenceScore: number;
  isValidJobDescription: boolean;
  validationReason: string;
  mode: JobParsingMode;
  parsedJob: Partial<IClientJobPosting>;
};

/**
 * Helper function to convert database model to domain model
 */
export function toJobParsingTaskDomain(task: any): IJobParsingTask {
  return {
    id: task.id,
    jobPostingId: task.jobPostingId,
    status: task.status as JobParsingTaskStatusEnum,
    error: task.error,
    fileUrl: task.fileUrl,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
