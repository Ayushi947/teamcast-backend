import { CandidateShortlistStatusEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistCreate:
 *       type: object
 *       required:
 *         - candidateId
 *       properties:
 *         candidateId:
 *           type: string
 *           format: uuid
 *           description: ID of the candidate to shortlist
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *           description: ID of the job posting
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Notes about the candidate
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1-5
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Custom tags for the candidate
 */
export interface IClientCandidateShortlistCreate {
  candidateId: string;
  jobPostingId?: string; // Make optional for independent shortlisting
  notes?: string;
  rating?: number;
  tags?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistUpdate:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/CandidateShortlistStatusEnum'
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Notes about the candidate
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1-5
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Custom tags for the candidate
 */
export interface IClientCandidateShortlistUpdate {
  status?: CandidateShortlistStatusEnum;
  notes?: string;
  rating?: number;
  tags?: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlist:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         candidateId:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *         status:
 *           $ref: '#/components/schemas/CandidateShortlistStatusEnum'
 *         notes:
 *           type: string
 *           nullable: true
 *         rating:
 *           type: number
 *           nullable: true
 *           minimum: 1
 *           maximum: 5
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         shortlistedById:
 *           type: string
 *           format: uuid
 *         viewedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IClientCandidateShortlist {
  id: string;
  candidateId: string;
  clientId: string;
  jobPostingId: string;
  status: CandidateShortlistStatusEnum;
  notes?: string;
  rating?: number;
  tags: string[];
  shortlistedById: string;
  viewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistWithCandidate:
 *       allOf:
 *         - $ref: '#/components/schemas/IClientCandidateShortlist'
 *         - type: object
 *           properties:
 *             candidate:
 *               type: object
 *               description: Candidate details
 *             jobPosting:
 *               type: object
 *               description: Job posting details (if applicable)
 *               nullable: true
 *             shortlistedBy:
 *               type: object
 *               description: Client user who shortlisted the candidate
 */
export interface IClientCandidateShortlistWithCandidate
  extends IClientCandidateShortlist {
  candidate: {
    id: string;
    user: {
      id: string;

      name: string;
      email: string;
      profilePicture?: string;
    };
    status: string;
    jobSearchStatus: string;
    completionPercentage: number;
    resume?: {
      id: string;
      title: string;
      summary: string;
      currentJobTitle: string;
      currentCompany: string;
      currentWorkLocation: string;
      currentSalary: number;
      currentSalaryCurrency: string;
      currentWorkType: string;
      currentWorkCommitment: string;
      currentWorkSchedule: string;
      totalExperience: number;
      resumeSkills: string[];
      education: {
        id: string;
        degree: string;
      }[];
    };
  };
  jobPosting?: {
    id: string;
    title: string;
    department?: string;
  };
  shortlistedBy: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientCandidateShortlistQuery:
 *       type: object
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/CandidateShortlistStatusEnum'
 *         jobPostingId:
 *           type: string
 *           format: uuid
 *         shortlistedById:
 *           type: string
 *           format: uuid
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         search:
 *           type: string
 *           description: Search by candidate name or email
 *         page:
 *           type: number
 *           minimum: 1
 *           default: 1
 *         limit:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 */
export interface IClientCandidateShortlistQuery {
  status?: CandidateShortlistStatusEnum;
  jobPostingId?: string;
  candidateId?: string;
  shortlistedById?: string;
  tags?: string[];
  rating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Helper function to convert database model to domain model
 */
export function toClientCandidateShortlistDomain(
  shortlist: any
): IClientCandidateShortlist {
  return {
    id: shortlist.id,
    candidateId: shortlist.candidateId,
    clientId: shortlist.clientId,
    jobPostingId: shortlist.jobPostingId,
    status: shortlist.status,
    notes: shortlist.notes,
    rating: shortlist.rating,
    tags: shortlist.tags || [],
    shortlistedById: shortlist.shortlistedById,
    viewedAt: shortlist.viewedAt,
    createdAt: shortlist.createdAt,
    updatedAt: shortlist.updatedAt,
  };
}

/**
 * Helper function to convert database model with relations to domain model
 */
export function toClientCandidateShortlistWithCandidateDomain(
  shortlist: any
): IClientCandidateShortlistWithCandidate {
  return {
    ...toClientCandidateShortlistDomain(shortlist),
    candidate: {
      id: shortlist.candidate.id,
      user: {
        id: shortlist.candidate.user.id,
        name: shortlist.candidate.user.name,
        email: shortlist.candidate.user.email,
        profilePicture: shortlist.candidate.user.profilePicture,
      },
      status: shortlist.candidate.status,
      jobSearchStatus: shortlist.candidate.jobSearchStatus,
      completionPercentage: shortlist.candidate.completionPercentage,
      resume: shortlist.candidate.resume
        ? {
            id: shortlist.candidate.resume.id,
            title: shortlist.candidate.resume.title,
            summary: shortlist.candidate.resume.summary,
            currentJobTitle: shortlist.candidate.resume.currentJobTitle,
            currentCompany: shortlist.candidate.resume.currentCompany,
            currentWorkLocation: shortlist.candidate.resume.currentWorkLocation,
            currentSalary: shortlist.candidate.resume.currentSalary,
            currentSalaryCurrency:
              shortlist.candidate.resume.currentSalaryCurrency,
            currentWorkType: shortlist.candidate.resume.currentWorkType,
            currentWorkCommitment:
              shortlist.candidate.resume.currentWorkCommitment,
            currentWorkSchedule: shortlist.candidate.resume.currentWorkSchedule,
            totalExperience: shortlist.candidate.resume.totalExperience,
            resumeSkills: shortlist.candidate.resume.resumeSkills,
            education: shortlist.candidate.resume.education,
          }
        : undefined,
    },
    jobPosting: shortlist.jobPosting
      ? {
          id: shortlist.jobPosting.id,
          title: shortlist.jobPosting.title,
          department: shortlist.jobPosting.department,
        }
      : undefined,
    shortlistedBy: {
      id: shortlist.shortlistedBy.id,
      user: {
        id: shortlist.shortlistedBy.user.id,
        firstName: shortlist.shortlistedBy.user.firstName,
        lastName: shortlist.shortlistedBy.user.lastName,
        email: shortlist.shortlistedBy.user.email,
      },
    },
  };
}
