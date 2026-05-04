import { Request, Response, NextFunction } from 'express';
import { PublicPracticeAssessmentService } from '@/services/candidate/public.practice.assessment.service';
import { BaseController } from '../common/base.controller';
import { createIApiRequest } from '@/utils/api.request';
import {
  IPublicPracticeAssessmentCreateApiRequest,
  IPublicPracticeAssessmentCreateApiResponse,
  IPublicPracticeAssessmentGetApiRequest,
  IPublicPracticeAssessmentGetApiResponse,
  IPublicPracticeAssessmentLinkApiRequest,
  IPublicPracticeAssessmentLinkApiResponse,
  IPublicPracticeAssessmentListByEmailApiResponse,
  IPublicPracticeAssessmentListApiResponse,
  IPublicPracticeAssessmentParseApiRequest,
  IPublicPracticeAssessmentParseApiResponse,
  IPublicPracticeAssessmentParseDescriptionApiRequest,
  IPublicPracticeAssessmentParseDescriptionApiResponse,
  IPublicPracticeAssessmentGetParsedJobDataApiRequest,
  IPublicPracticeAssessmentGetParsedJobDataApiResponse,
  IPublicPracticeAssessmentTaskGetApiRequest,
  IPublicPracticeAssessmentTaskGetApiResponse,
  IPublicPracticeAssessmentStartApiRequest,
  IPublicPracticeAssessmentStartApiResponse,
  IPublicPracticeAssessmentSubmitAnswerApiRequest,
  IPublicPracticeAssessmentSubmitAnswerApiResponse,
  IPublicPracticeAssessmentSubmitApiRequest,
  IPublicPracticeAssessmentSubmitApiResponse,
  IPublicPracticeAssessmentPresignedUrlApiRequest,
  IPublicPracticeAssessmentPresignedUrlApiResponse,
  IPublicPracticeAssessmentChunkUploadApiRequest,
  IPublicPracticeAssessmentChunkUploadApiResponse,
  IPublicPracticeAssessmentUpdateTermsAcceptedApiRequest,
} from '@/shared/models/api/candidate/public.practice.assessment.api';
import {
  IPublicPracticeAssessmentCreate,
  IPublicPracticeAssessmentWithMetadata,
} from '@/shared/models/domain/candidate/public.practice.assessment.domain';
import { singleton } from '@/shared/decorators/singleton';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';

@singleton
export class PublicPracticeAssessmentController extends BaseController {
  constructor(
    private readonly publicPracticeAssessmentService: PublicPracticeAssessmentService
  ) {
    super();
  }

