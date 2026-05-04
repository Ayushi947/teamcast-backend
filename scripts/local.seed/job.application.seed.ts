import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';
import { application_status } from '@prisma/client';

export const seedJobApplications = async (
  candidates: any[],
  jobPostings: any[]
) => {
  try {
    logger.info('Starting job application seed...');

    // Clear existing job applications and related assessments
    await prisma.job_application.deleteMany();
    await prisma.job_ai_assessment.deleteMany();

    // Create job applications
    const applications = await Promise.all(
      candidates.map(async (candidate) => {
        // Randomly select 1-3 job postings for each candidate to apply to
        const numApplications = faker.number.int({ min: 1, max: 3 });
        const selectedJobPostings = faker.helpers.arrayElements(
          jobPostings,
          numApplications
        );

        // Create applications for each selected job posting
        const candidateApplications = await Promise.all(
          selectedJobPostings.map(async (jobPosting) => {
            // Randomly determine if the application is comareasForImprovementpleted
            const isCompleted = faker.datatype.boolean();

            // Generate application status based on completion
            const status = isCompleted
              ? faker.helpers.arrayElement([
                  application_status.SHORTLISTED,
                  application_status.ASSESSING,
                  application_status.OFFERED,
                  application_status.ACCEPTED,
                  application_status.FAILED,
                  application_status.REJECTED,
                  application_status.WITHDRAWN,
                ])
              : faker.helpers.arrayElement([
                  application_status.DRAFT,
                  application_status.INVITED,
                  application_status.APPLIED,
                  application_status.REVIEWING,
                ]);

            // Generate application data
            const appliedAt = faker.date.past();
            const hasCoverLetter = faker.datatype.boolean();
            const hasNotes = faker.datatype.boolean();

            // Create the job application first
            const application = await prisma.job_application.create({
              data: {
                candidateId: candidate.id,
                jobPostingId: jobPosting.id,
                status,
                appliedAt,
                notes: hasNotes ? faker.lorem.paragraph() : null,
                coverLetterUrl: hasCoverLetter ? faker.internet.url() : null,
              },
            });

            return application;
          })
        );

        return candidateApplications;
      })
    );

    // Flatten the array of arrays into a single array of applications
    const flattenedApplications = applications.flat();

    logger.info(
      `Created ${flattenedApplications.length} job applications successfully`
    );
    return flattenedApplications;
  } catch (error) {
    logger.error('Error seeding job applications:', error);
    throw error;
  }
};
