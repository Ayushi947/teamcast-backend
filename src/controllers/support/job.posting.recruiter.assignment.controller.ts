import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../common/base.controller';
import { singleton } from '@/shared/decorators/singleton';
import { JobPostingRecruiterAssignmentService } from '@/services/support/job.posting.recruiter.assignment.service';
import { createIApiRequest } from '@/utils/api.request';
import { getPaginationInfo } from '@/utils/pagination';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import {
  IJobPostingRecruiterAssignmentCreateApiRequest,
  IJobPostingRecruiterAssignmentCreateApiResponse,
  IJobPostingRecruiterAssignmentGetApiRequest,
  IJobPostingRecruiterAssignmentGetApiResponse,
  IJobPostingRecruiterAssignmentUpdateApiRequest,
  IJobPostingRecruiterAssignmentUpdateApiResponse,
  IJobPostingRecruiterAssignmentReassignApiRequest,
  IJobPostingRecruiterAssignmentReassignApiResponse,
  IJobPostingRecruiterAssignmentListApiRequest,
  IJobPostingRecruiterAssignmentListApiResponse,
  IJobPostingRecruiterAssignmentCompleteApiRequest,
  IJobPostingRecruiterAssignmentCompleteApiResponse,
  IJobPostingRecruiterAssignmentAvailableRecruitersApiRequest,
  IJobPostingRecruiterAssignmentAvailableRecruitersApiResponse,
  IJobPostingRecruiterAssignmentJobPostingsApiRequest,
  IJobPostingRecruiterAssignmentJobPostingsApiResponse,
  IManualRecruiterAssignmentCreateApiResponse,
} from '@/shared/models/api/support/job.posting.recruiter.assignment.api';

@singleton
export class JobPostingRecruiterAssignmentController extends BaseController {
  constructor(
    private readonly recruiterAssignmentService: JobPostingRecruiterAssignmentService
  ) {
    super();
  }

  /**
   * Create a new recruiter assignment
   */
  createAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecruiterAssignmentCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const clientUserId = req.user.clientUserId as string;
        const createRequest =
          createIApiRequest<IJobPostingRecruiterAssignmentCreateApiRequest>(
            req
          );

