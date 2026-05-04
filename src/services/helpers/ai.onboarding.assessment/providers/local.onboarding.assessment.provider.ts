import { singleton } from '@/shared/decorators/singleton';
import { IOnboardingAssessmentProvider } from '../onboarding.assessment.provider';
import { IAiOnboardingAssessmentTask } from '../onboarding.assessment.provider';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import {
  ICandidateOnboardingAssessment,
  ICandidateOnboardingAssessmentAnswerSubmitted,
} from '@/shared/models/domain/candidate/onboarding.assessment.domain';
import {
  OnboardingAssessmentTaskStatusEnum,
  OnboardingAssessmentSectionStatusEnum,
  OnboardingAssessmentSectionResultEnum,
  OnboardingAssessmentStatusEnum,
  OnboardingAssessmentResultEnum,
  OnboardingAssessmentRecommendationEnum,
  QuestionTypeEnum,
} from '@/shared/models/common/enums';
import {
  ICandidateOnboardingAssessmentQuestion,
  ICandidateOnboardingAssessmentSection,
} from '@/shared/models/domain/candidate/onboarding.assessment.domain';

@singleton
export class LocalOnboardingAssessmentProvider
  implements IOnboardingAssessmentProvider
{
  private tasks: Map<string, IAiOnboardingAssessmentTask>;

  constructor() {
    this.tasks = new Map();
  }

  /**
   * Initiates the onboarding assessment initialize job
   * @param taskId The identifier of the onboarding assessment initialize task
   * @param assessment The onboarding assessment
   * @returns A promise that resolves to the onboarding assessment initialize task identifier
   */
  async initializeAssessment(
    taskId: string,
    assessment: ICandidateOnboardingAssessment
  ): Promise<IAiOnboardingAssessmentTask> {
    logger.info({
      message: 'Initializing assessment',
      context: 'LocalOnboardingAssessmentProvider.initializeAssessment',
      taskId,
    });
    // check if task for the taskId exists and if it is not failed or completed
    const existingTask = this.tasks.get(taskId);
    const task = existingTask
      ? existingTask
      : {
          id: uuidv4(),
          taskId,
          status: OnboardingAssessmentTaskStatusEnum.INITIALIZE_STARTED,
          assessment: assessment,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    // update the task with the new values
    task.assessment = assessment;
    task.updatedAt = new Date();

    this.tasks.set(taskId, task);

    // Start processing
    await this.processInitializeTask(taskId);

    return task;
  }

  /**
   * Does the onboarding assessment
   * @param taskId The identifier of the onboarding assessment task
   * @returns A promise that resolves to the onboarding assessment task identifier
   */
  async doAssessment(taskId: string): Promise<IAiOnboardingAssessmentTask> {
    logger.info({
      message: 'Doing assessment',
      context: 'LocalOnboardingAssessmentProvider.doAssessment',
      taskId,
    });
    // check if task for the taskId exists and if it is not failed or completed
    const existingTask = this.tasks.get(taskId);

    if (!existingTask) {
      throw new AppError(
        `Assessment task not found with id ${taskId}`,
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
      );
    }

    // update the task with the new values
    existingTask.updatedAt = new Date();
    this.tasks.set(taskId, existingTask);

    // Start processing in the background
    this.processAssessmentTask(taskId).catch((error) => {
      logger.error('Failed to process onboarding assessment assessment task', {
        context: 'LocalOnboardingAssessmentProvider.doAssessment',
        error: error instanceof Error ? error.message : 'Unknown error',
        taskId,
      });
    });

    return existingTask;
  }

  /**
   * Process the onboarding assessment video analysis
   * @param taskId The identifier of the onboarding assessment task
   * @returns A promise that resolves to the onboarding assessment task identifier
   */
  async doAssessmentVideoAnalysis(
    taskId: string
  ): Promise<IAiOnboardingAssessmentTask> {
    logger.info({
      message: 'Processing onboarding assessment video analysis',
      context:
        'LocalOnboardingAssessmentProvider.processAssessmentVideoAnalysis',
      taskId,
    });

    // check if task for the taskId exists and if it is not failed or completed
    const existingTask = this.tasks.get(taskId);
    if (!existingTask) {
      throw new AppError(
        `Assessment task not found with id ${taskId}`,
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_FOUND
      );
    }

    // Start processing
    existingTask.status = OnboardingAssessmentTaskStatusEnum.COMPLETED;
    existingTask.updatedAt = new Date();
    this.tasks.set(taskId, existingTask);

    return existingTask;
  }

  /**
   * Gets the status of a parsing task
   * @param taskId The identifier of the parsing task
   * @returns A promise that resolves to the parsing task status
   */
  async getOnboardingAssessmentTask(
    taskId: string
  ): Promise<IAiOnboardingAssessmentTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new AppError(
        `Assessment task not found with id ${taskId}`,
        404,
        ErrorCode.RESUME_ASSESSMENT_TASK_NOT_FOUND
      );
    }
    return task;
  }

  /**
   * Process the onboarding assessment initialize task
   * @param taskId The identifier of the onboarding assessment initialize task

   */
  private async processInitializeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(
        `Onboarding assessment initialize task not found with id ${taskId}`
      );
    }
    logger.info('Processing onboarding assessment initialize task', {
      context: 'LocalOnboardingAssessmentProvider.processTask',
      taskId: task.taskId,
    });
    try {
      // Update task status to processing
      task.status = OnboardingAssessmentTaskStatusEnum.INITIALIZE_STARTED;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      // Get the assessment settings
      const settings = task.assessment.onboardingAssessmentSettings;
      if (!settings) {
        throw new Error('Assessment settings not found');
      }

      // Generate sections based on required sections in settings
      const sections = settings.requiredSections.map((sectionType, index) => {
        return {
          id: uuidv4(),
          assessmentId: task.assessment.id,
          title: `${sectionType} Assessment`,
          description: `This section evaluates your ${sectionType.toLowerCase()} skills and knowledge.`,
          type: sectionType,
          status: OnboardingAssessmentSectionStatusEnum.NOT_STARTED,
          result: OnboardingAssessmentSectionResultEnum.NOT_AVAILABLE,
          score: 0,
          order: index,
          isRequired: true,
          passThreshold: settings.defaultPassingScore,
          strengths: [],
          areasForImprovement: [],
          questions: [], // Questions will be generated during assessment
        };
      });

      // Update the assessment with generated sections
      task.assessment.sections = sections;
      task.assessment.status =
        OnboardingAssessmentStatusEnum.AI_INITIALIZATION_COMPLETED;
      task.assessment.updatedAt = new Date();

      // Update task status to completed
      task.status = OnboardingAssessmentTaskStatusEnum.INITIALIZE_COMPLETED;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);
    } catch (error) {
      // Update task status to failed
      task.status = OnboardingAssessmentTaskStatusEnum.COMPLETED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      throw error;
    }
  }

  private async processAssessmentTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(
        `Onboarding assessment assessment task not found with id ${taskId}`
      );
    }
    logger.info('Processing onboarding assessment assessment task', {
      context: 'LocalOnboardingAssessmentProvider.processAssessmentTask',
      taskId: task.taskId,
    });
    try {
      // Update task status to processing
      task.status = OnboardingAssessmentTaskStatusEnum.ASSESSMENT_STARTED;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);

      // Simulate assessment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // --- Begin assessment logic ---
      const assessment = task.assessment;
      let totalScore = 0;
      let totalMaxScore = 0;
      const sectionStrengths: string[] = [];
      const sectionImprovements: string[] = [];

      for (const section of assessment.sections) {
        let sectionScore = 0;
        let sectionMaxScore = 0;
        const questionStrengths: string[] = [];
        const questionImprovements: string[] = [];

        // Generate scores for questions
        for (const question of section.questions) {
          // For demo: random score, real impl would use actual answers
          question.score =
            question.answerGiven === question.correctAnswer
              ? question.maxScore
              : Math.floor(question.maxScore / 2);
          sectionScore += question.score;
          sectionMaxScore += question.maxScore;

          // Feedback
          if (question.score === question.maxScore) {
            question.feedback = 'Excellent answer.';
            questionStrengths.push(`Strong on: ${question.question}`);
          } else {
            question.feedback = 'Needs improvement.';
            questionImprovements.push(`Improve: ${question.question}`);
          }
        }

        // Section-level calculations
        section.score =
          sectionMaxScore > 0 ? sectionScore / sectionMaxScore : 0;
        section.strengths = questionStrengths;
        section.areasForImprovement = questionImprovements;
        section.status = OnboardingAssessmentSectionStatusEnum.COMPLETED;
        section.completedAt = new Date();
        section.feedback =
          section.score >= section.passThreshold
            ? 'Section passed.'
            : 'Section failed.';
        section.result =
          section.score >= section.passThreshold
            ? OnboardingAssessmentSectionResultEnum.PASSED
            : OnboardingAssessmentSectionResultEnum.FAILED_AI_REVIEW;
        totalScore += sectionScore;
        totalMaxScore += sectionMaxScore;
        sectionStrengths.push(...questionStrengths);
        sectionImprovements.push(...questionImprovements);
      }

      // Assessment-level calculations
      assessment.score = totalMaxScore > 0 ? totalScore / totalMaxScore : 0;
      assessment.strengths = sectionStrengths;
      assessment.areasForImprovement = sectionImprovements;
      assessment.status = OnboardingAssessmentStatusEnum.ASSESSMENT_COMPLETED;
      assessment.completedAt = new Date();
      assessment.result =
        assessment.score >=
        (assessment.onboardingAssessmentSettings?.defaultPassingScore ?? 0.7)
          ? OnboardingAssessmentResultEnum.PASSED
          : OnboardingAssessmentResultEnum.AI_REVIEW_FAILED;
      assessment.overallFeedback =
        assessment.result === OnboardingAssessmentResultEnum.PASSED
          ? 'Great job! You have passed the onboarding assessment.'
          : 'You did not pass. Please review the feedback and try again.';
      // Recommendation logic
      if (assessment.score >= 0.9) {
        assessment.recommendation =
          OnboardingAssessmentRecommendationEnum.HIGHLY_RECOMMENDED;
      } else if (assessment.score >= 0.7) {
        assessment.recommendation =
          OnboardingAssessmentRecommendationEnum.RECOMMENDED;
      } else {
        assessment.recommendation =
          OnboardingAssessmentRecommendationEnum.NOT_RECOMMENDED;
      }
      assessment.selectedForNextRound =
        assessment.result === OnboardingAssessmentResultEnum.PASSED;
      assessment.updatedAt = new Date();

      // --- End assessment logic ---

      // Update task status to completed
      task.status = OnboardingAssessmentTaskStatusEnum.ASSESSMENT_COMPLETED;
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);
    } catch (error) {
      // Update task status to failed
      task.status = OnboardingAssessmentTaskStatusEnum.ASSESSMENT_COMPLETED;
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      this.tasks.set(taskId, task);
      throw error;
    }
  }

  /**
   * Gets the next question for the onboarding assessment
   * @param taskId The identifier of the onboarding assessment task
   * @returns A promise that resolves to the next question for the onboarding assessment
   */
  async getNextQuestion(
    taskId: string,
    previousQuestionWithAnswer?: ICandidateOnboardingAssessmentQuestion
  ): Promise<ICandidateOnboardingAssessmentAnswerSubmitted> {
    const task = await this.getOnboardingAssessmentTask(taskId);
    const assessment = task.assessment;

    // Find the current section and question based on progress state
    const progressState = assessment.progressState;
    if (!progressState) {
      throw new AppError(
        'Assessment progress state not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_PROGRESS_NOT_FOUND
      );
    }

    // If this is the first question (no previousQuestionWithAnswer), return the first question of the first section
    if (!previousQuestionWithAnswer) {
      const firstSection = assessment.sections.find(
        (section) => section.order === 0
      );
      if (!firstSection) {
        throw new AppError(
          'No sections found in assessment',
          404,
          ErrorCode.ONBOARDING_ASSESSMENT_SECTION_NOT_FOUND
        );
      }

      // Generate first question for the section
      const { nextQuestion: firstQuestion, shouldEndAssessment } =
        this.generateQuestion(firstSection);
      firstSection.questions.push(firstQuestion);

      // Update progress state
      progressState.currentSectionId = firstSection.id;
      progressState.currentQuestionId = firstQuestion.id;
      progressState.lastSavedAt = new Date();
      progressState.isCompleted = false;

      return {
        nextQuestion: firstQuestion,
        shouldEndAssessment,
      };
    }

    // For follow-up questions, find the current section and question
    const currentSection = assessment.sections.find(
      (section) => section.id === progressState.currentSectionId
    );
    if (!currentSection) {
      throw new AppError(
        'Current section not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_SECTION_NOT_FOUND
      );
    }

    const maxQuestionsPerSection =
      assessment.onboardingAssessmentSettings?.maxQuestionsPerSection || 5;

    logger.info({
      message: 'Analyzing section navigation (local provider)',
      context: 'LocalOnboardingAssessmentProvider.getNextQuestion',
      taskId,
      currentSectionId: currentSection.id,
      currentSectionOrder: currentSection.order,
      currentQuestionCount: currentSection.questions.length,
      maxQuestionsPerSection,
      totalSections: assessment.sections.length,
      previousQuestionIsLastQuestion:
        previousQuestionWithAnswer?.isLastQuestion,
    });

    // ✅ FIX: Check if current section has reached question limit OR previous question was marked as last
    if (
      currentSection.questions.length >= maxQuestionsPerSection ||
      previousQuestionWithAnswer?.isLastQuestion === true
    ) {
      // Find the next section
      const currentSectionIndex = assessment.sections.findIndex(
        (section) => section.id === currentSection.id
      );

      if (currentSectionIndex < assessment.sections.length - 1) {
        const nextSection = assessment.sections[currentSectionIndex + 1];

        logger.info({
          message: '🎯 Section completed, moving to next section (local)',
          context: 'LocalOnboardingAssessmentProvider.getNextQuestion',
          taskId,
          completedSectionOrder: currentSection.order,
          nextSectionOrder: nextSection.order,
          nextSectionTitle: nextSection.title,
        });

        const { nextQuestion, shouldEndAssessment } =
          this.generateQuestion(nextSection);
        nextSection.questions.push(nextQuestion);

        // Update progress state for next section
        progressState.currentSectionId = nextSection.id;
        progressState.currentQuestionId = nextQuestion.id;
        progressState.lastSavedAt = new Date();
        return {
          nextQuestion,
          shouldEndAssessment,
        };
      }

      // If we're at the last section, mark assessment as completed
      logger.info({
        message: '🏁 Assessment completed - all sections finished (local)',
        context: 'LocalOnboardingAssessmentProvider.getNextQuestion',
        taskId,
        totalSections: assessment.sections.length,
      });

      progressState.isCompleted = true;
      progressState.lastSavedAt = new Date();
      throw new AppError(
        'Assessment completed - no more questions',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_TASK_NOT_COMPLETED
      );
    }

    // Generate next question for current section
    logger.info({
      message: 'Generating next question in current section (local)',
      context: 'LocalOnboardingAssessmentProvider.getNextQuestion',
      taskId,
      sectionId: currentSection.id,
      questionNumber: currentSection.questions.length + 1,
    });

    const { nextQuestion, shouldEndAssessment } =
      this.generateQuestion(currentSection);
    currentSection.questions.push(nextQuestion);

    // Update progress state
    progressState.currentQuestionId = nextQuestion.id;
    progressState.lastSavedAt = new Date();

    return {
      nextQuestion,
      shouldEndAssessment,
    };
  }

  /**
   * Generates a random question for a given section
   * @param section The section to generate the question for
   * @returns A new question
   */
  private generateQuestion(
    section: ICandidateOnboardingAssessmentSection
  ): ICandidateOnboardingAssessmentAnswerSubmitted {
    const questionTypes = ['MULTIPLE_CHOICE', 'TEXT', 'CODE'];
    const questionType = questionTypes[
      Math.floor(Math.random() * questionTypes.length)
    ] as QuestionTypeEnum;

    // Generate question based on section type
    let questionText = '';
    let options = undefined;
    let correctAnswer = undefined;

    switch (section.type.toLowerCase()) {
      case 'technical':
        questionText = this.generateTechnicalQuestion(questionType);
        if (questionType === 'MULTIPLE_CHOICE') {
          const result = this.generateMultipleChoiceOptions(questionText);
          options = result.options;
          correctAnswer = result.correctAnswer;
        }
        break;
      case 'behavioral':
        questionText = this.generateBehavioralQuestion(questionType);
        break;
      case 'problem-solving':
        questionText = this.generateProblemSolvingQuestion(questionType);
        if (questionType === 'MULTIPLE_CHOICE') {
          const result = this.generateMultipleChoiceOptions(questionText);
          options = result.options;
          correctAnswer = result.correctAnswer;
        }
        break;
      default:
        questionText = `General question about ${section.type}`;
    }

    const maxQuestionsPerSection = 5; // Default for local provider

    return {
      nextQuestion: {
        id: uuidv4(),
        sectionId: section.id,
        question: questionText,
        questionType,
        options,
        correctAnswer,
        score: 0,
        maxScore: 1.0,
        order: section.questions.length,
        isRequired: true,
        isLastQuestion: section.questions.length === maxQuestionsPerSection - 1,
        isAnswered: false,
      },
      shouldEndAssessment: false,
    };
  }

  /**
   * Generates a technical question
   */
  private generateTechnicalQuestion(_questionType: QuestionTypeEnum): string {
    const questions = [
      'Explain the concept of RESTful APIs.',
      'What is the difference between let, const, and var in JavaScript?',
      'How does garbage collection work in Node.js?',
      'Explain the concept of dependency injection.',
      'What are design patterns and give an example?',
      'How does authentication work in web applications?',
      'Explain the concept of microservices architecture.',
      'What is the difference between SQL and NoSQL databases?',
      'How does caching improve application performance?',
      'Explain the concept of CI/CD pipelines.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Generates a behavioral question
   */
  private generateBehavioralQuestion(_questionType: QuestionTypeEnum): string {
    const questions = [
      'Describe a situation where you had to work under pressure.',
      'How do you handle conflicts in a team?',
      'Tell me about a time when you had to make a difficult decision.',
      'How do you prioritize your work when you have multiple deadlines?',
      'Describe a situation where you had to adapt to change quickly.',
      'How do you handle feedback from your team members?',
      'Tell me about a time when you had to lead a team.',
      'How do you ensure effective communication in a remote team?',
      'Describe a situation where you had to solve a complex problem.',
      'How do you maintain work-life balance?',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Generates a problem-solving question
   */
  private generateProblemSolvingQuestion(
    _questionType: QuestionTypeEnum
  ): string {
    const questions = [
      'How would you optimize a slow-performing database query?',
      'Design a system to handle high concurrent users.',
      'How would you implement a rate limiter?',
      'Design a caching strategy for a web application.',
      'How would you handle data consistency in a distributed system?',
      'Design a scalable notification system.',
      'How would you implement real-time updates in a web application?',
      'Design a system to handle file uploads efficiently.',
      'How would you implement a search feature with filters?',
      'Design a system to handle user authentication and authorization.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Generates multiple choice options for a question
   */
  private generateMultipleChoiceOptions(_question: string): {
    options: any;
    correctAnswer: string;
  } {
    // For demo purposes, generate simple options
    const options = {
      A: 'Option A',
      B: 'Option B',
      C: 'Option C',
      D: 'Option D',
    };
    const correctAnswer = 'A'; // For demo, always make A the correct answer
    return { options, correctAnswer };
  }

  /**
   * Saves the answer for the onboarding assessment question
   * @param taskId The identifier of the onboarding assessment task
   * @param question The question to save the answer for
   */
  async saveAnswer(
    taskId: string,
    question: ICandidateOnboardingAssessmentQuestion
  ): Promise<ICandidateOnboardingAssessmentQuestion> {
    const task = await this.getOnboardingAssessmentTask(taskId);
    const assessment = task.assessment;

    // Find the section containing the question
    const section = assessment.sections.find(
      (section) => section.id === question.sectionId
    );
    if (!section) {
      throw new AppError(
        'Section not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_SECTION_NOT_FOUND
      );
    }

    // Find and update the question
    const questionIndex = section.questions.findIndex(
      (q) => q.id === question.id
    );
    if (questionIndex === -1) {
      throw new AppError(
        'Question not found',
        404,
        ErrorCode.ONBOARDING_ASSESSMENT_QUESTION_NOT_FOUND
      );
    }

    section.questions[questionIndex] = question;
    assessment.updatedAt = new Date();

    return question;
  }
}
