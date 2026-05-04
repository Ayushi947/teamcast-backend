import {
  education_level,
  work_type,
  work_commitment,
  work_schedule,
  notice_period,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

export const seedCandidateResumes = async (candidateUsers: any[]) => {
  try {
    logger.info('Starting candidate resume seed...');

    // Clear existing resumes
    await prisma.resume.deleteMany();

    // Create resumes for each candidate
    const resumeMappings = await Promise.all(
      candidateUsers.map(async (user) => {
        const totalExperience = faker.number.int({ min: 1, max: 20 });
        const industries = [
          'Technology',
          'Healthcare',
          'Finance',
          'Education',
          'Retail',
          'Manufacturing',
          'Construction',
          'Hospitality',
          'Marketing',
          'Sales',
          'Customer Service',
        ];
        const skills = [
          'JavaScript',
          'TypeScript',
          'React',
          'Node.js',
          'Python',
          'Java',
          'SQL',
          'AWS',
          'Docker',
          'Kubernetes',
          'Next.js',
          'Tailwind CSS',
          'Express',
          'MongoDB',
          'PostgreSQL',
          'Git',
          'GitHub',
          'CI/CD',
          'DevOps',
          'Cloud',
          'AWS',
          'Azure',
          'GCP',
          'React Native',
          'Flutter',
          'Swift',
          'Kotlin',
          'Ruby',
          'PHP',
          'Go',
          'C#',
          'C++',
          'C',
          'Objective-C',
          'SwiftUI',
          'Go',
          'Rust',
          'Scala',
          'Kotlin',
          'Ruby',
          'PHP',
          'Go',
          'C#',
        ];

        return prisma.resume.create({
          data: {
            candidateId: user.id,
            phone: faker.phone.number(),
            location: faker.location.city(),
            summary: faker.lorem.paragraph(),
            primaryIndustry: faker.helpers.arrayElement(industries),
            industries: faker.helpers.arrayElements(industries, {
              min: 1,
              max: 3,
            }),
            highestEducationLevel: faker.helpers.arrayElement(
              Object.values(education_level)
            ),
            totalExperience,
            currentJobTitle: faker.person.jobTitle(),
            currentCompany: faker.company.name(),
            currentIndustry: faker.helpers.arrayElement(industries),
            currentWorkLocation: faker.location.city(),
            currentWorkType: faker.helpers.arrayElement(
              Object.values(work_type)
            ),
            currentWorkCommitment: faker.helpers.arrayElement(
              Object.values(work_commitment)
            ),
            currentWorkSchedule: faker.helpers.arrayElement(
              Object.values(work_schedule)
            ),
            currentSalary: faker.number.float({
              min: 50000,
              max: 200000,
              fractionDigits: 2,
            }),
            currentSalaryCurrency: 'USD',
            availableFrom: faker.date.future(),
            noticePeriod: faker.helpers.arrayElement(
              Object.values(notice_period)
            ),
            resumeSkills: faker.helpers.arrayElements(skills, {
              min: 3,
              max: 8,
            }),
            languages: [
              'English',
              faker.helpers.arrayElement([
                'Spanish',
                'French',
                'German',
                'Chinese',
              ]),
            ],
            social: {
              create: {
                linkedin: faker.internet.url(),
                github: faker.internet.url(),
                portfolio: faker.internet.url(),
              },
            },
            education: {
              create: [
                {
                  institution: faker.company.name(),
                  level: education_level.BACHELORS,
                  degree: 'Bachelor of Science',
                  fieldOfStudy: 'Computer Science',
                  startDate: faker.date.past({ years: 4 }),
                  endDate: faker.date.past({ years: 1 }),
                  gpa: faker.number.float({
                    min: 2.0,
                    max: 4.0,
                    fractionDigits: 1,
                  }),
                  achievements: [
                    "Dean's List",
                    'Computer Science Club President',
                    'Hackathon Winner',
                  ],
                },
              ],
            },
            experience: {
              create: [
                {
                  company: faker.company.name(),
                  position: faker.person.jobTitle(),
                  industry: faker.helpers.arrayElement(industries),
                  startDate: faker.date.past({ years: totalExperience }),
                  endDate: null,
                  currentlyWorking: true,
                  description: faker.lorem.paragraph(),
                  type: work_type.EMPLOYEE,
                  commitment: work_commitment.FULL_TIME,
                  location: faker.location.city(),
                  skills: faker.helpers.arrayElements(skills, {
                    min: 3,
                    max: 6,
                  }),
                  achievements: [
                    faker.lorem.sentence(),
                    faker.lorem.sentence(),
                    faker.lorem.sentence(),
                  ],
                  projects: {
                    create: [
                      {
                        name: faker.lorem.words(3),
                        description: faker.lorem.paragraph(),
                        role: faker.person.jobTitle(),
                        teamSize: faker.number.int({ min: 3, max: 10 }),
                        skills: faker.helpers.arrayElements(skills, {
                          min: 2,
                          max: 4,
                        }),
                        responsibilities: [
                          faker.lorem.sentence(),
                          faker.lorem.sentence(),
                        ],
                        achievements: [faker.lorem.sentence()],
                        challenges: [faker.lorem.sentence()],
                        solutions: [faker.lorem.sentence()],
                        impact: [faker.lorem.sentence()],
                      },
                    ],
                  },
                },
              ],
            },
          },
        });
      })
    );

    logger.info(
      `Created ${resumeMappings.length} candidate resumes successfully`
    );
    return resumeMappings;
  } catch (error) {
    logger.error('Error seeding candidate resumes:', error);
    throw error;
  }
};