        return await this.recruiterAssignmentService.assignRecruiterToJobPosting(
          createRequest.data.jobPostingId,
          clientId,
          createRequest.data.assignedBy || clientUserId
        );
      }
    );
  };

  /**
   * Get recruiter assignment for a job posting
   */
  getAssignmentForJobPosting = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecruiterAssignmentGetApiResponse>(
      req,
      res,
      next,
      async () => {
        const clientId = req.user.clientId as string;
        const getRequest =
          createIApiRequest<IJobPostingRecruiterAssignmentGetApiRequest>(req);

        return await this.recruiterAssignmentService.getRecruiterAssignmentForJobPosting(
          getRequest.params.jobPostingId,
          clientId
        );
      }
    );
  };

  /**
   * Update a recruiter assignment
   */
  updateAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecruiterAssignmentUpdateApiResponse>(
      req,
      res,
      next,
      async () => {
        const updateRequest =
          createIApiRequest<IJobPostingRecruiterAssignmentUpdateApiRequest>(
            req
          );

        // For updating, we use the service's method that corresponds to the status
        if (updateRequest.data.status === 'COMPLETED') {
          return await this.recruiterAssignmentService.completeAssignment(
            updateRequest.params.assignmentId,
            req.user.id,
            updateRequest.data.notes
          );
        }

        // For other status updates, we would need additional service methods
        // For now, let's throw an error for unsupported operations
        throw new Error(
          'Direct status updates not supported. Use specific endpoints.'
        );
      }
    );
  };

  /**
   * Reassign a recruiter to a different job posting
   */
  reassignRecruiter = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecruiterAssignmentReassignApiResponse>(
      req,
      res,
      next,
      async () => {
        const reassignRequest =
          createIApiRequest<IJobPostingRecruiterAssignmentReassignApiRequest>(
            req
          );

        return await this.recruiterAssignmentService.reassignRecruiter(
          reassignRequest.params.assignmentId,
          reassignRequest.data.newRecruiterId,
          req.user.id,
          reassignRequest.data.reason
        );
      }
    );
  };

  /**
   * Complete a recruiter assignment
   */
  completeAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecruiterAssignmentCompleteApiResponse>(
      req,
      res,
      next,
      async () => {
        const completeRequest =
          createIApiRequest<IJobPostingRecruiterAssignmentCompleteApiRequest>(
            req
          );

        return await this.recruiterAssignmentService.completeAssignment(
          completeRequest.params.assignmentId,
          req.user.id,
          completeRequest.data?.notes
        );
      }
    );
  };

  /**
   * List recruiter assignments with optional filtering
   */
  listAssignments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecruiterAssignmentListApiResponse>(
      req,
      res,
      next,
      async () => {
        const listRequest =
          createIApiRequest<IJobPostingRecruiterAssignmentListApiRequest>(req);
        const query = listRequest.filters || {};

        // Get pagination info
        const paginationInfo = getPaginationInfo({
          page: query.page || 1,
          limit: query.limit || 10,
        });

        // If recruiterId is provided, get assignments for that recruiter
        if (query.recruiterId) {
          const assignments =
            await this.recruiterAssignmentService.getAssignmentsForRecruiter(
              query.recruiterId
            );

          // Apply pagination to the results
          const startIndex = paginationInfo.skip || 0;
          const endIndex = startIndex + (paginationInfo.take || 10);
          const paginatedAssignments = assignments.slice(startIndex, endIndex);

          return {
            items: paginatedAssignments,
            pagination: {
              total: assignments.length,
              page: query.page || 1,
              limit: query.limit || 10,
              totalPages: Math.ceil(assignments.length / (query.limit || 10)),
            },
          };
        }

        //  if no recruiterId is provided, return empty result

        return {
          items: [],
          pagination: {
            total: 0,
            page: query.page || 1,
            limit: query.limit || 10,
            totalPages: 0,
          },
        };
      }
    );
  };

  /**
   * Get available recruiters for an account manager (support team only)
   */
  getAvailableRecruitersForAccountManager = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecruiterAssignmentAvailableRecruitersApiResponse>(
      req,
      res,
      next,
      async () => {
        const availableRecruitersRequest =
          createIApiRequest<IJobPostingRecruiterAssignmentAvailableRecruitersApiRequest>(
            req
          );

        const accountManagerId =
          availableRecruitersRequest.params.accountManagerId;

        if (!accountManagerId) {
          throw new AppError(
            'Account Manager ID is required',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        const paginationRequest = {
          page: availableRecruitersRequest.filters?.page,
          limit: availableRecruitersRequest.filters?.limit,
          sortBy: availableRecruitersRequest.filters?.sortBy,
          sortOrder: availableRecruitersRequest.filters?.sortOrder,
          search: availableRecruitersRequest.filters?.search,
        };

        const result =
          await this.recruiterAssignmentService.getAvailableRecruitersForAccountManager(
            accountManagerId,
            paginationRequest
          );

        return result;
      }
    );
  };

  /**
   * Get job postings assigned to a specific recruiter
   */
  getJobPostingsForRecruiter = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IJobPostingRecruiterAssignmentJobPostingsApiResponse>(
      req,
      res,
      next,
      async () => {
        const jobPostingsRequest =
          createIApiRequest<IJobPostingRecruiterAssignmentJobPostingsApiRequest>(
            req
          );

        const recruiterId = jobPostingsRequest.params.recruiterId;

        if (!recruiterId) {
          throw new AppError(
            'Recruiter ID is required',
            400,
            ErrorCode.INVALID_REQUEST
          );
        }

        const paginationRequest = {
          page: jobPostingsRequest.filters?.page,
          limit: jobPostingsRequest.filters?.limit,
          sortBy: jobPostingsRequest.filters?.sortBy,
          sortOrder: jobPostingsRequest.filters?.sortOrder,
          search: jobPostingsRequest.filters?.search,
          status: jobPostingsRequest.filters?.status,
        };

        const result =
          await this.recruiterAssignmentService.getJobPostingsForRecruiter(
            recruiterId,
            paginationRequest
          );

        return result;
      }
    );
  };

  /**
   * Manually assign a recruiter to a job posting
   */
  manuallyAssignRecruiter = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    this.handleRequest<IManualRecruiterAssignmentCreateApiResponse>(
      req,
      res,
      next,
      async () => {
        // Access the data directly from req.body.data as validated by the validator
        const requestData = req.body.data;

        const assignedBy = requestData.assignedBy || req.user.id;

        return await this.recruiterAssignmentService.manuallyAssignRecruiterToJobPosting(
          requestData.jobPostingId,
          requestData.recruiterId,
          assignedBy,
          requestData.notes
        );
      }
    );
  };
}
