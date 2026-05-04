// Workable Candidate interfaces for integration

export interface IWorkableCandidate {
  id: string;
  name: string;
  firstname: string;
  lastname: string;
  headline?: string;
  image_url?: string | null;
  account: IWorkableAccount;
  job?: IWorkableJobSummary;
  stage?: string;
  disqualified: boolean;
  disqualified_at?: string | null;
  disqualification_reason?: string | null;
  sourced: boolean;
  profile_url?: string;
  address?: string;
  phone?: string;
  email: string;
  outbound_mailbox?: string;
  domain?: string;
  uploader_id?: string | null;
  created_at: string;
  updated_at: string;
  cover_letter?: string | null;
  summary?: string;
  education_entries: IWorkableEducationEntry[];
  experience_entries: IWorkableExperienceEntry[];
  skills: IWorkableSkill[];
  answers: any[];
  resume_url?: string | null;
  social_profiles: IWorkableSocialProfile[];
  tags: string[];
  location?: IWorkableLocation;
  originating_candidate_id?: string;
  application_id?: string; // Added for candidate integration
}

export interface IWorkableAccount {
  subdomain: string;
  name: string;
}

export interface IWorkableJobSummary {
  shortcode: string;
  title: string;
}

export interface IWorkableEducationEntry {
  id: string;
  degree?: string;
  school?: string;
  field_of_study?: string | null;
  start_date?: string;
  end_date?: string;
}

export interface IWorkableExperienceEntry {
  id: string;
  title: string;
  summary?: string;
  start_date?: string;
  end_date?: string | null;
  company?: string;
  industry?: string | null;
  current: boolean;
}

export interface IWorkableSkill {
  name: string;
}

export interface IWorkableSocialProfile {
  type: string;
  name?: string;
  username?: string;
  url?: string;
}

export interface IWorkableLocation {
  location_str?: string;
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  zip_code?: string;
}
