import { z } from 'zod';
import {
  CertificationLevelEnum,
  EducationLevelEnum,
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
  NoticePeriodEnum,
} from '../../models/common/enums';

// Custom URL validation function that converts invalid URLs to null
const optionalUrlSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val || val.trim() === '') return null;
    try {
      new URL(val);
      return val;
    } catch {
      return null;
    }
  });

// Base schemas
const resumeSocialSchema = z.object({
  linkedin: optionalUrlSchema,
  twitter: optionalUrlSchema,
  github: optionalUrlSchema,
  portfolio: optionalUrlSchema,
  leetcode: optionalUrlSchema,
});

const certificationSchema = z.object({
  name: z.string().min(1, { message: 'Certification name is required' }),
  issuer: z.string().min(1, { message: 'Issuer name is required' }),
  issueDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Issue date must be a valid date',
    }),
  expiryDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Expiry date must be a valid date',
    })
    .optional(),
  credentialId: z.string().optional(),
  credentialUrl: optionalUrlSchema,
  level: z
    .nativeEnum(CertificationLevelEnum, {
      errorMap: () => ({ message: 'Invalid certification level' }),
    })
    .optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1, { message: 'Institution name is required' }),
  level: z.nativeEnum(EducationLevelEnum, {
    errorMap: () => ({ message: 'Invalid education level' }),
  }),
  degree: z.string().min(1, { message: 'Degree is required' }),
  fieldOfStudy: z.string().min(1, { message: 'Field of study is required' }),
  startDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Start date must be a valid date',
    }),
  endDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'End date must be a valid date',
    })
    .optional(),
  currentlyPursuing: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .optional()
    .describe('Indicates if the education is currently being pursued'),
  gpa: z
    .number()
    .min(0, { message: 'GPA must be between 0 and 10' })
    .max(10, { message: 'GPA must be between 0 and 10' })
    .optional(),
  achievements: z.array(
    z.string().min(1, { message: 'Achievement cannot be empty' })
  ),
});

const projectSchema = z.object({
  name: z.string().min(1, { message: 'Project name is required' }),
  description: z
    .string()
    .min(1, { message: 'Project description is required' }),
  startDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Start date must be a valid date',
    })
    .optional(),
  endDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'End date must be a valid date',
    })
    .optional(),
  currentlyWorking: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .optional()
    .describe('Indicates if the project is currently being worked on'),
  role: z.string().min(1, { message: 'Role is required' }),
  teamSize: z
    .number()
    .int({ message: 'Team size must be an integer' })
    .positive({ message: 'Team size must be positive' })
    .optional(),
  url: optionalUrlSchema,
  githubUrl: optionalUrlSchema,
  demoUrl: optionalUrlSchema,
  skills: z
    .array(z.string().min(1, { message: 'Skill cannot be empty' }))
    .optional(),
  responsibilities: z
    .array(z.string().min(1, { message: 'Responsibility cannot be empty' }))
    .optional(),
  achievements: z
    .array(z.string().min(1, { message: 'Achievement cannot be empty' }))
    .optional(),
  challenges: z
    .array(z.string().min(1, { message: 'Challenge cannot be empty' }))
    .optional(),
  solutions: z
    .array(z.string().min(1, { message: 'Solution cannot be empty' }))
    .optional(),
  impact: z
    .array(z.string().min(1, { message: 'Impact cannot be empty' }))
    .optional(),
});

const experienceSchema = z.object({
  company: z.string().min(1, { message: 'Company name is required' }),
  position: z.string().min(1, { message: 'Position is required' }),
  industry: z.string().min(1, { message: 'Industry is required' }),
  startDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Start date must be a valid date',
    }),
  endDate: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'End date must be a valid date',
    })
    .optional(),
  currentlyWorking: z
    .union([z.boolean(), z.string().transform((val) => val === 'true')])
    .optional()
    .describe('Indicates if the experience is currently being worked on'),
  description: z.string().min(1, { message: 'Description is required' }),
  type: z.nativeEnum(WorkTypeEnum, {
    errorMap: () => ({ message: 'Invalid work type' }),
  }),
  commitment: z.nativeEnum(WorkCommitmentEnum, {
    errorMap: () => ({ message: 'Invalid work commitment' }),
  }),
  location: z.string().optional(),
  skills: z.array(z.string().min(1, { message: 'Skill cannot be empty' })),
  achievements: z.array(
    z.string().min(1, { message: 'Achievement cannot be empty' })
  ),
  responsibilities: z.array(
    z.string().min(1, { message: 'Responsibilities cannot be empty' })
  ),
});

