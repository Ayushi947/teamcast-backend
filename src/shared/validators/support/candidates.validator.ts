import { z } from 'zod';
import { paginationValidatorSchema } from '../common/pagination.validator';
import {
  CandidateStatusEnum,
  CandidateAssessmentStageEnum,
  CandidateResumeAssessmentStatusEnum,
  CandidateOnboardingAssessmentStatusEnum,
  JobSearchStatusEnum,
  SexEnum,
  MaritalStatusEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  CommunicationChannelEnum,
  ResumeAssessmentStatusEnum,
  ResumeAssessmentResultEnum,
  ResumeAssessmentRecommendationEnum,
  OnboardingAssessmentStatusEnum,
  OnboardingAssessmentResultEnum,
  OnboardingAssessmentRecommendationEnum,
  OnboardingAssessmentSectionStatusEnum,
  OnboardingAssessmentSectionResultEnum,
  JobAiAssessmentStatusEnum,
  JobAiAssessmentResultEnum,
  JobAiAssessmentRecommendationEnum,
  JobAiAssessmentSectionStatusEnum,
  JobAiAssessmentSectionResultEnum,
} from '../../models/common/enums';

/**
 * Validator for creating a support candidate - matches ISupportCandidateCreateSimple interface exactly
 */
export const supportCandidateCreateValidator = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, { message: 'Full name must be at least 2 characters' }),
    email: z.string().email({ message: 'Invalid email format' }),
    jobTitle: z.string().optional(),
    partnerId: z
      .string()
      .uuid({ message: 'Invalid partner ID format' })
      .optional(),
  }),
});

/**
 * Validator for updating a support candidate - matches ISupportCandidateUpdate interface
 */
