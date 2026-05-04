export interface IClientAnalytics {
  activeJobPostings: IJobPostingAnalytics;
  aiAssessments: IAiAssessmentAnalytics;
  panelAssessment: IPanelAssessmentAnalytics;
  activeCandidates: ICandidateAnalytics;
  teamMembers: ITeamMemberAnalytics;
  candidateOnboarding: ICandidateOnboardingAnalytics;
}

export interface IJobPostingAnalytics {
  totalCount: number;
  activeCount: number;
  draftCount: number;
  closedCount: number;
  archivedCount: number;
  byIndustry: Record<string, number>;
  byJobType: Record<string, number>;
  featuredCount: number;
  remoteCount: number;
  recentlyAdded: IJobPostingBasic[];
}

export interface IJobPostingBasic {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  numberOfApplications: number;
  numberOfViews: number;
}

export interface IAiAssessmentAnalytics {
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  passedCount: number;
  failedCount: number;
  byJobPosting: Record<string, number>;
  recentAssessments: IAiAssessmentBasic[];
}

export interface IAiAssessmentBasic {
  id: string;
  candidateId: string;
  candidateName: string;
  jobPostingId: string;
  jobTitle: string;
  status: string;
  score: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface IPanelAssessmentAnalytics {
  totalCount: number;
  pendingCount: number;
  scheduledCount: number;
  completedCount: number;
  byJobPosting: Record<string, number>;
  pendingAssessments: IPanelAssessmentBasic[];
}

export interface IPanelAssessmentBasic {
  id: string;
  candidateId: string;
  candidateName: string;
  jobPostingId: string;
  jobTitle: string;
  status: string;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ICandidateAnalytics {
  totalCount: number;
  activeCount: number;
  byJobPosting: Record<string, number>;
  recentApplications: ICandidateApplicationBasic[];
}

export interface ICandidateApplicationBasic {
  id: string;
  candidateId: string;
  candidateName: string;
  jobPostingId: string;
  jobTitle: string;
  status: string;
  appliedAt: Date;
}

export interface ITeamMemberAnalytics {
  totalCount: number;
  byRole: ITeamManagementByRole;
  activeCount: number;
  inactiveCount: number;
  recentlyAdded: ITeamMemberBasic[];
}

export interface ITeamManagementByRole {
  admin: number;
  hr: number;
  recruiter: number;
  accounts: number;
  other: number;
}

export interface ITeamMemberBasic {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}

export interface ICandidateOnboardingAnalytics {
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  byStatus: Record<string, number>;
  recentOnboarding: ICandidateOnboardingBasic[];
}

export interface ICandidateOnboardingBasic {
  id: string;
  candidateId: string;
  candidateName: string;
  status: string;
  score: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IClientAnalyticsData {
  id: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobPostingAnalyticsData {
  id: string;
  clientId: string;
  totalCount: number;
  activeCount: number;
  draftCount: number;
  closedCount: number;
  archivedCount: number;
  byIndustry: Record<string, number>;
  byJobType: Record<string, number>;
  featuredCount: number;
  remoteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobPostingBasicData {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  numberOfApplications: number;
  numberOfViews: number;
}

export interface IAiAssessmentAnalyticsData {
  id: string;
  clientId: string;
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  passedCount: number;
  failedCount: number;
  byJobPosting: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAiAssessmentBasicData {
  id: string;
  candidateId: string;
  candidateName: string;
  jobPostingId: string;
  jobTitle: string;
  status: string;
  score: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface ICandidateAnalyticsData {
  id: string;
  clientId: string;
  totalCount: number;
  activeCount: number;
  byJobPosting: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICandidateApplicationBasicData {
  id: string;
  candidateId: string;
  candidateName: string;
  jobPostingId: string;
  jobTitle: string;
  status: string;
  appliedAt: Date;
}

export interface ITeamMemberAnalyticsData {
  id: string;
  clientId: string;
  totalCount: number;
  byRole: ITeamManagementByRole;
  activeCount: number;
  inactiveCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamManagementByRoleData {
  admin: number;
  hr: number;
  recruiter: number;
  accounts: number;
  other: number;
}

export interface ITeamMemberBasicData {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}

export interface ICandidateOnboardingAnalyticsData {
  id: string;
  clientId: string;
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  byStatus: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICandidateOnboardingBasicData {
  id: string;
  candidateId: string;
  candidateName: string;
  status: string;
  score: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

// Raw database query result types
export type JobPostingWithRelations = {
  id: string;
  title: string;
  status: string;
  industry: string | null;
  jobType: string | null;
  isFeatured: boolean;
  isRemote: boolean;
  numberOfApplications: number;
  numberOfViews: number;
  createdAt: Date;
};

export type AiAssessmentWithRelations = {
  id: string;
  status: string;
  result: string | null;
  score: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  candidate: {
    id: string;
    user: {
      name: string | null;
    } | null;
  } | null;
  jobApplication: {
    jobPosting: {
      id: string;
      title: string;
    } | null;
  } | null;
};

export type JobApplicationWithRelations = {
  id: string;
  status: string;
  appliedAt: Date;
  candidate: {
    id: string;
    user: {
      name: string | null;
      status: string;
    } | null;
  } | null;
  jobPosting: {
    id: string;
    title: string;
  } | null;
};

export type ClientUserWithRelations = {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  } | null;
};

export type OnboardingAssessmentWithRelations = {
  id: string;
  status: string;
  score: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  candidate: {
    id: string;
    user: {
      name: string | null;
    } | null;
  } | null;
};

export type PanelAssessmentWithRelations = {
  id: string;
  status: string;
  result: string | null;
  recommendation: string | null;
  scheduledDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  candidate: {
    id: string;
    user: {
      name: string | null;
    } | null;
  } | null;
  jobApplication: {
    jobPosting: {
      id: string;
      title: string;
    } | null;
  } | null;
};
