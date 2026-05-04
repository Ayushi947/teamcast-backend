import { logger } from '@/shared/utils/logger';
import { singleton } from '@/shared/decorators/singleton';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { ENV } from '@/config/env';
import {
  IDemoProfile,
  IDemoAssessment,
  IDemoQuestion,
  IDemoAnswer,
  IDemoResults,
  IDemoVideoAnalysis,
} from '@/shared/models/domain/demo/demo.domain';
import {
  IDemoAssessmentStartRequest,
  IDemoAnswerSubmitRequest,
  IDemoVideoAnalysisRequest,
} from '@/shared/models/api/demo/demo.api';
import { StorageFactory } from '@/services/helpers/storage/storage.factory';
import { GcpVertexOnboardingAssessmentProvider } from '@/services/helpers/ai.onboarding.assessment/providers/gpc.vertex.onboarding.assessment.provider';
// import { generateHighlightsVideo } from '@/utils/video.helper';

@singleton
export class DemoService {
  private readonly storageProvider: any;
  private readonly gcpVertexProvider: GcpVertexOnboardingAssessmentProvider;
  private redis: Redis | null = null;
  private useRedisCache: boolean;
  private readonly sessionCacheTTL = 3600 * 24; // 24 hours in seconds

  // In-memory storage for demo sessions (fallback when Redis is not available)
  private demoSessions = new Map<string, IDemoAssessment>();
  private demoProfiles: IDemoProfile[] = [];

