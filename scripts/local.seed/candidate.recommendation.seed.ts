import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';
import { candidate_recommendation_feedback_type } from '@prisma/client';

// Helper function to generate match reasons
const generateMatchReasons = () => {
  const reasons = [
    'Job requirements match candidate skills',
    'Role aligns with career goals',
    'Company culture matches preferences',
    'Location matches candidate preferences',
    'Salary range matches expectations',
    'Growth opportunities align with aspirations',
    'Work environment matches preferences',
    'Required experience matches candidate background',
    'Technical requirements match expertise',
    'Team structure matches working style',
  ];

  return faker.helpers.arrayElements(
    reasons,
    faker.number.int({ min: 2, max: 5 })
  );
};

export const seedCandidateRecommendations = async (
  candidates: any[],
  jobPostings: any[]
) => {
  try {
    logger.info('Starting candidate recommendations seed...');

    // Clear existing candidate recommendations
    await prisma.candidate_recommendation.deleteMany();

    // Create recommendations for each candidate
    const recommendations = await Promise.all(
      candidates.map(async (candidate) => {
        // Select 2-5 job postings to recommend for each candidate
        const numRecommendations = faker.number.int({ min: 2, max: 5 });
        const selectedJobPostings = faker.helpers.arrayElements(
          jobPostings,
          numRecommendations
        );

        // Create recommendations for selected job postings
        const candidateRecommendations = await Promise.all(
          selectedJobPostings.map(async (jobPosting) => {
            const score = faker.number.float({
              min: 0.5,
              max: 1,
              fractionDigits: 2,
            });
            const isViewed = faker.datatype.boolean();
            const hasApplied = isViewed && faker.datatype.boolean();
            const isSaved = isViewed && faker.datatype.boolean();

            return prisma.candidate_recommendation.create({
              data: {
                candidateId: candidate.id,
                jobPostingId: jobPosting.id,
                score,
                matchReason: generateMatchReasons(),
                isViewed,
                hasApplied,
                isSaved,
                feedback: {
                  create: {
                    type: faker.helpers.arrayElement(
                      Object.values(candidate_recommendation_feedback_type)
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

        return candidateRecommendations;
      })
    );

    // Flatten the array of arrays into a single array of recommendations
    const flattenedRecommendations = recommendations.flat();

    logger.info(
      `Created ${flattenedRecommendations.length} candidate recommendations successfully`
    );
    return flattenedRecommendations;
  } catch (error) {
    logger.error('Error seeding candidate recommendations:', error);
    throw error;
  }
};
