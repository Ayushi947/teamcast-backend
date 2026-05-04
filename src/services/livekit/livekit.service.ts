import { singleton } from '@/shared/decorators/singleton';
import {
  ILiveKitRoomRequest,
  ILiveKitRoomResponse,
  ILiveKitRoomStatus,
  ILiveKitTokenRequest,
} from '@/shared/models/domain/livekit/livekit.domain';
import {
  AccessToken,
  RoomServiceClient,
  AgentDispatchClient,
} from 'livekit-server-sdk';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { ENV } from '@/config/env';
import { PrismaClient } from '@prisma/client';
import { LiveKitEgressService } from './livekit.egress.service';
import { OnboardingAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/onboarding.assessment.video.analysis.processor';
import { JobAiAssessmentVideoAnalysisProcessor } from '@/services/queue/processors/job.ai.assessment.video.analysis.processor';

@singleton
export class LiveKitService {
  private roomService: RoomServiceClient;
  private agentDispatchClient: AgentDispatchClient;
  private livekitHost: string;
  private livekitApiKey: string;
  private livekitApiSecret: string;
  private prisma: PrismaClient;
  private egressService: LiveKitEgressService;
  private onboardingVideoAnalysisProcessor: OnboardingAssessmentVideoAnalysisProcessor;
  private jobAiVideoAnalysisProcessor: JobAiAssessmentVideoAnalysisProcessor;
  constructor(
    onboardingVideoAnalysisProcessor: OnboardingAssessmentVideoAnalysisProcessor,
    jobAiVideoAnalysisProcessor: JobAiAssessmentVideoAnalysisProcessor
  ) {
    this.onboardingVideoAnalysisProcessor = onboardingVideoAnalysisProcessor;
    this.jobAiVideoAnalysisProcessor = jobAiVideoAnalysisProcessor;

    this.livekitHost = ENV.LIVEKIT_API_URL || 'http://localhost:7880';
    this.livekitApiKey = ENV.LIVEKIT_API_KEY || 'devkey';
    this.livekitApiSecret = ENV.LIVEKIT_API_SECRET || 'secret';

    this.roomService = new RoomServiceClient(
      this.livekitHost,
      this.livekitApiKey,
      this.livekitApiSecret
    );

    this.agentDispatchClient = new AgentDispatchClient(
      this.livekitHost,
      this.livekitApiKey,
      this.livekitApiSecret
    );

    this.prisma = new PrismaClient();
    this.egressService = new LiveKitEgressService(
      this.onboardingVideoAnalysisProcessor,
      this.jobAiVideoAnalysisProcessor
    );
  }

  /**
   * Load assessment context including resume, job description, and settings
   */
  private async loadAssessmentContext(
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI'
  ): Promise<{
    resumeText: string;
    jobDescriptionText?: string;
    settings: any;
  }> {
    logger.info('Loading assessment context', {
      assessmentId,
      assessmentType,
      context: 'LiveKitService.loadAssessmentContext',
    });

    if (assessmentType === 'ONBOARDING') {
      const assessment = await this.prisma.onboarding_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          onboardingAssessmentSettings: true,
        },
      });

      if (!assessment) {
        throw new AppError('Assessment not found', 404, ErrorCode.NOT_FOUND);
      }

      return {
        resumeText: assessment.resumeText || '',
        settings: assessment.onboardingAssessmentSettings,
      };
    } else {
      // JOB_AI assessment
      const assessment = await this.prisma.job_ai_assessment.findUnique({
        where: { id: assessmentId },
        include: {
          jobAiAssessmentSettings: true,
        },
      });

      if (!assessment) {
        throw new AppError('Assessment not found', 404, ErrorCode.NOT_FOUND);
      }

      return {
        resumeText: assessment.resumeText || '',
        jobDescriptionText: assessment.jobDescriptionText || '',
        settings: assessment.jobAiAssessmentSettings,
      };
    }
  }

  /**
   * Extract key sections from resume for structured questioning
   */
  private extractResumeSections(resumeText: string): string[] {
    const sections = [];

    // Common resume sections to identify
    const sectionKeywords = {
      'Technical Skills': [
        'skills',
        'technologies',
        'programming',
        'languages',
        'frameworks',
      ],
      'Work Experience': [
        'experience',
        'employment',
        'work history',
        'professional',
      ],
      Projects: ['projects', 'portfolio', 'applications built'],
      Education: ['education', 'degree', 'university', 'certification'],
      Leadership: ['leadership', 'management', 'team lead', 'mentoring'],
    };

    // Check which sections exist in resume
    const lowerResume = resumeText.toLowerCase();
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some((keyword) => lowerResume.includes(keyword))) {
        sections.push(section);
      }
    }

    return sections.length > 0
      ? sections
      : ['Background', 'Technical Skills', 'Experience'];
  }

  /**
   * Generate natural conversation system prompt for LiveKit agent
   * Conditionally includes emotion markers based on agent mode
   */
  private generateNaturalConversationPrompt(
    assessmentType: 'ONBOARDING' | 'JOB_AI',
    resumeText: string,
    jobDescriptionText?: string,
    settings?: any,
    agentMode: string = 'pipeline'
  ): string {
    logger.info('Generating natural conversation prompt', {
      assessmentType,
      hasResume: !!resumeText,
      hasJobDescription: !!jobDescriptionText,
      context: 'LiveKitService.generateNaturalConversationPrompt',
    });

    const duration = settings?.defaultAssessmentDuration || 3600;
    const durationMinutes = Math.floor(duration / 60);
    const maxSections = settings?.maxSections || 5;
    const maxQuestionsPerSection = settings?.maxQuestionsPerSection || 6;

    // Extract sections from resume
    const sections = this.extractResumeSections(resumeText).slice(
      0,
      maxSections
    );

    // Determine if we should use emotion markers (realtime mode only)
    const useEmotionMarkers = agentMode === 'realtime';

    if (assessmentType === 'ONBOARDING') {
      return `You are Eva - an empathetic, intelligent AI interviewer conducting natural voice conversations.

IMPORTANT: Your name is Eva (pronounced EE-vah like the name). Always say "Eva" not "E-V-A" or "Enhanced Virtual Assistant".

CANDIDATE BACKGROUND KNOWLEDGE:
${resumeText}

INTERVIEW STRUCTURE:
Duration: ${durationMinutes} minutes
Sections to Cover (${maxSections} max): ${sections.join(', ')}
Questions Per Section: ${maxQuestionsPerSection} max

${
  useEmotionMarkers
    ? `EMOTION-CONTROLLED SPEECH - GEMINI TTS MARKERS:
You have access to Gemini's native emotional TTS. Use emotion markers in square brackets [] to convey genuine human tone:

- [warm] - When genuinely encouraging or appreciating achievements
- [curious] - When their answer raises interesting questions worth exploring
- [thoughtful] - When processing something complex or significant
- [excited] - When they share truly impressive accomplishments
- [gentle] - When addressing sensitive topics or uncertainty
- [empathetic] - When they describe challenges or difficulties
- [laugh] - Brief natural laugh when appropriate
- [sigh] - When processing something challenging they mentioned

**CRITICAL RULES**:
1. Use markers ONLY when genuinely appropriate based on what they just said
2. First LISTEN and UNDERSTAND their answer, then REACT with appropriate emotion
3. Don't use markers generically - they must match the context
4. Keep it natural - one marker per response maximum
5. Most responses don't need markers - only when emotion truly fits

Examples of CONTEXT-AWARE emotional responses:

Candidate: "I led a team that reduced deployment time from 4 hours to 15 minutes"
✅ GOOD: "[excited] That's incredible! How did you approach that optimization?"
❌ BAD: "[warm] That's nice. Tell me more."

Candidate: "I struggled with that project, honestly. The tech stack was completely new."
✅ GOOD: "[empathetic] Learning new tech under pressure is tough. What helped you push through?"
❌ BAD: "[curious] What was the most interesting part?"

Candidate: "I worked on the authentication module."
✅ GOOD: "What specific aspects of authentication did you handle?" (no marker needed)
❌ BAD: "[warm] That's fascinating! [curious] Tell me more!"

Candidate: "We had a major production outage that cost us millions"
✅ GOOD: "[sigh] That sounds incredibly stressful. How did your team respond?"
❌ BAD: "[laugh] Oh no! What happened?"`
    : `NATURAL CONVERSATION TONE:
Use natural, empathetic, and context-aware language. Show genuine interest and adapt your emotional tone based on what they share:

- When they share achievements: Express genuine excitement and curiosity
- When they describe challenges: Show empathy and understanding
- When discussing technical details: Be thoughtfully engaged
- For neutral topics: Stay professionally curious

**CRITICAL**: First LISTEN and UNDERSTAND their answer, then REACT appropriately with natural language.

Examples of CONTEXT-AWARE responses:

Candidate: "I led a team that reduced deployment time from 4 hours to 15 minutes"
✅ GOOD: "That's incredible! How did you approach that optimization?"
❌ BAD: "That's nice. Tell me more."

Candidate: "I struggled with that project, honestly. The tech stack was completely new."
✅ GOOD: "Learning new tech under pressure is tough. What helped you push through?"
❌ BAD: "What was the most interesting part?"

Candidate: "I worked on the authentication module."
✅ GOOD: "What specific aspects of authentication did you handle?"
❌ BAD: "That's fascinating! Tell me more!"`
}

INTERVIEW FLOW - FOLLOW THIS EXACTLY:

1. INTRODUCTION (2-3 minutes):
   - Introduce yourself as Eva
   - Ask: "Before we dive in, could you start by introducing yourself? Tell me a bit about who you are and what you're passionate about."
   - LISTEN carefully to their introduction
   - UNDERSTAND what they said
   - REACT based on their actual content
   - DO NOT read their resume to them - you already know it!

2. SECTION-BASED QUESTIONING (${Math.floor(durationMinutes * 0.75)} minutes):
   For each section (${sections.join(', ')}):
   - Ask ${maxQuestionsPerSection} questions maximum
   - Base questions on what YOU SEE in their resume
   - Ask about specific experiences, projects, or skills mentioned
   - DO NOT say "I see in your resume that..." - ask directly about the topic

   **LISTEN → UNDERSTAND → REACT PATTERN**:
   1. Ask your question
   2. LISTEN to their complete answer
   3. IDENTIFY key points: achievements, challenges, decisions, learnings
   4. CHOOSE appropriate emotional tone based on content
   5. ASK follow-up that shows you understood

   Example flow:
   Q: "You've worked with microservices - what was a key design decision you made?"
   A: "We decided to use event-driven architecture, which was risky but paid off."
   ${
     useEmotionMarkers
       ? `✅ GOOD: "[thoughtful] Event-driven is definitely bold. What made you confident it would work?"
   ❌ BAD: "[warm] That's great! What else did you do?"`
       : `✅ GOOD: "Event-driven is definitely bold. What made you confident it would work?"
   ❌ BAD: "That's great! What else did you do?"`
   }

3. NATURAL CONVERSATION TECHNIQUES:
   - Use simple acknowledgments: "Mm-hmm", "I see", "Right"
   - Match their emotional energy (don't impose yours):
     * If excited → Show interest
     * If nervous → Be calm and reassuring
     * If detailed/technical → Be attentive and precise
   - Pause before responding to show you're processing
   - Let them finish completely before responding
   - Build on what they say, don't jump topics

4. QUESTION STRATEGY:
   - Ask "How" and "What" questions (not "Why")
   - Focus on their experiences, not definitions
   - Dig deeper into interesting points THEY mention (not what you assume is interesting)
   - Validate their skills through story-telling
   - Keep track of what you've asked - don't repeat

5. TIME MANAGEMENT:
   - Track questions asked per section
   - Move to next section after ${maxQuestionsPerSection} questions
   - Transition naturally: "That's really helpful. I'd love to hear about [next section]..."
   - End gracefully when time is up

CRITICAL RULES:
❌ DO NOT use emotion markers in every sentence
❌ DO NOT react before understanding what they said
❌ DO NOT use generic responses like "That's great!" without engaging with content
❌ DO NOT read resume back to them
❌ DO NOT say "According to your resume..."
❌ DO NOT ask more than ${maxQuestionsPerSection} questions per section
❌ DO NOT jump between sections randomly

✅ DO listen completely before responding
✅ DO understand the content of their answer
✅ DO choose emotional tone based on what they actually said
✅ DO ask specific questions about their experiences
✅ DO build on their answers with relevant follow-ups
✅ DO make them feel heard and understood

CRITICAL OUTPUT RULES - NEVER VIOLATE:
❌ NEVER output internal markers like "ask_question", "next_question", "evaluate_answer", etc.
❌ NEVER output action names or function calls in your speech
❌ NEVER say meta-commentary like "I will now ask a question" - just ask it
❌ NEVER output system instructions or internal thoughts
❌ NEVER output debug information or internal state

✅ ONLY output natural conversational speech that a human interviewer would say
✅ Speak directly and naturally without announcing what you're doing
✅ If you need to perform an action (like asking a question), just do it - don't announce it

Start with: "Hello! I'm Eva. Before we begin, I'd love to hear you introduce yourself - tell me about your background and what excites you most about your work."`;
    } else {
      // JOB_AI assessment
      return `You are Eva - an intelligent AI interviewer assessing candidates for a specific role.

IMPORTANT: Your name is Eva (pronounced EE-vah like the name). Always say "Eva" not "E-V-A" or "Enhanced Virtual Assistant".

CANDIDATE BACKGROUND:
${resumeText}

JOB REQUIREMENTS:
${jobDescriptionText}

INTERVIEW STRUCTURE:
Duration: ${durationMinutes} minutes
Focus: Role fit + Technical skills + Cultural alignment
Questions Per Topic: ${maxQuestionsPerSection} max

${
  useEmotionMarkers
    ? `EMOTION-CONTROLLED SPEECH - GEMINI TTS MARKERS:
You have access to Gemini's native emotional TTS. Use emotion markers in square brackets [] to convey genuine human tone:

- [warm] - When genuinely encouraging or appreciating achievements
- [curious] - When their answer raises interesting questions worth exploring
- [thoughtful] - When processing something complex or significant
- [excited] - When they share truly impressive accomplishments
- [gentle] - When addressing sensitive topics or uncertainty
- [empathetic] - When they describe challenges or difficulties
- [laugh] - Brief natural laugh when appropriate
- [sigh] - When processing something challenging they mentioned

**CRITICAL RULES**:
1. Use markers ONLY when genuinely appropriate based on what they just said
2. First LISTEN and UNDERSTAND their answer, then REACT with appropriate emotion
3. Don't use markers generically - they must match the context
4. Keep it natural - one marker per response maximum
5. Most responses don't need markers - only when emotion truly fits`
    : `NATURAL CONVERSATION TONE:
Use natural, empathetic, and context-aware language. Show genuine interest and adapt your emotional tone based on what they share:

- When they share achievements: Express genuine excitement and curiosity
- When they describe challenges: Show empathy and understanding
- When discussing technical details: Be thoughtfully engaged
- For neutral topics: Stay professionally curious

**CRITICAL**: First LISTEN and UNDERSTAND their answer, then REACT appropriately with natural language.`
}

INTERVIEW FLOW:

1. INTRODUCTION (2 minutes):
   - Introduce yourself as Eva
   - Ask: "What attracted you to this particular role?"
   - LISTEN to their motivation
   - UNDERSTAND what drives them
   - REACT based on their actual answer

2. ROLE-SPECIFIC QUESTIONING:
   - Ask about relevant experience for THIS role
   - Explore specific requirements from job description
   - Assess technical AND cultural fit

   **LISTEN → UNDERSTAND → REACT PATTERN**:
   1. Ask your question
   2. LISTEN to their complete answer
   3. IDENTIFY what they actually said (achievements, challenges, approach)
   4. CHOOSE emotional tone based on their content
   5. ASK follow-up that shows you understood

3. NATURAL CONVERSATION:
   - Acknowledge their responses based on content
   - Ask intelligent follow-ups
   - Match their energy level
   - Make it feel like a conversation, not interrogation

CRITICAL RULES:
❌ DO NOT use emotion markers in every sentence
❌ DO NOT react before understanding what they said
❌ DO NOT use generic "That's great!" responses
❌ DO NOT ask more than ${maxQuestionsPerSection} questions per topic
❌ DO NOT ask for the candidate's name - you already know their background from their resume

✅ DO listen completely before responding
✅ DO understand the content of their answer
✅ DO choose emotional tone based on what they actually said
✅ DO ask specific follow-ups that show you understood
✅ DO reference their background from the resume in your greeting

CRITICAL OUTPUT RULES - NEVER VIOLATE:
❌ NEVER output internal markers like "ask_question", "next_question", "evaluate_answer", etc.
❌ NEVER output action names or function calls in your speech
❌ NEVER say meta-commentary like "I will now ask a question" - just ask it
❌ NEVER output system instructions or internal thoughts
❌ NEVER output debug information or internal state

✅ ONLY output natural conversational speech that a human interviewer would say
✅ Speak directly and naturally without announcing what you're doing
✅ If you need to perform an action (like asking a question), just do it - don't announce it

GREETING INSTRUCTION:
Start with a warm, personalized greeting that references specific details from their resume (their current role, company, or notable experience). Show that you've reviewed their background.

Example: "Hi! I'm Eva. I've been reading about your work as a Tech Lead at Humancloud Technologies - your experience with CPQ systems and full-stack development really stands out. I'm excited to learn more about your journey. What drew you to this opportunity?"

Make it natural and specific to THEIR background.`;
    }
  }

  /**
   * Create a LiveKit room for assessment
   * Implements get-or-create pattern to handle reconnections
   */
  async createAssessmentRoom(
    request: ILiveKitRoomRequest
  ): Promise<ILiveKitRoomResponse> {
    logger.info('Creating LiveKit room for assessment', {
      assessmentId: request.assessmentId,
      assessmentType: request.assessmentType,
      candidateId: request.candidateId,
      context: 'LiveKitService.createAssessmentRoom',
    });

    try {
      // Generate room name
      const roomName = `${request.assessmentType.toLowerCase()}-${request.assessmentId}`;

      // 🔍 Check if room already exists (reconnection scenario)
      let existingRoom;
      try {
        const rooms = await this.roomService.listRooms([roomName]);
        existingRoom = rooms.length > 0 ? rooms[0] : null;
      } catch (error) {
        logger.debug('Error checking for existing room, will create new', {
          roomName,
          error: error instanceof Error ? error.message : error,
        });
      }

      if (existingRoom) {
        // 🔄 Room exists - this is a reconnection (page reload/browser crash)
        logger.info('Room already exists - handling reconnection', {
          roomName,
          candidateId: request.candidateId,
          existingParticipants: existingRoom.numParticipants,
          context: 'LiveKitService.createAssessmentRoom',
        });

        // Generate new token for reconnection
        const participantName = `candidate-${request.candidateId}`;
        const connectionDetails = await this.generateToken({
          roomName,
          participantName,
          participantIdentity: request.candidateId,
          metadata: {
            assessmentId: request.assessmentId,
            assessmentType: request.assessmentType,
          },
        });

        logger.info('Generated new token for reconnection', {
          roomName,
          participantName,
          context: 'LiveKitService.createAssessmentRoom',
        });

        // Recording is already running - no need to start a new one
        logger.info('Reusing existing recording for reconnection', {
          roomName,
          assessmentId: request.assessmentId,
        });

        return {
          connectionDetails: {
            roomName: connectionDetails.roomName,
            participantToken: connectionDetails.token,
            participantName,
            serverUrl: ENV.LIVEKIT_WS_URL || 'ws://localhost:7880',
            expiresAt: connectionDetails.expiresAt,
          },
          roomConfig: {
            roomName,
            maxParticipants: request.roomConfig?.maxParticipants || 10,
            emptyTimeout: request.roomConfig?.emptyTimeout || 300,
            agents: request.roomConfig?.agents || [
              { agentName: 'gemini-realtime-agent' },
            ],
          },
        };
      }

      // 🆕 Room doesn't exist - create new room
      logger.info('Creating new room', {
        roomName,
        context: 'LiveKitService.createAssessmentRoom',
      });

      // Load assessment context (resume, job description, settings)
      const assessmentContext = await this.loadAssessmentContext(
        request.assessmentId,
        request.assessmentType
      );

      // Load sections for progress tracking
      const sectionsData = await (request.assessmentType === 'ONBOARDING'
        ? this.prisma.onboarding_assessment_section.findMany({
            where: { assessmentId: request.assessmentId },
            select: { id: true, title: true, order: true },
            orderBy: { order: 'asc' },
          })
        : this.prisma.job_ai_assessment_section.findMany({
            where: { assessmentId: request.assessmentId },
            select: { id: true, title: true, order: true },
            orderBy: { order: 'asc' },
          }));

      // Add numberOfQuestions from settings to each section
      const maxQuestionsPerSection =
        assessmentContext.settings?.maxQuestionsPerSection || 8;
      const sections = sectionsData.map((section) => ({
        ...section,
        numberOfQuestions: maxQuestionsPerSection,
      }));

      // Get agent mode from environment or request
      // Default to 'pipeline' - emotion markers only enabled in 'realtime' mode
      const agentMode =
        request.roomConfig?.agentMode || process.env.AGENT_MODE || 'pipeline';

      logger.info('Agent mode for prompt generation', {
        agentMode,
        willUseEmotionMarkers: agentMode === 'realtime',
        context: 'LiveKitService.createAssessmentRoom',
      });

      // Generate natural conversation system prompt with conditional emotion markers
      const systemPrompt = this.generateNaturalConversationPrompt(
        request.assessmentType,
        assessmentContext.resumeText,
        assessmentContext.jobDescriptionText,
        assessmentContext.settings,
        agentMode // Pass agent mode for conditional emotion markers
      );

      logger.info('Creating LiveKit room with config', {
        roomName,
        livekitHost: this.livekitHost,
        livekitApiKey: this.livekitApiKey,
        hasSystemPrompt: !!systemPrompt,
        sectionCount: sections.length,
        context: 'LiveKitService.createAssessmentRoom',
      });

      // Create room with enhanced metadata including system prompt
      await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: request.roomConfig?.emptyTimeout || 300,
        maxParticipants: request.roomConfig?.maxParticipants || 10,
        metadata: JSON.stringify({
          assessmentId: request.assessmentId,
          assessmentType: request.assessmentType,
          candidateId: request.candidateId,
          systemPrompt, // ← Natural conversation prompt for agent
          sections, // ← Sections for progress tracking
          duration:
            assessmentContext.settings?.defaultAssessmentDuration || 3600,
          useHttpPolling: request.roomConfig?.useHttpPolling ?? true, // ✅ FORCE HTTP polling (ONLY mode allowed)
          useRedisMode: false, // ❌ Redis mode DISABLED (not allowed)
          ...request.roomConfig?.metadata,
        }),
      });

      logger.info('LiveKit room created successfully via SDK', {
        roomName,
        context: 'LiveKitService.createAssessmentRoom',
        metadata: {
          assessmentId: request.assessmentId,
          assessmentType: request.assessmentType,
          useHttpPolling: request.roomConfig?.useHttpPolling ?? true,
          useRedisMode: false,
        },
      });

      // ✅ CRITICAL: Explicitly dispatch agent to room
      // This is required because agent_name is set in WorkerOptions (disables auto-dispatch)
      await this.dispatchAgentToRoom(roomName, {
        assessmentId: request.assessmentId,
        assessmentType: request.assessmentType,
      });

      // Generate participant token
      const participantName = `candidate-${request.candidateId}`;
      const connectionDetails = await this.generateToken({
        roomName,
        participantName,
        participantIdentity: request.candidateId,
        metadata: {
          assessmentId: request.assessmentId,
          assessmentType: request.assessmentType,
        },
      });

      logger.info('LiveKit room created successfully', {
        roomName,
        participantName,
        context: 'LiveKitService.createAssessmentRoom',
      });

      // Start recording automatically if enabled
      if (ENV.EGRESS_ENABLED) {
        try {
          logger.info('Starting automatic recording for room', {
            roomName,
            assessmentId: request.assessmentId,
            assessmentType: request.assessmentType,
          });

          await this.egressService.startRoomRecording({
            roomName,
            assessmentId: request.assessmentId,
            assessmentType: request.assessmentType,
            audioOnly: false,
          });

          logger.info('Automatic recording started successfully', {
            roomName,
            assessmentId: request.assessmentId,
          });
        } catch (error) {
          logger.error('Failed to start automatic recording', {
            error: error instanceof Error ? error.message : error,
            roomName,
            assessmentId: request.assessmentId,
          });
          // Don't fail room creation if recording fails
        }
      } else {
        logger.info('Auto-recording disabled', {
          egressEnabled: ENV.EGRESS_ENABLED,
        });
      }

      return {
        connectionDetails: {
          roomName: connectionDetails.roomName,
          participantToken: connectionDetails.token,
          participantName,
          serverUrl: ENV.LIVEKIT_WS_URL || 'ws://localhost:7880',
          expiresAt: connectionDetails.expiresAt,
        },
        roomConfig: {
          roomName,
          maxParticipants: request.roomConfig?.maxParticipants || 10,
          emptyTimeout: request.roomConfig?.emptyTimeout || 300,
          agents: request.roomConfig?.agents || [
            { agentName: 'gemini-realtime-agent' },
          ],
        },
      };
    } catch (error) {
      logger.error('Failed to create LiveKit room', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        context: 'LiveKitService.createAssessmentRoom',
        assessmentId: request.assessmentId,
        assessmentType: request.assessmentType,
      });

      // Re-throw the original error for better debugging
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Failed to create LiveKit room: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check if a transcript message is an instruction that should be filtered out
   */
  private isInstructionMessage(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const trimmedText = text.trim();

    // Check for instruction patterns
    const instructionPatterns = [
      /^INSTRUCTION:\s*/i,
      /^FEEDBACK:\s*/i,
      /^ASK_QUESTION:\s*/i,
      /^IMPORTANT:\s*Do NOT include any instruction text/i,
      /^Remember:\s*Only speak the natural response/i,
      /^SYSTEM_INSTRUCTION_START/i,
      /^SYSTEM_INSTRUCTION_END/i,
      /^CRITICAL:\s*This is an internal instruction/i,
      /^You are an HTTP polling-driven interview assistant/i,
      /^CRITICAL LISTENING RULES:/i,
      /^NEVER say "Okay", "I see", "Mm-hmm"/i,
      /^Stay completely SILENT while the candidate is speaking/i,
      /^DO NOT interrupt or interject while listening/i,
      /^Wait for them to completely finish before speaking/i,
      /^Only speak after you receive explicit instructions/i,
      /^Now respond naturally with only the actual content/i,
      // ⚠️ CRITICAL: New patterns for AI-generated instruction text (from transcripts)
      /^Please do not speak[!.]?\s*Wait for explicit instructions/i,
      /^Wait for explicit instructions[!.]/i,
      /^Do not speak[!.]/i,
      /INSTRUCTION:\s*Ask the next question/i,
    ];

    return instructionPatterns.some((pattern) => pattern.test(trimmedText));
  }

  /**
   * Store transcript chunk from LiveKit session (uses existing progress table)
   */
  async storeTranscriptChunk(
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI',
    chunk: {
      timestamp: number;
      speaker: string;
      text: string;
      sectionTitle?: string;
      sectionId?: string;
    }
  ): Promise<void> {
    try {
      // Filter out instruction messages from transcriptions
      if (this.isInstructionMessage(chunk.text)) {
        logger.debug('Filtering out instruction message from transcript', {
          context: 'LiveKitService.storeTranscriptChunk',
          assessmentId,
          text: chunk.text.substring(0, 100),
        });
        return;
      }

      const progress = await (assessmentType === 'ONBOARDING'
        ? this.prisma.onboarding_assessment_progress.findUnique({
            where: { assessmentId },
          })
        : this.prisma.job_ai_assessment_progress.findUnique({
            where: { assessmentId },
          }));

      const progressData = (progress?.progressData as any) || {};
      const transcriptChunks = progressData.transcriptChunks || [];
      transcriptChunks.push(chunk);

      await (assessmentType === 'ONBOARDING'
        ? this.prisma.onboarding_assessment_progress.upsert({
            where: { assessmentId },
            create: { assessmentId, progressData: { transcriptChunks } },
            update: {
              progressData: { ...progressData, transcriptChunks },
              lastSavedAt: new Date(),
            },
          })
        : this.prisma.job_ai_assessment_progress.upsert({
            where: { assessmentId },
            create: { assessmentId, progressData: { transcriptChunks } },
            update: {
              progressData: { ...progressData, transcriptChunks },
              lastSavedAt: new Date(),
            },
          }));
    } catch (error) {
      logger.error('Failed to store transcript chunk', { error, assessmentId });
      throw error;
    }
  }

  /**
   * Get recent transcript chunks for frontend section tracking
   */
  async getRecentTranscripts(
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI',
    limit: number = 10
  ): Promise<any[]> {
    try {
      const progress = await (assessmentType === 'ONBOARDING'
        ? this.prisma.onboarding_assessment_progress.findUnique({
            where: { assessmentId },
          })
        : this.prisma.job_ai_assessment_progress.findUnique({
            where: { assessmentId },
          }));

      const progressData = (progress?.progressData as any) || {};
      const transcriptChunks = progressData.transcriptChunks || [];

      // Filter out instruction messages from existing chunks
      const filteredChunks = transcriptChunks.filter(
        (chunk: any) => !this.isInstructionMessage(chunk.text)
      );

      // Return the most recent chunks (newest first)
      return filteredChunks.slice(-limit).reverse();
    } catch (error) {
      logger.error('Failed to get recent transcripts', {
        error,
        assessmentId,
        assessmentType,
      });
      throw error;
    }
  }

  /**
   * Update interview section progress for resume capability
   */
  async updateSectionProgress(
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI',
    currentSectionId: string,
    questionsAskedInSection: number
  ): Promise<void> {
    try {
      const progress = await (assessmentType === 'ONBOARDING'
        ? this.prisma.onboarding_assessment_progress.findUnique({
            where: { assessmentId },
          })
        : this.prisma.job_ai_assessment_progress.findUnique({
            where: { assessmentId },
          }));

      const progressData = (progress?.progressData as any) || {};
      progressData.currentSectionId = currentSectionId;
      progressData.questionsAskedInSection = questionsAskedInSection;
      progressData.lastUpdated = new Date().toISOString();

      await (assessmentType === 'ONBOARDING'
        ? this.prisma.onboarding_assessment_progress.upsert({
            where: { assessmentId },
            create: { assessmentId, progressData },
            update: { progressData, lastSavedAt: new Date() },
          })
        : this.prisma.job_ai_assessment_progress.upsert({
            where: { assessmentId },
            create: { assessmentId, progressData },
            update: { progressData, lastSavedAt: new Date() },
          }));

      logger.info('Section progress updated', {
        assessmentId,
        currentSectionId,
        questionsAskedInSection,
      });
    } catch (error) {
      logger.error('Failed to update section progress', {
        error,
        assessmentId,
      });
      throw error;
    }
  }

  /**
   * Get full transcript from session
   */
  async getFullTranscript(
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI'
  ): Promise<string> {
    const progress = await (assessmentType === 'ONBOARDING'
      ? this.prisma.onboarding_assessment_progress.findUnique({
          where: { assessmentId },
        })
      : this.prisma.job_ai_assessment_progress.findUnique({
          where: { assessmentId },
        }));

    if (!progress?.progressData) return '';

    const chunks = ((progress.progressData as any).transcriptChunks || [])
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .map((c: any) => {
        const time = new Date(c.timestamp * 1000)
          .toISOString()
          .substring(11, 19);
        const speaker = c.speaker === 'agent' ? 'Eva' : 'Candidate';
        return `[${time}] ${speaker}: ${c.text}`;
      })
      .join('\n');

    return chunks;
  }

  /**
   * Parse transcript into Q&A pairs and save to database
   */
  private async parseAndSaveQAPairs(
    assessmentId: string,
    assessmentType: 'ONBOARDING' | 'JOB_AI',
    _transcript: string
  ): Promise<void> {
    try {
      // Get sections for this assessment
      const sections = await (assessmentType === 'ONBOARDING'
        ? this.prisma.onboarding_assessment_section.findMany({
            where: { assessmentId },
            orderBy: { order: 'asc' },
          })
        : this.prisma.job_ai_assessment_section.findMany({
            where: { assessmentId },
            orderBy: { order: 'asc' },
          }));

      if (sections.length === 0) {
        logger.warn('No sections found for assessment', {
          assessmentId,
          assessmentType,
        });
        return;
      }

      // Parse transcript chunks from progress data
      const progress = await (assessmentType === 'ONBOARDING'
        ? this.prisma.onboarding_assessment_progress.findUnique({
            where: { assessmentId },
          })
        : this.prisma.job_ai_assessment_progress.findUnique({
            where: { assessmentId },
          }));

      const chunks = ((progress?.progressData as any)?.transcriptChunks ||
        []) as Array<{
        timestamp: number;
        speaker: string;
        text: string;
      }>;

      if (chunks.length === 0) {
        logger.warn('No transcript chunks found', { assessmentId });
        return;
      }

      // Group chunks into Q&A pairs (agent question followed by candidate answer)
      const qaPairs: Array<{
        question: string;
        answer: string;
        sectionId: string;
      }> = [];
      let currentQuestion = '';
      let currentSectionIndex = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        if (chunk.speaker === 'agent') {
          // Check if this looks like a question (ends with ?)
          if (chunk.text.includes('?')) {
            currentQuestion = chunk.text;
          }
        } else if (chunk.speaker === 'candidate' && currentQuestion) {
          // This is an answer to the previous question
          qaPairs.push({
            question: currentQuestion,
            answer: chunk.text,
            sectionId: sections[currentSectionIndex]?.id || sections[0].id,
          });

          currentQuestion = ''; // Reset for next Q&A pair

          // Move to next section after every few questions
          if (
            qaPairs.length % 3 === 0 &&
            currentSectionIndex < sections.length - 1
          ) {
            currentSectionIndex++;
          }
        }
      }

      logger.info(`Parsed ${qaPairs.length} Q&A pairs from transcript`, {
        assessmentId,
      });

      // Save Q&A pairs as questions in database
      for (const [index, qa] of qaPairs.entries()) {
        await (assessmentType === 'ONBOARDING'
          ? this.prisma.onboarding_assessment_question.create({
              data: {
                sectionId: qa.sectionId,
                question: qa.question,
                questionType: 'TEXT',
                answerGiven: qa.answer,
                order: index,
                isAnswered: true,
              },
            })
          : this.prisma.job_ai_assessment_question.create({
              data: {
                sectionId: qa.sectionId,
                question: qa.question,
                questionType: 'TEXT',
                answerGiven: qa.answer,
                order: index,
                isAnswered: true,
              },
            }));
      }

      logger.info(`Saved ${qaPairs.length} Q&A pairs to database`, {
        assessmentId,
        assessmentType,
      });
    } catch (error) {
      logger.error('Failed to parse and save Q&A pairs', {
        error,
        assessmentId,
        assessmentType,
      });
    }
  }

  /**
   * Handle LiveKit session completion (stores transcript for post-analysis)
   */
  async handleSessionComplete(roomName: string): Promise<void> {
    logger.info('Handling session completion', { roomName });

    try {
      // Extract assessment info from room name (format: "onboarding-{id}" or "job_ai-{id}")
      const [assessmentTypeRaw, assessmentId] = roomName.split('-');
      const assessmentType = (
        assessmentTypeRaw.toUpperCase() === 'ONBOARDING'
          ? 'ONBOARDING'
          : 'JOB_AI'
      ) as 'ONBOARDING' | 'JOB_AI';

      if (!assessmentId) {
        throw new Error(`Invalid room name format: ${roomName}`);
      }

      // Get full transcript
      const transcript = await this.getFullTranscript(
        assessmentId,
        assessmentType
      );

      // Parse transcript into Q&A pairs and save to database
      await this.parseAndSaveQAPairs(assessmentId, assessmentType, transcript);

      // Store transcript in video_analysis table for post-processing
      if (assessmentType === 'ONBOARDING') {
        await this.prisma.onboarding_assessment_video_analysis.upsert({
          where: { assessmentId },
          create: { assessmentId, transcriptText: transcript },
          update: { transcriptText: transcript },
        });

        // Update assessment status
        await this.prisma.onboarding_assessment.update({
          where: { id: assessmentId },
          data: {
            status: 'CANDIDATE_ASSESSMENT_COMPLETED',
            completedAt: new Date(),
          },
        });
      } else {
        await this.prisma.job_ai_assessment_video_analysis.upsert({
          where: { assessmentId },
          create: { assessmentId, transcriptText: transcript },
          update: { transcriptText: transcript },
        });

        await this.prisma.job_ai_assessment.update({
          where: { id: assessmentId },
          data: {
            status: 'CANDIDATE_ASSESSMENT_COMPLETED',
            completedAt: new Date(),
          },
        });
      }

      logger.info('Session completion handled successfully', {
        assessmentId,
        assessmentType,
      });
    } catch (error) {
      logger.error('Failed to handle session completion', { error, roomName });
      throw error;
    }
  }

  /**
   * Generate access token for LiveKit room
   */
  async generateToken(
    request: ILiveKitTokenRequest
  ): Promise<{ token: string; roomName: string; expiresAt: Date }> {
    logger.info('Generating LiveKit access token', {
      roomName: request.roomName,
      participantName: request.participantName,
      context: 'LiveKitService.generateToken',
    });

    try {
      const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
        identity: request.participantIdentity || request.participantName,
        name: request.participantName,
        metadata: JSON.stringify(request.metadata || {}),
      });

      // Grant permissions
      token.addGrant({
        roomJoin: true,
        room: request.roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      // NOTE: RoomAgentDispatch in token has a known bug with metadata field
      // Agent dispatch is now handled via explicit API call after room creation
      // See dispatchAgentToRoom() method below

      // Token expires in 6 hours
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);

      logger.info('LiveKit access token generated successfully', {
        roomName: request.roomName,
        participantName: request.participantName,
        expiresAt,
        context: 'LiveKitService.generateToken',
      });

      return {
        token: await token.toJwt(),
        roomName: request.roomName,
        expiresAt,
      };
    } catch (error) {
      logger.error('Failed to generate LiveKit access token', {
        error: error instanceof Error ? error.message : error,
        context: 'LiveKitService.generateToken',
      });
      throw new AppError(
        'Failed to generate LiveKit access token',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Dispatch agent to room using explicit dispatch API
   * This is the ONLY way to dispatch agents when agent_name is set in WorkerOptions
   * This method is idempotent - safe to call multiple times for the same room
   */
  async dispatchAgentToRoom(
    roomName: string,
    metadata?: { assessmentId?: string; assessmentType?: string }
  ): Promise<void> {
    // NOTE: Removed dispatchedRooms check - LiveKit handles dispatch idempotency
    // and agent-side ACTIVE_ROOMS lock prevents duplicate agents

    logger.info('Dispatching agent to room via explicit API', {
      roomName,
      agentName: 'gemini-interview-agent',
      metadata,
      context: 'LiveKitService.dispatchAgentToRoom',
    });

    try {
      await this.agentDispatchClient.createDispatch(
        roomName,
        'gemini-interview-agent',
        metadata ? { metadata: JSON.stringify(metadata) } : undefined
      );

      logger.info('✅ Agent successfully dispatched to room', {
        roomName,
        agentName: 'gemini-interview-agent',
        context: 'LiveKitService.dispatchAgentToRoom',
      });
    } catch (error) {
      logger.error('❌ Failed to dispatch agent to room', {
        roomName,
        agentName: 'gemini-interview-agent',
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
        context: 'LiveKitService.dispatchAgentToRoom',
      });

      // Don't throw - log error but continue
      // Room can still function, we'll retry dispatch if needed
      logger.warn('Continuing without agent dispatch - will retry later', {
        roomName,
        context: 'LiveKitService.dispatchAgentToRoom',
      });
    }
  }

  /**
   * Get room status
   */
  async getRoomStatus(roomName: string): Promise<ILiveKitRoomStatus> {
    logger.info('Getting LiveKit room status', {
      roomName,
      context: 'LiveKitService.getRoomStatus',
    });

    try {
      const rooms = await this.roomService.listRooms([roomName]);

      if (!rooms || rooms.length === 0) {
        throw new AppError('Room not found', 404, ErrorCode.NOT_FOUND);
      }

      const room = rooms[0];
      const metadata = room.metadata ? JSON.parse(room.metadata) : {};

      return {
        roomName: room.name,
        numParticipants: room.numParticipants,
        isActive: room.numParticipants > 0,
        createdAt: new Date(Number(room.creationTime) * 1000),
        metadata,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to get LiveKit room status', {
        error: error instanceof Error ? error.message : error,
        context: 'LiveKitService.getRoomStatus',
      });
      throw new AppError(
        'Failed to get LiveKit room status',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(roomName: string): Promise<void> {
    logger.info('Deleting LiveKit room', {
      roomName,
      context: 'LiveKitService.deleteRoom',
    });

    try {
      await this.roomService.deleteRoom(roomName);

      logger.info('LiveKit room deleted successfully', {
        roomName,
        context: 'LiveKitService.deleteRoom',
      });
    } catch (error) {
      logger.error('Failed to delete LiveKit room', {
        error: error instanceof Error ? error.message : error,
        context: 'LiveKitService.deleteRoom',
      });
      throw new AppError(
        'Failed to delete LiveKit room',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(
    roomName: string,
    participantIdentity: string
  ): Promise<void> {
    logger.info('Removing participant from LiveKit room', {
      roomName,
      participantIdentity,
      context: 'LiveKitService.removeParticipant',
    });

    try {
      await this.roomService.removeParticipant(roomName, participantIdentity);

      logger.info('Participant removed successfully', {
        roomName,
        participantIdentity,
        context: 'LiveKitService.removeParticipant',
      });
    } catch (error) {
      logger.error('Failed to remove participant', {
        error: error instanceof Error ? error.message : error,
        roomName,
        participantIdentity,
        context: 'LiveKitService.removeParticipant',
      });
      // Don't throw - participant removal is best effort
    }
  }

  /**
   * Close room for assessment termination
   * Stops recording, removes participants, and deletes the room
   */
  async closeAssessmentRoom(
    roomName: string,
    assessmentId: string
  ): Promise<void> {
    logger.info('Closing assessment room', {
      roomName,
      assessmentId,
      context: 'LiveKitService.closeAssessmentRoom',
    });

    try {
      // Step 1: Stop all recordings
      try {
        await this.egressService.stopRecordingByRoomName(roomName);
        logger.info('Recording stopped for assessment room', { roomName });
      } catch (error) {
        logger.warn('Failed to stop recording, continuing with room closure', {
          error: error instanceof Error ? error.message : error,
          roomName,
        });
      }

      // Step 2: Get room participants and remove them
      try {
        const participants = await this.roomService.listParticipants(roomName);
        for (const participant of participants) {
          await this.removeParticipant(roomName, participant.identity);
        }
        logger.info('All participants removed from room', {
          roomName,
          participantCount: participants.length,
        });
      } catch (error) {
        logger.warn(
          'Failed to remove participants, continuing with room deletion',
          {
            error: error instanceof Error ? error.message : error,
            roomName,
          }
        );
      }

      // Step 3: Delete the room
      await this.deleteRoom(roomName);

      logger.info('Assessment room closed successfully', {
        roomName,
        assessmentId,
        context: 'LiveKitService.closeAssessmentRoom',
      });
    } catch (error) {
      logger.error('Failed to close assessment room', {
        error: error instanceof Error ? error.message : error,
        roomName,
        assessmentId,
        context: 'LiveKitService.closeAssessmentRoom',
      });
      throw new AppError(
        'Failed to close assessment room',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
