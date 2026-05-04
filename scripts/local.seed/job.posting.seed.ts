import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';
import {
  work_type,
  work_commitment,
  work_schedule,
  company_industry,
  job_posting_status,
} from '@prisma/client';

export const seedJobPostings = async (clientUsers: any[]) => {
  try {
    logger.info('Starting job posting seed...');

    // Clear existing job postings
    await prisma.job_posting.deleteMany();

    // Create job postings for each client user
    const jobPostings = await Promise.all(
      clientUsers.map(async (clientUser) => {
        // Get the client for this user
        const client = await prisma.client.findUnique({
          where: { id: clientUser.clientId },
          include: {
            clientAiAssessmentSettings: true,
          },
        });

        if (!client) {
          throw new Error(`Client not found for user ${clientUser.id}`);
        }

        if (!client.clientAiAssessmentSettings) {
          throw new Error(`Client ${client.id} has no AI assessment settings`);
        }

        // Create the job posting
        const jobPosting = await prisma.job_posting.create({
          data: {
            clientId: client.id,
            createdById: clientUser.id,
            title: faker.person.jobTitle(),
            description: faker.lorem.paragraphs(3),
            jobType: faker.helpers.arrayElement(Object.values(work_type)),
            jobCommitment: faker.helpers.arrayElement(
              Object.values(work_commitment)
            ),
            jobSchedule: faker.helpers.arrayElement(
              Object.values(work_schedule)
            ),
            industry: faker.helpers.arrayElement(
              Object.values(company_industry)
            ),
            totalExperience: faker.number.int({ min: 1, max: 15 }),
            department: faker.helpers.arrayElement([
              'Engineering',
              'Product',
              'Design',
              'Marketing',
              'Sales',
              'Operations',
              'Finance',
              'HR',
            ]),
            teamSize: faker.number.int({ min: 5, max: 100 }),
            reportingTo: faker.person.jobTitle(),
            status: faker.helpers.arrayElement(
              Object.values(job_posting_status)
            ),
            applicationDeadline: faker.date.future(),
            availableFrom: faker.date.future(),
            numberOfOpenings: faker.number.int({ min: 1, max: 10 }),
            applicationUrl: faker.internet.url(),
            isFeatured: faker.datatype.boolean(),
            isRemote: faker.datatype.boolean(),
            preferredUniversities: Array(faker.number.int({ min: 1, max: 5 }))
              .fill(null)
              .map(() => faker.company.name() + ' University'),
            preferredDegrees: Array(faker.number.int({ min: 1, max: 5 }))
              .fill(null)
              .map(() =>
                faker.helpers.arrayElement([
                  "Bachelor's in Computer Science",
                  "Master's in Business Administration",
                  "Bachelor's in Engineering",
                  "Master's in Data Science",
                  "Bachelor's in Marketing",
                ])
              ),
            preferredLocations: Array(faker.number.int({ min: 1, max: 5 }))
              .fill(null)
              .map(() => faker.location.city()),
            preferredIndustries: Array(faker.number.int({ min: 1, max: 5 }))
              .fill(null)
              .map(() =>
                faker.helpers.arrayElement(Object.values(company_industry))
              ),
            requiredSkills: Array(faker.number.int({ min: 3, max: 8 }))
              .fill(null)
              .map(() =>
                faker.helpers.arrayElement([
                  'JavaScript',
                  'Python',
                  'React',
                  'Node.js',
                  'AWS',
                  'Docker',
                  'Kubernetes',
                  'Machine Learning',
                  'Data Analysis',
                  'Project Management',
                ])
              ),
            preferredSkills: Array(faker.number.int({ min: 2, max: 5 }))
              .fill(null)
              .map(() =>
                faker.helpers.arrayElement([
                  'TypeScript',
                  'GraphQL',
                  'MongoDB',
                  'Redis',
                  'CI/CD',
                  'Agile',
                  'Leadership',
                  'Communication',
                ])
              ),
            minSalary: faker.number.float({
              min: 50000,
              max: 100000,
              fractionDigits: 0,
            }),
            maxSalary: faker.number.float({
              min: 100000,
              max: 200000,
              fractionDigits: 0,
            }),
            salaryCurrency: 'USD',
            equity: faker.datatype.boolean(),
            benefits: Array(faker.number.int({ min: 3, max: 8 }))
              .fill(null)
              .map(() =>
                faker.helpers.arrayElement([
                  'Health Insurance',
                  'Dental Insurance',
                  'Vision Insurance',
                  '401(k) Matching',
                  'Flexible PTO',
                  'Remote Work',
                  'Gym Membership',
                  'Professional Development',
                  'Stock Options',
                  'Parental Leave',
                ])
              ),
            responsibilities: Array(faker.number.int({ min: 5, max: 10 }))
              .fill(null)
              .map(() => faker.lorem.sentence()),
            tags: Array(faker.number.int({ min: 3, max: 8 }))
              .fill(null)
              .map(() =>
                faker.helpers.arrayElement([
                  'Remote',
                  'Full-time',
                  'Senior',
                  'Entry-level',
                  'Tech',
                  'Startup',
                  'Fast-paced',
                  'Innovative',
                ])
              ),
            jobPostingAiAssessmentSettings: {
              create: {
                greetingMessage: 'Welcome to the onboarding assessment!',
                defaultAssessmentDuration: 60 * 60,
                defaultPassingScore: 0.7,
                requiredSections: [
                  'INTRODUCTION',
                  'PSYCHOMETRIC_ASSESSMENT',
                  'ASPIRATIONS',
                ],
                maximumAttempts: 3,
                cooldownPeriod: 7,
                proctoringEnabled: true,
                maxWarnings: 3,
                tabSwitchLimit: 3,
                copyPasteAllowed: false,
                videoRecordingEnabled: true,
                minimumVideoLength: 10,
                aiVideoAnalysisEnabled: true,
                autoPublishOnSuccess: true,
                autoNotifyOnComplete: true,
                sectionTemplates: {},
                questionTemplates: {},
                customStyles: {},
                customInstructions:
                  'Please complete all sections of the assessment honestly and to the best of your ability.',
              },
            },
          },
        });

        return jobPosting;
      })
    );

    logger.info(`Created ${jobPostings.length} job postings successfully`);
    return jobPostings;
  } catch (error) {
    logger.error('Error seeding job postings:', error);
    throw error;
  }
};
