import { IJobPostingAssessment } from '@/shared/models/domain/client/job.posting.assessment.domain';

export enum IAiJobPostingAssessmentStatus {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  CREATING_JOB_POSTING_TEXT = 'CREATING_JOB_POSTING_TEXT',
  CREATING_PROMPT = 'CREATING_PROMPT',
  LLM_PROCESSING = 'LLM_PROCESSING',
  PARSING_RESULTS = 'PARSING_RESULTS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IAiJobPostingAssessmentTask {
  taskId: string;
  status: IAiJobPostingAssessmentStatus;
  assessment?: IJobPostingAssessment;
  error?: string;
  jobPostingText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobPostingAssessmentProvider {
  /**
   * Does the job posting assessment
   * @param jobPostingText The text of the job posting to assess
   * @returns A promise that resolves to the assessment task identifier
   */
  doAssessment(
    taskId: string,
    jobPostingText: string
  ): Promise<IAiJobPostingAssessmentTask>;

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  getAssessmentTask(taskId: string): Promise<IAiJobPostingAssessmentTask>;
}