  /**
   * Parse a job URL and store parsed data
   */
  parse = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentParseApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<IPublicPracticeAssessmentParseApiRequest>(req);
        return await this.publicPracticeAssessmentService.parseJobUrl(
          request.data.jobUrl
        );
      }
    );
  };

  /**
   * Parse a job description text and store parsed data
   */
  parseDescription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentParseDescriptionApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<IPublicPracticeAssessmentParseDescriptionApiRequest>(
            req
          );
        return await this.publicPracticeAssessmentService.parseJobDescription(
          request.data.jobDescriptionText
        );
      }
    );
  };

  /**
   * Get parsed job data by ID
   */
  getParsedJobData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentGetParsedJobDataApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<IPublicPracticeAssessmentGetParsedJobDataApiRequest>(
            req
          );
        return await this.publicPracticeAssessmentService.getParsedJobData(
          request.params.parsedJobDataId
        );
      }
    );
  };

  /**
   * Create and initialize a public practice assessment from parsed job data
   */
  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<IPublicPracticeAssessmentCreateApiRequest>(req);
        const createRequest: IPublicPracticeAssessmentCreate = {
          parsedJobDataId: request.data.parsedJobDataId,
          parsedJobData: request.data.parsedJobData,
          candidateName: request.data.candidateName,
          candidateEmail: request.data.candidateEmail,
          resumeFile: req.file ? req.file.buffer : undefined,
          resumeFileName: req.file ? req.file.originalname : undefined,
        };
        const result: IPublicPracticeAssessmentWithMetadata =
          await this.publicPracticeAssessmentService.createFromParsedData(
            createRequest
          );

        // Extract metadata from result
        const { _metadata: metadata, ...assessment } = result;

        // Return with metadata in the response structure
        return {
          data: assessment,
          ...(metadata && { metadata }),
        };
      }
    );
  };

  /**
   * Get a public practice assessment by ID
   */
  get = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IPublicPracticeAssessmentGetApiRequest>(req);
        return await this.publicPracticeAssessmentService.getPublicPracticeAssessment(
          params.assessmentId
        );
      }
    );
  };

  /**
   * Link a public practice assessment to a candidate after signup/login
   */
  linkToCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentLinkApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            400,
            ErrorCode.CANDIDATE_ID_REQUIRED
          );
        }

        const request =
          createIApiRequest<IPublicPracticeAssessmentLinkApiRequest>(req);

        // Use candidateId from auth if not provided in data
        const targetCandidateId = request.data.candidateId || candidateId;

        return await this.publicPracticeAssessmentService.linkToCandidate(
          request.params.assessmentId,
          targetCandidateId
        );
      }
    );
  };

  /**
   * Get public practice assessments by email (for linking after signup)
   */
  getByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentListByEmailApiResponse>(
      req,
      res,
      next,
      async () => {
        const email = req.query.email as string;
        if (!email) {
          throw new AppError('Email is required', 400, ErrorCode.INVALID_INPUT);
        }
        return await this.publicPracticeAssessmentService.getByEmail(email);
      }
    );
  };

  /**
   * Check if candidate exists by email and return candidate info
   * Used for pre-filling form data when email is entered
   */
  checkCandidateByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{
      exists: boolean;
      name?: string;
      hasResume: boolean;
      resumeParsed: boolean;
      userType?: string;
    }>(req, res, next, async () => {
      const email = req.query.email as string;
      if (!email) {
        throw new AppError('Email is required', 400, ErrorCode.INVALID_INPUT);
      }
      return await this.publicPracticeAssessmentService.checkCandidateByEmail(
        email
      );
    });
  };

  /**
   * Get practice assessments for authenticated candidate
   */
  getPracticeAssessmentsForCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentListApiResponse>(
      req,
      res,
      next,
      async () => {
        const candidateId = req.user?.candidateId;
        if (!candidateId) {
          throw new AppError(
            'Candidate ID is required',
            401,
            ErrorCode.UNAUTHORIZED
          );
        }

        const paginationRequest = {
          page: req.query.page
            ? parseInt(req.query.page as string, 10)
            : undefined,
          limit: req.query.limit
            ? parseInt(req.query.limit as string, 10)
            : undefined,
          sortBy: req.query.sortBy as string | undefined,
          sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
        };

        return await this.publicPracticeAssessmentService.getPracticeAssessmentsForCandidate(
          candidateId,
          paginationRequest
        );
      }
    );
  };

  /**
   * Get public practice assessment initialization task
   */
  getTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IPublicPracticeAssessmentTaskGetApiRequest>(req);
        return await this.publicPracticeAssessmentService.getTask(
          params.assessmentId
        );
      }
    );
  };

  /**
   * Initialize public practice assessment (matches job AI assessment flow)
   * Called when user clicks "I am ready" on check page
   */
  initialize = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentTaskGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IPublicPracticeAssessmentTaskGetApiRequest>(req);
        return await this.publicPracticeAssessmentService.initialize(
          params.assessmentId
        );
      }
    );
  };

  /**
   * Start a public practice assessment
   */
  startAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentStartApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IPublicPracticeAssessmentStartApiRequest>(req);
        return await this.publicPracticeAssessmentService.startAssessment(
          params.assessmentId
        );
      }
    );
  };

  /**
   * Submit answer for a question
   */
  submitAnswer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentSubmitAnswerApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<IPublicPracticeAssessmentSubmitAnswerApiRequest>(
            req
          );
        return await this.publicPracticeAssessmentService.submitAnswer(
          request.params.assessmentId,
          request.params.questionId,
          request.data.answerGiven
        );
      }
    );
  };

  /**
   * Submit public practice assessment
   */
  submitAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentSubmitApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params } =
          createIApiRequest<IPublicPracticeAssessmentSubmitApiRequest>(req);
        return await this.publicPracticeAssessmentService.submitAssessment(
          params.assessmentId
        );
      }
    );
  };

  /**
   * Send heartbeat to update assessment timer state
   */
  heartbeat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<boolean>(req, res, next, async () => {
      const { params } = req;
      const { duration, status } = req.body;

      if (typeof duration !== 'number') {
        throw new AppError(
          'Duration is required and must be a number',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      return await this.publicPracticeAssessmentService.heartbeat(
        params.assessmentId,
        duration,
        status
      );
    });
  };

  /**
   * Get presigned URL for video chunk upload
   */
  getPresignedUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentPresignedUrlApiResponse>(
      req,
      res,
      next,
      async () => {
        const { params, filters } =
          createIApiRequest<IPublicPracticeAssessmentPresignedUrlApiRequest>(
            req
          );
        const chunkIndex = filters?.chunkIndex;
        return await this.publicPracticeAssessmentService.getPresignedUrl(
          params.assessmentId,
          chunkIndex
        );
      }
    );
  };

  /**
   * Record video chunk upload
   */
  recordChunkUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentChunkUploadApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<IPublicPracticeAssessmentChunkUploadApiRequest>(
            req
          );

        if (!request.data.chunkIndex || !request.data.gcsUri) {
          throw new AppError(
            'chunkIndex and gcsUri are required',
            400,
            ErrorCode.INVALID_INPUT
          );
        }

        return await this.publicPracticeAssessmentService.recordChunkUpload(
          request.params.assessmentId,
          request.data.chunkIndex,
          request.data.gcsUri,
          request.data.questionId,
          request.data.sectionId
        );
      }
    );
  };

  /**
   * Update terms acceptance status for a public practice assessment
   * No authentication required
   */
  updateTermsAccepted = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<{ message: string }>(req, res, next, async () => {
      const request =
        createIApiRequest<IPublicPracticeAssessmentUpdateTermsAcceptedApiRequest>(
          req
        );

      const { termsAccepted } = request.data;

      if (typeof termsAccepted !== 'boolean') {
        throw new AppError(
          'Terms accepted must be a boolean value',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      await this.publicPracticeAssessmentService.updateTermsAccepted(
        request.params.assessmentId,
        termsAccepted
      );

      return { message: 'Terms acceptance status updated successfully' };
    });
  };

  /**
   * Get presigned URL for video chunk upload
   */
  getPresignedUrlForVideoChunk = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const request =
        createIApiRequest<IPublicPracticeAssessmentPresignedUrlApiRequest>(req);
      const { assessmentId } = request.params;
      const { chunkIndex, sectionId, questionId } = req.query;

      return await this.publicPracticeAssessmentService.getPresignedUrlForVideoChunk(
        assessmentId,
        chunkIndex ? parseInt(chunkIndex as string, 10) : undefined,
        sectionId as string | undefined,
        questionId as string | undefined
      );
    });
  };

  /**
   * Record video chunk upload
   */
  recordVideoChunkUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IPublicPracticeAssessmentChunkUploadApiResponse>(
      req,
      res,
      next,
      async () => {
        const request =
          createIApiRequest<IPublicPracticeAssessmentChunkUploadApiRequest>(
            req
          );
        const { assessmentId } = request.params;
        const { chunkIndex, gcsUri, questionId, sectionId } = request.data;

        return await this.publicPracticeAssessmentService.recordVideoChunkUpload(
          assessmentId,
          chunkIndex,
          gcsUri,
          questionId,
          sectionId
        );
      }
    );
  };

  /**
   * Get video chunks for an assessment
   */
  getVideoChunks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const request =
        createIApiRequest<IPublicPracticeAssessmentGetApiRequest>(req);
      const { assessmentId } = request.params;
      const { questionId, sectionId, includeAnalysis, includePlaybackUrls } =
        req.query;

      return await this.publicPracticeAssessmentService.getVideoChunks(
        assessmentId,
        {
          questionId: questionId as string | undefined,
          sectionId: sectionId as string | undefined,
          includeAnalysis: includeAnalysis === 'true',
          includePlaybackUrls: includePlaybackUrls === 'true',
        }
      );
    });
  };

  /**
   * Record proctoring event
   */
  recordProctoringEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const request =
        createIApiRequest<IPublicPracticeAssessmentGetApiRequest>(req);
      const { assessmentId } = request.params;
      const { type, data } = req.body;

      if (!type) {
        throw new AppError(
          'Proctoring event type is required',
          400,
          ErrorCode.INVALID_INPUT
        );
      }

      return await this.publicPracticeAssessmentService.recordProctoringEvent(
        assessmentId,
        type,
        data
      );
    });
  };

  /**
   * Get proctoring data for an assessment
   */
  getProctoringData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const request =
        createIApiRequest<IPublicPracticeAssessmentGetApiRequest>(req);
      const { assessmentId } = request.params;

      return await this.publicPracticeAssessmentService.getProctoringData(
        assessmentId
      );
    });
  };

  /**
   * Trigger video analysis
   */
  triggerVideoAnalysis = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const request =
        createIApiRequest<IPublicPracticeAssessmentGetApiRequest>(req);
      const { assessmentId } = request.params;

      return await this.publicPracticeAssessmentService.triggerVideoAnalysis(
        assessmentId
      );
    });
  };

  /**
   * Get video analysis results
   */
  getVideoAnalysis = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<any>(req, res, next, async () => {
      const request =
        createIApiRequest<IPublicPracticeAssessmentGetApiRequest>(req);
      const { assessmentId } = request.params;

      return await this.publicPracticeAssessmentService.getVideoAnalysis(
        assessmentId
      );
    });
  };
}
