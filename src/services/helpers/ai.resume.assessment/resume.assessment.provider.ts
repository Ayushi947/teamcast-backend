import { IResumeAssessment } from '@/shared/models/domain/candidate/resume.assessment.domain';

export enum IAiResumeAssessmentStatus {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  CREATING_RESUME_TEXT = 'CREATING_RESUME_TEXT',
  CREATING_PROMPT = 'CREATING_PROMPT',
  LLM_PROCESSING = 'LLM_PROCESSING',
  PARSING_RESULTS = 'PARSING_RESULTS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IAiResumeAssessmentTask {
  taskId: string;
  status: IAiResumeAssessmentStatus;
  assessment?: IResumeAssessment;
  error?: string;
  resumeText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResumeAssessmentProvider {
  /**
   * Does the resume assessment
   * @param resumeText The text of the resume to assess
   * @returns A promise that resolves to the assessment task identifier
   */
  doAssessment(
    taskId: string,
    resumeText: string
  ): Promise<IAiResumeAssessmentTask>;

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  getAssessmentTask(taskId: string): Promise<IAiResumeAssessmentTask>;
}
