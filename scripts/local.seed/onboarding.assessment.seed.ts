import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';

export const seedOnboardingAssessments = async (candidates: any[]) => {
  try {
    logger.info('Starting onboarding assessment seed...');

    // Clear existing onboarding assessments
    await prisma.onboarding_assessment.deleteMany();

    // Create onboarding assessments for each candidate
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
              'AI_INITIALIZATION_IN_PROGRESS',
              'AI_INITIALIZATION_COMPLETED',
              'CANDIDATE_ASSESSMENT_IN_PROGRESS',
              'CANDIDATE_ASSESSMENT_COMPLETED',
              'AI_REVIEW_IN_PROGRESS',
              'AI_REVIEW_COMPLETED',
              'MANUAL_REVIEW_IN_PROGRESS',
              'MANUAL_REVIEW_COMPLETED',
              'ASSESSMENT_COMPLETED',
              'ASSESSMENT_FAILED',
            ]);

        // Create the assessment
        const assessment = await prisma.onboarding_assessment.create({
          data: {
            candidateId: candidate.id,
            status,
            result,
            score,
            startedAt,
            completedAt,
            automaticallyPublished: isCompleted && result === 'PASSED',
            overallFeedback: isCompleted ? faker.lorem.paragraph() : null,
            recommendation,
            duration: isCompleted
              ? faker.number.int({ min: 30 * 60, max: 120 * 60 })
              : null,
            selectedForNextRound: isCompleted && result === 'PASSED',
            strengths: isCompleted
              ? Array(faker.number.int({ min: 1, max: 5 }))
                  .fill(null)
                  .map(() => faker.lorem.sentence())
              : [],
            areasForImprovement: isCompleted
              ? Array(faker.number.int({ min: 1, max: 5 }))
                  .fill(null)
                  .map(() => faker.lorem.sentence())
              : [],
            onboardingAssessmentSettings: {
              create: {
                // Copy from global settings
                greetingMessage: 'Welcome to your job ai-based assessment!',
                defaultAssessmentDuration: 60 * 60,
                defaultPassingScore: 0.7,
                requiredSections: ['job_knowledge'],
                maximumAttempts: 3,
                cooldownPeriod: 7,
                maxSections: 3,
                maxQuestionsPerSection: 5,
                proctoringEnabled: true,
                maxWarnings: 3,
                tabSwitchLimit: 3,
                copyPasteAllowed: false,
                videoRecordingEnabled: true,
                minimumVideoLength: 300,
                aiVideoAnalysisEnabled: true,
                autoPublishOnSuccess: false,
                autoNotifyOnComplete: true,
                sectionTemplates: {},
                questionTemplates: {},
                customStyles: {},
                customInstructions:
                  'Please answer all questions based on the job description provided. Take your time and provide thoughtful responses.',
              },
            },
            progressState: {
              create: {
                lastSavedAt: new Date(),
                isCompleted: isCompleted,
                progressData: isCompleted
                  ? {
                      sections: [],
                      currentSection: null,
                      currentQuestion: null,
                    }
                  : undefined,
              },
            },

            // Video analysis for completed assessments
            videoAnalysis: isCompleted
              ? {
                  create: {
                    videoUrl: `https://storage.googleapis.com/teamcast-videos/job-ai-assessments/${faker.string.uuid()}/video.mp4`,
                    transcriptText: faker.lorem.paragraphs(4),
                    overallScore: faker.number.float({ min: 0, max: 1 }),
                    overallFeedback: faker.lorem.paragraph(),
                    engagementScore: faker.number.float({ min: 0, max: 1 }),
                    engagementFeedback: faker.lorem.paragraph(),
                    confidenceScore: faker.number.float({ min: 0, max: 1 }),
                    confidenceFeedback: faker.lorem.paragraph(),
                    clarityScore: faker.number.float({ min: 0, max: 1 }),
                    clarityFeedback: faker.lorem.paragraph(),
                    professionalDemeanorScore: faker.number.float({
                      min: 0,
                      max: 1,
                    }),
                    professionalDemeanorFeedback: faker.lorem.paragraph(),
                    proctoringScore: faker.number.float({ min: 0, max: 1 }),
                    proctoringFeedback: faker.lorem.paragraph(),
                    strengths: [
                      faker.helpers.arrayElement([
                        `Strong technical expertise in ${faker.helpers.arrayElement(
                          [
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
                          ]
                        )}`,
                        'Excellent problem-solving approach demonstrated in responses',
                        'Clear communication and articulation of complex concepts',
                        'Relevant industry experience in ${industry}',
                        'Demonstrated leadership and team collaboration skills',
                        'Proactive approach to learning and professional development',
                        'Strong analytical thinking and attention to detail',
                      ]),
                    ],
                    areasForImprovement: [
                      faker.helpers.arrayElement([
                        `Could benefit from deeper knowledge in ${faker.helpers.arrayElement(
                          [
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
                          ]
                        )}`,
                        'Opportunity to improve presentation and communication skills',
                        'Would benefit from more hands-on experience with industry-specific tools',
                        'Could strengthen project management and organizational skills',
                        'Opportunity to develop more strategic thinking approaches',
                        'Could improve time management and prioritization skills',
                      ]),
                    ],
                    highlightsInstructions: JSON.stringify({
                      introduction: {
                        startTime: 0,
                        endTime: 10,
                        description: 'Introduction to the candidate',
                      },
                    }),
                  },
                }
              : undefined,

            // Proctoring data
            proctoring: {
              create: {
                warningCount: faker.number.int({ min: 0, max: 3 }),
                tabSwitches: faker.number.int({ min: 0, max: 5 }),
                copyPasteAttempts: faker.number.int({ min: 0, max: 3 }),
                multiplePersonsDetected: faker.datatype.boolean(),
                audioIrregularities: faker.datatype.boolean(),
                screenShareViolations: faker.datatype.boolean(),
                automaticallyFailed: false,
                manualReviewRequired: faker.datatype.boolean(),
                reviewerNotes: faker.datatype.boolean()
                  ? faker.lorem.paragraph()
                  : null,
              },
            },
          },
        });

        // Create sections for the assessment
        if (isCompleted) {
          const sections = ['TECHNICAL', 'BEHAVIORAL', 'COMMUNICATION'];
          for (let i = 0; i < sections.length; i++) {
            await prisma.onboarding_assessment_section.create({
              data: {
                assessmentId: assessment.id,
                title: `${sections[i]} Assessment`,
                description: faker.lorem.sentence(),
                type: sections[i],
                status: 'COMPLETED',
                result: 'PASSED',
                score: faker.number.float({
                  min: 0.7,
                  max: 1,
                  fractionDigits: 2,
                }),
                order: i,
                isRequired: true,
                passThreshold: 0.7,
                startedAt: faker.date.between({
                  from: startedAt,
                  to: completedAt!,
                }),
                completedAt: faker.date.between({
                  from: startedAt,
                  to: completedAt!,
                }),
                feedback: faker.lorem.paragraph(),
                strengths: Array(faker.number.int({ min: 1, max: 3 }))
                  .fill(null)
                  .map(() => faker.lorem.sentence()),
                areasForImprovement: Array(faker.number.int({ min: 1, max: 3 }))
                  .fill(null)
                  .map(() => faker.lorem.sentence()),
                questions: {
                  create: Array(faker.number.int({ min: 3, max: 5 }))
                    .fill(null)
                    .map((_, qIndex) => ({
                      question: faker.lorem.sentence() + '?',
                      questionType: 'MULTIPLE_CHOICE',
                      options: ['Option A', 'Option B', 'Option C', 'Option D'],
                      correctAnswer: 'Option A',
                      answerGiven: 'Option A',
                      score: 1,
                      maxScore: 1,
                      order: qIndex,
                      isRequired: true,
                      feedback: faker.lorem.sentence(),
                    })),
                },
              },
            });
          }
        }

        return assessment;
      })
    );

    logger.info(
      `Created ${assessments.length} onboarding assessments successfully`
    );
    return assessments;
  } catch (error) {
    logger.error('Error seeding onboarding assessments:', error);
    throw error;
  }
};