// Main resume schema
export const resumeSchema = z.object({
  phone: z
    .string()
    .regex(/^\+?[1-9][\d\-+]{0,14}$/, {
      message: 'Phone number must be a valid international format',
    })
    .optional(),
  location: z
    .string()
    .min(2, { message: 'Location must be at least 2 characters long' })
    .max(200, { message: 'Location must be at most 200 characters long' })
    .optional(),
  summary: z
    .string()
    .min(50, { message: 'Summary must be at least 50 characters long' })
    .max(2000, { message: 'Summary must be at most 2000 characters long' }),
  primaryIndustry: z
    .string()
    .min(2, { message: 'Primary industry must be at least 2 characters long' })
    .max(100, {
      message: 'Primary industry must be at most 100 characters long',
    }),
  totalExperience: z
    .number()
    .int({ message: 'Total experience must be an integer' })
    .min(0, { message: 'Total experience cannot be negative' }),
  currentJobTitle: z
    .string()
    .min(2, { message: 'Job title must be at least 2 characters long' })
    .max(100, { message: 'Job title must be at most 100 characters long' })
    .optional(),
  currentCompany: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters long' })
    .max(100, { message: 'Company name must be at most 100 characters long' })
    .optional(),
  currentIndustry: z
    .string()
    .min(2, { message: 'Industry must be at least 2 characters long' })
    .max(100, { message: 'Industry must be at most 100 characters long' })
    .optional(),
  currentWorkLocation: z
    .string()
    .min(2, { message: 'Work location must be at least 2 characters long' })
    .max(200, { message: 'Work location must be at most 200 characters long' })
    .optional(),
  currentWorkType: z
    .nativeEnum(WorkTypeEnum, {
      errorMap: () => ({ message: 'Invalid work type' }),
    })
    .optional(),
  currentWorkCommitment: z
    .nativeEnum(WorkCommitmentEnum, {
      errorMap: () => ({ message: 'Invalid work commitment' }),
    })
    .optional(),
  currentWorkSchedule: z
    .nativeEnum(WorkScheduleEnum, {
      errorMap: () => ({ message: 'Invalid work schedule' }),
    })
    .optional(),
  currentSalary: z
    .number()
    .min(0, { message: 'Current salary cannot be negative' })
    .optional(),
  currentSalaryCurrency: z
    .string()
    .length(3, { message: 'Currency must be a 3-letter code' })
    .optional(),
  availableFrom: z
    .union([z.string().transform((str) => new Date(str)), z.date()])
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Available from date must be a valid date',
    })
    .optional(),
  noticePeriod: z
    .nativeEnum(NoticePeriodEnum, {
      errorMap: () => ({ message: 'Invalid notice period' }),
    })
    .optional(),
  highestEducationLevel: z.nativeEnum(EducationLevelEnum, {
    errorMap: () => ({ message: 'Invalid education level' }),
  }),
  resumeSkills: z
    .array(z.string().min(1, { message: 'Skill cannot be empty' }))
    .min(1, { message: 'At least one skill is required' }),
  industries: z
    .array(z.string().min(1, { message: 'Industry cannot be empty' }))
    .min(1, { message: 'At least one industry is required' })
    .max(20, { message: 'Cannot have more than 20 industries' }),
  languages: z
    .array(z.string().min(1, { message: 'Language cannot be empty' }))
    .min(1, { message: 'At least one language is required' })
    .max(10, { message: 'Cannot have more than 10 languages' }),
  social: resumeSocialSchema.optional(),
});

// Update schemas - all fields optional
const resumeUpdateSchema = resumeSchema.partial();
const resumeSocialUpdateSchema = resumeSocialSchema.partial();
const resumeCertificationUpdateSchema = certificationSchema.partial();
const resumeEducationUpdateSchema = educationSchema.partial();
const resumeExperienceUpdateSchema = experienceSchema.partial();
const resumeProjectUpdateSchema = projectSchema.partial();

// Validation schemas for individual components
const resumeCreateSchema = resumeSchema;
const resumeCertificationCreateSchema = certificationSchema;
const resumeEducationCreateSchema = educationSchema;
const resumeExperienceCreateSchema = experienceSchema;
const resumeProjectCreateSchema = projectSchema;

// Update validators
export const resumeUpdateValidator = z.object({
  body: resumeUpdateSchema,
});
export const resumeSocialUpdateValidator = z.object({
  body: resumeSocialUpdateSchema,
});
export const resumeCertificationUpdateValidator = z.object({
  body: resumeCertificationUpdateSchema,
});
export const resumeEducationUpdateValidator = z.object({
  body: resumeEducationUpdateSchema,
});
export const resumeExperienceUpdateValidator = z.object({
  body: resumeExperienceUpdateSchema,
});
export const resumeProjectUpdateValidator = z.object({
  body: resumeProjectUpdateSchema,
});

// Export create validators
export const resumeCreateValidator = z.object({
  body: resumeCreateSchema,
});
export const resumeCertificationCreateValidator = z.object({
  body: resumeCertificationCreateSchema,
});
export const resumeEducationCreateValidator = z.object({
  body: resumeEducationCreateSchema,
});
export const resumeExperienceCreateValidator = z.object({
  body: resumeExperienceCreateSchema,
});
export const resumeProjectCreateValidator = z.object({
  body: resumeProjectCreateSchema,
});
