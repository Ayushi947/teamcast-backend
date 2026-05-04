import { singleton } from '@/shared/decorators/singleton';
import { logger } from '@/shared/utils/logger';
import { PrismaClient } from '@prisma/client';
import {
  INextQuestionPollResponse,
  ISubmitAnswerRequest,
  ISubmitAnswerResponse,
  QuestionPollStatus,
} from '@/shared/models/domain/livekit/http.polling.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { IOnboardingAssessmentProvider } from '@/services/helpers/ai.onboarding.assessment/onboarding.assessment.provider';
import { IStorageProvider } from '@/services/helpers/storage/storage.interface';
import { AnswerValidatorService } from './answer.validator.service';

/**
 * HTTP Polling Service for LiveKit Agent Communication
 *
 * Simple, robust alternative to Redis pub/sub.
 * Agent polls for next question, posts answers via HTTP.
 * Integrates with AI question generation system.
 */
@singleton
export class LiveKitHttpPollingService {
  private prisma: PrismaClient;
  private answerProcessingLocks: Map<string, boolean> = new Map();
  // ⚠️ CRITICAL: Assessment-level locks to prevent race conditions
  // Prevents polling while question generation is in progress
  private assessmentGenerationLocks: Map<string, boolean> = new Map();

  constructor(
    private readonly onboardingAssessmentProvider: IOnboardingAssessmentProvider,
    private readonly storageProvider: IStorageProvider
  ) {
    this.prisma = new PrismaClient();
  }

  /**
   * Clean question text to remove Gemini instruction formatting
   * CRITICAL: Gemini sometimes includes instruction prefixes like "INSTRUCTION:", "FEEDBACK:", etc.
   * that should not be spoken by the agent
   */
  private cleanQuestionText(questionText: string): string {
    if (!questionText || typeof questionText !== 'string') {
      return questionText;
    }

    let cleaned = questionText.trim();

    // Remove common instruction prefixes that Gemini adds
    const instructionPrefixes = [
      /^INSTRUCTION:\s*/i,
      /^FEEDBACK:\s*/i,
      /^NEXT QUESTION:\s*/i,
      /^ASK_QUESTION:\s*/i,
      /^QUESTION:\s*/i,
      /^SAY:\s*/i,
      /^SPEAK:\s*/i,
    ];

    // Apply each prefix removal
    for (const prefix of instructionPrefixes) {
      cleaned = cleaned.replace(prefix, '');
    }

    // Extract actual question if Gemini wrapped it with instructions
    // Pattern: "INSTRUCTION: ... FEEDBACK: ... NEXT QUESTION: actual question here"
    const nextQuestionMatch = cleaned.match(/NEXT QUESTION:\s*(.+)/i);
    if (nextQuestionMatch) {
      cleaned = nextQuestionMatch[1].trim();
    }

    // If text starts with "Provide feedback..." then extract the actual question after it
    const feedbackPattern =
      /^Provide feedback[^.]*\.\s*FEEDBACK:[^.]*\.\s*NEXT QUESTION:\s*(.+)/i;
    const feedbackMatch = cleaned.match(feedbackPattern);
    if (feedbackMatch) {
      cleaned = feedbackMatch[1].trim();
    }

    return cleaned.trim();
  }

