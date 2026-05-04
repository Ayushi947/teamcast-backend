// Workable Job interfaces for integration

export interface IWorkableJob {
  id: string;
  title: string;
  full_title?: string;
  shortcode: string;
  code?: string;
  state: string;
  department?: IWorkableJobDepartment | string;
  application_url?: string;
  shortlink?: string;
  location?: IWorkableJobLocation;
  locations?: IWorkableJobLocation[];
  created_at: string;
  full_description?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  employment_type?: string;
  industry?: IWorkableJobIndustry | string;
  function?: IWorkableJobFunction | string;
  experience?: string;
  education?: string;
  keywords?: string[];
  salary?: IWorkableJobSalary;
  openings_count?: number;
  remote?: boolean;
  sample?: boolean;
}

export interface IWorkableJobLocation {
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  zip_code?: string;
  telecommuting?: boolean;
}

export interface IWorkableJobSalary {
  salary_from?: number;
  salary_to?: number;
  salary_currency?: string;
}

export interface IWorkableJobDepartment {
  id?: string;
  name?: string;
}

export interface IWorkableJobIndustry {
  id?: string;
  name?: string;
}

export interface IWorkableJobFunction {
  id?: string;
  name?: string;
}
