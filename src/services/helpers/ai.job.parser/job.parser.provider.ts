import {
  IJobParsed,
  JobParsingMode,
} from '@/shared/models/domain/client/job.parsing.domain';

export enum IAiJobParsingStatus {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  DOWNLOADING_JOB_DESCRIPTION = 'DOWNLOADING_JOB_DESCRIPTION',
  CREATING_PROMPT = 'CREATING_PROMPT',
  LLM_PROCESSING = 'LLM_PROCESSING',
  PARSING_RESULTS = 'PARSING_RESULTS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IAiJobParsingTask {
  taskId: string;
  status: IAiJobParsingStatus;
  error?: string;
  fileUrl: string;
  parsedJob?: IJobParsed;
  mode: JobParsingMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobParserProvider {
  /**
   * Parses a job description
   * @param jobUrl The URL of the job description to parse
   * @returns A promise that resolves to the parsing task identifier
   */
  parse(
    taskId: string,
    jobUrl: string,
    mode: JobParsingMode
  ): Promise<IAiJobParsingTask>;

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  getParsingTask(taskId: string): Promise<IAiJobParsingTask>;

  /**
   * Gets the parsed job description
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsed job description
   */
  getParsedJob(taskId: string): Promise<IJobParsed>;
}
