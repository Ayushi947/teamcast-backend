import { IWorkableCandidate } from '@/shared/models/domain/integration/ats/workable/candidate/workable.candidate.domain';
import { IWorkableJob } from '@/shared/models/domain/integration/ats/workable/jobposting/workable.job.domain';
import { ICandidateProfile } from '@/shared/models/domain/candidate/profile.domain';
import {
  IResume,
  IResumeEducation,
  IResumeExperience,
} from '@/shared/models/domain/candidate/resume.domain';
import { IClientJobPosting } from '@/shared/models/domain/client/job.postings.domain';
import {
  EducationLevelEnum,
  WorkTypeEnum,
  CompanyIndustryEnum,
  JobPostingStatusEnum,
  UserRoleEnum,
  CandidateStatusEnum,
  UserStatusEnum,
  CandidateAssessmentStageEnum,
  CandidateResumeAssessmentStatusEnum,
  CandidateOnboardingAssessmentStatusEnum,
  JobSearchStatusEnum,
  UserTypeEnum,
} from '@/shared/models/common/enums';
import { v4 as uuidv4 } from 'uuid';

// --- Helper: Map education level string to EducationLevelEnum ---
function mapEducationLevel(degree?: string): EducationLevelEnum {
  if (!degree) return EducationLevelEnum.BACHELORS;
  const d = degree.toLowerCase();
  if (d.includes('high school')) return EducationLevelEnum.HIGH_SCHOOL;
  if (d.includes('master')) return EducationLevelEnum.MASTERS;
  if (d.includes('phd') || d.includes('doctor'))
    return EducationLevelEnum.DOCTORATE;
  if (d.includes('bachelor')) return EducationLevelEnum.BACHELORS;
  return EducationLevelEnum.BACHELORS;
}

// --- Candidate Profile Mapping ---
export function mapWorkableCandidateToProfile(
  candidate: IWorkableCandidate
): ICandidateProfile {
  return {
    candidateId: candidate.id,
    name: candidate.name,
    email: candidate.email,
    role: UserRoleEnum.INDIVIDUAL,
    status: UserStatusEnum.ACTIVE,
    user: {
      id: candidate.id,
      email: candidate.email,
      role: UserRoleEnum.INDIVIDUAL,
      status: UserStatusEnum.ACTIVE,
      name: candidate.name,
      type: UserTypeEnum.CANDIDATE,
      createdAt: new Date(candidate.created_at),
      updatedAt: new Date(candidate.updated_at),
    },
    candidateStatus: CandidateStatusEnum.NEW,
    assessmentStage: CandidateAssessmentStageEnum.RESUME_ASSESSMENT,
    resumeAssessmentStatus:
      CandidateResumeAssessmentStatusEnum.ASSESSMENT_NOT_DONE,
    onboardingAssessmentStatus:
      CandidateOnboardingAssessmentStatusEnum.ASSESSMENT_NOT_DONE,
    isPublished: false,
    isInviteSignup: false,
    completionPercentage: 0,
    jobSearchStatus: JobSearchStatusEnum.OPEN_TO_OPPORTUNITIES,
    jobTitle: candidate.headline || candidate.job?.title,
    image: candidate.image_url || undefined,
    sex: undefined,
    birthDate: undefined,
    maritalStatus: undefined,
    settings: undefined,
    preferences: undefined,
    createdAt: new Date(candidate.created_at),
    updatedAt: new Date(candidate.updated_at),
  };
}

// --- Resume Mapping ---
export function mapWorkableCandidateToResume(
  candidate: IWorkableCandidate
): IResume {
  return {
    id: uuidv4(),
    candidateId: candidate.id,
    name: candidate.name,
    email: candidate.email,
    jobTitle: candidate.headline || candidate.job?.title,
    image: candidate.image_url || undefined,
    sex: undefined,
    birthDate: undefined,
    maritalStatus: undefined,
    phone: candidate.phone,
    location: candidate.location?.location_str || candidate.address,
    summary: candidate.summary || '',
    primaryIndustry: '',
    totalExperience: 0, // Could be calculated from experience_entries
    currentJobTitle: candidate.job?.title,
    currentCompany: candidate.experience_entries?.[0]?.company,
    currentIndustry: candidate.experience_entries?.[0]?.industry || '',
    currentWorkLocation: candidate.location?.location_str,
    currentWorkType: undefined,
    currentWorkCommitment: undefined,
    currentWorkSchedule: undefined,
    currentSalary: undefined,
    currentSalaryCurrency: undefined,
    availableFrom: undefined,
    noticePeriod: undefined,
    highestEducationLevel: mapEducationLevel(
      candidate.education_entries?.[0]?.degree
    ),
    resumeSkills: candidate.skills?.map((s) => s.name) || [],
    industries: [],
    languages: [],
    social: undefined,
    certifications: [],
    education:
      candidate.education_entries?.map(mapWorkableEducationToResumeEducation) ||
      [],
    experience:
      candidate.experience_entries?.map(
        mapWorkableExperienceToResumeExperience
      ) || [],
    createdAt: new Date(candidate.created_at),
    updatedAt: new Date(candidate.updated_at),
    resumeFileUrl: candidate.resume_url || undefined,
    parsingTask: undefined,
  };
}

