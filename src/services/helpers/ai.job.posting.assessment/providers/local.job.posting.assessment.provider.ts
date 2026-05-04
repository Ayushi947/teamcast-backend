import { singleton } from '@/shared/decorators/singleton';
import {
  IAiJobPostingAssessmentStatus,
  IAiJobPostingAssessmentTask,
  IJobPostingAssessmentProvider,
} from '../job.posting.assessment.provider';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import {
  JobPostingAssessmentRecommendationEnum,
  JobPostingAssessmentResultEnum,
  JobPostingAssessmentStatusEnum,
} from '@/shared/models/common/enums';

@singleton
export class LocalJobPostingAssessmentProvider
  implements IJobPostingAssessmentProvider
{
  private tasks: Map<string, IAiJobPostingAssessmentTask>;

  constructor() {
    this.tasks = new Map();
  }

  /**
   * Initiates the job posting assessment job
   * @param jobPostingText The text of the job posting to assess
   * @returns A promise that resolves to the assessment task identifier
   */
  async doAssessment(
    taskId: string,
    jobPostingText: string
  ): Promise<IAiJobPostingAssessmentTask> {
    // check if task for the taskId exists and if it is not failed or completed
    const task = this.tasks.get(taskId);
    if (task) {
      if (
        task.status !== IAiJobPostingAssessmentStatus.FAILED &&
        task.status !== IAiJobPostingAssessmentStatus.COMPLETED
      ) {
        throw new AppError(
          'Job posting assessment task already exists',
          400,
          ErrorCode.JOB_POSTING_ASSESSMENT_TASK_ALREADY_EXISTS
        );
      }
    }

    const newTask: IAiJobPostingAssessmentTask = {
      taskId,
      status: IAiJobPostingAssessmentStatus.PENDING,
      jobPostingText: jobPostingText,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, newTask);

    // Proceed with the assessment
    await this.processTask(taskId, jobPostingText);

    return newTask;
  }

  /**
   * Gets the status of an assessment task
   * @param taskId The identifier of the assessment task
   * @returns A promise that resolves to the assessment task status
   */
  async getAssessmentTask(
    taskId: string
  ): Promise<IAiJobPostingAssessmentTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new AppError(
        `Assessment task not found with id ${taskId}`,
        404,
        ErrorCode.JOB_POSTING_ASSESSMENT_TASK_NOT_FOUND
      );
    }
    return task;
  }

  /**
   * Process the job posting assessment task
   * @param taskId The identifier of the assessment task
   */
  private async processTask(
    taskId: string,
    jobPostingText: string
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Assessment task not found with id ${taskId}`);
    }
    logger.info('Processing job posting assessment task', {
      context: 'LocalJobPostingAssessmentProvider.processTask',
      taskId,
      jobPostingText,
    });
    try {
      // Update task status to processing
      task.status = IAiJobPostingAssessmentStatus.LLM_PROCESSING;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      // TODO: Implement actual job posting assessment logic here
      // For now, we'll just simulate processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Update task status to completed
      task.status = IAiJobPostingAssessmentStatus.COMPLETED;
      task.updatedAt = new Date();
      task.assessment = {
        id: uuidv4(),
        jobPostingId: '123',
        status: JobPostingAssessmentStatusEnum.AI_REVIEW_COMPLETED,
        result: JobPostingAssessmentResultEnum.PASSED,
        score: 0.95,
        confidenceScore: 0.95,
        jobPostingText: jobPostingText,
        strengths: ['Clear job requirements', 'Competitive compensation'],
        areasForImprovement: [
          'Improve diversity language',
          'Add more specific technical requirements',
        ],
        overallFeedback: 'Well-structured job posting',
        jobDescriptionQuality: 'Clear and comprehensive job description',
        requirementsClarity: 'Requirements are well-defined',
        compensationAnalysis: 'Competitive compensation package',
        identifiedSkills: ['Project Management', 'Leadership', 'Communication'],
        requiredSkills: ['Project Management', 'Leadership'],
        preferredSkills: ['Communication', 'Team Management'],
        industryRelevance: ['Technology', 'Finance'],
        roleClarity: ['Project Manager', 'Team Leader'],
        titleQuality: 0.9,
        descriptionQuality: 0.85,
        requirementsQuality: 0.8,
        compensationQuality: 0.9,
        complianceIssues: [],
        diversityCompliance: true,
        legalCompliance: true,
        recommendation:
          JobPostingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.tasks.set(taskId, task);
    } catch (error) {
      // Update task status to failed
      task.status = IAiJobPostingAssessmentStatus.FAILED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      throw error;
    }
  }
}