  /**
   * Agent polls this to get next question
   * GET /api/livekit/assessment/:assessmentId/next-question
   */
  async getNextQuestion(
    assessmentId: string
  ): Promise<INextQuestionPollResponse> {
    try {
      logger.info('📡 [HTTP POLLING] Agent polling for next question', {
        context: 'LiveKitHttpPollingService.getNextQuestion',
        assessmentId,
        timestamp: new Date().toISOString(),
      });

      // ⚠️ CRITICAL: Check if question is being generated for this assessment
      // Prevents race condition where agent polls while question is still being created
      if (this.assessmentGenerationLocks.get(assessmentId)) {
        logger.info(
          '⏳ [HTTP POLLING] Question generation in progress, returning GENERATING status',
          {
            context: 'LiveKitHttpPollingService.getNextQuestion',
            assessmentId,
            lockStatus: 'LOCKED',
          }
        );
        return {
          status: QuestionPollStatus.GENERATING,
        };
      }

      // Get assessment with current progress
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          progressState: true,
          sections: {
            include: {
              questions: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!assessment) {
        return {
          status: QuestionPollStatus.ERROR,
          errorMessage: 'Assessment not found',
        };
      }

      // Check if assessment is completed
      if (
        assessment.status === 'ASSESSMENT_COMPLETED' ||
        assessment.status === 'CANDIDATE_ASSESSMENT_COMPLETED'
      ) {
        return {
          status: QuestionPollStatus.COMPLETED,
        };
      }

      // Get current question ID from progress state
      let currentQuestionId = assessment.progressState?.currentQuestionId;

      // If no current question, initialize with first question
      if (!currentQuestionId) {
        // Find first question across allin  sections
        const firstSection = assessment.sections[0];
        const firstQuestion = firstSection?.questions[0];

        if (!firstQuestion) {
          return {
            status: QuestionPollStatus.ERROR,
            errorMessage: 'No questions found in assessment',
          };
        }

        // Initialize progress state with first question
        await this.prisma.onboarding_assessment_progress.upsert({
          where: { assessmentId },
          create: {
            id: `progress-${assessmentId}`,
            assessmentId,
            currentQuestionId: firstQuestion.id,
            currentSectionId: firstSection.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          update: {
            currentQuestionId: firstQuestion.id,
            currentSectionId: firstSection.id,
            updatedAt: new Date(),
          },
        });

        currentQuestionId = firstQuestion.id;

        logger.info('Initialized progress state with first question', {
          context: 'LiveKitHttpPollingService.getNextQuestion',
          assessmentId,
          firstQuestionId: firstQuestion.id,
        });
      }

      // Find the current question and its section
      let question: any = null;
      let currentSection: any = null;
      let sequence = 0;
      let totalQuestions = 0;
      let currentSectionQuestionCount = 0;
      let currentSectionTotalQuestions = 0;

      for (const section of assessment.sections) {
        for (const q of section.questions) {
          totalQuestions++;
          if (q.id === currentQuestionId) {
            question = q;
            currentSection = section;
            sequence = totalQuestions;
            // Count questions in current section
            currentSectionTotalQuestions = section.questions.length;
            currentSectionQuestionCount =
              section.questions.findIndex((sq) => sq.id === q.id) + 1;
          }
        }
      }

      if (!question) {
        return {
          status: QuestionPollStatus.ERROR,
          errorMessage: 'Current question not found',
        };
      }

      const isFirstQuestion = sequence === 1;
      // Fix: isLastQuestion should be true only if this is the last question of the last section
      const isLastQuestion =
        currentSectionQuestionCount === currentSectionTotalQuestions &&
        currentSection.order === assessment.sections.length - 1;

      // CRITICAL: Clean question text to remove any instruction formatting from Gemini
      const cleanedQuestionText = this.cleanQuestionText(question.question);

      // Log if cleaning removed anything (indicates Gemini added instructions)
      if (cleanedQuestionText !== question.question) {
        logger.warn(
          '⚠️ [HTTP POLLING] Question text contained instruction formatting (cleaned)',
          {
            context: 'LiveKitHttpPollingService.getNextQuestion',
            assessmentId,
            questionId: question.id,
            originalLength: question.question.length,
            cleanedLength: cleanedQuestionText.length,
            originalPreview: question.question.substring(0, 200),
            cleanedPreview: cleanedQuestionText.substring(0, 200),
          }
        );
      }

      const response = {
        status: QuestionPollStatus.READY,
        questionId: question.id,
        question: cleanedQuestionText, // Use cleaned text
        questionType: question.questionType,
        sequence,
        isFirstQuestion,
        isLastQuestion,
        expectedResponseBy: new Date(Date.now() + 180000).toISOString(), // 3 min timeout
        sectionId: currentSection?.id,
        sectionTitle: currentSection?.title,
      };

      logger.info('✅ [HTTP POLLING] Returning question to agent', {
        context: 'LiveKitHttpPollingService.getNextQuestion',
        assessmentId,
        questionId: question.id,
        sequence,
        totalQuestions,
        isFirstQuestion,
        isLastQuestion,
        questionText: cleanedQuestionText, // Log cleaned text
        questionType: question.questionType,
        sectionId: currentSection?.id,
        sectionTitle: currentSection?.title,
        questionWasAnswered: question.isAnswered,
        questionOrder: question.order,
      });

      return response;
    } catch (error) {
      logger.error('❌ [HTTP POLLING] Failed to get next question', {
        context: 'LiveKitHttpPollingService.getNextQuestion',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        assessmentId,
      });

      return {
        status: QuestionPollStatus.ERROR,
        errorMessage: 'Internal server error',
      };
    }
  }

  /**
   * Agent posts answer here
   * POST /api/livekit/assessment/:assessmentId/answer
   *
   * Stores answer and triggers AI question generation
   */
  async submitAnswer(
    request: ISubmitAnswerRequest
  ): Promise<ISubmitAnswerResponse> {
    const { assessmentId, questionId, answer, transcript } = request;

    logger.info('📥 [HTTP POLLING] Received answer submission from agent', {
      context: 'LiveKitHttpPollingService.submitAnswer',
      assessmentId,
      questionId,
      answerLength: answer.length,
      hasTranscript: !!transcript,
      transcriptLength: transcript?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Prevent duplicate answer processing
    const lockKey = `${assessmentId}-${questionId}`;
    if (this.answerProcessingLocks.get(lockKey)) {
      logger.warn(
        '⚠️ [HTTP POLLING] Answer already being processed, skipping duplicate',
        {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          questionId,
        }
      );
      return {
        success: true,
        message: 'Answer already being processed',
        nextQuestionGenerating: true,
      };
    }

    this.answerProcessingLocks.set(lockKey, true);

    try {
      logger.info(
        '🔄 [HTTP POLLING] Processing answer - will trigger AI generation',
        {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          questionId,
          answerText: answer,
          answerLength: answer.length,
          hasTranscript: !!transcript,
          transcriptLength: transcript?.length || 0,
        }
      );

      // 0. VALIDATE ANSWER QUALITY (Safety net to prevent non-answers)
      logger.info('🔍 [HTTP POLLING] Validating answer quality', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        questionId,
        answerPreview: answer.substring(0, 100),
      });

      const validation = AnswerValidatorService.validateAnswer(answer);

      if (!validation.isValid) {
        logger.warn(
          '⚠️ [HTTP POLLING] Answer validation failed - rejecting non-answer',
          {
            context: 'LiveKitHttpPollingService.submitAnswer',
            assessmentId,
            questionId,
            intent: validation.intent,
            reason: validation.reason,
            shouldRetry: validation.shouldRetry,
            answerText: answer,
          }
        );

        return {
          success: false,
          message: `Answer rejected: ${validation.reason}`,
          nextQuestionGenerating: false,
          validationError: {
            intent: validation.intent,
            reason: validation.reason || '',
            shouldRetry: validation.shouldRetry || false,
          },
        };
      }

      logger.info(
        '✅ [HTTP POLLING] Answer validation passed - proceeding with submission',
        {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          questionId,
          intent: validation.intent,
        }
      );

      // 1. Verify question exists and is not already answered
      logger.info(
        '🔍 [HTTP POLLING] Fetching question and assessment details',
        {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          questionId,
          timestamp: new Date().toISOString(),
        }
      );

      const question =
        await this.prisma.onboarding_assessment_question.findUnique({
          where: { id: questionId },
          include: {
            section: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                },
                assessment: {
                  include: {
                    task: true,
                    onboardingAssessmentSettings: true,
                    sections: {
                      include: {
                        questions: {
                          orderBy: { order: 'asc' },
                        },
                      },
                      orderBy: { order: 'asc' },
                    },
                  },
                },
              },
            },
          },
        });

      logger.info(
        '📋 [HTTP POLLING] Question and assessment details retrieved',
        {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          questionId,
          questionExists: !!question,
          questionAlreadyAnswered: question?.isAnswered,
          assessmentStatus: question?.section?.assessment?.status,
          taskExists: !!question?.section?.assessment?.task,
          taskId: question?.section?.assessment?.task?.id,
          totalSections: question?.section?.assessment?.sections?.length,
          currentSectionId: question?.sectionId,
          currentSectionTitle: question?.section?.title,
          questionsInCurrentSection: question?.section?.questions?.length,
          maxQuestionsPerSection:
            question?.section?.assessment?.onboardingAssessmentSettings
              ?.maxQuestionsPerSection,
        }
      );

      if (!question) {
        throw new AppError('Question not found', 404, ErrorCode.NOT_FOUND);
      }

      if (question.isAnswered) {
        logger.warn('Question already answered', {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          questionId,
        });
        return {
          success: true,
          message: 'Question already answered',
          nextQuestionGenerating: false,
        };
      }

      // 2. Save the answer
      logger.info('💾 [HTTP POLLING] Saving answer to database', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        questionId,
        questionOrder: question.order,
      });

      await this.prisma.onboarding_assessment_question.update({
        where: { id: questionId },
        data: {
          answerGiven: answer,
          isAnswered: true,
        },
      });

      logger.info('✅ [HTTP POLLING] Answer saved to database', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        questionId,
        questionText: question.question,
        questionOrder: question.order,
        answerGiven: answer,
        answerLength: answer.length,
      });