export const supportCandidateUpdateValidator = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid candidate ID format' }),
  }),
  body: z.object({
    // Basic candidate information
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9][\d\-+]{0,14}$/, {
        message: 'Phone number must be a valid international format',
      })
      .optional(),
    image: z.string().optional(),

    // Candidate status and assessment stages
    status: z
      .enum(Object.values(CandidateStatusEnum) as [string, ...string[]])
      .optional(),
    assessmentStage: z
      .enum(
        Object.values(CandidateAssessmentStageEnum) as [string, ...string[]]
      )
      .optional(),
    resumeAssessmentStatus: z
      .enum(
        Object.values(CandidateResumeAssessmentStatusEnum) as [
          string,
          ...string[],
        ]
      )
      .optional(),
    onboardingAssessmentStatus: z
      .enum(
        Object.values(CandidateOnboardingAssessmentStatusEnum) as [
          string,
          ...string[],
        ]
      )
      .optional(),
    jobSearchStatus: z
      .enum(Object.values(JobSearchStatusEnum) as [string, ...string[]])
      .optional(),

    // Personal information
    sex: z.enum(Object.values(SexEnum) as [string, ...string[]]).optional(),
    birthDate: z.string().datetime().optional(),
    maritalStatus: z
      .enum(Object.values(MaritalStatusEnum) as [string, ...string[]])
      .optional(),

    // Publishing and completion
    isPublished: z.boolean().optional(),
    isDirty: z.boolean().optional(),
    completionPercentage: z.number().min(0).max(100).optional(),
    createdBy: z.string().optional(),

    // Partner relationship
    partnerId: z
      .string()
      .uuid({ message: 'Invalid partner ID format' })
      .optional(),

    // Resume data
    resume: z
      .object({
        summary: z.string().optional(),
        skills: z.array(z.string()).optional(),
        industries: z.array(z.string()).optional(),
        totalExperience: z.number().min(0).optional(),
        highestEducationLevel: z.string().optional(),
        experience: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              title: z.string(),
              company: z.string(),
              startDate: z.string().datetime(),
              endDate: z.string().datetime().optional(),
              description: z.string(),
              projects: z
                .array(
                  z.object({
                    id: z.string().uuid().optional(),
                    name: z.string(),
                    description: z.string(),
                    startDate: z.string().datetime(),
                    endDate: z.string().datetime().optional(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
        education: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              institution: z.string(),
              degree: z.string(),
              fieldOfStudy: z.string().min(0).nullable().optional(),
              startDate: z.string().datetime(),
              endDate: z.string().datetime().optional(),
            })
          )
          .optional(),
        certifications: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              name: z.string(),
              issuer: z.string(),
              date: z.string().datetime(),
            })
          )
          .optional(),
      })
      .optional(),

    // Candidate settings
    settings: z
      .object({
        globalSettings: z
          .object({
            id: z.string().uuid().optional(),
          })
          .optional(),
        notificationsEnabled: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        jobAlerts: z.boolean().optional(),
        applicationUpdates: z.boolean().optional(),
        profileVisibility: z.boolean().optional(),
        shareDataWithEmployers: z.boolean().optional(),
        darkMode: z.boolean().optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
        preferredCommunicationChannel: z
          .enum(
            Object.values(CommunicationChannelEnum) as [string, ...string[]]
          )
          .optional(),
      })
      .optional(),

    // Candidate preferences
    preferences: z
      .object({
        preferredIndustries: z.array(z.string()).optional(),
        preferredLocations: z.array(z.string()).optional(),
        preferredWorkTypes: z
          .array(
            z.enum(Object.values(WorkCommitmentEnum) as [string, ...string[]])
          )
          .optional(),
        preferredJobTitles: z.array(z.string()).optional(),
        preferredJobCommitments: z.array(z.string()).optional(),
        preferredJobSchedules: z
          .array(
            z.enum(Object.values(WorkScheduleEnum) as [string, ...string[]])
          )
          .optional(),
        preferredSalaryMin: z.number().optional(),
        preferredSalaryMax: z.number().optional(),
        preferredSalaryCurrency: z.string().optional(),
        preferredEquity: z.boolean().optional(),
        preferredBenefits: z.array(z.string()).optional(),
        preferredResponsibilities: z.array(z.string()).optional(),
        preferredTags: z.array(z.string()).optional(),
      })
      .optional(),

    // Subscription object validation - comprehensive fields for support
    subscription: z
      .object({
        status: z.string().optional(),
        endDate: z.string().datetime().optional(),
        autoRenew: z.boolean().optional(),
        assessmentsUsedThisMonth: z.number().min(0).optional(),
        practiceAssessmentsUsed: z.number().min(0).optional(),
        additionalPracticeAssessmentCredits: z.number().min(0).optional(),
      })
      .optional(),

    // Resume assessments validation
    resumeAssessments: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          status: z
            .enum(
              Object.values(ResumeAssessmentStatusEnum) as [string, ...string[]]
            )
            .optional(),
          result: z
            .enum(
              Object.values(ResumeAssessmentResultEnum) as [string, ...string[]]
            )
            .optional(),
          score: z.number().min(0).max(100).optional(),
          recommendation: z
            .enum(
              Object.values(ResumeAssessmentRecommendationEnum) as [
                string,
                ...string[],
              ]
            )
            .optional(),
          overallFeedback: z.string().optional(),
          strengths: z.array(z.string()).optional(),
          areasForImprovement: z.array(z.string()).optional(),
          skills: z.array(z.string()).optional(),
          technicalSkills: z.array(z.string()).optional(),
          softSkills: z.array(z.string()).optional(),
          industriesFit: z.array(z.string()).optional(),
          jobRolesFit: z.array(z.string()).optional(),
        })
      )
      .optional(),

    // Onboarding assessments validation
    onboardingAssessments: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          status: z
            .enum(
              Object.values(OnboardingAssessmentStatusEnum) as [
                string,
                ...string[],
              ]
            )
            .optional(),
          result: z
            .enum(
              Object.values(OnboardingAssessmentResultEnum) as [
                string,
                ...string[],
              ]
            )
            .optional(),
          score: z.number().min(0).max(100).optional(),
          recommendation: z
            .enum(
              Object.values(OnboardingAssessmentRecommendationEnum) as [
                string,
                ...string[],
              ]
            )
            .optional(),
          overallFeedback: z.string().optional(),
          strengths: z.array(z.string()).optional(),
          areasForImprovement: z.array(z.string()).optional(),
          skills: z.array(z.string()).optional(),
          technicalSkills: z.array(z.string()).optional(),
          softSkills: z.array(z.string()).optional(),
          duration: z.number().min(0).optional(),
          sections: z
            .array(
              z.object({
                id: z.string().uuid().optional(),
                title: z.string().optional(),
                description: z.string().optional(),
                type: z.string().optional(), // Dynamic assessment section types
                status: z
                  .enum(
                    Object.values(OnboardingAssessmentSectionStatusEnum) as [
                      string,
                      ...string[],
                    ]
                  )
                  .optional(),
                result: z
                  .enum(
                    Object.values(OnboardingAssessmentSectionResultEnum) as [
                      string,
                      ...string[],
                    ]
                  )
                  .optional(),
                score: z.number().min(0).max(100).optional(),
                order: z.number().min(0).optional(),
                feedback: z.string().optional(),
                strengths: z.array(z.string()).optional(),
                areasForImprovement: z.array(z.string()).optional(),
              })
            )
            .optional(),
          // Allow limited editing of video analysis fields from support
          videoAnalysis: z
            .object({
              id: z.string().uuid().optional(),
              strengths: z.array(z.string()).optional(),
              areasForImprovement: z.array(z.string()).optional(),
            })
            .optional(),
        })
      )
      .optional(),

    // Job AI assessments validation
    jobAiAssessments: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          status: z
            .enum(
              Object.values(JobAiAssessmentStatusEnum) as [string, ...string[]]
            )
            .optional(),
          result: z
            .enum(
              Object.values(JobAiAssessmentResultEnum) as [string, ...string[]]
            )
            .optional(),
          score: z.number().min(0).max(100).optional(),
          recommendation: z
            .enum(
              Object.values(JobAiAssessmentRecommendationEnum) as [
                string,
                ...string[],
              ]
            )
            .optional(),
          overallFeedback: z.string().optional(),
          strengths: z.array(z.string()).optional(),
          areasForImprovement: z.array(z.string()).optional(),
          skills: z.array(z.string()).optional(),
          technicalSkills: z.array(z.string()).optional(),
          softSkills: z.array(z.string()).optional(),
          duration: z.number().min(0).optional(),
          sections: z
            .array(
              z.object({
                id: z.string().uuid().optional(),
                title: z.string().optional(),
                description: z.string().optional(),
                type: z.string().optional(), // Dynamic assessment section types
                status: z
                  .enum(
                    Object.values(JobAiAssessmentSectionStatusEnum) as [
                      string,
                      ...string[],
                    ]
                  )
                  .optional(),
                result: z
                  .enum(
                    Object.values(JobAiAssessmentSectionResultEnum) as [
                      string,
                      ...string[],
                    ]
                  )
                  .optional(),
                score: z.number().min(0).max(100).optional(),
                order: z.number().min(0).optional(),
                feedback: z.string().optional(),
                strengths: z.array(z.string()).optional(),
                areasForImprovement: z.array(z.string()).optional(),
              })
            )
            .optional(),
          // Allow limited editing of video analysis fields from support
          videoAnalysis: z
            .object({
              id: z.string().uuid().optional(),
              strengths: z.array(z.string()).optional(),
              areasForImprovement: z.array(z.string()).optional(),
            })
            .optional(),
        })
      )
      .optional(),
  }),
});

