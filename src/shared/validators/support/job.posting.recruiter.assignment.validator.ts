import { z } from 'zod';
import { JobPostingRecruiterAssignmentStatusEnum } from '../../models/common/enums';

/**
 * Schema for creating a new recruiter assignment (automatic)
 */
export const jobPostingRecruiterAssignmentCreateValidator = z.object({
  body: z.object({
    data: z.object({
      jobPostingId: z
        .string()
        .uuid({ message: 'Job posting ID must be a valid UUID' }),
      assignedBy: z
        .string()
        .uuid({ message: 'Assigned by ID must be a valid UUID' })
        .optional(),
      notes: z
        .string()
        .max(1000, { message: 'Notes cannot exceed 1000 characters' })
        .optional(),
    }),
  }),
});

/**
 * Schema for manually assigning a recruiter to a job posting
 */
export const manualRecruiterAssignmentCreateValidator = z.object({
  body: z.object({
    data: z.object({
      jobPostingId: z
        .string()
        .uuid({ message: 'Job posting ID must be a valid UUID' }),
      recruiterId: z
        .string()
        .uuid({ message: 'Recruiter ID must be a valid UUID' }),
      assignedBy: z
        .string()
        .uuid({ message: 'Assigned by ID must be a valid UUID' })
        .optional(),
      notes: z
        .string()
        .max(1000, { message: 'Notes cannot exceed 1000 characters' })
        .optional(),
    }),
  }),
});

/**
 * Schema for getting a recruiter assignment by job posting ID
 */
export const jobPostingRecruiterAssignmentGetValidator = z.object({
  params: z.object({
    jobPostingId: z
      .string()
      .uuid({ message: 'Job posting ID must be a valid UUID' }),
  }),
});

/**
 * Schema for updating a recruiter assignment
 */
export const jobPostingRecruiterAssignmentUpdateValidator = z.object({
  params: z.object({
    assignmentId: z
      .string()
      .uuid({ message: 'Assignment ID must be a valid UUID' }),
  }),
  body: z.object({
    data: z.object({
      status: z
        .nativeEnum(JobPostingRecruiterAssignmentStatusEnum, {
          errorMap: () => ({
            message: `Status must be one of: ${Object.values(JobPostingRecruiterAssignmentStatusEnum).join(', ')}`,
          }),
        })
        .optional(),
      notes: z
        .string()
        .max(1000, { message: 'Notes cannot exceed 1000 characters' })
        .optional(),
      reassignedReason: z
        .string()
        .max(500, { message: 'Reassigned reason cannot exceed 500 characters' })
        .optional(),
    }),
  }),
});

/**
 * Schema for reassigning a recruiter
 */
export const jobPostingRecruiterAssignmentReassignValidator = z.object({
  params: z.object({
    assignmentId: z
      .string()
      .uuid({ message: 'Assignment ID must be a valid UUID' }),
  }),
  body: z.object({
    newRecruiterId: z
      .string()
      .uuid({ message: 'New recruiter ID must be a valid UUID' }),
    reason: z
      .string()
      .max(500, { message: 'Reason cannot exceed 500 characters' })
      .optional(),
  }),
});

/**
 * Schema for listing recruiter assignments
 */
export const jobPostingRecruiterAssignmentListValidator = z.object({
  query: z
    .object({
      recruiterId: z
        .string()
        .uuid({ message: 'Recruiter ID must be a valid UUID' })
        .optional(),
      status: z
        .nativeEnum(JobPostingRecruiterAssignmentStatusEnum, {
          errorMap: () => ({
            message: `Status must be one of: ${Object.values(JobPostingRecruiterAssignmentStatusEnum).join(', ')}`,
          }),
        })
        .optional(),
      page: z.coerce
        .number()
        .int()
        .min(1, { message: 'Page must be at least 1' })
        .optional(),
      limit: z.coerce
        .number()
        .int()
        .min(1, { message: 'Limit must be at least 1' })
        .max(100, { message: 'Limit cannot exceed 100' })
        .optional(),
    })
    .optional(),
});

/**
 * Schema for completing a recruiter assignment
 */
export const jobPostingRecruiterAssignmentCompleteValidator = z.object({
  params: z.object({
    assignmentId: z
      .string()
      .uuid({ message: 'Assignment ID must be a valid UUID' }),
  }),
  body: z
    .object({
      data: z
        .object({
          notes: z
            .string()
            .max(1000, { message: 'Notes cannot exceed 1000 characters' })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * Schema for assignment ID parameter
 */
export const jobPostingRecruiterAssignmentIdValidator = z.object({
  params: z.object({
    assignmentId: z
      .string()
      .uuid({ message: 'Assignment ID must be a valid UUID' }),
  }),
});

/**
 * Schema for getting available recruiters for an account manager
 */
export const jobPostingRecruiterAssignmentAvailableRecruitersValidator =
  z.object({
    params: z.object({
      accountManagerId: z
        .string()
        .uuid({ message: 'Account Manager ID must be a valid UUID' }),
    }),
    query: z
      .object({
        page: z.coerce
          .number()
          .int()
          .min(1, { message: 'Page must be at least 1' })
          .optional(),
        limit: z.coerce
          .number()
          .int()
          .min(1, { message: 'Limit must be at least 1' })
          .max(100, { message: 'Limit cannot exceed 100' })
          .optional(),
        sortBy: z
          .string()
          .max(50, { message: 'Sort field cannot exceed 50 characters' })
          .optional(),
        sortOrder: z
          .enum(['asc', 'desc'], {
            errorMap: () => ({
              message: 'Sort order must be either asc or desc',
            }),
          })
          .optional(),
        search: z
          .string()
          .max(100, { message: 'Search term cannot exceed 100 characters' })
          .optional(),
      })
      .optional(),
  });

/**
 * Schema for getting job postings assigned to a recruiter
 */
export const jobPostingRecruiterAssignmentJobPostingsValidator = z.object({
  params: z.object({
    recruiterId: z
      .string()
      .uuid({ message: 'Recruiter ID must be a valid UUID' }),
  }),
  query: z
    .object({
      page: z.coerce
        .number()
        .int()
        .min(1, { message: 'Page must be at least 1' })
        .optional(),
      limit: z.coerce
        .number()
        .int()
        .min(1, { message: 'Limit must be at least 1' })
        .max(100, { message: 'Limit cannot exceed 100' })
        .optional(),
      sortBy: z
        .string()
        .max(50, { message: 'Sort field cannot exceed 50 characters' })
        .optional(),
      sortOrder: z
        .enum(['asc', 'desc'], {
          errorMap: () => ({
            message: 'Sort order must be either asc or desc',
          }),
        })
        .optional(),
      search: z
        .string()
        .max(100, { message: 'Search term cannot exceed 100 characters' })
        .optional(),
      status: z
        .string()
        .max(50, { message: 'Status filter cannot exceed 50 characters' })
        .optional(),
    })
    .optional(),
});
