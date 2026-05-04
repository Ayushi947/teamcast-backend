import { singleton } from '@/shared/decorators/singleton';
import {
  IAiResumeAssessmentStatus,
  IAiResumeAssessmentTask,
  IResumeAssessmentProvider,
} from '../resume.assessment.provider';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import {
  ResumeAssessmentRecommendationEnum,
  ResumeAssessmentResultEnum,
  ResumeAssessmentStatusEnum,
} from '@/shared/models/common/enums';

@singleton
export class LocalResumeAssessmentProvider
  implements IResumeAssessmentProvider
{
  private tasks: Map<string, IAiResumeAssessmentTask>;

  constructor() {
    this.tasks = new Map();
  }

  /**
   * Initiates the resume parsing job
   * @param resumeUrl The URL of the resume to parse
   * @returns A promise that resolves to the parsing task identifier
   */
  async doAssessment(
    taskId: string,
    resumeText: string
  ): Promise<IAiResumeAssessmentTask> {
    // check if task for the taskId exists and if it is not failed or completed
    const task = this.tasks.get(taskId);
    if (task) {
      if (
        task.status !== IAiResumeAssessmentStatus.FAILED &&
        task.status !== IAiResumeAssessmentStatus.COMPLETED
      ) {
        throw new AppError(
          'Resume assessment task already exists',
          400,
          ErrorCode.RESUME_ASSESSMENT_TASK_ALREADY_EXISTS
        );
      }
    }

    const newTask: IAiResumeAssessmentTask = {
      taskId,
      status: IAiResumeAssessmentStatus.PENDING,
      resumeText: resumeText,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, newTask);

    // Proceed with the assessment
    await this.processTask(taskId, resumeText);

    return newTask;
  }

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  async getAssessmentTask(taskId: string): Promise<IAiResumeAssessmentTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new AppError(
        `Assessment task not found with id ${taskId}`,
        404,
        ErrorCode.RESUME_ASSESSMENT_TASK_NOT_FOUND
      );
    }
    return task;
  }

  /**
   * Process the resume parsing task
   * @param taskId The identifier of the parsing task
   */
  private async processTask(taskId: string, resumeText: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Parsing task not found with id ${taskId}`);
    }
    logger.info('Processing resume parsing task', {
      context: 'LocalResumeAssessmentProvider.processTask',
      taskId,
      resumeText,
    });
    try {
      // Update task status to processing
      task.status = IAiResumeAssessmentStatus.LLM_PROCESSING;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      // TODO: Implement actual resume parsing logic here
      // For now, we'll just simulate processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Update task status to completed
      task.status = IAiResumeAssessmentStatus.COMPLETED;
      task.updatedAt = new Date();
      task.assessment = {
        id: uuidv4(),
        candidateId: '123',
        status: ResumeAssessmentStatusEnum.AI_REVIEW_COMPLETED,
        result: ResumeAssessmentResultEnum.PASSED,
        score: 0.95,
        confidenceScore: 0.95,
        resumeText: resumeText,
        strengths: ['Strong communication skills', 'Team player'],
        areasForImprovement: [
          'Improve coding skills',
          'Increase project management experience',
        ],
        skills: ['Communication', 'Teamwork', 'Project Management'],
        experienceSummary:
          'Experienced in project management and team leadership',
        educationSummary: "Bachelor's degree in Business Administration",
        technicalSkills: [
          'Project Management',
          'Leadership',
          'Team Management',
        ],
        softSkills: ['Communication', 'Teamwork', 'Leadership'],
        yearsOfExperience: 5,
        industriesFit: ['IT'],
        jobRolesFit: ['Project Manager', 'Team Leader'],
        overallFeedback: 'Excellent resume',
        recommendation: ResumeAssessmentRecommendationEnum.HIGHLY_RECOMMENDED,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.tasks.set(taskId, task);
    } catch (error) {
      // Update task status to failed
      task.status = IAiResumeAssessmentStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      throw error;
    }
  }
}