/**
 * Validator for support candidate ID in route parameters
 */
export const supportCandidateIdValidator = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid candidate ID format' }),
  }),
});

/**
 * Schema for filtering support candidates
 */
const supportCandidateFilterSchema = z.object({
  status: z.string().optional(),
  assessmentStage: z.string().optional(),
  search: z.string().optional(),
});

/**
 * Validator for listing support candidates with filtering
 */
export const supportCandidateListValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...supportCandidateFilterSchema.shape,
  }),
});

/**
 * Validator for getting support candidate details
 */
export const supportCandidateDetailValidator = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid candidate ID format' }),
  }),
});

/**
 * Validator for getting recommended candidates
 */
export const supportRecommendedCandidatesValidator = z.object({
  query: z.object({
    ...paginationValidatorSchema.shape,
    ...supportCandidateFilterSchema.shape,
  }),
});

/**
 * Validator for publishing candidate
 */
export const supportCandidatePublishValidator = z.object({
  body: z.object({
    candidateId: z.string().uuid({ message: 'Invalid candidate ID format' }),
    note: z.string(),
  }),
});

/**
 * Validator for resetting onboarding assessment
 */
export const supportCandidateResetOnboardingAssessmentValidator = z.object({
  params: z.object({
    supportCandidateId: z
      .string()
      .uuid({ message: 'Invalid candidate ID format' })
      .optional(),
    assessmentId: z
      .string()
      .uuid({ message: 'Invalid assessment ID format' })
      .optional(),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});

/**
 * Validator for resending job AI assessment invitation
 */
export const supportCandidateResendJobAiInvitationValidator = z.object({
  params: z.object({
    invitationId: z.string().uuid({ message: 'Invalid invitation ID format' }),
  }),
});

/**
 * Validator for getting video chunks for onboarding assessment (Support/Admin)
 */
export const supportCandidateOnboardingAssessmentVideoChunksGetValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
    }),
    query: z
      .object({
        questionId: z.string().optional(),
        includeAnalysis: z.string().optional(),
        includePlaybackUrls: z.string().optional(),
      })
      .optional(),
  });

/**
 * Validator for getting chunk playback URL (Support/Admin)
 */
export const supportCandidateOnboardingAssessmentChunkPlaybackUrlGetValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
      chunkId: z.string(),
    }),
  });

/**
 * Validator for getting video chunks for job AI assessment (Support/Admin)
 */
export const supportCandidateJobAiAssessmentVideoChunksGetValidator = z.object({
  params: z.object({
    assessmentId: z.string(),
  }),
  query: z
    .object({
      questionId: z.string().optional(),
      sectionId: z.string().optional(),
      includeAnalysis: z.string().optional(),
      includePlaybackUrls: z.string().optional(),
    })
    .optional(),
});

/**
 * Validator for getting chunk playback URL for job AI assessment (Support/Admin)
 */
export const supportCandidateJobAiAssessmentChunkPlaybackUrlGetValidator =
  z.object({
    params: z.object({
      assessmentId: z.string(),
      chunkId: z.string(),
    }),
  });
