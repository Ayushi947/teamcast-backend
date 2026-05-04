import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';
import { job_recommendation_feedback_type } from '@prisma/client';

// Helper function to generate match reasons
const generateMatchReasons = () => {
  const reasons = [
    'Skills match job requirements',
    'Experience level aligns with position',
    'Educational background matches criteria',
    'Location matches job requirements',
    'Industry experience relevant',
    'Technical skills align with role',
    'Soft skills match company culture',
    'Career progression aligns with role',
    'Previous role responsibilities similar',
    'Certifications match requirements',
  ];

  return faker.helpers.arrayElements(
    reasons,
    faker.number.int({ min: 2, max: 5 })
  );
};

export const seedJobRecommendations = async (
  candidates: any[],
  jobPostings: any[]
) => {
  try {
    logger.info('Starting job recommendations seed...');

    // Clear existing job recommendations
    await prisma.job_posting_recommendation.deleteMany();

    // Create recommendations for each job posting
    const recommendations = await Promise.all(
      jobPostings.map(async (jobPosting) => {
        // Select 3-7 candidates to recommend for each job
        const numRecommendations = faker.number.int({ min: 3, max: 7 });
        const selectedCandidates = faker.helpers.arrayElements(
          candidates,
          numRecommendations
        );

        // Create recommendations for selected candidates
        const jobRecommendations = await Promise.all(
          selectedCandidates.map(async (candidate) => {
            const score = faker.number.float({
              min: 0.5,
              max: 1,
              fractionDigits: 2,
            });
            const isViewed = faker.datatype.boolean();
            const isSaved = faker.datatype.boolean();
            const isInvited = isViewed && faker.datatype.boolean();

            return prisma.job_posting_recommendation.create({
              data: {
                candidateId: candidate.id,
                jobPostingId: jobPosting.id,
                score,
                matchReason: generateMatchReasons(),
                isViewed,
                isSaved,
                isInvited,
                feedback: {
                  create: {
                    type: faker.helpers.arrayElement(
                      Object.values(job_recommendation_feedback_type)
                    ),
                    comment: faker.lorem.paragraph(),
                    isHelpful: faker.datatype.boolean(),
                    reason: faker.lorem.paragraph(),
                  },
                },
              },
            });
          })
        );

        return jobRecommendations;
      })
    );

    // Flatten the array of arrays into a single array of recommendations
    const flattenedRecommendations = recommendations.flat();

    logger.info(
      `Created ${flattenedRecommendations.length} job recommendations successfully`
    );
    return flattenedRecommendations;
  } catch (error) {
    logger.error('Error seeding job recommendations:', error);
    throw error;
  }
};
