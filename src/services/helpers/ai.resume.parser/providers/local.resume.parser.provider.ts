import { singleton } from '@/shared/decorators/singleton';
import {
  IAiResumeParsingStatus,
  IAiResumeParsingTask,
  IResumeParserProvider,
} from '../resume.parser.provider';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { ResumeParsingMode } from '@/shared/models/domain/candidate/resume.parsing.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';

@singleton
export class LocalResumeParserProvider implements IResumeParserProvider {
  private tasks: Map<string, IAiResumeParsingTask>;

  constructor() {
    this.tasks = new Map();
  }

  /**
   * Initiates the resume parsing job
   * @param resumeUrl The URL of the resume to parse
   * @returns A promise that resolves to the parsing task identifier
   */
  async parse(
    taskId: string,
    resumeUrl: string,
    mode: ResumeParsingMode
  ): Promise<IAiResumeParsingTask> {
    // check if task for the taskId exists and if it is not failed or completed
    const task = this.tasks.get(taskId);
    if (task) {
      if (
        task.status !== IAiResumeParsingStatus.FAILED &&
        task.status !== IAiResumeParsingStatus.COMPLETED
      ) {
        throw new AppError(
          'Resume assessment task already exists',
          400,
          ErrorCode.RESUME_ASSESSMENT_TASK_ALREADY_EXISTS
        );
      }
    }

    const newTask: IAiResumeParsingTask = {
      taskId,
      status: IAiResumeParsingStatus.PENDING,
      fileUrl: resumeUrl,
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
  async getParsingTask(taskId: string): Promise<IAiResumeParsingTask> {
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
   * Process the resume parsing task
   * @param taskId The identifier of the parsing task
   */
  private async processTask(
    taskId: string,
    mode: ResumeParsingMode
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Parsing task not found with id ${taskId}`);
    }
    logger.info('Processing resume parsing task', {
      context: 'LocalResumeParserProvider.processTask',
      taskId,
      mode,
    });
    try {
      // Update task status to processing
      task.status = IAiResumeParsingStatus.LLM_PROCESSING;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      // TODO: Implement actual resume parsing logic here
      // For now, we'll just simulate processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Update task status to completed
      task.status = IAiResumeParsingStatus.COMPLETED;
      task.updatedAt = new Date();
      task.parsedResume = {
        confidenceScore: 0.95,
        isValidResume: true,
        validationReason: 'The resume is valid',
        mode,
        parsedResume: {
          id: uuidv4(),
          candidateId: '123',
          phone: '1234567890',
          location: 'New York, NY',
          summary:
            'I am a software engineer with a passion for building scalable and efficient systems.',
        },
      };
      this.tasks.set(taskId, task);
    } catch (error) {
      // Update task status to failed
      task.status = IAiResumeParsingStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      throw error;
    }
  }
}
