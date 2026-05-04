import {
  IResumeParsed,
  ResumeParsingMode,
} from '@/shared/models/domain/candidate/resume.parsing.domain';

export enum IAiResumeParsingStatus {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  DOWNLOADING_RESUME = 'DOWNLOADING_RESUME',
  CREATING_PROMPT = 'CREATING_PROMPT',
  LLM_PROCESSING = 'LLM_PROCESSING',
  PARSING_RESULTS = 'PARSING_RESULTS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IAiResumeParsingTask {
  taskId: string;
  status: IAiResumeParsingStatus;
  error?: string;
  fileUrl: string;
  parsedResume?: IResumeParsed;
  mode: ResumeParsingMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResumeParserProvider {
  /**
   * Parses a resume
   * @param resumeUrl The URL of the resume to parse
   * @returns A promise that resolves to the parsing task identifier
   */
  parse(
    taskId: string,
    resumeUrl: string,
    mode: ResumeParsingMode
  ): Promise<IAiResumeParsingTask>;

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  getParsingTask(taskId: string): Promise<IAiResumeParsingTask>;
}
