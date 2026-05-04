import { ResumeParsingTaskStatusEnum } from '../../common/enums';
import { IResume } from './resume.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     ResumeParsingMode:
 *       type: string
 *       enum: [STRICT, INFERRED, GENERATIVE]
 *       description: The mode of the resume parsing task
 */

export enum ResumeParsingMode {
  STRICT = 'STRICT',
  INFERRED = 'INFERRED',
  GENERATIVE = 'GENERATIVE',
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeParsingTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         resumeId:
 *           type: string
 *           description: The resume ID
 *         status:
 *           $ref: '#/components/schemas/ResumeParsingTaskStatusEnum'
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         fileUrl:
 *           type: string
 *           description: URL of the uploaded resume file
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IResumeParsingTask {
  id: string;
  resumeId: string;
  status: ResumeParsingTaskStatusEnum;
  error?: string;
  fileUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumeParsed:
 *       type: object
 *       properties:
 *         confidenceScore:
 *           type: number
 *           description: Confidence score of the parsed resume
 *         parsedResume:
 *           $ref: '#/components/schemas/IResumeParsed'
 */
export type IResumeParsed = {
  confidenceScore: number;
  isValidResume: boolean;
  validationReason: string;
  mode: ResumeParsingMode;
  parsedResume: Partial<IResume>;
};

/**
 * Helper function to convert database model to domain model
 */
export function toResumeParsingTaskDomain(task: any): IResumeParsingTask {
  return {
    id: task.id,
    resumeId: task.resumeId,
    status: task.status as ResumeParsingTaskStatusEnum,
    error: task.error,
    fileUrl: task.fileUrl,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