  constructor() {
    try {
      logger.info({
        message: 'DemoService constructor started',
        context: 'DemoService.constructor',
      });

      this.useRedisCache = ENV.USE_REDIS_CACHE;

      // Initialize Redis if enabled
      if (this.useRedisCache) {
        try {
          this.redis = new Redis({
            host: ENV.REDIS_HOST,
            port: ENV.REDIS_PORT,
            password: ENV.REDIS_PASSWORD,
            username: ENV.REDIS_USER,
            keyPrefix: `${ENV.ENV_NAME}:demo_sessions:`,
            connectTimeout: 5000,
            retryStrategy: (times: number) => {
              const delay = Math.min(times * 100, 3000);
              return delay;
            },
          });

          this.redis.on('error', (err: Error) => {
            logger.error('Redis error in DemoService', {
              error: err.message,
              context: 'DemoService.redis',
            });
          });

          logger.info('Redis cache initialized for demo sessions', {
            context: 'DemoService.constructor',
          });
        } catch (error) {
          logger.error('Failed to initialize Redis for demo sessions', {
            error: error instanceof Error ? error.message : 'Unknown error',
            context: 'DemoService.constructor',
          });
          this.redis = null;
        }
      } else {
        logger.info('Redis cache disabled for demo sessions', {
          context: 'DemoService.constructor',
        });
      }

      // Initialize storage provider
      this.storageProvider = StorageFactory.getInstance().getProvider();
      logger.info({
        message: 'Storage provider initialized',
        context: 'DemoService.constructor',
      });

      // Initialize GCP Vertex AI provider for natural conversation
      this.gcpVertexProvider = new GcpVertexOnboardingAssessmentProvider();
      logger.info({
        message: 'GCP Vertex AI provider initialized',
        context: 'DemoService.constructor',
      });

      this.initializeDemoProfiles();
      logger.info({
        message: 'DemoService constructor completed successfully',
        context: 'DemoService.constructor',
      });
    } catch (error) {
      logger.error({
        message: 'DemoService constructor failed',
        context: 'DemoService.constructor',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Initialize hardcoded demo profiles
   */
  private initializeDemoProfiles(): void {
    this.demoProfiles = [
      // Technical Profiles
      {
        id: 'senior-software-engineer',
        title: 'Senior Software Engineer',
        category: 'technical',
        experienceLevel: '5+ years',
        description: 'Full-stack development with focus on scalable systems',
        skills: [
          'React',
          'Node.js',
          'AWS',
          'System Design',
          'TypeScript',
          'Docker',
        ],
        industries: ['Technology', 'Fintech', 'E-commerce'],
        questions: [
          {
            id: 'intro-1',
            type: 'video',
            question:
              'Tell me about yourself and your experience with full-stack development.',
            duration: 90,
            expectedSkills: ['Communication', 'Technical Background'],
          },
          {
            id: 'tech-1',
            type: 'video',
            question:
              'How would you design a scalable microservices architecture for a high-traffic e-commerce platform?',
            duration: 120,
            expectedSkills: ['System Design', 'Architecture', 'Scalability'],
          },
          {
            id: 'scenario-1',
            type: 'video',
            question:
              'A critical production bug is affecting 10% of users. Walk me through your debugging process.',
            duration: 90,
            expectedSkills: [
              'Problem Solving',
              'Debugging',
              'Crisis Management',
            ],
          },
        ],
        assessmentCriteria: {
          technicalSkills: 40,
          problemSolving: 30,
          communication: 20,
          leadership: 10,
        },
      },
      {
        id: 'data-scientist',
        title: 'Data Scientist',
        category: 'technical',
        experienceLevel: '3+ years',
        description: 'Machine learning and data analysis for business insights',
        skills: [
          'Python',
          'Machine Learning',
          'SQL',
          'Statistics',
          'TensorFlow',
          'Pandas',
        ],
        industries: ['Technology', 'Finance', 'Healthcare', 'E-commerce'],
        questions: [
          {
            id: 'intro-2',
            type: 'video',
            question:
              'Describe your experience with machine learning projects and their business impact.',
            duration: 90,
            expectedSkills: ['ML Experience', 'Business Acumen'],
          },
          {
            id: 'tech-2',
            type: 'video',
            question:
              'How would you approach building a recommendation system for a streaming platform?',
            duration: 120,
            expectedSkills: [
              'ML Algorithms',
              'System Design',
              'Data Engineering',
            ],
          },
          {
            id: 'scenario-2',
            type: 'video',
            question:
              "Your model's accuracy dropped from 95% to 85% in production. How do you investigate?",
            duration: 90,
            expectedSkills: ['Model Monitoring', 'Debugging', 'Data Quality'],
          },
        ],
        assessmentCriteria: {
          technicalSkills: 45,
          problemSolving: 25,
          communication: 20,
          businessAcumen: 10,
        },
      },
      {
        id: 'devops-engineer',
        title: 'DevOps Engineer',
        category: 'technical',
        experienceLevel: '4+ years',
        description: 'Infrastructure automation and deployment pipelines',
        skills: [
          'Kubernetes',
          'Docker',
          'CI/CD',
          'AWS',
          'Monitoring',
          'Terraform',
        ],
        industries: ['Technology', 'Fintech', 'Healthcare'],
        questions: [
          {
            id: 'intro-3',
            type: 'video',
            question:
              'Walk me through your experience with containerization and orchestration.',
            duration: 90,
            expectedSkills: ['DevOps Experience', 'Containerization'],
          },
          {
            id: 'tech-3',
            type: 'video',
            question:
              'Design a CI/CD pipeline for a microservices application with zero-downtime deployments.',
            duration: 120,
            expectedSkills: ['CI/CD', 'System Design', 'Automation'],
          },
          {
            id: 'scenario-3',
            type: 'video',
            question:
              'The production environment is experiencing high CPU usage. How do you troubleshoot?',
            duration: 90,
            expectedSkills: ['Monitoring', 'Troubleshooting', 'Performance'],
          },
        ],
        assessmentCriteria: {
          technicalSkills: 40,
          problemSolving: 30,
          communication: 20,
          automation: 10,
        },
      },
      {
        id: 'product-manager',
        title: 'Product Manager',
        category: 'technical',
        experienceLevel: '6+ years',
        description: 'Product strategy and roadmap development',
        skills: [
          'Product Strategy',
          'Analytics',
          'User Research',
          'Roadmapping',
          'Stakeholder Management',
        ],
        industries: ['Technology', 'Fintech', 'E-commerce', 'SaaS'],
        questions: [
          {
            id: 'intro-4',
            type: 'video',
            question:
              'Describe your approach to product discovery and validation.',
            duration: 90,
            expectedSkills: ['Product Strategy', 'User Research'],
          },
          {
            id: 'tech-4',
            type: 'video',
            question:
              'How would you prioritize features for a mobile app with limited development resources?',
            duration: 120,
            expectedSkills: [
              'Prioritization',
              'Analytics',
              'Business Strategy',
            ],
          },
          {
            id: 'scenario-4',
            type: 'video',
            question:
              'A key feature launch resulted in 20% user drop-off. How do you respond?',
            duration: 90,
            expectedSkills: [
              'Crisis Management',
              'Data Analysis',
              'Decision Making',
            ],
          },
        ],
        assessmentCriteria: {
          strategicThinking: 35,
          communication: 25,
          analyticalSkills: 25,
          leadership: 15,
        },
      },
      // Non-Technical Profiles
      {
        id: 'sales-manager',
        title: 'Sales Manager',
        category: 'non-technical',
        experienceLevel: '5+ years',
        description: 'Sales strategy and team leadership',
        skills: [
          'CRM',
          'Lead Generation',
          'Team Management',
          'Sales Strategy',
          'Negotiation',
        ],
        industries: ['Technology', 'Finance', 'Healthcare', 'Manufacturing'],
        questions: [
          {
            id: 'intro-5',
            type: 'video',
            question:
              'Tell me about your sales management experience and team leadership approach.',
            duration: 90,
            expectedSkills: ['Leadership', 'Sales Experience'],
          },
          {
            id: 'tech-5',
            type: 'video',
            question:
              'How would you develop a sales strategy for a new SaaS product in a competitive market?',
            duration: 120,
            expectedSkills: ['Strategy', 'Market Analysis', 'Planning'],
          },
          {
            id: 'scenario-5',
            type: 'video',
            question:
              'Your team missed Q3 targets by 15%. How do you address this with stakeholders?',
            duration: 90,
            expectedSkills: [
              'Crisis Management',
              'Communication',
              'Problem Solving',
            ],
          },
        ],
        assessmentCriteria: {
          leadership: 35,
          communication: 30,
          strategicThinking: 25,
          salesSkills: 10,
        },
      },
      {
        id: 'marketing-specialist',
        title: 'Marketing Specialist',
        category: 'non-technical',
        experienceLevel: '3+ years',
        description: 'Digital marketing and brand strategy',
        skills: [
          'Digital Marketing',
          'Analytics',
          'Content Strategy',
          'SEO',
          'Social Media',
        ],
        industries: ['Technology', 'E-commerce', 'Retail', 'SaaS'],
        questions: [
          {
            id: 'intro-6',
            type: 'video',
            question:
              'Describe your experience with digital marketing campaigns and their ROI.',
            duration: 90,
            expectedSkills: ['Marketing Experience', 'Analytics'],
          },
          {
            id: 'tech-6',
            type: 'video',
            question:
              'How would you launch a new product with a limited marketing budget?',
            duration: 120,
            expectedSkills: ['Strategy', 'Budget Management', 'Creativity'],
          },
          {
            id: 'scenario-6',
            type: 'video',
            question:
              'A viral campaign went negative. How do you manage the brand reputation?',
            duration: 90,
            expectedSkills: [
              'Crisis Management',
              'Brand Management',
              'Communication',
            ],
          },
        ],
        assessmentCriteria: {
          marketingSkills: 40,
          communication: 25,
          analyticalSkills: 20,
          creativity: 15,
        },
      },
      {
        id: 'hr-business-partner',
        title: 'HR Business Partner',
        category: 'non-technical',
        experienceLevel: '4+ years',
        description: 'Human resources strategy and employee relations',
        skills: [
          'Recruitment',
          'Employee Relations',
          'Policy Development',
          'Talent Management',
        ],
        industries: ['Technology', 'Finance', 'Healthcare', 'Manufacturing'],
        questions: [
          {
            id: 'intro-7',
            type: 'video',
            question:
              'Tell me about your experience with talent acquisition and employee development.',
            duration: 90,
            expectedSkills: ['HR Experience', 'Talent Management'],
          },
          {
            id: 'tech-7',
            type: 'video',
            question:
              'How would you design a remote work policy for a growing tech company?',
            duration: 120,
            expectedSkills: [
              'Policy Development',
              'Strategic Thinking',
              'Employee Relations',
            ],
          },
          {
            id: 'scenario-7',
            type: 'video',
            question:
              'Two senior employees are in conflict, affecting team productivity. How do you handle this?',
            duration: 90,
            expectedSkills: [
              'Conflict Resolution',
              'Communication',
              'Problem Solving',
            ],
          },
        ],
        assessmentCriteria: {
          hrSkills: 40,
          communication: 30,
          problemSolving: 20,
          strategicThinking: 10,
        },
      },
      {
        id: 'customer-success-manager',
        title: 'Customer Success Manager',
        category: 'non-technical',
        experienceLevel: '3+ years',
        description: 'Customer retention and account management',
        skills: [
          'Account Management',
          'Customer Retention',
          'Analytics',
          'Relationship Building',
        ],
        industries: ['Technology', 'SaaS', 'E-commerce', 'Finance'],
        questions: [
          {
            id: 'intro-8',
            type: 'video',
            question:
              'Describe your approach to customer success and retention strategies.',
            duration: 90,
            expectedSkills: ['Customer Success', 'Retention Strategy'],
          },
          {
            id: 'tech-8',
            type: 'video',
            question:
              'How would you identify and prevent customer churn in a SaaS business?',
            duration: 120,
            expectedSkills: ['Analytics', 'Strategy', 'Customer Insights'],
          },
          {
            id: 'scenario-8',
            type: 'video',
            question:
              'A key customer is threatening to cancel due to product limitations. How do you respond?',
            duration: 90,
            expectedSkills: [
              'Crisis Management',
              'Relationship Building',
              'Problem Solving',
            ],
          },
        ],
        assessmentCriteria: {
          customerSkills: 40,
          communication: 30,
          analyticalSkills: 20,
          relationshipBuilding: 10,
        },
      },
      {
        id: 'senior-aiml-engineer',
        title: 'Senior AI/ML Engineer',
        category: 'technical',
        experienceLevel: '9+ years',
        description:
          'LLM architecture specialist with expertise in transformer models and production ML systems',
        skills: [
          'Large Language Models',
          'PyTorch',
          'MLOps',
          'Transformer Architecture',
          'Graph Neural Networks',
          'Python',
        ],
        industries: ['Technology', 'AI/ML', 'Research', 'Fintech'],
        questions: [
          {
            id: 'intro-9',
            type: 'video',
            question:
              'Tell me about your experience with large language models and transformer architectures.',
            duration: 90,
            expectedSkills: ['LLM Experience', 'Technical Leadership'],
          },
          {
            id: 'tech-9',
            type: 'video',
            question:
              'How would you design a production-ready LLM system that can handle millions of requests per day?',
            duration: 120,
            expectedSkills: [
              'System Design',
              'MLOps',
              'Scalability',
              'Performance Optimization',
            ],
          },
          {
            id: 'scenario-9',
            type: 'video',
            question:
              'Your transformer model is showing degraded performance after a week in production. How do you investigate and resolve this?',
            duration: 90,
            expectedSkills: [
              'Model Monitoring',
              'Debugging',
              'Performance Analysis',
            ],
          },
        ],
        assessmentCriteria: {
          technicalSkills: 50,
          problemSolving: 25,
          communication: 15,
          leadership: 10,
        },
      },
      {
        id: 'senior-data-labeller',
        title: 'AI Training Specialist',
        category: 'technical',
        experienceLevel: '4+ years',
        description:
          'Expert in RLHF methodologies, instruction tuning datasets, and multi-modal annotation pipelines',
        skills: [
          'RLHF',
          'Instruction Tuning',
          'Dataset Creation',
          'Quality Assurance',
          'Python',
          'Annotation Tools',
        ],
        industries: ['AI/ML', 'Technology', 'Research', 'Data Services'],
        questions: [
          {
            id: 'intro-10',
            type: 'video',
            question:
              'Describe your experience with RLHF and instruction tuning for large language models.',
            duration: 90,
            expectedSkills: ['RLHF Experience', 'Data Quality'],
          },
          {
            id: 'tech-10',
            type: 'video',
            question:
              'How would you design a comprehensive annotation pipeline for training a conversational AI model?',
            duration: 120,
            expectedSkills: [
              'Pipeline Design',
              'Quality Control',
              'Process Optimization',
            ],
          },
          {
            id: 'scenario-10',
            type: 'video',
            question:
              'You discover significant bias in your training dataset affecting model outputs. How do you address this systematically?',
            duration: 90,
            expectedSkills: [
              'Bias Detection',
              'Quality Assurance',
              'Problem Solving',
            ],
          },
        ],
        assessmentCriteria: {
          technicalSkills: 40,
          problemSolving: 30,
          communication: 20,
          analyticalSkills: 10,
        },
      },
      {
        id: 'senior-finance-analyst',
        title: 'Senior Finance Analyst',
        category: 'non-technical',
        experienceLevel: '5+ years',
        description:
          'Chartered Accountant expert in financial reporting, Ind AS, and business analysis',
        skills: [
          'Financial Reporting',
          'Ind AS',
          'Cost Accounting',
          'SAP FI/CO',
          'Variance Analysis',
          'Excel',
        ],
        industries: ['Finance', 'Technology', 'Manufacturing', 'Consulting'],
        questions: [
          {
            id: 'intro-11',
            type: 'video',
            question:
              'Tell me about your experience with financial reporting under Ind AS and your approach to variance analysis.',
            duration: 90,
            expectedSkills: ['Financial Expertise', 'Regulatory Knowledge'],
          },
          {
            id: 'tech-11',
            type: 'video',
            question:
              'How would you implement a comprehensive management reporting system for a multi-entity organization?',
            duration: 120,
            expectedSkills: [
              'System Design',
              'Process Improvement',
              'Financial Analysis',
            ],
          },
          {
            id: 'scenario-11',
            type: 'video',
            question:
              'During month-end close, you discover a significant variance in cost allocation. How do you investigate and resolve this?',
            duration: 90,
            expectedSkills: [
              'Problem Solving',
              'Attention to Detail',
              'Process Analysis',
            ],
          },
        ],
        assessmentCriteria: {
          analyticalSkills: 45,
          problemSolving: 25,
          communication: 20,
          strategicThinking: 10,
        },
      },
    ];
  }

  /**
   * Get available demo profiles
   */
  async getDemoProfiles(): Promise<IDemoProfile[]> {
    logger.info({
      message: 'Retrieving demo profiles',
      context: 'DemoService.getDemoProfiles',
      count: this.demoProfiles.length,
    });

    return this.demoProfiles;
  }

  /**
   * Get specific demo profile
   */
  async getDemoProfile(profileId: string): Promise<IDemoProfile | null> {
    logger.info({
      message: 'Retrieving demo profile',
      context: 'DemoService.getDemoProfile',
      profileId,
    });

    return (
      this.demoProfiles.find((profile) => profile.id === profileId) || null
    );
  }

  /**
   * Get session from storage (Redis or Map)
   */
  private async getSession(sessionId: string): Promise<IDemoAssessment | null> {
    if (this.useRedisCache && this.redis) {
      try {
        const sessionData = await this.redis.get(sessionId);
        if (sessionData) {
          return JSON.parse(sessionData) as IDemoAssessment;
        }
      } catch (redisError) {
        logger.warn('Redis session lookup failed, falling back to Map', {
          error:
            redisError instanceof Error ? redisError.message : 'Unknown error',
          sessionId,
          context: 'DemoService.getSession',
        });
      }
    }

    // Fallback to Map storage
    return this.demoSessions.get(sessionId) || null;
  }

  /**
   * Set session in storage (Redis and Map)
   */
  private async setSession(
    sessionId: string,
    assessment: IDemoAssessment
  ): Promise<void> {
    // Always store in Map as fallback
    this.demoSessions.set(sessionId, assessment);

    if (this.useRedisCache && this.redis) {
      try {
        await this.redis.set(
          sessionId,
          JSON.stringify(assessment),
          'EX',
          this.sessionCacheTTL
        );
      } catch (redisError) {
        logger.warn('Failed to cache session in Redis', {
          error:
            redisError instanceof Error ? redisError.message : 'Unknown error',
          sessionId,
          context: 'DemoService.setSession',
        });
        // Continue even if Redis fails, as we have Map fallback
      }
    }
  }

  /**
   * Delete session from storage (Redis and Map)
   */
  private async deleteSession(sessionId: string): Promise<void> {
    // Remove from Map
    this.demoSessions.delete(sessionId);

    if (this.useRedisCache && this.redis) {
      try {
        await this.redis.del(sessionId);
      } catch (redisError) {
        logger.warn('Failed to delete session from Redis', {
          error:
            redisError instanceof Error ? redisError.message : 'Unknown error',
          sessionId,
          context: 'DemoService.deleteSession',
        });
      }
    }
  }

  /**
   * Get all available session IDs for debugging
   */
  private async getAllSessionIds(): Promise<string[]> {
    const mapSessions = Array.from(this.demoSessions.keys());

    if (this.useRedisCache && this.redis) {
      try {
        const redisKeys = await this.redis.keys('*');
        const redisSessions = redisKeys.map((key) =>
          key.replace(`${ENV.ENV_NAME}:demo_sessions:`, '')
        );
        // Combine and deduplicate
        return [...new Set([...mapSessions, ...redisSessions])];
      } catch (redisError) {
        logger.warn('Failed to get Redis session keys', {
          error:
            redisError instanceof Error ? redisError.message : 'Unknown error',
          context: 'DemoService.getAllSessionIds',
        });
      }
    }

    return mapSessions;
  }

  /**
   * Start demo assessment
   */
  async startDemoAssessment(
    request: IDemoAssessmentStartRequest
  ): Promise<IDemoAssessment> {
    const sessionId = uuidv4();
    const profile = await this.getDemoProfile(request.profileId);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const assessment: IDemoAssessment = {
      sessionId,
      profileId: request.profileId,
      candidateName: request.candidateName || 'Demo Candidate',
      candidateEmail: request.candidateEmail || 'demo@example.com',
      status: 'started',
      startedAt: new Date(),
      questions: profile.questions,
      answers: [],
      currentQuestionIndex: 0,
      profile,
    };

    await this.setSession(sessionId, assessment);

    logger.info({
      message: 'Demo assessment started',
      context: 'DemoService.startDemoAssessment',
      sessionId,
      profileId: request.profileId,
    });

    return assessment;
  }

  /**
   * Create or get demo session with specific ID (for testing/development)
   */
  async createOrGetDemoSession(
    sessionId: string,
    profileId?: string
  ): Promise<IDemoAssessment> {
    // Check if session already exists
    let assessment = await this.getSession(sessionId);

    if (assessment) {
      return assessment;
    }

    // Create new session with specific ID
    const profile = await this.getDemoProfile(
      profileId || 'senior-software-engineer'
    );

    if (!profile) {
      throw new Error('Profile not found');
    }

    assessment = {
      sessionId,
      profileId: profileId || 'senior-software-engineer',
      candidateName: 'Demo Candidate',
      candidateEmail: 'demo@example.com',
      status: 'started',
      startedAt: new Date(),
      questions: profile.questions,
      answers: [],
      currentQuestionIndex: 0,
      profile,
    };

    await this.setSession(sessionId, assessment);

    logger.info({
      message: 'Demo session created with specific ID',
      context: 'DemoService.createOrGetDemoSession',
      sessionId,
      profileId: profileId || 'senior-software-engineer',
    });

    return assessment;
  }

  /**
   * Get assessment questions
   */
  async getAssessmentQuestions(sessionId: string): Promise<IDemoQuestion[]> {
    let assessment = await this.getSession(sessionId);

    // If session doesn't exist and it's the demo-session, create it automatically
    if (!assessment && sessionId === 'demo-session') {
      assessment = await this.createOrGetDemoSession(sessionId);
    }

    if (!assessment) {
      throw new Error('Assessment session not found');
    }

    return assessment.questions;
  }

  /**
   * Submit answer for assessment question with conversational AI
   */
  async submitAnswer(
    sessionId: string,
    request: IDemoAnswerSubmitRequest
  ): Promise<{ success: boolean; nextQuestion?: IDemoQuestion }> {
    const availableSessions = await this.getAllSessionIds();

    logger.info({
      message: 'Submitting answer to demo service',
      context: 'DemoService.submitAnswer',
      sessionId,
      request,
      availableSessions,
    });

    let assessment = await this.getSession(sessionId);

    // If session doesn't exist and it's the demo-session, create it automatically
    if (!assessment && sessionId === 'demo-session') {
      logger.info({
        message: 'Creating demo session for demo-session fallback',
        context: 'DemoService.submitAnswer',
        sessionId,
      });
      assessment = await this.createOrGetDemoSession(sessionId);
    }

    if (!assessment) {
      logger.error({
        message: 'Assessment session not found',
        context: 'DemoService.submitAnswer',
        sessionId,
        availableSessions,
      });
      throw new Error('Assessment session not found');
    }

    const answer: IDemoAnswer = {
      questionId: request.questionId,
      answer: request.answer,
      videoUrl: request.videoUrl,
      submittedAt: new Date(),
      duration: request.duration || 0,
    };

    assessment.answers.push(answer);
    assessment.currentQuestionIndex++;

    // Generate conversational follow-up question based on user response
    let nextQuestion: IDemoQuestion | undefined;

    // Check if we have more predefined questions (only the first one is predefined)
    if (assessment.currentQuestionIndex < 1) {
      // Use the first predefined question as introduction
      nextQuestion = assessment.questions[0];
      logger.info({
        message: 'Using predefined introduction question',
        context: 'DemoService.submitAnswer',
        sessionId,
        questionIndex: assessment.currentQuestionIndex,
        questionId: nextQuestion.id,
      });
    } else {
      // Generate all subsequent questions using Gemini AI through Vertex AI
      logger.info({
        message: 'Generating AI-powered follow-up question using Gemini',
        context: 'DemoService.submitAnswer',
        sessionId,
        answersCount: assessment.answers.length,
        currentQuestionIndex: assessment.currentQuestionIndex,
        isFirstAIQuestion: assessment.currentQuestionIndex === 1,
      });

      // Build conversation history from all previous Q&A pairs
      const conversationHistory = assessment.questions
        .slice(0, assessment.answers.length)
        .map((question, index) => ({
          question: question.question,
          answer: assessment.answers[index]?.answer || '',
        }));

      const previousQuestion =
        assessment.questions[assessment.currentQuestionIndex - 1]?.question ||
        '';

      logger.info({
        message: 'Building conversation context for AI',
        context: 'DemoService.submitAnswer',
        sessionId,
        conversationHistoryLength: conversationHistory.length,
        previousQuestion: previousQuestion.substring(0, 100) + '...',
        currentAnswer: request.answer?.substring(0, 100) + '...',
      });

      // Generate AI-powered question using Gemini through Vertex AI
      const aiGeneratedQuestion = await this.generateGeminiFollowUpQuestion(
        assessment.profile,
        previousQuestion,
        request.answer || '',
        conversationHistory
      );

      // Create AI-generated question
      nextQuestion = {
        id: `gemini-ai-${Date.now()}`,
        type: 'video',
        question: aiGeneratedQuestion,
        duration: 90,
        expectedSkills: [
          'Communication',
          'Experience',
          'Problem Solving',
          'Technical Skills',
        ],
      };

      // Add to questions array for tracking
      assessment.questions.push(nextQuestion);

      logger.info({
        message: 'Gemini AI question generated successfully',
        context: 'DemoService.submitAnswer',
        sessionId,
        questionId: nextQuestion.id,
        questionPreview: aiGeneratedQuestion.substring(0, 100) + '...',
        totalQuestions: assessment.questions.length,
      });
    }

    // Save the updated assessment back to storage
    await this.setSession(sessionId, assessment);

    logger.info({
      message: 'Answer submitted with conversational AI',
      context: 'DemoService.submitAnswer',
      sessionId,
      questionId: request.questionId,
      hasNextQuestion: !!nextQuestion,
      isDynamicQuestion:
        assessment.currentQuestionIndex >= assessment.questions.length - 1,
    });

    return {
      success: true,
      nextQuestion,
    };
  }

  /**
   * Generate follow-up question using Gemini AI through Vertex AI
   */
  private async generateGeminiFollowUpQuestion(
    profile: IDemoProfile,
    previousQuestion: string,
    userResponse: string,
    conversationHistory: Array<{ question: string; answer: string }>
  ): Promise<string> {
    logger.info({
      message: 'Generating Gemini AI follow-up question',
      context: 'DemoService.generateGeminiFollowUpQuestion',
      profileId: profile.id,
      conversationLength: conversationHistory.length,
      previousQuestion: previousQuestion.substring(0, 100) + '...',
      userResponse: userResponse.substring(0, 100) + '...',
    });

    try {
      // Create a mock resume text based on the profile for AI context
      const mockResumeText = this.generateMockResumeFromProfile(profile);

      // Build conversation context for Gemini AI
      const historyText = conversationHistory
        .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
        .join('\n\n');

      logger.info({
        message: 'Built conversation history for Gemini AI',
        context: 'DemoService.generateGeminiFollowUpQuestion',
        historyLength: historyText.length,
        historyPreview: historyText.substring(0, 200) + '...',
      });

      // Use Gemini AI through Vertex AI to generate natural follow-up question
      const geminiResponse = await this.generateGeminiAIQuestion(
        mockResumeText,
        previousQuestion,
        userResponse,
        historyText,
        profile
      );

      logger.info({
        message: 'Gemini AI follow-up question generated successfully',
        context: 'DemoService.generateGeminiFollowUpQuestion',
        responseLength: geminiResponse.length,
        responsePreview: geminiResponse.substring(0, 100) + '...',
      });

      return geminiResponse;
    } catch (error) {
      logger.error({
        message:
          'Failed to generate Gemini AI follow-up question, using enhanced fallback',
        context: 'DemoService.generateGeminiFollowUpQuestion',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Enhanced fallback with more sophisticated logic
      const fallbackQuestion = this.generateEnhancedContextualFollowUp(
        previousQuestion,
        userResponse,
        conversationHistory
          .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
          .join('\n\n')
      );

      logger.info({
        message: 'Using enhanced fallback follow-up question',
        context: 'DemoService.generateGeminiFollowUpQuestion',
        fallbackQuestion: fallbackQuestion.substring(0, 100) + '...',
      });

      return fallbackQuestion;
    }
  }

  /**
   * Generate follow-up question based on user response using GCP Vertex AI
   */
  private async generateFollowUpQuestion(
    profile: IDemoProfile,
    previousQuestion: string,
    userResponse: string,
    conversationHistory: Array<{ question: string; answer: string }>
  ): Promise<string> {
    logger.info({
      message: 'Generating AI-powered follow-up question',
      context: 'DemoService.generateFollowUpQuestion',
      profileId: profile.id,
      conversationLength: conversationHistory.length,
      previousQuestion: previousQuestion.substring(0, 100) + '...',
      userResponse: userResponse.substring(0, 100) + '...',
    });

    try {
      // Create a mock resume text based on the profile for AI context
      const mockResumeText = this.generateMockResumeFromProfile(profile);

      // Build conversation context for AI
      const historyText = conversationHistory
        .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
        .join('\n\n');

      logger.info({
        message: 'Built conversation history for AI',
        context: 'DemoService.generateFollowUpQuestion',
        historyLength: historyText.length,
        historyPreview: historyText.substring(0, 200) + '...',
      });

      // Use GCP Vertex AI to generate natural follow-up question
      const aiResponse = await this.generateAIFollowUpQuestion(
        mockResumeText,
        previousQuestion,
        userResponse,
        historyText
      );

      logger.info({
        message: 'AI follow-up question generated successfully',
        context: 'DemoService.generateFollowUpQuestion',
        responseLength: aiResponse.length,
        responsePreview: aiResponse.substring(0, 100) + '...',
      });

      return aiResponse;
    } catch (error) {
      logger.error({
        message: 'Failed to generate AI follow-up question, using fallback',
        context: 'DemoService.generateFollowUpQuestion',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Fallback to predefined follow-up questions
      const fallbackQuestion = this.getFallbackFollowUpQuestion(
        profile,
        previousQuestion
      );

      logger.info({
        message: 'Using fallback follow-up question',
        context: 'DemoService.generateFollowUpQuestion',
        fallbackQuestion: fallbackQuestion.substring(0, 100) + '...',
      });

      return fallbackQuestion;
    }
  }

  /**
   * Generate mock resume text from demo profile for AI context
   */
  private generateMockResumeFromProfile(profile: IDemoProfile): string {
    const baseResume = `
${profile.title}
${profile.category} Professional
${profile.experienceLevel} Experience

PROFESSIONAL SUMMARY:
${profile.description}

SKILLS:
${profile.skills.join(', ')}

INDUSTRIES:
${profile.industries.join(', ')}

ASSESSMENT CRITERIA:
- Technical Skills: ${profile.assessmentCriteria.technicalSkills || 0}%
- Problem Solving: ${profile.assessmentCriteria.problemSolving || 0}%
- Communication: ${profile.assessmentCriteria.communication || 0}%
- Leadership: ${profile.assessmentCriteria.leadership || 0}%
- Strategic Thinking: ${profile.assessmentCriteria.strategicThinking || 0}%
- Analytical Skills: ${profile.assessmentCriteria.analyticalSkills || 0}%

ADDITIONAL INFORMATION:
- Category: ${profile.category}
- Experience Level: ${profile.experienceLevel}
`;

    return baseResume.trim();
  }

  /**
   * Generate question using Gemini AI through Vertex AI
   */
  private async generateGeminiAIQuestion(
    _resumeText: string,
    previousQuestion: string,
    userResponse: string,
    conversationHistory: string,
    _profile: IDemoProfile
  ): Promise<string> {
    try {
      // Create a comprehensive prompt for Gemini AI focused ONLY on the latest interaction
      const geminiPrompt = `
You are an expert AI interviewer conducting a professional assessment. Focus ONLY on the most recent question and answer.

LATEST INTERACTION (IGNORE ALL PREVIOUS CONVERSATION):
QUESTION: "${previousQuestion}"
CANDIDATE'S RESPONSE: "${userResponse}"

CRITICAL INSTRUCTIONS:
Generate a natural, conversational follow-up question that:

1. **ALWAYS ASK ABOUT SPECIFIC TECHNOLOGIES MENTIONED** - If they mentioned any technology, framework, or tool, you MUST ask about that specific technology
2. **REFERENCE EXACT WORDS FROM THEIR RESPONSE** - Use the exact technology names they mentioned
3. **ACKNOWLEDGE THEIR ANSWER** - Show you've been listening to what they just said
4. **ASK SPECIFIC QUESTIONS ABOUT MENTIONED TECHNOLOGIES** - Don't ask generic questions, ask about the specific technology they mentioned
5. **MAINTAIN CONVERSATIONAL FLOW** - Feel natural and engaging, not robotic

MANDATORY RULE: If the candidate mentions ANY technology, framework, or tool in their response, you MUST ask a question about that specific technology.

EXAMPLES OF WHAT TO DO:
- If they say "Angular" → Ask about Angular specifically
- If they say "React" → Ask about React specifically  
- If they say "Python" → Ask about Python specifically
- If they say "AWS" → Ask about AWS specifically
- If they say "Docker" → Ask about Docker specifically

CONVERSATION STYLE:
- Start with acknowledgment: "That's great!", "I can see that...", "That's interesting..."
- Reference the EXACT technology they mentioned
- Use "you" and "your" to make it personal
- Ask specific questions about the technology they mentioned

RESPONSE FORMAT:
Generate ONLY a single, natural follow-up question. Do not include any explanations, context, or additional text. Just the question.

EXAMPLE STYLES:
- "That's great! You mentioned [EXACT TECHNOLOGY NAME]. Can you tell me about a specific project where you used [EXACT TECHNOLOGY NAME]? What challenges did you face?"
- "I can see you have experience with [EXACT TECHNOLOGY NAME]. How did you approach [specific aspect] when working with [EXACT TECHNOLOGY NAME]?"
- "That's interesting! You mentioned [EXACT TECHNOLOGY NAME]. What was the most challenging part of working with [EXACT TECHNOLOGY NAME] in your projects?"

Generate a single, natural follow-up question that asks about the SPECIFIC technology they mentioned in their latest response.
`;

      logger.info({
        message: 'Sending skill-focused prompt to Gemini AI',
        context: 'DemoService.generateGeminiAIQuestion',
        promptLength: geminiPrompt.length,
        userResponseLength: userResponse.length,
        conversationHistoryLength: conversationHistory.length,
      });

      // Use the GCP Vertex AI provider to generate the question
      const sessionId = `demo-gemini-${Date.now()}`;

      // Call the actual Gemini API through Vertex AI
      const geminiResponse = await this.callGeminiAPI(geminiPrompt, sessionId);

      return geminiResponse;
    } catch (error) {
      logger.error({
        message: 'Failed to generate Gemini AI question',
        context: 'DemoService.generateGeminiAIQuestion',
        error: error instanceof Error ? error.message : String(error),
      });

      // Return enhanced fallback
      return this.generateEnhancedContextualFollowUp(
        previousQuestion,
        userResponse,
        conversationHistory
      );
    }
  }

  /**
   * Call Gemini API through Vertex AI
   */
  private async callGeminiAPI(
    prompt: string,
    sessionId: string
  ): Promise<string> {
    try {
      logger.info({
        message: 'Calling Gemini API via Vertex AI',
        context: 'DemoService.callGeminiAPI',
        sessionId,
        promptLength: prompt.length,
      });

      // Import GCP config and ENV
      const { gcpConfig } = await import('@/config/gcp');
      const { ENV } = await import('@/config/env');

      // Get Vertex AI instance
      const vertexAI = gcpConfig.getVertexAI();

      // Get the model
      const generativeModel = vertexAI.preview.getGenerativeModel({
        model: `projects/${ENV.GOOGLE_CLOUD_PROJECT_ID}/locations/${ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION}/publishers/google/models/${ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL}`,
      });

      // Generate content using Vertex AI
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      // Extract the response text
      if (!result.response.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response structure from Vertex AI');
      }

      const response = result.response.candidates[0].content.parts[0].text;

      logger.info({
        message: 'Generated response from Gemini API',
        context: 'DemoService.callGeminiAPI',
        sessionId,
        responseLength: response.length,
        responsePreview: response.substring(0, 100) + '...',
      });

      return response;
    } catch (error) {
      logger.error({
        message: 'Gemini API call failed',
        context: 'DemoService.callGeminiAPI',
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to sophisticated contextual response if API fails
      logger.info({
        message: 'Falling back to sophisticated contextual response',
        context: 'DemoService.callGeminiAPI',
        sessionId,
      });

      return this.generateSophisticatedContextualResponse(prompt);
    }
  }

  /**
   * Generate sophisticated contextual response (placeholder for Gemini)
   */
  private generateSophisticatedContextualResponse(_prompt: string): string {
    // This method is now simplified - let the AI prompt handle all the logic
    // Just return a generic fallback that will be overridden by the AI-generated response
    return "That's interesting! Can you tell me more about that experience?";
  }

  /**
   * Generate AI-powered follow-up question using GCP Vertex AI
   */
  private async generateAIFollowUpQuestion(
    _resumeText: string,
    previousQuestion: string,
    userResponse: string,
    conversationHistory: string
  ): Promise<string> {
    try {
      // For demo purposes, we'll use a simplified approach
      // Create a conversation context for the AI
      const _conversationContext = `
CONVERSATION HISTORY:
${conversationHistory}

PREVIOUS QUESTION: ${previousQuestion}
CANDIDATE'S RESPONSE: ${userResponse}

Based on the candidate's response above, generate a natural, conversational follow-up question that:
1. Acknowledges their response authentically
2. Uses their language and examples when possible
3. Builds naturally on what they shared
4. Feels like a natural conversation progression
5. Demonstrates you've been listening and are genuinely interested
6. Maintains the assessment structure while feeling conversational
7. Validates or explores their claimed skills and experience
8. Assesses their technical depth and tool proficiency
9. Evaluates their problem-solving approach and critical thinking
10. Balances technical assessment with conversational comfort

Generate a single, natural follow-up question that continues the conversation flow.
`;

      // Use the GCP Vertex AI prompt generator to create a more sophisticated follow-up
      // For now, we'll use the existing contextual follow-up logic but enhanced
      const enhancedFollowUp = this.generateEnhancedContextualFollowUp(
        previousQuestion,
        userResponse,
        conversationHistory
      );

      return enhancedFollowUp;
    } catch (error) {
      logger.error({
        message: 'Failed to generate AI follow-up question',
        context: 'DemoService.generateAIFollowUpQuestion',
        error: error instanceof Error ? error.message : String(error),
      });

      // Return a fallback question
      return this.getFallbackFollowUpQuestion(null, previousQuestion);
    }
  }

  /**
   * Generate enhanced contextual follow-up question using conversation history
   */
  private generateEnhancedContextualFollowUp(
    _previousQuestion: string,
    userResponse: string,
    conversationHistory: string
  ): string {
    const response = userResponse.toLowerCase();

    // Analyze the conversation history for context
    const historyLines = conversationHistory.split('\n');
    const previousAnswers = historyLines.filter((line) =>
      line.startsWith('A: ')
    );

    // Extract key technologies and skills mentioned throughout the conversation
    const allResponses = [
      userResponse,
      ...previousAnswers.map((a) => a.replace('A: ', '')),
    ]
      .join(' ')
      .toLowerCase();

    // Build on previous responses for more natural conversation
    if (previousAnswers.length > 0) {
      const _lastAnswer = previousAnswers[previousAnswers.length - 1].replace(
        'A: ',
        ''
      );

      // If they mentioned specific technologies or skills, dive deeper
      if (
        allResponses.includes('javascript') ||
        allResponses.includes('react') ||
        allResponses.includes('node')
      ) {
        const tech = allResponses.includes('javascript')
          ? 'JavaScript'
          : allResponses.includes('react')
            ? 'React'
            : 'Node.js';
        return `That's great! You mentioned ${tech}. Can you tell me about a specific project where you used this technology? What challenges did you face and how did you solve them?`;
      }

      if (
        allResponses.includes('python') ||
        allResponses.includes('machine learning') ||
        allResponses.includes('data')
      ) {
        return `Excellent! I can see you have experience with data science and machine learning. Can you walk me through a specific ML project you worked on? What was the business problem you were solving, and how did you measure the success of your solution?`;
      }

      if (
        allResponses.includes('kubernetes') ||
        allResponses.includes('docker') ||
        allResponses.includes('devops')
      ) {
        return `That's impressive DevOps experience! Can you tell me about a challenging deployment or infrastructure issue you solved? How did you ensure zero downtime, and what monitoring strategies did you implement?`;
      }

      if (
        allResponses.includes('team') ||
        allResponses.includes('collaborate') ||
        allResponses.includes('manage')
      ) {
        return `I can see you have experience with ${allResponses.includes('team') ? 'teamwork' : allResponses.includes('collaborate') ? 'collaboration' : 'management'}. What was your role in that team dynamic? How did you contribute to the project's success, and what did you learn about leadership?`;
      }

      if (
        allResponses.includes('problem') ||
        allResponses.includes('challenge') ||
        allResponses.includes('difficult')
      ) {
        return `That sounds like a significant challenge! Can you walk me through your thought process in solving that problem? What alternatives did you consider, and how did you decide on your approach?`;
      }

      if (
        allResponses.includes('learn') ||
        allResponses.includes('grow') ||
        allResponses.includes('improve')
      ) {
        return `That's wonderful to hear! How has that experience shaped your approach to similar situations? What would you do differently now, and how do you continue to grow in that area?`;
      }

      if (
        allResponses.includes('success') ||
        allResponses.includes('achieved') ||
        allResponses.includes('result')
      ) {
        return `Impressive results! How did you measure the success of that initiative? What metrics or outcomes were most important to you, and how did you ensure the project met its goals?`;
      }

      if (
        allResponses.includes('customer') ||
        allResponses.includes('client') ||
        allResponses.includes('user')
      ) {
        return `That's valuable experience! How did you ensure the customer's needs were met? What feedback did you receive, and how did you incorporate it into your work?`;
      }

      if (
        allResponses.includes('strategy') ||
        allResponses.includes('plan') ||
        allResponses.includes('approach')
      ) {
        return `Interesting approach! How did you develop that strategy? What factors did you consider, and how did you validate your assumptions?`;
      }
    }

    // Default enhanced follow-up based on response content
    if (
      response.includes('experience') ||
      response.includes('worked') ||
      response.includes('project')
    ) {
      return `That's interesting! Can you tell me about a specific project where you applied those skills? What was the most challenging part and how did you overcome it?`;
    }

    if (
      response.includes('technology') ||
      response.includes('technical') ||
      response.includes('system')
    ) {
      return `Excellent! Can you dive deeper into the technical details? What specific technologies or methodologies did you use, and why did you choose that approach?`;
    }

    if (
      response.includes('leadership') ||
      response.includes('team') ||
      response.includes('manage')
    ) {
      return `That's great leadership experience! Can you tell me about a time when you had to make a difficult decision that affected your team? How did you communicate the decision, and what was the outcome?`;
    }

    if (
      response.includes('innovation') ||
      response.includes('creative') ||
      response.includes('new')
    ) {
      return `That's exciting! Innovation is crucial in today's fast-paced environment. Can you walk me through how you identify opportunities for improvement or innovation in your work?`;
    }

    // Default intelligent follow-up
    return `That's a great example! Can you elaborate on how that experience has influenced your professional development? What key takeaways do you still apply today?`;
  }

  /**
   * Generate contextual follow-up question based on response analysis
   */
  private generateContextualFollowUp(
    profile: IDemoProfile,
    _previousQuestion: string,
    userResponse: string,
    _historyText: string
  ): string {
    const response = userResponse.toLowerCase();

    // Analyze response content and generate appropriate follow-up
    if (
      response.includes('experience') ||
      response.includes('worked') ||
      response.includes('project')
    ) {
      return `That's interesting! Can you tell me about a specific project where you applied those skills? What was the most challenging part and how did you overcome it?`;
    }

    if (
      response.includes('team') ||
      response.includes('collaborate') ||
      response.includes('manage')
    ) {
      return `Great! What role did you play in that team? How did you contribute to the success of the project, and what did you learn about leadership?`;
    }

    if (
      response.includes('problem') ||
      response.includes('challenge') ||
      response.includes('difficult')
    ) {
      return `That sounds challenging! Can you walk me through your thought process in solving that problem? What alternatives did you consider?`;
    }

    if (
      response.includes('technology') ||
      response.includes('technical') ||
      response.includes('system')
    ) {
      return `Excellent! Can you dive deeper into the technical details? What specific technologies or methodologies did you use, and why did you choose that approach?`;
    }

    if (
      response.includes('learn') ||
      response.includes('grow') ||
      response.includes('improve')
    ) {
      return `That's great to hear! How has that experience shaped your approach to similar situations? What would you do differently now?`;
    }

    if (
      response.includes('success') ||
      response.includes('achieved') ||
      response.includes('result')
    ) {
      return `Impressive! How did you measure the success of that initiative? What metrics or outcomes were most important to you?`;
    }

    if (
      response.includes('customer') ||
      response.includes('client') ||
      response.includes('user')
    ) {
      return `That's valuable experience! How did you ensure the customer's needs were met? What feedback did you receive, and how did you incorporate it?`;
    }

    if (
      response.includes('strategy') ||
      response.includes('plan') ||
      response.includes('approach')
    ) {
      return `Interesting approach! How did you develop that strategy? What factors did you consider, and how did you validate your assumptions?`;
    }

    // Role-specific follow-ups
    if (profile.category === 'technical') {
      if (
        response.includes('code') ||
        response.includes('develop') ||
        response.includes('programming')
      ) {
        return `Can you share more about your development process? How do you ensure code quality and maintainability in your projects?`;
      }
      if (
        response.includes('architecture') ||
        response.includes('design') ||
        response.includes('system')
      ) {
        return `That's a solid approach! How do you handle scalability and performance considerations in your system design?`;
      }
    }

    if (profile.category === 'non-technical') {
      if (
        response.includes('sales') ||
        response.includes('revenue') ||
        response.includes('target')
      ) {
        return `Great results! How do you build and maintain relationships with clients? What's your approach to handling objections?`;
      }
      if (
        response.includes('marketing') ||
        response.includes('campaign') ||
        response.includes('brand')
      ) {
        return `That's creative! How do you measure the effectiveness of your marketing efforts? What tools and metrics do you rely on?`;
      }
    }

    // Default intelligent follow-up
    return `That's a great example! Can you elaborate on how that experience has influenced your professional development? What key takeaways do you still apply today?`;
  }

  /**
   * Get fallback follow-up question
   */
  private getFallbackFollowUpQuestion(
    _profile: IDemoProfile | null,
    _previousQuestion: string
  ): string {
    const followUps = [
      "That's interesting! Can you tell me more about that experience?",
      'What was the most challenging part of that situation?',
      'How did you measure the success of that project?',
      'What would you do differently if you faced a similar challenge?',
      'How did that experience help you grow professionally?',
      'What did you learn from that experience that you still apply today?',
    ];

    return followUps[Math.floor(Math.random() * followUps.length)];
  }

  /**
   * Complete demo assessment
   */
  async completeAssessment(
    sessionId: string
  ): Promise<{ success: boolean; resultsId: string }> {
    let assessment = await this.getSession(sessionId);

    // If session doesn't exist and it's the demo-session, create it automatically
    if (!assessment && sessionId === 'demo-session') {
      assessment = await this.createOrGetDemoSession(sessionId);
    }

    if (!assessment) {
      throw new Error('Assessment session not found');
    }

    assessment.status = 'completed';
    assessment.completedAt = new Date();

    // Generate mock results (in production, this would use AI analysis)
    const results = await this.generateMockResults(assessment);
    assessment.results = results;

    // Save the updated assessment back to storage
    await this.setSession(sessionId, assessment);

    logger.info({
      message: 'Demo assessment completed',
      context: 'DemoService.completeAssessment',
      sessionId,
    });

    return {
      success: true,
      resultsId: sessionId,
    };
  }

  /**
   * Get demo assessment results
   */
  async getAssessmentResults(sessionId: string): Promise<IDemoResults> {
    let assessment = await this.getSession(sessionId);

    // If session doesn't exist and it's the demo-session, create it automatically
    if (!assessment && sessionId === 'demo-session') {
      assessment = await this.createOrGetDemoSession(sessionId);
    }

    if (!assessment) {
      throw new Error('Assessment session not found');
    }

    if (!assessment.results) {
      throw new Error('Assessment results not available');
    }

    return assessment.results;
  }

  /**
   * Analyze demo video using real AI analysis
   */
  async analyzeVideo(
    request: IDemoVideoAnalysisRequest
  ): Promise<IDemoVideoAnalysis> {
    logger.info({
      message: 'Analyzing demo video with AI',
      context: 'DemoService.analyzeVideo',
      videoUrl: request.videoUrl,
    });

    try {
      // For demo purposes, we'll simulate real AI analysis
      // In production, this would use the actual video analysis service
      const analysis = await this.performRealVideoAnalysis(request);
      return analysis;
    } catch (error) {
      logger.error({
        message:
          'Failed to analyze video with AI, using enhanced mock analysis',
        context: 'DemoService.analyzeVideo',
        error: error instanceof Error ? error.message : String(error),
      });

      // Enhanced mock analysis with more realistic data
      return this.getEnhancedMockVideoAnalysis(request.videoUrl);
    }
  }

  /**
   * Perform real video analysis (simulated for demo)
   */
  private async performRealVideoAnalysis(
    request: IDemoVideoAnalysisRequest
  ): Promise<IDemoVideoAnalysis> {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate realistic analysis based on video content
    const analysis: IDemoVideoAnalysis = {
      videoUrl: request.videoUrl,
      transcriptText: this.generateRealisticTranscript(),
      overallScore: this.generateRealisticScore(0.75, 0.95),
      overallFeedback: this.generateOverallFeedback(),
      engagementScore: this.generateRealisticScore(0.7, 0.95),
      engagementFeedback:
        'The candidate demonstrated good engagement throughout the interview, maintaining appropriate eye contact and showing enthusiasm for the role.',
      confidenceScore: this.generateRealisticScore(0.65, 0.9),
      confidenceFeedback:
        'The candidate spoke with confidence and conviction, though there were moments of hesitation that are normal in interview settings.',
      clarityScore: this.generateRealisticScore(0.7, 0.95),
      clarityFeedback:
        'The candidate articulated their thoughts clearly with well-structured responses and good use of examples.',
      professionalDemeanorScore: this.generateRealisticScore(0.8, 0.95),
      professionalDemeanorFeedback:
        'The candidate presented themselves professionally with appropriate attire and demeanor throughout the assessment.',
      proctoringScore: this.generateRealisticScore(0.9, 1.0),
      proctoringFeedback:
        'No suspicious activities detected. The candidate maintained focus and followed assessment guidelines appropriately.',
      areasForImprovement: this.generateAreasForImprovement(),
      strengths: this.generateStrengths(),
      highlightsInstructions: this.generateHighlightsInstructions(),
    };

    return analysis;
  }

  /**
   * Generate realistic transcript
   */
  private generateRealisticTranscript(): string {
    const transcriptParts = [
      "Hello, thank you for having me. I'm excited to discuss this opportunity with you.",
      'I have about five years of experience in software development, primarily working with React and Node.js.',
      'In my previous role, I led a team of three developers on a major e-commerce platform migration.',
      'The biggest challenge we faced was ensuring zero downtime during the migration process.',
      'We implemented a blue-green deployment strategy and used feature flags to gradually roll out changes.',
      'The project was successful, and we reduced page load times by 40% while maintaining 99.9% uptime.',
      "I'm particularly interested in this role because it aligns with my passion for building scalable systems.",
      'I believe my experience with microservices architecture and cloud technologies would be valuable here.',
      "Thank you for the opportunity to discuss this position. I'm excited about the possibility of joining your team.",
    ];

    return transcriptParts.join(' ');
  }

  /**
   * Generate realistic score within range
   */
  private generateRealisticScore(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  /**
   * Generate overall feedback
   */
  private generateOverallFeedback(): string {
    const feedbacks = [
      'The candidate demonstrated strong technical knowledge and excellent communication skills. They provided clear, structured answers with relevant examples from their experience.',
      'Overall strong performance with good technical depth and professional presentation. The candidate showed enthusiasm and provided thoughtful responses throughout the interview.',
      'The candidate exhibited solid technical skills and good problem-solving abilities. Their responses were well-articulated and demonstrated relevant experience for the role.',
      'Strong interview performance with good communication and technical competence. The candidate provided specific examples and showed clear understanding of the role requirements.',
    ];

    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
  }

  /**
   * Generate areas for improvement
   */
  private generateAreasForImprovement(): string[] {
    const improvements = [
      'Could provide more specific metrics and quantifiable results from past projects',
      'Consider elaborating on technical challenges faced and detailed solutions implemented',
      'Opportunity to showcase more leadership experience and team management skills',
      'Could demonstrate more knowledge of current industry trends and technologies',
      'Consider providing more examples of cross-functional collaboration',
    ];

    return improvements.slice(0, Math.floor(Math.random() * 3) + 2);
  }

  /**
   * Generate strengths
   */
  private generateStrengths(): string[] {
    const strengths = [
      'Excellent communication skills with clear articulation',
      'Strong technical foundation and problem-solving approach',
      'Good use of specific examples and concrete experiences',
      'Professional demeanor and confidence throughout',
      'Demonstrated relevant experience for the role',
      'Good understanding of system architecture and scalability',
      'Showed enthusiasm and genuine interest in the position',
    ];

    return strengths.slice(0, Math.floor(Math.random() * 3) + 4);
  }

  /**
   * Generate highlights instructions
   */
  private generateHighlightsInstructions(): any {
    return {
      introduction: {
        startTime: '00:05',
        endTime: '00:25',
        description: 'Candidate introduction and background overview',
        keyPoints: [
          '5+ years software development experience',
          'Expertise in React and Node.js',
          'Team leadership experience',
        ],
      },
      highs: [
        {
          startTime: '01:30',
          endTime: '02:00',
          description: 'Strong technical explanation of project migration',
          reason:
            'Demonstrated deep understanding of deployment strategies and system architecture',
          keyQuote:
            'We implemented a blue-green deployment strategy and used feature flags to gradually roll out changes.',
        },
        {
          startTime: '02:45',
          endTime: '03:15',
          description: 'Excellent problem-solving approach',
          reason:
            'Showed structured thinking and provided specific technical solutions',
          keyQuote:
            'The biggest challenge was ensuring zero downtime during the migration process.',
        },
      ],
      lows: [
        {
          startTime: '03:45',
          endTime: '04:00',
          description: 'Could provide more specific metrics',
          reason: 'General statements without quantifiable results',
          improvement:
            'Include specific metrics and measurable outcomes in responses',
        },
      ],
      interviewEnd: {
        startTime: '04:30',
        endTime: '04:45',
        description: 'Candidate closing thoughts and enthusiasm',
        closingThoughts:
          'The candidate showed strong potential with good technical skills and professional presentation. Room for improvement in providing more specific metrics and examples.',
      },
    };
  }

  /**
   * Get enhanced mock video analysis as fallback
   */
  private getEnhancedMockVideoAnalysis(videoUrl: string): IDemoVideoAnalysis {
    return {
      videoUrl,
      transcriptText:
        "This is a mock transcript of the candidate's responses during the assessment.",
      overallScore: 0.85,
      overallFeedback:
        'The candidate demonstrated strong communication skills and technical knowledge. They provided clear, structured answers and showed good problem-solving abilities.',
      engagementScore: 0.88,
      engagementFeedback:
        'The candidate maintained good eye contact and showed enthusiasm throughout the interview.',
      confidenceScore: 0.82,
      confidenceFeedback:
        'The candidate spoke with confidence and conviction in their answers.',
      clarityScore: 0.87,
      clarityFeedback:
        'The candidate articulated their thoughts clearly and provided well-structured responses.',
      professionalDemeanorScore: 0.9,
      professionalDemeanorFeedback:
        'The candidate presented themselves professionally and maintained appropriate demeanor.',
      proctoringScore: 0.95,
      proctoringFeedback:
        'No suspicious activities detected during the assessment.',
      areasForImprovement: [
        'Could provide more specific examples in technical questions',
        'Consider elaborating on past project challenges and solutions',
      ],
      strengths: [
        'Excellent communication skills',
        'Strong technical foundation',
        'Good problem-solving approach',
        'Professional presentation',
      ],
      highlightsInstructions: {
        introduction: {
          startTime: '00:05',
          endTime: '00:20',
          description: 'Candidate introduction and background',
          keyPoints: [
            '5+ years experience',
            'Full-stack development',
            'Team leadership',
          ],
        },
        highs: [
          {
            startTime: '01:30',
            endTime: '02:00',
            description: 'Strong technical explanation',
            reason: 'Demonstrated deep understanding of system architecture',
            keyQuote:
              'I would implement a microservices architecture with API gateways for scalability.',
          },
        ],
        lows: [
          {
            startTime: '03:45',
            endTime: '04:00',
            description: 'Could improve example specificity',
            reason: 'General answer without concrete examples',
            improvement: 'Provide specific examples from past projects',
          },
        ],
        interviewEnd: {
          startTime: '04:30',
          endTime: '04:45',
          description: 'Candidate closing thoughts',
          closingThoughts:
            'The candidate showed strong potential with room for growth in providing specific examples.',
        },
      },
    };
  }

  /**
   * Get presigned URL for demo video upload
   */
  async getPresignedUrl(
    fileName: string
  ): Promise<{ uploadUrl: string; videoUrl: string }> {
    const key = `demo/videos/${Date.now()}-${fileName}`;

    const uploadUrl = await this.storageProvider.generatePreSignedUrl(
      key,
      'write',
      'video/webm'
    );

    // For demo purposes, we'll use the same URL for both upload and access
    // In production, you might want to generate a separate read URL
    const videoUrl = uploadUrl;

    return {
      uploadUrl,
      videoUrl,
    };
  }

  /**
   * Generate mock results for demo assessment
   */
  private async generateMockResults(
    assessment: IDemoAssessment
  ): Promise<IDemoResults> {
    try {
      logger.info({
        message: 'Generating AI-powered assessment results',
        context: 'DemoService.generateMockResults',
        sessionId: assessment.sessionId,
        totalQuestions: assessment.questions.length,
        totalAnswers: assessment.answers.length,
      });

      // Generate AI analysis of the assessment
      const aiAnalysis = await this.generateAIAssessmentAnalysis(assessment);

      // Calculate scores based on AI analysis and profile criteria
      const criteria = assessment.profile.assessmentCriteria;
      const scores = {
        overall: aiAnalysis.overallScore,
        technicalSkills: criteria.technicalSkills
          ? aiAnalysis.technicalSkillsScore
          : 0,
        problemSolving: criteria.problemSolving
          ? aiAnalysis.problemSolvingScore
          : 0,
        communication: criteria.communication
          ? aiAnalysis.communicationScore
          : 0,
        leadership: criteria.leadership ? aiAnalysis.leadershipScore : 0,
        strategicThinking: criteria.strategicThinking
          ? aiAnalysis.strategicThinkingScore
          : 0,
        analyticalSkills: criteria.analyticalSkills
          ? aiAnalysis.analyticalSkillsScore
          : 0,
      };

      const recommendation =
        scores.overall > 0.8
          ? 'HIGHLY_RECOMMENDED'
          : scores.overall > 0.6
            ? 'RECOMMENDED'
            : 'NOT_RECOMMENDED';

      return {
        sessionId: assessment.sessionId,
        overallScore: scores.overall,
        recommendation,
        scores,
        strengths: aiAnalysis.strengths,
        areasForImprovement: aiAnalysis.areasForImprovement,
        detailedFeedback: {
          technicalSkills: aiAnalysis.technicalSkillsFeedback,
          problemSolving: aiAnalysis.problemSolvingFeedback,
          communication: aiAnalysis.communicationFeedback,
          leadership: aiAnalysis.leadershipFeedback,
        },
        videoAnalysis: undefined, // Will be populated when video is analyzed
        completedAt: new Date(),
      };
    } catch (error) {
      logger.error({
        message:
          'Failed to generate AI assessment results, falling back to mock results',
        context: 'DemoService.generateMockResults',
        error: error instanceof Error ? error.message : String(error),
        sessionId: assessment.sessionId,
      });

      // Fallback to basic mock results if AI analysis fails
      return this.generateFallbackResults(assessment);
    }
  }

  /**
   * Generate AI-powered assessment analysis using Vertex AI
   */
  private async generateAIAssessmentAnalysis(
    assessment: IDemoAssessment
  ): Promise<{
    overallScore: number;
    technicalSkillsScore: number;
    problemSolvingScore: number;
    communicationScore: number;
    leadershipScore: number;
    strategicThinkingScore: number;
    analyticalSkillsScore: number;
    strengths: string[];
    areasForImprovement: string[];
    technicalSkillsFeedback: string;
    problemSolvingFeedback: string;
    communicationFeedback: string;
    leadershipFeedback: string;
  }> {
    try {
      // Build conversation history from questions and answers
      const conversationHistory = assessment.questions
        .map((question, index) => {
          const answer = assessment.answers.find(
            (a) => a.questionId === question.id
          );
          return `Q${index + 1}: ${question.question}\nA${index + 1}: ${answer?.answer || 'No answer provided'}`;
        })
        .join('\n\n');

      // Create comprehensive prompt for AI assessment analysis
      const analysisPrompt = `
You are an expert AI interviewer conducting a comprehensive assessment analysis. Analyze the following interview conversation and provide detailed scoring and feedback.

ASSESSMENT CONTEXT:
Profile: ${assessment.profile.title}
Category: ${assessment.profile.category}
Industries: ${assessment.profile.industries.join(', ')}
Experience Level: ${assessment.profile.experienceLevel}

ASSESSMENT CRITERIA:
- Technical Skills: ${assessment.profile.assessmentCriteria.technicalSkills ? 'Required' : 'Not Required'}
- Problem Solving: ${assessment.profile.assessmentCriteria.problemSolving ? 'Required' : 'Not Required'}
- Communication: ${assessment.profile.assessmentCriteria.communication ? 'Required' : 'Not Required'}
- Leadership: ${assessment.profile.assessmentCriteria.leadership ? 'Required' : 'Not Required'}
- Strategic Thinking: ${assessment.profile.assessmentCriteria.strategicThinking ? 'Required' : 'Not Required'}
- Analytical Skills: ${assessment.profile.assessmentCriteria.analyticalSkills ? 'Required' : 'Not Required'}

INTERVIEW CONVERSATION:
${conversationHistory}

ANALYSIS REQUIREMENTS:
1. Analyze the candidate's responses for each assessment criteria
2. Provide scores (0.0 to 1.0) for each area
3. Identify specific strengths and areas for improvement
4. Generate detailed feedback for each skill area
5. Calculate an overall score based on the assessment criteria

RESPONSE FORMAT (JSON ONLY - NO MARKDOWN, NO EXPLANATIONS):
{
  "overallScore": 0.85,
  "technicalSkillsScore": 0.90,
  "problemSolvingScore": 0.80,
  "communicationScore": 0.85,
  "leadershipScore": 0.75,
  "strategicThinkingScore": 0.70,
  "analyticalSkillsScore": 0.80,
  "strengths": [
    "Strong technical knowledge demonstrated",
    "Clear communication style",
    "Good problem-solving approach"
  ],
  "areasForImprovement": [
    "Could provide more specific examples",
    "Opportunity to showcase leadership experience"
  ],
  "technicalSkillsFeedback": "Demonstrated solid technical knowledge and understanding of key concepts. Showed familiarity with relevant technologies and methodologies.",
  "problemSolvingFeedback": "Showed good analytical thinking and structured approach to problem-solving. Provided logical solutions to complex scenarios.",
  "communicationFeedback": "Clear and articulate communication with good structure in responses. Effectively conveyed ideas and experiences.",
  "leadershipFeedback": "Showed potential for leadership with examples of team collaboration. Could benefit from more specific leadership examples."
}

CRITICAL: Return ONLY the JSON object above. Do not include any markdown formatting, explanations, or additional text. Just the raw JSON.
`;

      // Call Gemini API for analysis
      const sessionId = `demo-analysis-${Date.now()}`;
      const aiResponse = await this.callGeminiAPI(analysisPrompt, sessionId);

      // Parse the AI response - handle markdown formatting
      const cleanedResponse = this.cleanJsonResponse(aiResponse);

      logger.info({
        message: 'Attempting to parse AI response as JSON',
        context: 'DemoService.generateAIAssessmentAnalysis',
        cleanedResponsePreview: cleanedResponse.substring(0, 200) + '...',
      });

      const analysis = JSON.parse(cleanedResponse);

      logger.info({
        message: 'AI assessment analysis completed',
        context: 'DemoService.generateAIAssessmentAnalysis',
        sessionId: assessment.sessionId,
        overallScore: analysis.overallScore,
      });

      return analysis;
    } catch (error) {
      logger.error({
        message: 'Failed to generate AI assessment analysis',
        context: 'DemoService.generateAIAssessmentAnalysis',
        error: error instanceof Error ? error.message : String(error),
        sessionId: assessment.sessionId,
      });

      // Return default analysis if AI fails
      return {
        overallScore: 0.75,
        technicalSkillsScore: 0.7,
        problemSolvingScore: 0.75,
        communicationScore: 0.8,
        leadershipScore: 0.7,
        strategicThinkingScore: 0.7,
        analyticalSkillsScore: 0.75,
        strengths: [
          'Participated actively in the assessment',
          'Provided thoughtful responses',
          'Showed engagement with the process',
        ],
        areasForImprovement: [
          'Could provide more specific examples',
          'Consider elaborating on past experiences',
          'Opportunity to showcase more skills',
        ],
        technicalSkillsFeedback:
          'Demonstrated basic technical knowledge through responses.',
        problemSolvingFeedback:
          'Showed logical thinking in problem-solving scenarios.',
        communicationFeedback:
          'Clear communication with room for more detailed examples.',
        leadershipFeedback:
          'Showed potential for leadership with basic examples.',
      };
    }
  }

  /**
   * Generate fallback results when AI analysis fails
   */
  private generateFallbackResults(assessment: IDemoAssessment): IDemoResults {
    const criteria = assessment.profile.assessmentCriteria;
    const scores = {
      overall: Math.random() * 0.3 + 0.7, // 70-100%
      technicalSkills: criteria.technicalSkills ? Math.random() * 0.3 + 0.7 : 0,
      problemSolving: criteria.problemSolving ? Math.random() * 0.3 + 0.7 : 0,
      communication: criteria.communication ? Math.random() * 0.3 + 0.7 : 0,
      leadership: criteria.leadership ? Math.random() * 0.3 + 0.7 : 0,
      strategicThinking: criteria.strategicThinking
        ? Math.random() * 0.3 + 0.7
        : 0,
      analyticalSkills: criteria.analyticalSkills
        ? Math.random() * 0.3 + 0.7
        : 0,
    };

    const recommendation =
      scores.overall > 0.8
        ? 'HIGHLY_RECOMMENDED'
        : scores.overall > 0.6
          ? 'RECOMMENDED'
          : 'NOT_RECOMMENDED';

    return {
      sessionId: assessment.sessionId,
      overallScore: scores.overall,
      recommendation,
      scores,
      strengths: [
        'Strong technical foundation',
        'Excellent communication skills',
        'Good problem-solving approach',
        'Professional demeanor',
      ],
      areasForImprovement: [
        'Could provide more specific examples',
        'Consider elaborating on past challenges',
        'Opportunity to showcase leadership experience',
      ],
      detailedFeedback: {
        technicalSkills:
          scores.technicalSkills > 0
            ? 'Demonstrated solid technical knowledge and understanding of key concepts.'
            : '',
        problemSolving:
          scores.problemSolving > 0
            ? 'Showed good analytical thinking and structured approach to problem-solving.'
            : '',
        communication:
          scores.communication > 0
            ? 'Clear and articulate communication with good structure in responses.'
            : '',
        leadership:
          scores.leadership > 0
            ? 'Showed potential for leadership with examples of team collaboration.'
            : '',
      },
      videoAnalysis: undefined,
      completedAt: new Date(),
    };
  }

  /**
   * Clean JSON response from AI to handle markdown formatting
   */
  private cleanJsonResponse(response: string): string {
    try {
      // Remove markdown code blocks
      let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Remove any leading/trailing whitespace
      cleaned = cleaned.trim();

      // Try to find JSON object boundaries
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }

      logger.info({
        message: 'Cleaned JSON response from AI',
        context: 'DemoService.cleanJsonResponse',
        originalLength: response.length,
        cleanedLength: cleaned.length,
        cleanedPreview: cleaned.substring(0, 100) + '...',
      });

      return cleaned;
    } catch (error) {
      logger.error({
        message: 'Failed to clean JSON response',
        context: 'DemoService.cleanJsonResponse',
        error: error instanceof Error ? error.message : String(error),
        originalResponse: response.substring(0, 200) + '...',
      });

      // Return original response if cleaning fails
      return response;
    }
  }
}
