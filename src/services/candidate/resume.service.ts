import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  IResume,
  IResumeSocial,
  IResumeCertification,
  IResumeEducation,
  IResumeExperience,
  IResumeProject,
  toResumeDomain,
  IResumeUpdate,
  IResumeSocialUpdate,
  IResumeCertificationCreate,
  IResumeCertificationUpdate,
  toResumeCertificationDomain,
  IResumeEducationUpdate,
  IResumeEducationCreate,
  toResumeEducationDomain,
  toResumeSocialDomain,
  IResumeExperienceCreate,
  toResumeExperienceDomain,
  IResumeExperienceUpdate,
  IResumeProjectCreate,
  toResumeProjectDomain,
} from '@/shared/models/domain/candidate/resume.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { formatResumeSkills } from '@/utils/ai-formatter';
import {
  EducationLevelEnum,
  WorkTypeEnum,
  WorkCommitmentEnum,
  WorkScheduleEnum,
} from '@/shared/models/common/enums';
import { CandidateProfileService } from './profile.service';
import { IStorageProvider } from '../helpers/storage/storage.interface';

@singleton
export class CandidateResumeService {
  private readonly prisma: PrismaClient;

  constructor(
    private readonly profileService: CandidateProfileService,
    private readonly storageService: IStorageProvider
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Get a candidate's resume
   */
  async getResume(candidateId: string): Promise<IResume> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: {
          candidateId,
        },
        include: {
          social: true,
          certifications: true,
          education: true,
          experience: {
            include: {
              projects: true,
            },
            orderBy: [{ startDate: 'desc' }, { endDate: 'desc' }],
          },
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });
      if (!resume) {
        logger.info({
          message: 'Resume not found, creating new resume',
          context: 'ResumeService.getResume',
          candidateId,
        });
        // Create a new resume for the candidate
        return await this.createInitialResume(candidateId);
      }
      return toResumeDomain(resume);
    } catch (error) {
      logger.error({
        message: 'Failed to get resume',
        context: 'ResumeService.getResume',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  getResumeSocailDefaults() {
    return {
      linkedin: '',
      twitter: '',
      github: '',
      portfolio: '',
      leetcode: '',
    };
  }

  getResumeDefaults(candidateId: string) {
    return {
      candidateId,
      phone: '',
      location: '',
      summary: '',
      primaryIndustry: '',
      totalExperience: 0,
      currentJobTitle: '',
      currentCompany: '',
      currentIndustry: '',
      currentWorkLocation: '',
      currentWorkType: WorkTypeEnum.EMPLOYEE,
      currentWorkCommitment: WorkCommitmentEnum.FULL_TIME,
      currentWorkSchedule: WorkScheduleEnum.REGULAR,
      currentSalary: 0,
      currentSalaryCurrency: 'USD',
      availableFrom: null,
      noticePeriod: null,
      highestEducationLevel: EducationLevelEnum.BACHELORS,
      resumeSkills: [],
      industries: [],
      languages: [],
    };
  }

  /**
   * Create a new resume for a candidate
   */
  async createInitialResume(candidateId: string): Promise<IResume> {
    // Get candidate information to populate the resume
    const candidate = await this.prisma.candidate.findUnique({
      where: {
        id: candidateId,
      },
      include: {
        user: true,
      },
    });

    if (!candidate) {
      throw new AppError(
        'Candidate not found',
        404,
        ErrorCode.CANDIDATE_NOT_FOUND
      );
    }

    logger.info({
      message: 'Candidate found, will use data for new resume',
      context: 'ResumeService.getResume',
      candidateId,
    });
    // Create a new resume if not found
    const resume = await this.prisma.resume.create({
      data: {
        ...this.getResumeDefaults(candidateId),
        social: {
          create: this.getResumeSocailDefaults(),
        },
      },
      include: {
        social: true,
        certifications: true,
        education: true,
        experience: {
          include: {
            projects: true,
          },
          orderBy: [{ startDate: 'desc' }, { endDate: 'desc' }],
        },
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    return toResumeDomain(resume);
  }

  /**
   * Update a resume
   */
  async updateResume(
    candidateId: string,
    resumeData: IResumeUpdate
  ): Promise<IResume> {
    try {
      // First, get the resume ID
      const resumeRecord = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resumeRecord) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      const _resumeId = resumeRecord.id;

      // Update the main resume data
      const _resume = await this.prisma.resume.update({
        where: { candidateId },
        data: {
          phone: resumeData.phone,
          location: resumeData.location,
          summary: resumeData.summary,
          highestEducationLevel:
            resumeData.highestEducationLevel as EducationLevelEnum,
          primaryIndustry: resumeData.primaryIndustry,
          totalExperience: resumeData.totalExperience,
          currentJobTitle: resumeData.currentJobTitle,
          currentCompany: resumeData.currentCompany,
          currentIndustry: resumeData.currentIndustry,
          currentWorkLocation: resumeData.currentWorkLocation,
          currentWorkType: resumeData.currentWorkType,
          currentWorkCommitment: resumeData.currentWorkCommitment,
          currentWorkSchedule: resumeData.currentWorkSchedule,
          currentSalary: resumeData.currentSalary,
          currentSalaryCurrency: resumeData.currentSalaryCurrency,
          availableFrom: resumeData.availableFrom,
          noticePeriod: resumeData.noticePeriod,
          resumeSkills: resumeData.resumeSkills
            ? await formatResumeSkills(resumeData.resumeSkills)
            : resumeData.resumeSkills,
          industries: resumeData.industries
            ? await formatResumeSkills(resumeData.industries)
            : resumeData.industries,
          languages: resumeData.languages
            ? await formatResumeSkills(resumeData.languages)
            : resumeData.languages,
          // USA Work Authorization fields
          isUSWorkAuthorized: resumeData.isUSWorkAuthorized,
          requiresUSVisaSponsorship: resumeData.requiresUSVisaSponsorship,
          usWorkAuthorizationStatus: resumeData.usWorkAuthorizationStatus,
          usWorkAuthorizationDetails: resumeData.usWorkAuthorizationDetails,
        },
        include: {
          social: true,
          certifications: true,
          education: true,
          experience: {
            include: {
              projects: true,
            },
            orderBy: [{ startDate: 'desc' }, { endDate: 'desc' }],
          },
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      // Update social data if provided
      if (resumeData.social) {
        await this.updateResumeSocial(candidateId, resumeData.social);
      }

      // Get current resume data to compare with updates
      const currentResume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          certifications: true,
          education: true,
          experience: {
            include: {
              projects: true,
            },
            orderBy: [{ startDate: 'desc' }, { endDate: 'desc' }],
          },
        },
      });

      if (!currentResume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Update certifications if provided
      if (resumeData.certifications && resumeData.certifications.length > 0) {
        // We need to match certifications by ID
        const currentCertifications = currentResume.certifications || [];

        for (const certData of resumeData.certifications) {
          // Find the certification ID from the current data
          const certId = currentCertifications.find(
            (c) => c.name === certData.name && c.issuer === certData.issuer
          )?.id;

          if (certId) {
            // Update existing certification
            await this.updateCertification(candidateId, certId, certData);
          } else {
            // Add as new certification if it doesn't exist
            await this.addCertification(candidateId, {
              name: certData.name || '',
              issuer: certData.issuer || '',
              issueDate: certData.issueDate || new Date(),
              expiryDate: certData.expiryDate,
              credentialId: certData.credentialId,
              credentialUrl: certData.credentialUrl,
              level: certData.level,
              category: certData.category,
              description: certData.description,
            });
          }
        }
      }

      // Update education if provided
      if (resumeData.education && resumeData.education.length > 0) {
        const currentEducation = currentResume.education || [];

        for (const eduData of resumeData.education) {
          const eduId = currentEducation.find(
            (e) =>
              e.institution === eduData.institution &&
              e.degree === eduData.degree
          )?.id;

          if (eduId) {
            await this.updateEducation(candidateId, eduId, eduData);
          } else {
            // Add as new education if it doesn't exist
            await this.addEducation(candidateId, {
              institution: eduData.institution || '',
              level: eduData.level || EducationLevelEnum.BACHELORS,
              degree: eduData.degree || '',
              fieldOfStudy: eduData.fieldOfStudy || '',
              startDate: eduData.startDate || new Date(),
              endDate: eduData.endDate,
              gpa: eduData.gpa || 0,
              achievements: eduData.achievements || [],
            });
          }
        }
      }

      // Update experience if provided
      if (resumeData.experience && resumeData.experience.length > 0) {
        const currentExperience = currentResume.experience || [];

        for (const expData of resumeData.experience) {
          const expId = currentExperience.find(
            (e) =>
              e.company === expData.company && e.position === expData.position
          )?.id;

          if (expId) {
            await this.updateExperience(candidateId, expId, expData);
          } else {
            // Add as new experience if it doesn't exist
            // For required fields, use default values if not provided
            const workType = expData.type || WorkTypeEnum.EMPLOYEE;
            const workCommitment =
              expData.commitment || WorkCommitmentEnum.FULL_TIME;

            await this.addExperience(candidateId, {
              company: expData.company || '',
              position: expData.position || '',
              industry: expData.industry || '',
              startDate: expData.startDate || new Date(),
              endDate: expData.endDate,
              currentlyWorking: expData.currentlyWorking || false,
              description: expData.description || '',
              type: workType,
              commitment: workCommitment,
              location: expData.location || '',
              skills: expData.skills
                ? await formatResumeSkills(expData.skills)
                : [],
              achievements: expData.achievements || [],
              responsibilities: [], // Required field for IResumeExperienceCreate
            });
          }
        }
      }

      // Get the updated resume with all the changes
      const updatedResume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          social: true,
          certifications: true,
          education: true,
          experience: {
            include: {
              projects: true,
            },
            orderBy: [{ startDate: 'desc' }, { endDate: 'desc' }],
          },
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);

      return toResumeDomain(updatedResume);
    } catch (error) {
      logger.error({
        message: 'Failed to update resume',
        context: 'ResumeService.updateResume',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        resumeData,
      });
      throw error;
    }
  }

  /**
   * Get resume social links
   */
  async getResumeSocial(candidateId: string): Promise<IResumeSocial | null> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          social: true,
        },
      });

      if (!resume) {
        throw new AppError('Resume not found', 404, ErrorCode.RESUME_NOT_FOUND);
      }

      if (!resume.social) {
        return null;
      }

      return toResumeSocialDomain(resume.social);
    } catch (error) {
      logger.error({
        message: 'Failed to get resume social',
        context: 'ResumeService.getResumeSocial',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Update resume social links
   */
  async updateResumeSocial(
    candidateId: string,
    socialData: IResumeSocialUpdate
  ): Promise<IResumeSocial> {
    try {
      const resume = await this.prisma.resume.update({
        where: { candidateId },
        data: {
          social: {
            upsert: {
              create: socialData,
              update: socialData,
            },
          },
        },
        include: {
          social: true,
          certifications: true,
          education: true,
          experience: {
            include: {
              projects: true,
            },
            orderBy: [{ startDate: 'desc' }, { endDate: 'desc' }],
          },
        },
      });

      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);

      return toResumeSocialDomain(resume.social);
    } catch (error) {
      logger.error({
        message: 'Failed to update resume social',
        context: 'ResumeService.updateResumeSocial',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        socialData,
      });
      throw error;
    }
  }

  /**
   * Get a certification from resume
   */
  async getCertification(
    candidateId: string,
    certificationId: string
  ): Promise<IResumeCertification> {
    try {
      // Get the resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      const certification = await this.prisma.resume_certification.findUnique({
        where: {
          id: certificationId,
          resumeId: resume.id,
        },
      });

      if (!certification) {
        throw new AppError(
          `Certification not found with id ${certificationId}`,
          404,
          ErrorCode.CERTIFICATION_NOT_FOUND
        );
      }

      return toResumeCertificationDomain(certification);
    } catch (error) {
      logger.error({
        message: 'Failed to get certification',
        context: 'ResumeService.getCertification',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        certificationId,
      });
      throw error;
    }
  }

  /**
   * Add a certification to resume
   */
  async addCertification(
    candidateId: string,
    certificationData: IResumeCertificationCreate
  ): Promise<IResumeCertification> {
    try {
      // Get the resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });
      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }
      const certification = await this.prisma.resume_certification.create({
        data: {
          ...certificationData,
          resumeId: resume.id,
        },
      });
      return toResumeCertificationDomain(certification);
    } catch (error) {
      logger.error({
        message: 'Failed to add certification',
        context: 'ResumeService.addCertification',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        certificationData,
      });
      throw error;
    }
  }

  /**
   * Update a certification in resume
   */
  async updateCertification(
    candidateId: string,
    certificationId: string,
    certificationData: IResumeCertificationUpdate
  ): Promise<IResumeCertification> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      const certification = await this.prisma.resume_certification.update({
        where: {
          id: certificationId,
          resumeId: resume.id,
        },
        data: certificationData,
      });

      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);

      return toResumeCertificationDomain(certification);
    } catch (error) {
      logger.error({
        message: 'Failed to update certification',
        context: 'ResumeService.updateCertification',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        certificationId,
        certificationData,
      });
      throw error;
    }
  }

  /**
   * Get education from resume
   */
  async getEducation(
    candidateId: string,
    educationId: string
  ): Promise<IResumeEducation> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      const education = await this.prisma.resume_education.findUnique({
        where: {
          id: educationId,
          resumeId: resume.id,
        },
      });

      if (!education) {
        throw new AppError(
          `Education not found with id ${educationId}`,
          404,
          ErrorCode.EDUCATION_NOT_FOUND
        );
      }

      return toResumeEducationDomain(education);
    } catch (error) {
      logger.error({
        message: 'Failed to get education',
        context: 'ResumeService.getEducation',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        educationId,
      });
      throw error;
    }
  }

  /**
   * Add education to resume
   */
  async addEducation(
    candidateId: string,
    educationData: IResumeEducationCreate
  ): Promise<IResumeEducation> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });
      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }
      const formattedEducationData = {
        ...educationData,
        resumeId: resume.id,
      };

      const education = await this.prisma.resume_education.create({
        data: formattedEducationData,
      });
      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
      return toResumeEducationDomain(education);
    } catch (error) {
      logger.error({
        message: 'Failed to add education',
        context: 'ResumeService.addEducation',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        educationData,
      });
      throw error;
    }
  }

  /**
   * Update education in resume
   */
  async updateEducation(
    candidateId: string,
    educationId: string,
    educationData: IResumeEducationUpdate
  ): Promise<IResumeEducation> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      const education = await this.prisma.resume_education.update({
        where: {
          id: educationId,
          resumeId: resume.id,
        },
        data: educationData,
      });

      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
      return toResumeEducationDomain(education);
    } catch (error) {
      logger.error({
        message: 'Failed to update education',
        context: 'ResumeService.updateEducation',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        educationId,
        educationData,
      });
      throw error;
    }
  }

  /**
   * Get experience from resume
   */
  async getExperience(
    candidateId: string,
    experienceId: string
  ): Promise<IResumeExperience> {
    try {
      // Get the resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      const experience = await this.prisma.resume_experience.findUnique({
        where: {
          id: experienceId,
          resumeId: resume.id,
        },
        include: {
          projects: true,
        },
      });

      if (!experience) {
        throw new AppError(
          `Experience not found with id ${experienceId}`,
          404,
          ErrorCode.EXPERIENCE_NOT_FOUND
        );
      }

      return toResumeExperienceDomain(experience);
    } catch (error) {
      logger.error({
        message: 'Failed to get experience',
        context: 'ResumeService.getExperience',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceId,
      });
      throw error;
    }
  }

  /**
   * Add experience to resume
   */
  async addExperience(
    candidateId: string,
    experienceData: IResumeExperienceCreate
  ): Promise<IResumeExperience> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });
      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }
      // Format skills and achievements if present
      const formattedExperienceData = {
        ...experienceData,
        skills: experienceData.skills
          ? await formatResumeSkills(experienceData.skills)
          : experienceData.skills,
        resumeId: resume.id,
      };

      const experience = await this.prisma.resume_experience.create({
        data: formattedExperienceData,
      });

      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
      return toResumeExperienceDomain(experience);
    } catch (error) {
      logger.error({
        message: 'Failed to add experience',
        context: 'ResumeService.addExperience',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceData,
      });
      throw error;
    }
  }

  /**
   * Update experience in resume
   */
  async updateExperience(
    candidateId: string,
    experienceId: string,
    experienceData: IResumeExperienceUpdate
  ): Promise<IResumeExperience> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Format skills and achievements if present
      const formattedExperienceData = {
        ...experienceData,
        skills: experienceData.skills
          ? await formatResumeSkills(experienceData.skills)
          : experienceData.skills,
      };

      const experience = await this.prisma.resume_experience.update({
        where: {
          id: experienceId,
          resumeId: resume.id,
        },
        data: formattedExperienceData,
      });

      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
      return toResumeExperienceDomain(experience);
    } catch (error) {
      logger.error({
        message: 'Failed to update experience',
        context: 'ResumeService.updateExperience',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceId,
        experienceData,
      });
      throw error;
    }
  }

  /**
   * Get a project from experience
   */
  async getProject(
    candidateId: string,
    experienceId: string,
    projectId: string
  ): Promise<IResumeProject> {
    try {
      // Get the resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if the experience exists and belongs to the candidate's resume
      const experience = await this.prisma.resume_experience.findUnique({
        where: {
          id: experienceId,
          resumeId: resume.id,
        },
      });

      if (!experience) {
        throw new AppError(
          `Experience not found with id ${experienceId}`,
          404,
          ErrorCode.EXPERIENCE_NOT_FOUND
        );
      }

      // Get the project
      const project = await this.prisma.resume_project.findUnique({
        where: {
          id: projectId,
          experienceId: experience.id,
        },
      });

      if (!project) {
        throw new AppError(
          `Project not found with id ${projectId}`,
          404,
          ErrorCode.PROJECT_NOT_FOUND
        );
      }

      return toResumeProjectDomain(project);
    } catch (error) {
      logger.error({
        message: 'Failed to get project',
        context: 'ResumeService.getProject',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceId,
        projectId,
      });
      throw error;
    }
  }

  /**
   * Add project to experience
   */
  async addProject(
    candidateId: string,
    experienceId: string,
    projectData: IResumeProjectCreate
  ): Promise<IResumeProject> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });
      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }
      // Check if the experience exists and belongs to the candidate's resume
      const experience = await this.prisma.resume_experience.findUnique({
        where: {
          id: experienceId,
          resumeId: resume.id,
        },
      });

      if (!experience) {
        throw new AppError(
          `Experience not found for candidate ${candidateId}`,
          404,
          ErrorCode.EXPERIENCE_NOT_FOUND
        );
      }
      const project = await this.prisma.resume_project.create({
        data: {
          ...projectData,
          experienceId: experience.id,
        },
      });

      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
      return toResumeProjectDomain(project);
    } catch (error) {
      logger.error({
        message: 'Failed to add project',
        context: 'ResumeService.addProject',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceId,
        projectData,
      });
      throw error;
    }
  }

  /**
   * Update a project for a candidate's resume experience
   * @param candidateId - The ID of the candidate
   * @param experienceId - The ID of the experience
   * @param projectId - The ID of the project to update
   * @param projectData - The updated project data
   * @returns The updated project
   */
  async updateProject(
    candidateId: string,
    experienceId: string,
    projectId: string,
    projectData: Partial<IResumeProject>
  ): Promise<IResumeProject> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if the experience exists and belongs to the candidate's resume
      const experience = await this.prisma.resume_experience.findUnique({
        where: {
          id: experienceId,
          resumeId: resume.id,
        },
      });

      if (!experience) {
        throw new AppError(
          `Experience not found for candidate ${candidateId}`,
          404,
          ErrorCode.EXPERIENCE_NOT_FOUND
        );
      }

      // Check if the project exists and belongs to the experience
      const existingProject = await this.prisma.resume_project.findUnique({
        where: {
          id: projectId,
          experienceId: experience.id,
        },
      });

      if (!existingProject) {
        throw new AppError(
          `Project not found for experience ${experienceId}`,
          404,
          ErrorCode.PROJECT_NOT_FOUND
        );
      }

      // Update the project
      const updatedProject = await this.prisma.resume_project.update({
        where: { id: projectId },
        data: projectData,
      });

      return toResumeProjectDomain(updatedProject);
    } catch (error) {
      logger.error({
        message: 'Failed to update project',
        context: 'ResumeService.updateProject',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceId,
        projectId,
        projectData,
      });
      throw error;
    }
  }

  /**
   * Get all certifications from resume
   */
  async getCertifications(
    candidateId: string
  ): Promise<IResumeCertification[]> {
    try {
      // Get the resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          certifications: true,
        },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      return resume.certifications.map(toResumeCertificationDomain);
    } catch (error) {
      logger.error({
        message: 'Failed to get certifications',
        context: 'ResumeService.getCertifications',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get all education entries from resume
   */
  async getEducationList(candidateId: string): Promise<IResumeEducation[]> {
    try {
      // Get the resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          education: true,
        },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      return resume.education.map(toResumeEducationDomain);
    } catch (error) {
      logger.error({
        message: 'Failed to get education list',
        context: 'ResumeService.getEducationList',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get all experience entries from resume
   */
  async getExperienceList(candidateId: string): Promise<IResumeExperience[]> {
    try {
      // Get the resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        include: {
          experience: {
            include: {
              projects: true,
            },
            orderBy: [{ startDate: 'desc' }, { endDate: 'desc' }],
          },
        },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      return resume.experience.map(toResumeExperienceDomain);
    } catch (error) {
      logger.error({
        message: 'Failed to get experience list',
        context: 'ResumeService.getExperienceList',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get all projects for a specific experience
   */
  async getProjectList(
    candidateId: string,
    experienceId: string
  ): Promise<IResumeProject[]> {
    try {
      // Get the resume for the candidate
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if the experience exists and belongs to the candidate's resume
      const experience = await this.prisma.resume_experience.findUnique({
        where: {
          id: experienceId,
          resumeId: resume.id,
        },
        include: {
          projects: true,
        },
      });

      if (!experience) {
        throw new AppError(
          `Experience not found with id ${experienceId}`,
          404,
          ErrorCode.EXPERIENCE_NOT_FOUND
        );
      }

      return experience.projects.map(toResumeProjectDomain);
    } catch (error) {
      logger.error({
        message: 'Failed to get project list',
        context: 'ResumeService.getProjectList',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceId,
      });
      throw error;
    }
  }

  /**
   * Delete experience from resume
   */
  async deleteExperience(
    candidateId: string,
    experienceId: string
  ): Promise<void> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if the experience exists and belongs to the candidate's resume
      const experience = await this.prisma.resume_experience.findUnique({
        where: {
          id: experienceId,
          resumeId: resume.id,
        },
      });

      if (!experience) {
        throw new AppError(
          `Experience not found with id ${experienceId}`,
          404,
          ErrorCode.EXPERIENCE_NOT_FOUND
        );
      }
      // Delete the experience
      await this.prisma.resume_experience.delete({
        where: { id: experienceId },
      });
      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
    } catch (error) {
      logger.error({
        message: 'Failed to delete experience',
        context: 'ResumeService.deleteExperience',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceId,
      });
      throw error;
    }
  }

  /**
   * Delete project from experience
   */
  async deleteProject(
    candidateId: string,
    experienceId: string,
    projectId: string
  ): Promise<void> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if the experience exists and belongs to the candidate's resume
      const experience = await this.prisma.resume_experience.findUnique({
        where: {
          id: experienceId,
          resumeId: resume.id,
        },
      });

      if (!experience) {
        throw new AppError(
          `Experience not found with id ${experienceId}`,
          404,
          ErrorCode.EXPERIENCE_NOT_FOUND
        );
      }

      // Check if the project exists and belongs to the experience
      const project = await this.prisma.resume_project.findUnique({
        where: {
          id: projectId,
          experienceId: experience.id,
        },
      });

      if (!project) {
        throw new AppError(
          `Project not found with id ${projectId}`,
          404,
          ErrorCode.PROJECT_NOT_FOUND
        );
      }

      // Delete the project
      await this.prisma.resume_project.delete({
        where: { id: projectId },
      });
      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
    } catch (error) {
      logger.error({
        message: 'Failed to delete project',
        context: 'ResumeService.deleteProject',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        experienceId,
        projectId,
      });
      throw error;
    }
  }

  /**
   * Delete education from resume
   */
  async deleteEducation(
    candidateId: string,
    educationId: string
  ): Promise<void> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if the education exists and belongs to the candidate's resume
      const education = await this.prisma.resume_education.findUnique({
        where: {
          id: educationId,
          resumeId: resume.id,
        },
      });

      if (!education) {
        throw new AppError(
          `Education not found with id ${educationId}`,
          404,
          ErrorCode.EDUCATION_NOT_FOUND
        );
      }
      await this.prisma.resume_education.delete({
        where: { id: educationId },
      });
      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
      // Delete the education
    } catch (error) {
      logger.error({
        message: 'Failed to delete education',
        context: 'ResumeService.deleteEducation',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        educationId,
      });
      throw error;
    }
  }

  /**
   * Delete certification from resume
   */
  async deleteCertification(
    candidateId: string,
    certificationId: string
  ): Promise<void> {
    try {
      const resume = await this.prisma.resume.findUnique({
        where: { candidateId },
        select: { id: true },
      });

      if (!resume) {
        throw new AppError(
          `Resume not found for candidate ${candidateId}`,
          404,
          ErrorCode.RESUME_NOT_FOUND
        );
      }

      // Check if the certification exists and belongs to the candidate's resume
      const certification = await this.prisma.resume_certification.findUnique({
        where: {
          id: certificationId,
          resumeId: resume.id,
        },
      });

      if (!certification) {
        throw new AppError(
          `Certification not found with id ${certificationId}`,
          404,
          ErrorCode.CERTIFICATION_NOT_FOUND
        );
      }

      // Delete the certification
      await this.prisma.resume_certification.delete({
        where: { id: certificationId },
      });
      // Calculate profile completeness
      await this.profileService.calculateProfileCompleteness(candidateId);
    } catch (error) {
      logger.error({
        message: 'Failed to delete certification',
        context: 'ResumeService.deleteCertification',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        certificationId,
      });
      throw error;
    }
  }
}
