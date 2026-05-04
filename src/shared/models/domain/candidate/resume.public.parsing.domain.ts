import { ResumeParsingTaskStatusEnum } from '../../common/enums';
import { ResumeParsingMode } from './resume.parsing.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IResumePublicParsingTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The task ID
 *         status:
 *           $ref: '#/components/schemas/ResumeParsingTaskStatusEnum'
 *         error:
 *           type: string
 *           description: Error message if task failed
 *         fileUrl:
 *           type: string
 *           description: URL of the uploaded resume file
 *         fileName:
 *           type: string
 *           description: Original filename of the uploaded resume
 *         mode:
 *           $ref: '#/components/schemas/ResumeParsingMode'
 *           description: The parsing mode used
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IResumePublicParsingTask {
  id: string;
  status: ResumeParsingTaskStatusEnum;
  error?: string;
  fileUrl: string;
  fileName: string;
  mode: ResumeParsingMode;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to convert database model to domain model
 */
export function toResumePublicParsingTaskDomain(
  task: any
): IResumePublicParsingTask {
  return {
    id: task.id,
    status: task.status,
    error: task.error,
    fileUrl: task.fileUrl,
    fileName: task.fileName,
    mode: task.mode as ResumeParsingMode,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
