import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

export const seedResumeAssessments = async (candidates: any[]) => {
  try {
    logger.info('Starting resume assessment seed...');

    // Clear existing resume assessments
    await prisma.resume_assessment.deleteMany();

    // Create resume assessments for each candidate
    const assessments = await Promise.all(
      candidates.map(async (candidate) => {
        // Randomly determine if assessment is completed
        const isCompleted = faker.datatype.boolean();
        const startedAt = faker.date.past();
        const completedAt = isCompleted
          ? faker.date.between({ from: startedAt, to: new Date() })
          : null;

        // Generate random scores and results
        const score = isCompleted
          ? faker.number.float({ min: 0, max: 100, fractionDigits: 2 })
          : 0;
        const result = isCompleted
          ? faker.helpers.arrayElement([
              'PASSED',
              'AI_REVIEW_FAILED',
              'MANUAL_REVIEW_FAILED',
            ])
          : 'NOT_AVAILABLE';
        const recommendation = isCompleted
          ? faker.helpers.arrayElement([
              'HIGHLY_RECOMMENDED',
              'RECOMMENDED',
              'NOT_RECOMMENDED',
            ])
          : null;

        // Generate status based on completion
        const status = isCompleted
          ? 'ASSESSMENT_COMPLETED'
          : faker.helpers.arrayElement([
              'NOT_STARTED',
              'AI_REVIEW_IN_PROGRESS',
              'AI_REVIEW_COMPLETED',
              'MANUAL_REVIEW_IN_PROGRESS',
              'MANUAL_REVIEW_COMPLETED',
              'ASSESSMENT_FAILED',
            ]);

        // Generate analysis data if completed
        const strengths = isCompleted
          ? Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
              faker.lorem.sentence()
            )
          : [];
        const areasForImprovement = isCompleted
          ? Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
              faker.lorem.sentence()
            )
          : [];
        const skills = isCompleted
          ? Array.from({ length: faker.number.int({ min: 5, max: 10 }) }, () =>
              faker.person.jobArea()
            )
          : [];
        const technicalSkills = isCompleted
          ? Array.from({ length: faker.number.int({ min: 3, max: 7 }) }, () =>
              faker.helpers.arrayElement([
                'JavaScript',
                'Python',
                'Java',
                'React',
                'Node.js',
                'SQL',
                'AWS',
                'Docker',
                'Kubernetes',
                'TypeScript',
              ])
            )
          : [];
        const industriesFit = isCompleted
          ? Array.from({ length: faker.number.int({ min: 1, max: 7 }) }, () =>
              faker.helpers.arrayElement([
                'Finance',
                'Healthcare',
                'Technology',
                'Education',
                'Manufacturing',
                'Retail',
                'Marketing',
                'Sales',
                'Customer Service',
                'Administration',
                'Other',
              ])
            )
          : [];
        const jobRolesFit = isCompleted
          ? Array.from({ length: faker.number.int({ min: 1, max: 7 }) }, () =>
              faker.helpers.arrayElement([
                'Software Engineer',
                'Data Analyst',
                'Project Manager',
                'Sales Manager',
                'Marketing Manager',
                'Administrator',
                'HR Manager',
                'Customer Success Manager',
                'Other',
              ])
            )
          : [];
        const softSkills = isCompleted
          ? Array.from({ length: faker.number.int({ min: 3, max: 7 }) }, () =>
              faker.helpers.arrayElement([
                'Communication',
                'Leadership',
                'Problem Solving',
                'Teamwork',
                'Time Management',
                'Adaptability',
                'Critical Thinking',
              ])
            )
          : [];

        return prisma.resume_assessment.create({
          data: {
            candidateId: candidate.id,
            status,
            result,
            score,
            resumeText: faker.lorem.paragraph(),
            strengths,
            areasForImprovement,
            skills,
            experienceSummary: isCompleted ? faker.lorem.paragraphs(2) : null,
            educationSummary: isCompleted ? faker.lorem.paragraph() : null,
            technicalSkills,
            softSkills,
            yearsOfExperience: isCompleted
              ? faker.number.float({ min: 0, max: 20, fractionDigits: 1 })
              : null,
            overallFeedback: isCompleted ? faker.lorem.paragraph() : null,
            recommendation,
            industriesFit,
            jobRolesFit,
            startedAt,
            completedAt,
          },
        });
      })
    );

    logger.info(
      `Created ${assessments.length} resume assessments successfully`
    );
    return assessments;
  } catch (error) {
    logger.error('Error seeding resume assessments:', error);
    throw error;
  }
};