function mapWorkableEducationToResumeEducation(entry: any): IResumeEducation {
  return {
    id: entry.id || uuidv4(),
    institution: entry.school || '',
    level: mapEducationLevel(entry.degree),
    degree: entry.degree || '',
    fieldOfStudy: entry.field_of_study || '',
    startDate: entry.start_date ? new Date(entry.start_date) : new Date(),
    endDate: entry.end_date ? new Date(entry.end_date) : undefined,
    currentlyPursuing: false,
    gpa: undefined,
    achievements: [],
  };
}

function mapWorkableExperienceToResumeExperience(
  entry: any
): IResumeExperience {
  return {
    id: entry.id || uuidv4(),
    company: entry.company || '',
    position: entry.title || '',
    industry: entry.industry || '',
    startDate: entry.start_date ? new Date(entry.start_date) : new Date(),
    endDate: entry.end_date ? new Date(entry.end_date) : undefined,
    currentlyWorking: entry.current,
    description: entry.summary || '',
    type: undefined as any, // Map if possible
    commitment: undefined as any, // Map if possible
    location: undefined,
    skills: [],
    achievements: [],
    responsibilities: [],
    projects: [],
  };
}

// --- Job Mapping ---
export function mapWorkableJobToClientJobPosting(
  job: IWorkableJob
): IClientJobPosting {
  return {
    id: job.id,
    clientId: '', // Set as needed
    applications: [],
    title: job.title,
    description: job.description || job.full_description || '',
    jobType: mapWorkType(job.employment_type),
    jobCommitment: undefined as any,
    jobSchedule: undefined as any,
    industry: mapIndustry(
      typeof job.industry === 'string' ? job.industry : job.industry?.name
    ),
    totalExperience: job.experience ? parseInt(job.experience) : 0,
    department:
      typeof job.department === 'string'
        ? job.department
        : job.department?.name,
    teamSize: undefined,
    reportingTo: undefined,
    hiring_manager_email: undefined,
    status: mapJobStatus(job.state),
    applicationDeadline: undefined,
    availableFrom: undefined,
    numberOfOpenings: job.openings_count || 1,
    applicationUrl: job.application_url,
    isFeatured: false,
    numberOfViews: 0,
    numberOfApplications: 0,
    minSalary: job.salary?.salary_from || 0,
    maxSalary: job.salary?.salary_to || 0,
    salaryCurrency: job.salary?.salary_currency || '',
    equity: false,
    responsibilities: parseHtmlList(job.requirements),
    benefits: parseHtmlList(job.benefits),
    tags: job.keywords || [],
    isRemote: job.remote || job.location?.telecommuting || false,
    preferredUniversities: [],
    preferredDegrees: [],
    preferredLocations: job.location?.city ? [job.location.city] : [],
    preferredIndustries: [],
    requiredSkills: [],
    preferredSkills: [],
    isPublished: false,
    createdAt: new Date(job.created_at),
    updatedAt: new Date(job.created_at),
  };
}

function mapWorkType(type?: string): WorkTypeEnum {
  if (!type) return WorkTypeEnum.EMPLOYEE;
  const t = type.toLowerCase();
  if (t.includes('full')) return WorkTypeEnum.EMPLOYEE;
  if (t.includes('part')) return WorkTypeEnum.CONTRACTOR;
  return WorkTypeEnum.EMPLOYEE;
}

function mapIndustry(industry?: string): CompanyIndustryEnum {
  // Add more mappings as needed
  if (!industry) return CompanyIndustryEnum.OTHER;
  return CompanyIndustryEnum.OTHER;
}

export function mapJobStatus(state?: string): JobPostingStatusEnum {
  if (!state) return JobPostingStatusEnum.DRAFT;
  const s = state.toLowerCase();
  if (s === 'published') return JobPostingStatusEnum.PUBLISHED;
  if (s === 'closed') return JobPostingStatusEnum.CLOSED;
  if (s === 'archived') return JobPostingStatusEnum.ARCHIVED;
  return JobPostingStatusEnum.DRAFT;
}

function parseHtmlList(html?: string): string[] {
  if (!html) return [];
  // Simple regex to extract <li>...</li> content
  const matches = html.match(/<li>(.*?)<\/li>/g);
  if (!matches) return [];
  return matches.map((li) => li.replace(/<li>|<\/li>/g, '').trim());
}
