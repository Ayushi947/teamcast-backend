import { singleton } from '@/shared/decorators/singleton';
import {
  IJobParserProvider,
  IAiJobParsingTask,
  IAiJobParsingStatus,
} from '../job.parser.provider';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { JobParsingMode } from '@/shared/models/domain/client/job.parsing.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { WorkTypeEnum } from '@/shared/models/common/enums';

@singleton
export class LocalJobParserProvider implements IJobParserProvider {
  private tasks: Map<string, IAiJobParsingTask>;

  constructor() {
    this.tasks = new Map();
  }

  /**
   * Initiates the job parsing job
   * @param jobUrl The URL of the job description to parse
   * @returns A promise that resolves to the parsing task identifier
   */
  async parse(
    taskId: string,
    jobUrl: string,
    mode: JobParsingMode
  ): Promise<IAiJobParsingTask> {
    // check if task for the taskId exists and if it is not failed or completed
    const task = this.tasks.get(taskId);
    if (task) {
      if (
        task.status !== IAiJobParsingStatus.FAILED &&
        task.status !== IAiJobParsingStatus.COMPLETED
      ) {
        throw new AppError(
          'Job parsing task already exists',
          400,
          ErrorCode.JD_PARSING_TASK_ALREADY_EXISTS
        );
      }
    }

    const newTask: IAiJobParsingTask = {
      taskId,
      status: IAiJobParsingStatus.PENDING,
      fileUrl: jobUrl,
      mode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, newTask);

    // Start processing
    this.processTask(taskId, mode);

    return newTask;
  }

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  async getParsingTask(taskId: string): Promise<IAiJobParsingTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new AppError(
        `Parsing task not found with id ${taskId}`,
        404,
        ErrorCode.PARSING_TASK_NOT_FOUND
      );
    }
    return task;
  }

  /**
   * Gets the parsed job description
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsed job description
   */
  async getParsedJob(taskId: string): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new AppError(
        `Parsing task not found with id ${taskId}`,
        404,
        ErrorCode.PARSING_TASK_NOT_FOUND
      );
    }

    if (task.status !== IAiJobParsingStatus.COMPLETED) {
      throw new AppError(
        `Job parsing is not completed yet. Current status: ${task.status}`,
        400,
        ErrorCode.JD_PARSING_TASK_NOT_COMPLETED
      );
    }

    return task.parsedJob;
  }

  /**
   * Process the job parsing task
   * @param taskId The identifier of the parsing task
   */
  private async processTask(
    taskId: string,
    mode: JobParsingMode
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Parsing task not found with id ${taskId}`);
    }
    logger.info('Processing job parsing task', {
      context: 'LocalJobParserProvider.processTask',
      taskId,
      mode,
    });
    try {
      // Update task status to processing
      task.status = IAiJobParsingStatus.LLM_PROCESSING;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      // TODO: Implement actual job parsing logic here
      // For now, we'll just simulate processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Update task status to completed
      task.status = IAiJobParsingStatus.COMPLETED;
      task.updatedAt = new Date();
      task.parsedJob = {
        confidenceScore: 0.95,
        isValidJobDescription: true,
        validationReason: 'The job description is valid and complete',
        mode,
        parsedJob: {
          id: uuidv4(),
          title: 'Senior Software Engineer',
          description:
            'We are seeking a talented Senior Software Engineer to join our team.',
          jobType: WorkTypeEnum.EMPLOYEE,
          minSalary: 120000,
          maxSalary: 180000,
          salaryCurrency: 'USD',
          benefits: [
            'Competitive salary and equity',
            'Health, dental, and vision insurance',
            'Flexible work arrangements',
            'Professional development opportunities',
          ],
          responsibilities: [
            'Develop and maintain high-quality software solutions',
            'Collaborate with cross-functional teams',
            'Write clean, maintainable code',
            'Participate in code reviews and technical discussions',
          ],
          requiredSkills: ['JavaScript', 'Python', 'Go', 'AWS', 'GCP', 'Azure'],
          preferredSkills: ['Docker', 'Kubernetes', 'React', 'Node.js'],
          totalExperience: 5,
          numberOfOpenings: 1,
          isFeatured: false,
          isRemote: true,
          equity: true,
        },
      };
      this.tasks.set(taskId, task);
    } catch (error) {
      // Update task status to failed
      task.status = IAiJobParsingStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      throw error;
    }
  }
}
