import { logger } from '@/shared/utils/logger';
import { PrismaClient } from '@prisma/client';
import { IResume } from '@/shared/models/domain/candidate/resume.domain';

/**
 * Generate comprehensive job description text from job posting data
 */
export async function generateJobDescriptionText(
  prisma: PrismaClient,
  jobPostingId: string
): Promise<string> {
  const jobPosting = await prisma.job_posting.findUnique({
    where: { id: jobPostingId },
    include: {
      client: {
        include: {
          company: true,
        },
      },
      createdBy: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!jobPosting) {
    throw new Error('Job posting not found');
  }

  const sections: string[] = [];

  try {
    // Job Title and Company
    sections.push(`JOB TITLE\n${jobPosting.title}\n`);

    if (jobPosting.client?.company) {
      sections.push(`COMPANY\n${jobPosting.client.company.name}\n`);
      if (jobPosting.client.company.description) {
        sections.push(
          `Company Description: ${jobPosting.client.company.description}\n`
        );
      }
      if (jobPosting.client.company.industry) {
        sections.push(
          `Company Industry: ${jobPosting.client.company.industry}\n`
        );
      }
      if (jobPosting.client.company.website) {
        sections.push(
          `Company Website: ${jobPosting.client.company.website}\n`
        );
      }
    }

    // Job Description
    if (jobPosting.description) {
      sections.push(`JOB DESCRIPTION\n${jobPosting.description}\n`);
    }

    // Job Details
    sections.push('JOB DETAILS');
    sections.push(`Job Type: ${jobPosting.jobType}`);
    sections.push(`Job Commitment: ${jobPosting.jobCommitment}`);
    sections.push(`Job Schedule: ${jobPosting.jobSchedule}`);
    sections.push(`Industry: ${jobPosting.industry}`);
    sections.push(
      `Total Experience Required: ${jobPosting.totalExperience} years`
    );
    sections.push(`Number of Openings: ${jobPosting.numberOfOpenings}`);
    sections.push(`Remote Work: ${jobPosting.isRemote ? 'Yes' : 'No'}`);

    if (jobPosting.department) {
      sections.push(`Department: ${jobPosting.department}`);
    }
    if (jobPosting.teamSize) {
      sections.push(`Team Size: ${jobPosting.teamSize}`);
    }
    if (jobPosting.reportingTo) {
      sections.push(`Reports To: ${jobPosting.reportingTo}`);
    }
    if (jobPosting.hiring_manager_email) {
      sections.push(`Hiring Manager Email: ${jobPosting.hiring_manager_email}`);
    }
    sections.push('');

    // Dates and Deadlines
    sections.push('IMPORTANT DATES');
    if (jobPosting.applicationDeadline) {
      try {
        sections.push(
          `Application Deadline: ${new Date(jobPosting.applicationDeadline).toLocaleDateString()}`
        );
      } catch (dateError) {
        logger.warn('Failed to format application deadline', {
          context: 'generateJobDescriptionText',
          error:
            dateError instanceof Error ? dateError.message : 'Unknown error',
          jobPostingId,
        });
        sections.push('Application Deadline: N/A');
      }
    }
    if (jobPosting.availableFrom) {
      try {
        sections.push(
          `Available From: ${new Date(jobPosting.availableFrom).toLocaleDateString()}`
        );
      } catch (dateError) {
        logger.warn('Failed to format available from date', {
          context: 'generateJobDescriptionText',
          error:
            dateError instanceof Error ? dateError.message : 'Unknown error',
          jobPostingId,
        });
        sections.push('Available From: N/A');
      }
    }
    sections.push('');

    // Required Skills
    if (jobPosting.requiredSkills && jobPosting.requiredSkills.length > 0) {
      sections.push('REQUIRED SKILLS');
      const validRequiredSkills = jobPosting.requiredSkills.filter(
        (skill: string) => skill
      );
      if (validRequiredSkills.length > 0) {
        sections.push(validRequiredSkills.join(', '));
      }
      sections.push('');
    }

    // Preferred Skills
    if (jobPosting.preferredSkills && jobPosting.preferredSkills.length > 0) {
      sections.push('PREFERRED SKILLS');
      const validPreferredSkills = jobPosting.preferredSkills.filter(
        (skill: string) => skill
      );
      if (validPreferredSkills.length > 0) {
        sections.push(validPreferredSkills.join(', '));
      }
      sections.push('');
    }

    // Responsibilities
    if (jobPosting.responsibilities && jobPosting.responsibilities.length > 0) {
      sections.push('RESPONSIBILITIES');
      jobPosting.responsibilities.forEach((responsibility: string) => {
        if (responsibility) {
          sections.push(`- ${responsibility}`);
        }
      });
      sections.push('');
    }

    // Compensation
    if (jobPosting.minSalary || jobPosting.maxSalary) {
      sections.push('COMPENSATION');
      if (jobPosting.minSalary && jobPosting.maxSalary) {
        sections.push(
          `Salary Range: ${jobPosting.minSalary} - ${jobPosting.maxSalary} ${jobPosting.salaryCurrency || 'USD'}`
        );
      } else if (jobPosting.minSalary) {
        sections.push(
          `Minimum Salary: ${jobPosting.minSalary} ${jobPosting.salaryCurrency || 'USD'}`
        );
      } else if (jobPosting.maxSalary) {
        sections.push(
          `Maximum Salary: ${jobPosting.maxSalary} ${jobPosting.salaryCurrency || 'USD'}`
        );
      }

      if (jobPosting.equity) {
        sections.push('Equity: Available');
      }
      sections.push('');
    }

    // Benefits
    if (jobPosting.benefits && jobPosting.benefits.length > 0) {
      sections.push('BENEFITS');
      jobPosting.benefits.forEach((benefit: string) => {
        if (benefit) {
          sections.push(`- ${benefit}`);
        }
      });
      sections.push('');
    }

    // Preferred Requirements
    if (
      jobPosting.preferredUniversities &&
      jobPosting.preferredUniversities.length > 0
    ) {
      sections.push('PREFERRED UNIVERSITIES');
      const validUniversities = jobPosting.preferredUniversities.filter(
        (university: string) => university
      );
      if (validUniversities.length > 0) {
        sections.push(validUniversities.join(', '));
      }
      sections.push('');
    }

    if (jobPosting.preferredDegrees && jobPosting.preferredDegrees.length > 0) {
      sections.push('PREFERRED DEGREES');
      const validDegrees = jobPosting.preferredDegrees.filter(
        (degree: string) => degree
      );
      if (validDegrees.length > 0) {
        sections.push(validDegrees.join(', '));
      }
      sections.push('');
    }

    if (
      jobPosting.preferredLocations &&
      jobPosting.preferredLocations.length > 0
    ) {
      sections.push('PREFERRED LOCATIONS');
      const validLocations = jobPosting.preferredLocations.filter(
        (location: string) => location
      );
      if (validLocations.length > 0) {
        sections.push(validLocations.join(', '));
      }
      sections.push('');
    }

    if (
      jobPosting.preferredIndustries &&
      jobPosting.preferredIndustries.length > 0
    ) {
      sections.push('PREFERRED INDUSTRIES');
      const validIndustries = jobPosting.preferredIndustries.filter(
        (industry: string) => industry
      );
      if (validIndustries.length > 0) {
        sections.push(validIndustries.join(', '));
      }
      sections.push('');
    }

    // Tags
    if (jobPosting.tags && jobPosting.tags.length > 0) {
      sections.push('TAGS');
      const validTags = jobPosting.tags.filter((tag: string) => tag);
      if (validTags.length > 0) {
        sections.push(validTags.join(', '));
      }
      sections.push('');
    }

    // Application Information
    if (jobPosting.applicationUrl) {
      sections.push('APPLICATION INFORMATION');
      sections.push(`Application URL: ${jobPosting.applicationUrl}`);
      sections.push('');
    }

    // Job Status
    sections.push('JOB STATUS');
    sections.push(`Status: ${jobPosting.status}`);
    sections.push(`Featured: ${jobPosting.isFeatured ? 'Yes' : 'No'}`);
    sections.push(`Published: ${jobPosting.isPublished ? 'Yes' : 'No'}`);
    sections.push('');

    // Created By Information
    if (jobPosting.createdBy?.user) {
      sections.push('CREATED BY');
      sections.push(`Name: ${jobPosting.createdBy.user.name}`);
      sections.push(`Email: ${jobPosting.createdBy.user.email}`);
      if (jobPosting.createdBy.user.jobTitle) {
        sections.push(`Job Title: ${jobPosting.createdBy.user.jobTitle}`);
      }
      sections.push('');
    }

    // Timestamps
    sections.push('TIMESTAMPS');
    try {
      sections.push(
        `Created: ${new Date(jobPosting.createdAt).toLocaleDateString()}`
      );
      sections.push(
        `Last Updated: ${new Date(jobPosting.updatedAt).toLocaleDateString()}`
      );
    } catch (dateError) {
      logger.warn('Failed to format timestamps', {
        context: 'generateJobDescriptionText',
        error: dateError instanceof Error ? dateError.message : 'Unknown error',
        jobPostingId,
      });
      sections.push('Created: N/A');
      sections.push('Last Updated: N/A');
    }
    sections.push('');
  } catch (error) {
    logger.error('Failed to generate job description text', {
      context: 'generateJobDescriptionText',
      error: error instanceof Error ? error.message : 'Unknown error',
      jobPostingId,
    });
    // Return whatever sections we managed to generate
  }

  return sections.join('\n');
}

/**
 * Generate comprehensive resume text from resume data
 */
export async function generateResumeText(
  prisma: PrismaClient,
  resumeId: string
): Promise<string> {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      candidate: true,
      experience: {
        include: {
          projects: true,
        },
      },
      education: true,
      certifications: true,
      social: true,
    },
  });

  if (!resume) {
    throw new Error('Resume not found');
  }

  const sections: string[] = [];

  try {
    // Basic Information
    if (resume.summary) {
      sections.push(`PROFESSIONAL SUMMARY\n${resume.summary}\n`);
    }

    // Contact Information
    if (resume.phone || resume.location) {
      sections.push('CONTACT INFORMATION');
      if (resume.phone) sections.push(`Phone: ${resume.phone}`);
      if (resume.location) sections.push(`Location: ${resume.location}`);
      sections.push('');
    }

    // Current Position
    if (resume.currentJobTitle || resume.currentCompany) {
      sections.push('CURRENT POSITION');
      if (resume.currentJobTitle)
        sections.push(`Title: ${resume.currentJobTitle}`);
      if (resume.currentCompany)
        sections.push(`Company: ${resume.currentCompany}`);
      if (resume.currentIndustry)
        sections.push(`Industry: ${resume.currentIndustry}`);
      if (resume.currentWorkLocation)
        sections.push(`Location: ${resume.currentWorkLocation}`);
      sections.push('');
    }

    // Experience
    if (resume.experience && resume.experience.length > 0) {
      sections.push('PROFESSIONAL EXPERIENCE');
      resume.experience.forEach((exp: any) => {
        try {
          sections.push(`${exp.position || 'N/A'} at ${exp.company || 'N/A'}`);
          if (exp.industry) sections.push(`Industry: ${exp.industry}`);

          try {
            const startDate = exp.startDate
              ? new Date(exp.startDate).toLocaleDateString()
              : 'N/A';
            const endDate = exp.currentlyWorking
              ? 'Present'
              : exp.endDate
                ? new Date(exp.endDate).toLocaleDateString()
                : 'N/A';
            sections.push(`Duration: ${startDate} - ${endDate}`);
          } catch (dateError) {
            logger.warn('Failed to format date in experience', {
              context: 'CandidateResumeAssessmentService.generateResumeText',
              error:
                dateError instanceof Error
                  ? dateError.message
                  : 'Unknown error',
              expId: exp.id,
            });
            sections.push('Duration: N/A');
          }

          if (exp.description) sections.push(`Description: ${exp.description}`);

          if (exp.projects && exp.projects.length > 0) {
            sections.push('Projects:');
            exp.projects.forEach((project: any) => {
              try {
                sections.push(
                  `- ${project.name || 'N/A'}: ${project.description || 'N/A'}`
                );
              } catch (projectError) {
                logger.warn('Failed to process project', {
                  context:
                    'CandidateResumeAssessmentService.generateResumeText',
                  error:
                    projectError instanceof Error
                      ? projectError.message
                      : 'Unknown error',
                  projectId: project.id,
                });
              }
            });
          }
          sections.push('');
        } catch (expError) {
          logger.warn('Failed to process experience entry', {
            context: 'CandidateResumeAssessmentService.generateResumeText',
            error:
              expError instanceof Error ? expError.message : 'Unknown error',
            expId: exp.id,
          });
        }
      });
    }

    // Education
    if (resume.education && resume.education.length > 0) {
      sections.push('EDUCATION');
      resume.education.forEach((edu: any) => {
        try {
          sections.push(
            `${edu.degree || 'N/A'} in ${edu.fieldOfStudy || 'N/A'}`
          );
          if (edu.institution) sections.push(`Institution: ${edu.institution}`);
          if (edu.level) sections.push(`Level: ${edu.level}`);
          if (edu.gpa) sections.push(`GPA: ${edu.gpa}`);

          try {
            const startDate = edu.startDate
              ? new Date(edu.startDate).toLocaleDateString()
              : 'N/A';
            const endDate = edu.currentlyPursuing
              ? 'Present'
              : edu.endDate
                ? new Date(edu.endDate).toLocaleDateString()
                : 'N/A';
            sections.push(`Duration: ${startDate} - ${endDate}`);
          } catch (dateError) {
            logger.warn('Failed to format date in education', {
              context: 'CandidateResumeAssessmentService.generateResumeText',
              error:
                dateError instanceof Error
                  ? dateError.message
                  : 'Unknown error',
              eduId: edu.id,
            });
            sections.push('Duration: N/A');
          }

          if (edu.achievements && edu.achievements.length > 0) {
            sections.push('Achievements:');
            edu.achievements.forEach((achievement: string) => {
              if (achievement) sections.push(`- ${achievement}`);
            });
          }
          sections.push('');
        } catch (eduError) {
          logger.warn('Failed to process education entry', {
            context: 'CandidateResumeAssessmentService.generateResumeText',
            error:
              eduError instanceof Error ? eduError.message : 'Unknown error',
            eduId: edu.id,
          });
        }
      });
    }

    // Certifications
    if (resume.certifications && resume.certifications.length > 0) {
      sections.push('CERTIFICATIONS');
      resume.certifications.forEach((cert: any) => {
        try {
          sections.push(`${cert.name || 'N/A'} - ${cert.issuer || 'N/A'}`);
          if (cert.level) sections.push(`Level: ${cert.level}`);

          try {
            if (cert.issueDate)
              sections.push(
                `Issued: ${new Date(cert.issueDate).toLocaleDateString()}`
              );
            if (cert.expiryDate)
              sections.push(
                `Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`
              );
          } catch (dateError) {
            logger.warn('Failed to format certification date', {
              context: 'CandidateResumeAssessmentService.generateResumeText',
              error:
                dateError instanceof Error
                  ? dateError.message
                  : 'Unknown error',
              certId: cert.id,
            });
          }

          if (cert.description)
            sections.push(`Description: ${cert.description}`);
          sections.push('');
        } catch (certError) {
          logger.warn('Failed to process certification', {
            context: 'CandidateResumeAssessmentService.generateResumeText',
            error:
              certError instanceof Error ? certError.message : 'Unknown error',
            certId: cert.id,
          });
        }
      });
    }

    // Skills
    if (resume.resumeSkills && resume.resumeSkills.length > 0) {
      sections.push('SKILLS');
      const validSkills = resume.resumeSkills.filter((skill: any) => skill);
      if (validSkills.length > 0) {
        sections.push(validSkills.join(', '));
      }
      sections.push('');
    }

    // Languages
    if (resume.languages && resume.languages.length > 0) {
      sections.push('LANGUAGES');
      const validLanguages = resume.languages.filter((lang: any) => lang);
      if (validLanguages.length > 0) {
        sections.push(validLanguages.join(', '));
      }
      sections.push('');
    }

    // Social Links
    if (resume.social) {
      sections.push('PROFESSIONAL PROFILES');
      if (resume.social.linkedin)
        sections.push(`LinkedIn: ${resume.social.linkedin}`);
      if (resume.social.github)
        sections.push(`GitHub: ${resume.social.github}`);
      if (resume.social.portfolio)
        sections.push(`Portfolio: ${resume.social.portfolio}`);
      sections.push('');
    }
  } catch (error) {
    logger.error('Failed to generate resume text', {
      context: 'CandidateResumeAssessmentService.generateResumeText',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Return whatever sections we managed to generate
  }

  return sections.join('\n');
}

/**
 * Generate comprehensive resume text from parsed resume data (IResumeParsed)
 */
export function generateResumeTextFromParsedResume(
  parsedResume: Partial<IResume>
): string {
  const sections: string[] = [];

  try {
    // Basic Information
    if (parsedResume.summary) {
      sections.push(`PROFESSIONAL SUMMARY\n${parsedResume.summary}\n`);
    }

    // Contact Information
    if (parsedResume.phone || parsedResume.location) {
      sections.push('CONTACT INFORMATION');
      if (parsedResume.phone) sections.push(`Phone: ${parsedResume.phone}`);
      if (parsedResume.location)
        sections.push(`Location: ${parsedResume.location}`);
      sections.push('');
    }

    // Current Position
    if (parsedResume.currentJobTitle || parsedResume.currentCompany) {
      sections.push('CURRENT POSITION');
      if (parsedResume.currentJobTitle)
        sections.push(`Title: ${parsedResume.currentJobTitle}`);
      if (parsedResume.currentCompany)
        sections.push(`Company: ${parsedResume.currentCompany}`);
      if (parsedResume.currentIndustry)
        sections.push(`Industry: ${parsedResume.currentIndustry}`);
      if (parsedResume.currentWorkLocation)
        sections.push(`Location: ${parsedResume.currentWorkLocation}`);
      sections.push('');
    }

    // Experience
    if (parsedResume.experience && parsedResume.experience.length > 0) {
      sections.push('WORK EXPERIENCE');
      parsedResume.experience.forEach((exp: any, index: number) => {
        sections.push(`\nExperience ${index + 1}:`);
        if (exp.position) sections.push(`Position: ${exp.position}`);
        if (exp.company) sections.push(`Company: ${exp.company}`);
        if (exp.industry) sections.push(`Industry: ${exp.industry}`);
        if (exp.location) sections.push(`Location: ${exp.location}`);
        if (exp.startDate) sections.push(`Start Date: ${exp.startDate}`);
        if (exp.endDate) sections.push(`End Date: ${exp.endDate}`);
        if (exp.currentlyWorking)
          sections.push(`Currently Working: ${exp.currentlyWorking}`);
        if (exp.description) sections.push(`Description: ${exp.description}`);
        if (exp.skills && exp.skills.length > 0)
          sections.push(`Skills: ${exp.skills.join(', ')}`);
        if (exp.achievements && exp.achievements.length > 0) {
          sections.push('Achievements:');
          exp.achievements.forEach((achievement: string) => {
            sections.push(`- ${achievement}`);
          });
        }
        if (exp.responsibilities && exp.responsibilities.length > 0) {
          sections.push('Responsibilities:');
          exp.responsibilities.forEach((resp: string) => {
            sections.push(`- ${resp}`);
          });
        }
        if (exp.projects && exp.projects.length > 0) {
          sections.push('Projects:');
          exp.projects.forEach((proj: any) => {
            sections.push(`  - ${proj.name || 'Unnamed Project'}`);
            if (proj.description) sections.push(`    ${proj.description}`);
            if (proj.skills && proj.skills.length > 0)
              sections.push(`    Skills: ${proj.skills.join(', ')}`);
          });
        }
      });
      sections.push('');
    }

    // Education
    if (parsedResume.education && parsedResume.education.length > 0) {
      sections.push('EDUCATION');
      parsedResume.education.forEach((edu: any) => {
        if (edu.institution) sections.push(`Institution: ${edu.institution}`);
        if (edu.level) sections.push(`Level: ${edu.level}`);
        if (edu.degree) sections.push(`Degree: ${edu.degree}`);
        if (edu.fieldOfStudy)
          sections.push(`Field of Study: ${edu.fieldOfStudy}`);
        if (edu.startDate) sections.push(`Start Date: ${edu.startDate}`);
        if (edu.endDate) sections.push(`End Date: ${edu.endDate}`);
        if (edu.gpa) sections.push(`GPA: ${edu.gpa}`);
        if (edu.achievements && edu.achievements.length > 0) {
          sections.push('Achievements:');
          edu.achievements.forEach((achievement: string) => {
            sections.push(`- ${achievement}`);
          });
        }
        sections.push('');
      });
    }

    // Certifications
    if (parsedResume.certifications && parsedResume.certifications.length > 0) {
      sections.push('CERTIFICATIONS');
      parsedResume.certifications.forEach((cert: any) => {
        if (cert.name) sections.push(`Name: ${cert.name}`);
        if (cert.issuer) sections.push(`Issuer: ${cert.issuer}`);
        if (cert.issueDate) sections.push(`Issue Date: ${cert.issueDate}`);
        if (cert.expiryDate) sections.push(`Expiry Date: ${cert.expiryDate}`);
        sections.push('');
      });
    }

    // Skills
    if (parsedResume.resumeSkills && parsedResume.resumeSkills.length > 0) {
      sections.push('SKILLS');
      const validSkills = parsedResume.resumeSkills.filter(
        (skill: any) => skill
      );
      if (validSkills.length > 0) {
        sections.push(validSkills.join(', '));
      }
      sections.push('');
    }

    // Languages
    if (parsedResume.languages && parsedResume.languages.length > 0) {
      sections.push('LANGUAGES');
      const validLanguages = parsedResume.languages.filter((lang: any) => lang);
      if (validLanguages.length > 0) {
        sections.push(validLanguages.join(', '));
      }
      sections.push('');
    }

    // Social Links
    if (parsedResume.social) {
      sections.push('PROFESSIONAL PROFILES');
      if (parsedResume.social.linkedin)
        sections.push(`LinkedIn: ${parsedResume.social.linkedin}`);
      if (parsedResume.social.github)
        sections.push(`GitHub: ${parsedResume.social.github}`);
      if (parsedResume.social.portfolio)
        sections.push(`Portfolio: ${parsedResume.social.portfolio}`);
      sections.push('');
    }
  } catch (error) {
    logger.error('Failed to generate resume text from parsed resume', {
      context: 'generateResumeTextFromParsedResume',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Return whatever sections we managed to generate
  }

  return sections.join('\n');
}