      const assessment = question.section.assessment;
      const currentSection = question.section;

      // 3. Update section start/end times
      // ⚠️ CRITICAL: Count ANSWERED questions, not total questions in DB
      const answeredQuestionsInSection = currentSection.questions.filter(
        (q) => q.isAnswered
      ).length;
      const maxQuestionsPerSection =
        assessment.onboardingAssessmentSettings?.maxQuestionsPerSection || 5;

      logger.info('📊 Section progress tracking', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        sectionId: currentSection.id,
        sectionTitle: currentSection.title,
        answeredQuestions: answeredQuestionsInSection,
        maxQuestions: maxQuestionsPerSection,
        currentQuestionOrder: question.order,
        isFirstQuestion: answeredQuestionsInSection === 1,
        shouldCompleteSection:
          answeredQuestionsInSection >= maxQuestionsPerSection,
      });

      // Mark section as IN_PROGRESS when first question is answered
      if (answeredQuestionsInSection === 1) {
        await this.prisma.onboarding_assessment_section.update({
          where: { id: currentSection.id },
          data: {
            startedAt: new Date(),
            status: 'IN_PROGRESS',
          },
        });
        logger.info('✅ Section marked as IN_PROGRESS', {
          context: 'LiveKitHttpPollingService.submitAnswer',
          sectionId: currentSection.id,
          sectionTitle: currentSection.title,
        });
      }

      // ⚠️ CRITICAL: DO NOT mark section as COMPLETED here!
      // Section completion is handled AFTER next question generation (lines 841-879)
      // This ensures we know if there's a section transition before marking complete
      // Only mark COMPLETED in two cases:
      // 1. Section transition detected (next question is from different section)
      // 2. Assessment complete (no more questions in entire assessment)

      // 4. Check if this is the last question
      // ⚠️ CRITICAL: Use answered question count, not total DB count
      const isLastSection =
        currentSection.id ===
        assessment.sections[assessment.sections.length - 1].id;
      const isLastQuestionInSection =
        answeredQuestionsInSection >= maxQuestionsPerSection;

      logger.info('🔍 Assessment completion check', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        isLastSection,
        isLastQuestionInSection,
        answeredInSection: answeredQuestionsInSection,
        maxPerSection: maxQuestionsPerSection,
        currentSectionOrder: currentSection.order,
        totalSections: assessment.sections.length,
      });

      if (isLastSection && isLastQuestionInSection) {
        // Assessment complete
        logger.info(
          '🏁 [HTTP POLLING] Last question answered - completing assessment',
          {
            context: 'LiveKitHttpPollingService.submitAnswer',
            assessmentId,
            questionId,
            isLastSection,
            isLastQuestionInSection,
            totalSections: assessment.sections.length,
          }
        );

        if (assessment.task) {
          await this.onboardingAssessmentProvider.saveAnswer(
            assessment.task.id,
            {
              ...question,
              answerGiven: answer,
            } as any
          );
        }

        // ⚠️ CRITICAL: Mark the last section as COMPLETED before completing assessment
        try {
          await this.prisma.onboarding_assessment_section.update({
            where: { id: currentSection.id },
            data: {
              completedAt: new Date(),
              status: 'COMPLETED',
            },
          });

          logger.info('✅ [HTTP POLLING] Last section marked as COMPLETED', {
            context: 'LiveKitHttpPollingService.submitAnswer',
            assessmentId,
            sectionId: currentSection.id,
            sectionTitle: currentSection.title,
            answeredQuestions: answeredQuestionsInSection,
            maxQuestions: maxQuestionsPerSection,
          });
        } catch (sectionError) {
          logger.error(
            '❌ [HTTP POLLING] Failed to mark last section as completed',
            {
              context: 'LiveKitHttpPollingService.submitAnswer',
              assessmentId,
              sectionId: currentSection.id,
              error:
                sectionError instanceof Error
                  ? sectionError.message
                  : 'Unknown error',
              errorStack:
                sectionError instanceof Error ? sectionError.stack : undefined,
            }
          );
          // Don't throw - section status update failure shouldn't break the flow
        }

        await this.prisma.onboarding_assessment.update({
          where: { id: assessmentId },
          data: {
            status: 'CANDIDATE_ASSESSMENT_COMPLETED',
          },
        });

        if (assessment.task) {
          await this.prisma.onboarding_assessment_task.update({
            where: { id: assessment.task.id },
            data: {
              status: 'ASSESSMENT_COMPLETED',
            },
          });
        }

        await this.prisma.onboarding_assessment_progress.update({
          where: { assessmentId },
          data: {
            isCompleted: true,
            lastSavedAt: new Date(),
          },
        });

        return {
          success: true,
          message: 'Assessment completed',
          nextQuestionGenerating: false,
        };
      }

      // 5. Generate next question using AI provider
      if (!assessment.task) {
        throw new AppError(
          'Assessment task not found',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      // ⚠️ CRITICAL: Lock assessment to prevent race conditions during generation
      this.assessmentGenerationLocks.set(assessmentId, true);
      logger.info(
        '🔒 [HTTP POLLING] Locked assessment for question generation',
        {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          lockStatus: 'LOCKED',
        }
      );

      logger.info('🤖 [HTTP POLLING] Starting AI question generation', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        questionId,
        taskId: assessment.task.id,
        previousQuestionText: question.question,
        previousAnswerText: answer,
        previousQuestionOrder: question.order,
        previousQuestionType: question.questionType,
        sectionId: question.sectionId,
        sectionTitle: currentSection.title,
        assessmentStatus: assessment.status,
        totalSections: assessment.sections.length,
        currentSectionOrder: currentSection.order,
        questionsInCurrentSection: currentSection.questions.length,
        maxQuestionsPerSection:
          assessment.onboardingAssessmentSettings?.maxQuestionsPerSection,
      });

      const generationStartTime = Date.now();

      logger.info('🔄 [HTTP POLLING] Calling AI provider for next question', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        taskId: assessment.task.id,
        providerMethod: 'getNextQuestion',
        inputData: {
          taskId: assessment.task.id,
          previousQuestion: {
            id: question.id,
            text: question.question,
            type: question.questionType,
            order: question.order,
            sectionId: question.sectionId,
            answerGiven: answer,
            answerLength: answer.length,
          },
        },
      });

      const response = await this.onboardingAssessmentProvider.getNextQuestion(
        assessment.task.id,
        {
          ...question,
          answerGiven: answer,
        } as any
      );

      const generationDuration = Date.now() - generationStartTime;

      logger.info('⏱️ [HTTP POLLING] AI generation completed', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        taskId: assessment.task.id,
        generationDurationMs: generationDuration,
        generationDurationSeconds: (generationDuration / 1000).toFixed(2),
        responseReceived: !!response,
        hasNextQuestion: !!response?.nextQuestion,
        shouldEndAssessment: response?.shouldEndAssessment,
        responseKeys: response ? Object.keys(response) : [],
      });

      const nextQuestion = response.nextQuestion;

      logger.info('🔍 [HTTP POLLING] Validating AI provider response', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        taskId: assessment.task.id,
        responseExists: !!response,
        nextQuestionExists: !!nextQuestion,
        responseStructure: response
          ? {
              hasNextQuestion: 'nextQuestion' in response,
              hasShouldEndAssessment: 'shouldEndAssessment' in response,
              responseType: typeof response,
            }
          : null,
      });

      if (!nextQuestion) {
        logger.error('❌ [HTTP POLLING] AI provider returned no question', {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          taskId: assessment.task.id,
          responseReceived: !!response,
          shouldEndAssessment: response?.shouldEndAssessment,
          responseType: typeof response,
          responseKeys: response ? Object.keys(response) : [],
          fullResponse: response,
        });

        throw new AppError(
          'No next question generated',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      logger.info('✅ [HTTP POLLING] AI provider generated next question', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        taskId: assessment.task.id,
        nextQuestionId: nextQuestion.id,
        nextQuestionText: nextQuestion.question,
        nextQuestionType: nextQuestion.questionType,
        nextQuestionSectionId: nextQuestion.sectionId,
        nextQuestionSectionTitle: assessment.sections.find(
          (s) => s.id === nextQuestion.sectionId
        )?.title,
        nextQuestionOrder: nextQuestion.order,
        isLastQuestion: nextQuestion.isLastQuestion,
        shouldEndAssessment: response.shouldEndAssessment,
        generationDurationMs: generationDuration,
        sectionChanged: nextQuestion.sectionId !== question.sectionId,
        nextQuestionProperties: {
          hasId: 'id' in nextQuestion,
          hasQuestion: 'question' in nextQuestion,
          hasQuestionType: 'questionType' in nextQuestion,
          hasSectionId: 'sectionId' in nextQuestion,
          hasOrder: 'order' in nextQuestion,
          hasOptions: 'options' in nextQuestion,
          hasCorrectAnswer: 'correctAnswer' in nextQuestion,
          hasMaxScore: 'maxScore' in nextQuestion,
          hasIsLastQuestion: 'isLastQuestion' in nextQuestion,
        },
        nextQuestionData: {
          id: nextQuestion.id,
          question:
            nextQuestion.question?.substring(0, 100) +
            (nextQuestion.question?.length > 100 ? '...' : ''),
          questionType: nextQuestion.questionType,
          sectionId: nextQuestion.sectionId,
          order: nextQuestion.order,
          options: nextQuestion.options,
          correctAnswer: nextQuestion.correctAnswer,
          maxScore: nextQuestion.maxScore,
          isLastQuestion: nextQuestion.isLastQuestion,
        },
      });

      // 6. Save next question to database
      logger.info('💾 [HTTP POLLING] Saving generated question to database', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        nextQuestionId: nextQuestion.id,
        nextQuestionOrder: nextQuestion.order,
        nextQuestionSectionId: nextQuestion.sectionId,
        questionDataToSave: {
          id: nextQuestion.id,
          sectionId: nextQuestion.sectionId,
          question:
            nextQuestion.question?.substring(0, 100) +
            (nextQuestion.question?.length > 100 ? '...' : ''),
          questionType: nextQuestion.questionType,
          options: nextQuestion.options,
          correctAnswer: nextQuestion.correctAnswer,
          maxScore: nextQuestion.maxScore,
          isLastQuestion: nextQuestion.isLastQuestion,
          order: nextQuestion.order,
        },
        sectionExists: assessment.sections.some(
          (s) => s.id === nextQuestion.sectionId
        ),
        targetSection: assessment.sections.find(
          (s) => s.id === nextQuestion.sectionId
        )?.title,
      });

      try {
        await this.prisma.onboarding_assessment_question.create({
          data: {
            id: nextQuestion.id,
            sectionId: nextQuestion.sectionId,
            question: nextQuestion.question,
            questionType: nextQuestion.questionType,
            options: nextQuestion.options,
            correctAnswer: nextQuestion.correctAnswer,
            maxScore: nextQuestion.maxScore,
            isLastQuestion: nextQuestion.isLastQuestion,
            order: nextQuestion.order,
          },
        });

        logger.info(
          '✅ [HTTP POLLING] Question saved to database successfully',
          {
            context: 'LiveKitHttpPollingService.submitAnswer',
            assessmentId,
            nextQuestionId: nextQuestion.id,
            nextQuestionOrder: nextQuestion.order,
            nextQuestionSectionId: nextQuestion.sectionId,
            questionText: nextQuestion.question?.substring(0, 50) + '...',
            questionType: nextQuestion.questionType,
          }
        );

        // ⚠️ CRITICAL: Handle section transitions
        // If the next question is from a different section, mark previous section as COMPLETED
        // (New section will be marked as IN_PROGRESS when its first question is answered)
        const sectionChanged = nextQuestion.sectionId !== question.sectionId;

        if (sectionChanged) {
          logger.info('🔄 [HTTP POLLING] Section transition detected', {
            context: 'LiveKitHttpPollingService.submitAnswer',
            assessmentId,
            previousSectionId: question.sectionId,
            previousSectionTitle: currentSection.title,
            nextSectionId: nextQuestion.sectionId,
            nextSectionTitle: assessment.sections.find(
              (s) => s.id === nextQuestion.sectionId
            )?.title,
          });

          // Mark previous section as COMPLETED (it MUST be complete if we're moving to next section)
          // This ensures section is marked COMPLETED even if the last question was skipped/irrelevant
          await this.prisma.onboarding_assessment_section.update({
            where: { id: question.sectionId },
            data: {
              completedAt: new Date(),
              status: 'COMPLETED',
            },
          });

          logger.info(
            '✅ [HTTP POLLING] Previous section marked as COMPLETED',
            {
              context: 'LiveKitHttpPollingService.submitAnswer',
              previousSectionId: question.sectionId,
              previousSectionTitle: currentSection.title,
            }
          );

          // Note: New section will be marked as IN_PROGRESS when its first question is answered
          // (See lines 517-531 which handle first question of any section)
        }

        // ⚠️ DO NOT UNLOCK YET - must update progress state first!
      } catch (dbError) {
        // ⚠️ CRITICAL: Unlock assessment even on error
        this.assessmentGenerationLocks.delete(assessmentId);
        logger.error(
          '❌ [HTTP POLLING] Failed to save question - unlocked assessment',
          {
            context: 'LiveKitHttpPollingService.submitAnswer',
            assessmentId,
            nextQuestionId: nextQuestion.id,
            lockStatus: 'UNLOCKED_ON_ERROR',
            error:
              dbError instanceof Error
                ? dbError.message
                : 'Unknown database error',
            errorStack: dbError instanceof Error ? dbError.stack : undefined,
            questionData: {
              id: nextQuestion.id,
              sectionId: nextQuestion.sectionId,
              question: nextQuestion.question,
              questionType: nextQuestion.questionType,
              order: nextQuestion.order,
            },
          }
        );
        throw dbError;
      }

      // 7. Update progress state
      logger.info('📊 [HTTP POLLING] Updating progress state', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        currentQuestionId: nextQuestion.id,
        currentSectionId: nextQuestion.sectionId,
        previousQuestionId: questionId,
        previousSectionId: question.sectionId,
        sectionChanged: nextQuestion.sectionId !== question.sectionId,
        progressUpdateData: {
          currentSectionId: nextQuestion.sectionId,
          currentQuestionId: nextQuestion.id,
          lastSavedAt: new Date().toISOString(),
          isCompleted: false,
        },
      });

      try {
        await this.prisma.onboarding_assessment_progress.update({
          where: { assessmentId },
          data: {
            currentSectionId: nextQuestion.sectionId,
            currentQuestionId: nextQuestion.id,
            lastSavedAt: new Date(),
            isCompleted: false,
          },
        });

        logger.info('✅ [HTTP POLLING] Progress state updated successfully', {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          newCurrentQuestionId: nextQuestion.id,
          newCurrentSectionId: nextQuestion.sectionId,
          previousQuestionId: questionId,
          previousSectionId: question.sectionId,
          sectionChanged: nextQuestion.sectionId !== question.sectionId,
        });

        // ⚠️ CRITICAL: NOW unlock assessment after BOTH question save AND progress update
        // This prevents race condition where agent polls and gets old question before progress updates
        this.assessmentGenerationLocks.delete(assessmentId);
        logger.info(
          '🔓 [HTTP POLLING] Unlocked assessment after question generation AND progress update',
          {
            context: 'LiveKitHttpPollingService.submitAnswer',
            assessmentId,
            lockStatus: 'UNLOCKED',
            questionReady: nextQuestion.id,
            progressUpdated: true,
          }
        );
      } catch (progressError) {
        // ⚠️ CRITICAL: Unlock assessment even on progress update error
        this.assessmentGenerationLocks.delete(assessmentId);
        logger.error(
          '❌ [HTTP POLLING] Failed to update progress - unlocked assessment',
          {
            context: 'LiveKitHttpPollingService.submitAnswer',
            assessmentId,
            lockStatus: 'UNLOCKED_ON_PROGRESS_ERROR',
            error:
              progressError instanceof Error
                ? progressError.message
                : 'Unknown progress error',
            errorStack:
              progressError instanceof Error ? progressError.stack : undefined,
            progressData: {
              currentSectionId: nextQuestion.sectionId,
              currentQuestionId: nextQuestion.id,
              isCompleted: false,
            },
          }
        );
        throw progressError;
      }

      logger.info(
        '🎉 [HTTP POLLING] Answer submitted and next question saved successfully',
        {
          context: 'LiveKitHttpPollingService.submitAnswer',
          assessmentId,
          previousQuestionId: questionId,
          previousQuestionText: question.question,
          previousQuestionOrder: question.order,
          answerReceived: answer,
          answerLength: answer.length,
          nextQuestionId: nextQuestion.id,
          nextQuestionText: nextQuestion.question,
          nextQuestionOrder: nextQuestion.order,
          nextQuestionSectionId: nextQuestion.sectionId,
          shouldEndAssessment: response.shouldEndAssessment,
          sectionChanged: nextQuestion.sectionId !== question.sectionId,
          totalProcessingTime: Date.now() - generationStartTime,
          processingTimeSeconds: (
            (Date.now() - generationStartTime) /
            1000
          ).toFixed(2),
        }
      );

      const responseMessage = response.shouldEndAssessment
        ? 'Assessment will end after this question'
        : 'Answer saved, next question generated via AI';

      logger.info('📤 [HTTP POLLING] Returning success response to agent', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        responseMessage,
        nextQuestionGenerating: false,
        shouldEndAssessment: response.shouldEndAssessment,
      });

      return {
        success: true,
        message: responseMessage,
        nextQuestionGenerating: false,
      };
    } catch (error) {
      logger.error('❌ [HTTP POLLING] Failed to submit answer', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        assessmentId,
        questionId,
        answerLength: answer?.length || 0,
      });

      throw error;
    } finally {
      // Release locks
      logger.info('🔓 [HTTP POLLING] Releasing processing locks', {
        context: 'LiveKitHttpPollingService.submitAnswer',
        assessmentId,
        questionId,
        answerLockReleased: this.answerProcessingLocks.has(lockKey),
        generationLockReleased:
          this.assessmentGenerationLocks.has(assessmentId),
      });
      this.answerProcessingLocks.delete(lockKey);
      // ⚠️ CRITICAL: Always release generation lock in finally block
      this.assessmentGenerationLocks.delete(assessmentId);
    }
  }
}
