import {
  ICandidateJobAiAssessmentQuestion,
  ICandidateJobAiAssessmentSection,
} from '@/shared/models/domain/candidate/job.ai.assessment.domain';
import { IAiJobAiAssessmentTask } from '../job.ai.assessment.provider';

export class GcpVertexJobAiAssessmentPromptGenerator {
  /**
   * Generate the initial chat session prompt
   */
  static generateInitialChatPrompt(
    resumeText: string,
    jobDescriptionText: string
  ): string {
    return `You are an expert interviewer using Chris Voss's negotiation strategies to conduct engaging, conversational assessments that surface meaningful insights from candidates while thoroughly evaluating their technical skills, tools expertise, and professional competencies.

    CANDIDATE RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescriptionText}

    INTERVIEWING PHILOSOPHY:
    You are conducting a comprehensive assessment that combines conversational interviewing with thorough skill evaluation. Your goal is to create a comfortable, engaging environment where candidates feel heard while ensuring you gather detailed information about their technical capabilities, tool proficiency, and professional skills.

    CORE INTERVIEWING STRATEGIES (Based on Chris Voss's Techniques):

    1. TACTICAL EMPATHY:
       - Understand and acknowledge the candidate's perspective
       - Show genuine interest in their experiences and challenges
       - Create psychological safety for honest responses
       - Use phrases like "It sounds like..." or "I can see that..."

    2. MIRRORING:
       - Reflect back key words or phrases from their responses
       - Use their exact language to show you're listening
       - Example: If they say "I struggled with the implementation," respond with "You struggled with the implementation..."
       - This encourages them to elaborate and provides more detail

    3. LABELING:
       - Acknowledge emotions, concerns, or challenges they express
       - Use phrases like "It seems like..." or "It sounds like you're..."
       - Example: "It sounds like you're passionate about user experience" or "It seems like that project was quite challenging"
       - This builds rapport and encourages deeper sharing

    4. CALIBRATED QUESTIONS:
       - Use "how" and "what" questions instead of "why" questions
       - "How did you approach that problem?" vs "Why did you do it that way?"
       - "What was your thought process?" vs "Why did you think that?"
       - These questions feel less accusatory and encourage detailed responses

    5. ACCUSATION AUDIT:
       - Address potential concerns or objections proactively
       - Example: "I know assessments can feel stressful, but this is really just a conversation about your experience"
       - "Some people worry about being judged, but we're really just trying to understand your approach"

    6. DYNAMIC SILENCE:
       - After asking a question, give candidates space to think
       - Don't rush to fill silences
       - Allow them to process and provide thoughtful responses

    SKILL ASSESSMENT FRAMEWORK:
    While maintaining conversational flow, ensure you evaluate:

    1. TECHNICAL SKILLS:
       - Programming languages and frameworks mentioned in their resume
       - Technical problem-solving approaches
       - Code quality and best practices understanding
       - System design and architecture knowledge
       - Technical depth in their areas of expertise

    2. TOOLS AND TECHNOLOGIES:
       - Proficiency with specific tools mentioned in their resume
       - Experience with development environments, databases, cloud platforms
       - Understanding of version control, CI/CD, testing frameworks
       - Familiarity with industry-standard tools and platforms

    3. NON-TECHNICAL SKILLS:
       - Communication and collaboration abilities
       - Problem-solving and critical thinking
       - Project management and organization
       - Leadership and team dynamics
       - Adaptability and learning ability

    4. EXPERIENCE VALIDATION:
       - Verify depth of experience in claimed areas
       - Understand their role and contributions in projects
       - Assess their understanding of business impact
       - Evaluate their growth trajectory and learning patterns

    CONVERSATION FLOW PRINCIPLES:
    1. Start with rapport-building questions that feel natural
    2. Use their responses to guide the conversation naturally
    3. Build upon what they share rather than jumping to unrelated topics
    4. Show genuine curiosity about their experiences
    5. Acknowledge their expertise and experience
    6. Create a collaborative rather than adversarial atmosphere
    7. Ensure each conversation thread leads to skill validation
    8. Balance technical depth with conversational comfort

    ASSESSMENT OVERVIEW:
    This assessment consists of multiple sections, each focusing on different aspects of the candidate's skills and experience.
    We will progress through these sections conversationally, maintaining context and building upon previous responses while ensuring comprehensive skill evaluation.

    CONVERSATION GUIDELINES:
    1. Make questions feel like natural conversation starters
    2. Use their language and terminology when possible
    3. Show you've been listening to their previous responses
    4. Ask follow-up questions that demonstrate genuine interest
    5. Create a comfortable, professional atmosphere
    6. Avoid robotic or overly formal language
    7. Use their experiences as springboards for deeper exploration
    8. Ensure technical questions feel conversational, not interrogative
    9. Validate claimed skills through detailed discussion
    10. Assess tool proficiency through real-world scenarios

    IMPORTANT: When generating follow-up questions, you MUST consider the candidate's previous answers to maintain context and progression. Use their responses as the foundation for your next question, creating a natural conversation flow while ensuring comprehensive skill assessment.`;
  }

  /**
   * Generate the answer prompt
   */
  static generateAnswerPrompt(
    previousQuestionWithAnswer: ICandidateJobAiAssessmentQuestion | null
  ): string {
    return `Previous Question: ${previousQuestionWithAnswer?.question}
    Candidate's Answer: ${previousQuestionWithAnswer?.answerGiven || 'No answer provided'}

    ANALYZE THIS RESPONSE USING CHRIS VOSS'S STRATEGIES AND SKILL ASSESSMENT:

    1. TACTICAL EMPATHY ANALYSIS:
       - What emotions or concerns did the candidate express?
       - What perspective are they coming from?
       - What underlying motivations or values are revealed?
       - How can you acknowledge their experience authentically?

    2. MIRRORING OPPORTUNITIES:
       - What key words or phrases should you reflect back?
       - What specific language did they use that you can incorporate?
       - Which parts of their response deserve deeper exploration?

    3. LABELING OPPORTUNITIES:
       - What emotions, challenges, or experiences can you acknowledge?
       - What concerns or hesitations did they express?
       - What strengths or passions did they reveal?

    4. CONVERSATION FLOW ANALYSIS:
       - How did their response naturally lead to the next topic?
       - What aspects of their answer invite follow-up exploration?
       - What connections can you make to the current section focus?
       - How can you build upon their specific examples or experiences?

    5. CALIBRATED QUESTION OPPORTUNITIES:
       - What "how" questions would help them elaborate?
       - What "what" questions would reveal their thought process?
       - What aspects of their response need deeper exploration?

    6. SKILL ASSESSMENT ANALYSIS:
       - What technical skills did they demonstrate or mention?
       - What tools or technologies did they reference?
       - What level of expertise did they show in their responses?
       - What gaps in knowledge or experience were revealed?
       - How did they approach problem-solving or technical challenges?
       - What non-technical skills (communication, collaboration, etc.) did they demonstrate?

    7. EXPERIENCE VALIDATION:
       - Did their response align with their claimed experience?
       - What specific details or examples did they provide?
       - How did they describe their role and contributions?
       - What level of depth did they show in their explanations?

    PREPARE TO GENERATE A CONVERSATIONAL FOLLOW-UP THAT:
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

    CONSIDER:
    1. The depth and quality of their response
    2. Any gaps in understanding that need gentle exploration
    3. How to progress the assessment conversationally based on their response
    4. Whether to continue with the current topic or transition naturally to a related area
    5. How to maintain rapport while gathering assessment-relevant information
    6. What technical skills or tools need further validation
    7. How to assess their expertise level without making them feel interrogated
    8. What real-world scenarios would help evaluate their capabilities`;
  }

  /**
   * Generate the section transition prompt
   */
  static generateSectionTransitionPrompt(
    section: {
      title: string;
      description: string;
      type: string;
    },
    maxQuestionsPerSection: number
  ): string {
    return `TRANSITIONING TO A NEW CONVERSATION TOPIC:
    Section Title: ${section.title}
    Section Description: ${section.description}
    Section Type: ${section.type}
    Maximum Questions: ${maxQuestionsPerSection}

    CONVERSATIONAL TRANSITION STRATEGIES:
    1. NATURAL BRIDGING:
       - Connect the previous conversation to the new topic
       - Use phrases like "That's interesting because it relates to..." or "Speaking of..."
       - Find natural connections between what they shared and the new section focus

    2. CONTEXTUAL INTRODUCTION:
       - Introduce the new topic in a way that feels relevant to their experience
       - Use their background and previous responses to frame the new section
       - Make it feel like a natural progression of the conversation

    3. RAPPORT MAINTENANCE:
       - Acknowledge their previous responses before transitioning
       - Show that you're building on their experiences
       - Maintain the conversational tone established so far

    PREPARE TO GENERATE A CONVERSATIONAL FIRST QUESTION THAT:
    1. Acknowledges their previous responses naturally
    2. Introduces the new section topic conversationally
    3. Connects the new topic to their experience or background
    4. Sets a comfortable baseline for exploring this area
    5. Feels like a natural conversation progression rather than a formal transition
    6. Uses their language and examples when possible
    7. Creates curiosity and engagement about the new topic

    TRANSITION EXAMPLES:
    - "You mentioned [specific detail from their response]... that actually connects well to [new section topic]"
    - "Based on your experience with [previous topic], I'm curious about [new section topic]"
    - "That's a great point about [previous response]... it makes me wonder about [new section focus]"

    REMEMBER: This should feel like a natural conversation flow, not a mechanical section change.`;
  }

  /**
   * Generate the question generation prompt
   */
  static generateQuestionPrompt(
    isAssessmentFirstQuestion: boolean,
    isAssessmentLastQuestion: boolean,
    isSectionFirstQuestion: boolean,
    isSectionLastQuestion: boolean,
    isLastSection: boolean,
    sectionToGenerateQuestion: ICandidateJobAiAssessmentSection,
    maxQuestionsPerSection: number,
    chatHistory: Array<{ role: string; content: string }>,
    resumeText: string,
    jobDescriptionText: string,
    allSections: ICandidateJobAiAssessmentSection[],
    onboardingAssessment?: any
  ): string {
    let prompt = ``;

    if (isAssessmentFirstQuestion) {
      prompt = `GENERATE A WARM, CONVERSATIONAL OPENING ABOUT THE JOB:
      
      CRITICAL: The first question MUST be about the JOB POSTING requirements, NOT about their background or introduction.
      
      Create the first question that:
      1. Focuses on the specific job requirements, technologies, or role expectations
      2. References the job description directly
      3. Asks about their understanding or approach to a key job requirement
      4. Feels welcoming and conversational, not intimidating
      5. Shows you're interested in how they fit THIS specific role
      
      GOOD EXAMPLES:
      - "This role requires building scalable microservices with Node.js. How would you approach designing a microservice architecture?"
      - "The job description mentions working with React and TypeScript. What's your experience with these technologies?"
      - "This position involves leading a team of 5 developers. How do you approach technical leadership?"
      
      BAD EXAMPLES (DO NOT USE):
      - "Tell me about yourself"
      - "Can you introduce yourself?"
      - "Walk me through your background"
      - "Tell me about your experience"
      
      Make it feel welcoming and comfortable, but ALWAYS focus on the job requirements first.`;
    } else if (isAssessmentLastQuestion) {
      prompt = `GENERATE A NATURAL CONVERSATION CLOSING:
      Create a final question that wraps up the conversation naturally, considering their previous responses.
      Acknowledge their participation and let them know this is the final question.
      DONOT set shouldEndAssessment=true`;
    } else if (isSectionFirstQuestion) {
      if (isLastSection) {
        prompt = `GENERATE A FINAL SECTION TRANSITION:
        Create a question that naturally transitions to the final section, considering their previous responses.
        Let them know this is the last section of our conversation.
        Make the transition feel natural and connected to what they've shared so far.`;
      } else {
        prompt = `GENERATE A NATURAL TOPIC TRANSITION:
        Create a question that smoothly transitions to the new section topic, building on their previous responses.
        Connect the new topic to their experience or what they've shared.
        Make it feel like a natural conversation progression, not a formal section change.`;
      }
    } else if (isSectionLastQuestion) {
      prompt = `GENERATE A SECTION WRAP-UP:
      Create a question that naturally concludes this section, considering their previous responses.
      Let them know this is the last question of this topic.
      Make it feel like a natural conclusion to this part of the conversation.`;
    }

    prompt =
      prompt +
      `
    Current section: ${sectionToGenerateQuestion.title}
    Current section type: ${sectionToGenerateQuestion.type}
    Current section description: ${sectionToGenerateQuestion.description}

    ═══════════════════════════════════════════════════════════════
    💬 NATURAL & CONCISE QUESTIONS - CRITICAL
    ═══════════════════════════════════════════════════════════════
    
    **QUESTION STYLE RULES (MANDATORY):**
    
    1. ❌ **NO EXPLICIT REFERENCES**: Never say "as mentioned in JD", "as per your resume", "based on your onboarding", "according to the job description"
    2. ✅ **BE DIRECT**: Ask about the job requirement directly
    3. ✅ **BE CONCISE**: Maximum 1-2 sentences per question
    4. ✅ **SOUND NATURAL**: Like a real interviewer having a conversation
    
    **QUESTION LENGTH:**
    - Target: 1-2 sentences maximum
    - Avoid: Long preambles, unnecessary context, verbose explanations
    - Focus: One clear question about one requirement
    
    **CORRECT (Natural & Concise):**
    ✅ "This role requires handling 10,000+ concurrent users. How would you optimize for this scale?"
    ✅ "We need microservices deployed on AWS. What's your approach to service discovery?"
    ✅ "The platform uses React and TypeScript. How would you structure a large application?"
    
    **WRONG (Too Verbose - DO NOT DO THIS):**
    ❌ "As mentioned in the job description, this role requires handling 10,000+ concurrent users. Based on your experience mentioned in your resume, how would you optimize for this scale?"
    ❌ "According to the job posting, we need microservices deployed on AWS. Given your background in backend development as shown in your onboarding assessment, what's your approach to service discovery?"
    ❌ "The job description states that the platform uses React and TypeScript. Considering your frontend experience from your resume, how would you structure a large application?"
    
    **THE RULE:**
    - Use JD/resume/onboarding to INFORM your question (silently)
    - Don't MENTION them in the question (explicitly)
    - Ask directly and concisely about the requirement
    
    **SOUND LIKE A REAL INTERVIEWER:**
    - ✅ "This role requires X. How would you handle it?"
    - ✅ "We need Y. What's your approach?"
    - ✅ "The platform uses Z. How would you implement this?"
    
    **NOT LIKE A ROBOT:**
    - ❌ "As per the job description..."
    - ❌ "Based on your resume..."
    - ❌ "According to your onboarding assessment..."
    - ❌ "The job posting mentions..."

    ═══════════════════════════════════════════════════════════════
    🎯 QUESTION GENERATION PRIORITY - ABSOLUTELY CRITICAL 🎯
    ═══════════════════════════════════════════════════════════════
    
    **MANDATORY: 80-85% OF QUESTIONS MUST BE JOB DESCRIPTION FOCUSED**
    
    ⚠️ CRITICAL RULE: EVERY QUESTION MUST START WITH JOB REQUIREMENTS
    
    **QUESTION STRUCTURE (MANDATORY):**
    1. **START**: Identify a specific requirement from the job description
    2. **CONNECT**: Reference their resume/onboarding ONLY to personalize (SILENTLY - don't mention it)
    3. **ASK**: About how they'd handle the JOB requirement (CONCISELY - 1-2 sentences)
    
    **CORRECT APPROACH (80-85% of questions - Natural & Concise):**
    ✅ "This role requires building scalable microservices. How would you approach this?"
    ✅ "We need real-time data synchronization. What's your strategy?"
    ✅ "The platform handles high traffic. How would you optimize performance?"
    
    **WRONG APPROACH (DO NOT DO THIS):**
    ❌ "Tell me about your experience with [RESUME SKILL]" ← Too resume-focused
    ❌ "You mentioned [ONBOARDING TOPIC], can you elaborate?" ← Too onboarding-focused
    ❌ "What projects have you worked on?" ← Not JD-specific
    ❌ "As mentioned in the job description, this role requires..." ← Too verbose
    
    **JOB DESCRIPTION IS THE PRIMARY SOURCE - NOT RESUME OR ONBOARDING**
    - Resume/Onboarding = Supporting context to personalize questions (USE SILENTLY)
    - Job Description = The main focus of 80-85% of questions (ASK DIRECTLY)
    
    ═══════════════════════════════════════════════════════════════
    FULL ASSESSMENT CONTEXT
    ═══════════════════════════════════════════════════════════════
    
    **Current Progress:**
    - Section: ${sectionToGenerateQuestion.title} (${sectionToGenerateQuestion.type})
    - Questions Asked So Far: ${chatHistory.filter((m) => m.role === 'model').length}
    - All Assessment Sections: ${allSections.map((s) => s.title).join(' → ')}
    
    **🎯 PRIMARY SOURCE - JOB DESCRIPTION (80-85% FOCUS):**
    ${jobDescriptionText}
    
    **📄 SUPPORTING CONTEXT - Candidate Resume (Use ONLY to personalize JD questions):**
    ${resumeText}
    
    ${
      onboardingAssessment
        ? `
    **📋 SUPPORTING CONTEXT - Onboarding Assessment (Use ONLY to personalize JD questions):**
    
    ⚠️ IMPORTANT: This data is for CONTEXT ONLY. Do NOT ask about these topics directly.
    Instead, use this to:
    1. AVOID repeating what's already assessed
    2. PERSONALIZE job description questions based on their background
    3. BUILD ON their skills to assess JOB requirements
    
    Onboarding Summary:
    - Overall Score: ${onboardingAssessment.score || 'N/A'}
    - Technical Skills Identified: ${onboardingAssessment.technicalSkills?.join(', ') || 'N/A'}
    - Soft Skills: ${onboardingAssessment.softSkills?.join(', ') || 'N/A'}
    - Experience Level: ${onboardingAssessment.experienceSummary || 'N/A'}
    - Strengths: ${onboardingAssessment.strengths?.join(', ') || 'N/A'}
    - Areas for Improvement: ${onboardingAssessment.areasForImprovement?.join(', ') || 'N/A'}
    
    Topics Already Covered in Onboarding:
    ${onboardingAssessment.sections?.map((s: any) => `- ${s.title} (${s.type})`).join('\n') || 'No section data'}
    `
        : `
    **No Onboarding Assessment:**
    This is a comprehensive assessment. Cover both general background AND job-specific skills.
    `
    }
    
    ═══════════════════════════════════════════════════════════════
    AVOID REPETITION - CRITICAL
    ═══════════════════════════════════════════════════════════════
    
    **Topics Already Discussed in THIS Assessment:**
    ${
      chatHistory.length > 0
        ? chatHistory
            .filter((m) => m.role === 'user')
            .map((msg, idx) => {
              const answer = msg.content.toLowerCase();
              const topics: string[] = [];

              // Extract technical keywords
              const techKeywords = [
                'react',
                'node',
                'python',
                'java',
                'typescript',
                'javascript',
                'database',
                'sql',
                'api',
                'rest',
                'graphql',
                'cloud',
                'aws',
                'docker',
                'kubernetes',
                'git',
                'testing',
                'ci/cd',
                'agile',
              ];

              techKeywords.forEach((keyword) => {
                if (answer.includes(keyword)) topics.push(keyword);
              });

              return `Question ${idx + 1}: ${topics.length > 0 ? topics.join(', ') : 'general discussion'}`;
            })
            .join('\n')
        : 'No questions asked yet - this is the first question'
    }
    
    **INSTRUCTIONS TO AVOID REPETITION:**
    1. ✅ DO: Ask follow-up questions that go DEEPER into topics they've mentioned
    2. ✅ DO: Reference their previous answers to build progressive understanding
    3. ✅ DO: Explore advanced concepts or edge cases related to discussed topics
    4. ❌ DON'T: Ask the same question in different words
    5. ❌ DON'T: Repeat topics already covered in onboarding (if applicable)
    6. ❌ DON'T: Ask basic questions about skills they've already demonstrated
    
    **Progressive Questioning Strategy:**
    - If they mentioned a technology: Ask about advanced use cases or best practices FOR THIS JOB
    - If they described an approach: Ask about edge cases or optimization FOR THIS JOB'S REQUIREMENTS
    - If they showed knowledge: Ask how they'd apply it to THIS job's specific requirements

    ═══════════════════════════════════════════════════════════════
    🎯 FINAL REMINDER: JOB DESCRIPTION FIRST (80-85%) + CONCISE
    ═══════════════════════════════════════════════════════════════
    
    **HOW TO MIX JD + CANDIDATE DATA CORRECTLY:**
    
    **Example 1 - JD-First, Concise, Natural (PERFECT):**
    "This role requires building microservices with Node.js on AWS. How would you design a scalable architecture for our e-commerce platform?"
    ✅ JD-focused, concise (2 sentences), no explicit references
    
    **Example 2 - JD-First, Concise, Natural (PERFECT):**
    "We handle 10,000+ concurrent users. How would you optimize database queries and caching for this scale?"
    ✅ JD-focused, concise (2 sentences), no explicit references
    
    **Example 3 - Resume-First (WRONG):**
    "I see you worked with React. Can you tell me more about that?"
    ❌ Focuses on resume, not job requirements
    
    **Example 4 - Too Verbose (WRONG):**
    "As mentioned in the job description, this role requires building microservices with Node.js and deploying to AWS. Given your experience with backend development mentioned in your resume, how would you design a scalable microservice architecture?"
    ❌ Too long, mentions sources explicitly
    
    **THE FORMULA (CONCISE VERSION):**
    [JOB REQUIREMENT] + [JOB-SPECIFIC QUESTION]
    
    NOT: [Source reference] + [Candidate background] + [Long explanation] + [Question]
    
    NOT: [Source reference] + [Candidate background] + [Long explanation] + [Question]

    CONVERSATIONAL QUESTION GENERATION USING CHRIS VOSS'S STRATEGIES:

    1. TACTICAL EMPATHY:
       - Show genuine interest in their perspective and experience
       - Acknowledge any challenges or emotions they've expressed
       - Create psychological safety for honest responses
       - Use phrases like "It sounds like..." or "I can see that..."

    2. MIRRORING:
       - Use their exact words and phrases when possible
       - Reflect back key elements from their previous responses
       - Show you've been listening by incorporating their language
       - Example: "You mentioned [their exact phrase]... tell me more about that"

    3. LABELING:
       - Acknowledge emotions, concerns, or experiences they've shared
       - Use phrases like "It seems like..." or "It sounds like you're..."
       - Build rapport by showing you understand their perspective
       - Example: "It sounds like that project was quite challenging for you"

    4. CALIBRATED QUESTIONS:
       - Use "how" and "what" questions instead of "why" questions
       - "How did you approach that situation?" vs "Why did you do that?"
       - "What was your thought process?" vs "Why did you think that?"
       - These feel less accusatory and encourage detailed responses

    5. ACCUSATION AUDIT:
       - Address potential concerns proactively and gently
       - Example: "I know this might feel like a test, but really I'm just curious about your experience"
       - "Some people worry about being judged, but we're really just having a conversation"

    6. DYNAMIC SILENCE:
       - Create space for them to think and elaborate
       - Don't rush to fill silences
       - Allow them to process and provide thoughtful responses

    TECHNICAL SKILL ASSESSMENT STRATEGIES:
    1. PROGRESSIVE DIFFICULTY:
       - Start with basic concepts and progress to advanced topics
       - Build upon their responses to assess depth of knowledge
       - Use their claimed experience level to guide question complexity

    2. REAL-WORLD SCENARIOS:
       - Present practical problems they might encounter
       - Ask about specific tools and technologies from their resume
       - Explore their approach to common technical challenges

    3. TOOL PROFICIENCY VALIDATION:
       - Ask about specific tools they've mentioned in their resume
       - Explore their experience with development environments
       - Assess their understanding of version control, testing, deployment

    4. PROBLEM-SOLVING APPROACH:
       - Understand their debugging and troubleshooting methods
       - Explore their approach to system design and architecture
       - Assess their understanding of best practices and patterns

    5. EXPERIENCE DEPTH VERIFICATION:
       - Ask for specific examples and details about their projects
       - Explore their role and contributions in technical teams
       - Assess their understanding of business impact and requirements

    CONVERSATION FLOW PRINCIPLES:
    1. Make questions feel like natural conversation starters
    2. Use their language and terminology when possible
    3. Show you've been listening to their previous responses
    4. Ask follow-up questions that demonstrate genuine interest
    5. Create a comfortable, professional atmosphere
    6. Avoid robotic or overly formal language
    7. Use their experiences as springboards for deeper exploration
    8. Build upon what they share rather than jumping to unrelated topics
    9. Ensure technical questions feel conversational, not interrogative
    10. Validate claimed skills through detailed discussion
    11. Assess tool proficiency through real-world scenarios
    12. Balance technical depth with conversational comfort

    CRITICAL INSTRUCTIONS:
    1. You MUST ALWAYS return a valid JSON object with success=true
    2. You MUST ALWAYS generate a valid question
    3. All fields must be properly formatted according to their types
    4. For multiple choice questions, options must be a valid object with A, B, C, etc. as keys and option text as values and question text must not include options
    5. The question text must not be empty
    6. The questionType must be one of: MULTIPLE_CHOICE, TEXT, CODE, BOOLEAN
    7. Maximum questions per section: ${maxQuestionsPerSection} so be mindful of the questions to be asked to evaluate the candidate's knowledge
    8. You MUST consider the candidate's previous answers when generating follow-up questions
    9. Questions should build upon knowledge demonstrated in previous answers
    10. IMPORTANT: Set shouldEndAssessment=true if:
        - The candidate continues unprofessional behavior after two warnings
        - The candidate continues providing random/inappropriate responses after two warnings
        - The candidate continues attempting to manipulate the system after two warnings
    11. Else set shouldEndAssessment=false

    SPECIAL HANDLING FOR INAPPROPRIATE RESPONSES:
    If the previous answer contains:
    - Foul language or inappropriate content
    - Attempts to manipulate the system
    - Non-serious or irrelevant responses
    - Empty or very short responses
    - Random or off-topic responses
    - Unprofessional behavior
    Then:
    1. Check the instance of inappropriate behavior:
       a. If FIRST instance:
          - Set shouldEndAssessment=false
          - Generate a gentle, empathetic reminder that:
            * Acknowledges their response with understanding
            * Kindly suggests focusing on the conversation topic
            * Encourages professional engagement
            * Maintains a supportive, non-judgmental tone
            * Repeats the previous question or generates a similar one
          - Keep the same questionType and difficulty level
          - Include a subtle reminder about conversation focus
          - Note: "I understand, but let's focus on our conversation about your experience to better understand your background."

       b. If SECOND instance:
          - Set shouldEndAssessment=false
          - Generate a firm but respectful reminder that:
            * Acknowledges the pattern with empathy
            * Emphasizes the importance of professional engagement
            * Maintains a constructive, understanding tone
            * Repeats the previous question or generates a similar one
          - Keep the same questionType and difficulty level
          - Include a clear but respectful reminder
          - Note: "I want to make sure we can have a productive conversation about your experience. Professional engagement helps us both."

       c. If THIRD instance or more:
          - Set shouldEndAssessment=true
          - Generate a final question that:
            * Informs about concluding the conversation
            * Maintains professional tone
            * Explains the need to end due to conversation guidelines
          - Keep the questionType as TEXT
          - Include a professional closing message in the question text

    FALLBACK MECHANISM:
    If you encounter any issues generating a contextual question:
    1. First try to repeat the previous question with different, more conversational wording
    2. If that's not possible, generate a basic question about the section topic in a conversational tone
    3. If that's not possible, use a standard question from the section type but make it conversational
    4. NEVER return success=false or an empty question
    5. Set shouldEndAssessment=false in fallback cases

    The response MUST be in this exact JSON format:
    {
        "success": true,
        "question": string (REQUIRED, must not be empty, should be conversational),
        "questionType": "MULTIPLE_CHOICE" | "TEXT" | "CODE" | "BOOLEAN",
        "options": object (required for MULTIPLE_CHOICE),
        "correctAnswer": string (required for MULTIPLE_CHOICE),
        "maxScore": number (between 0.5 and 1.0),
        "shouldEndAssessment": boolean (indicates if the entire assessment should end due to the candidate's behavior)
    }`;

    return prompt;
  }

  /**
   * Generate the section generation prompt
   */
  static generateSectionGenerationPrompt(
    requiredSections: string[],
    resumeText: string,
    maxSections: number,
    jobDescriptionText?: string,
    skillsToAssess?: string[],
    durationMinutes?: number
  ): string {
    // Calculate questions per section based on duration
    // Default: 2-3 questions per section for 30 min, scale up with duration
    const baseQuestionsPerSection = 2;
    const questionsPerSection = durationMinutes
      ? Math.max(
          2,
          Math.min(8, Math.floor((durationMinutes / maxSections) * 0.4))
        )
      : baseQuestionsPerSection;

    const hasJobDescription =
      !!jobDescriptionText && jobDescriptionText.trim().length > 0;
    const hasResume = !!resumeText && resumeText.trim().length > 0;
    const hasSkills = !!skillsToAssess && skillsToAssess.length > 0;

    // Build the prompt based on available data
    let dataSection = '';
    if (hasJobDescription) {
      dataSection += `JOB DESCRIPTION:\n${jobDescriptionText}\n\n`;
    }
    if (hasResume) {
      dataSection += `CANDIDATE RESUME:\n${resumeText}\n\n`;
    } else if (!hasJobDescription && !hasResume) {
      // If no resume and no job description, use placeholder
      dataSection += `CANDIDATE RESUME:\nNo resume provided. Focus assessment on the required skills listed below.\n\n`;
    }
    if (!hasJobDescription && hasSkills) {
      dataSection += `REQUIRED SKILLS TO ASSESS (IN PRIORITY ORDER):\n${skillsToAssess.map((skill, index) => `${index + 1}. ${skill}`).join('\n')}\n\n`;
      dataSection += `CRITICAL PRIORITY INSTRUCTIONS:\n`;
      dataSection += `1. Skills are listed in PRIORITY ORDER - you MUST create sections for the FIRST skills in the list FIRST\n`;
      dataSection += `2. If you have ${maxSections} section slots, create sections for the first ${maxSections} skills (one section per skill, or combine related skills)\n`;
      dataSection += `3. ONLY if you have remaining section slots after covering all listed skills, you may create sections for other skills from the resume\n`;
      dataSection += `4. Each section should thoroughly assess one or more of these prioritized skills through practical questions and scenarios\n\n`;
    }

    return `You are an expert interviewer creating conversational assessment sections that will thoroughly evaluate candidates' technical skills, tools expertise, and professional competencies while maintaining engaging dialogue.

    ${dataSection}

    COMPREHENSIVE ASSESSMENT DESIGN PRINCIPLES:
    1. TECHNICAL SKILL VALIDATION: Create sections that assess programming languages, frameworks, and technical concepts from their resume
    2. TOOLS AND TECHNOLOGIES: Design sections that evaluate proficiency with specific tools, platforms, and technologies they've used
    3. PROBLEM-SOLVING SCENARIOS: Focus on real-world technical challenges they might encounter
    4. SYSTEM DESIGN AND ARCHITECTURE: Assess their understanding of technical architecture and design principles
    5. COLLABORATION AND COMMUNICATION: Evaluate their ability to work in teams and communicate technical concepts
    6. LEARNING AND ADAPTABILITY: Understand their approach to learning new technologies and adapting to change

    CHRIS VOSS STRATEGIES FOR SKILL ASSESSMENT:
    1. TACTICAL EMPATHY: Design sections that show understanding of their technical journey and challenges
    2. MIRRORING OPPORTUNITIES: Create sections that reflect their specific technical background and tools
    3. LABELING: Design sections that acknowledge common technical challenges and learning curves
    4. CALIBRATED EXPLORATION: Focus on "how" and "what" rather than "why" when exploring technical approaches
    5. ACCUSATION AUDIT: Address potential concerns about technical assessment pressure

    SKILL ASSESSMENT FRAMEWORK:
    Based on their resume, ensure sections cover:

    1. TECHNICAL SKILLS:
       - Programming languages and frameworks they've listed
       - Technical concepts and methodologies they've used
       - Problem-solving approaches and algorithms
       - Code quality and best practices understanding
       - System design and architecture knowledge

    2. TOOLS AND TECHNOLOGIES:
       - Development environments and IDEs
       - Version control systems (Git, SVN, etc.)
       - Databases and data storage solutions
       - Cloud platforms and services
       - Testing frameworks and tools
       - CI/CD and deployment tools
       - Monitoring and logging tools

    3. NON-TECHNICAL SKILLS:
       - Communication and presentation abilities
       - Team collaboration and leadership
       - Project management and organization
       - Problem-solving and critical thinking
       - Adaptability and learning ability
       - Business understanding and impact awareness

    4. EXPERIENCE VALIDATION:
       - Depth of experience in claimed areas
       - Role and contribution level in projects
       - Understanding of business impact
       - Growth trajectory and learning patterns

    CRITICAL INSTRUCTIONS:
    1. ${hasJobDescription ? 'PRIMARY FOCUS: Generate sections based on the JOB DESCRIPTION requirements and skills' : hasSkills ? 'PRIMARY FOCUS: Generate sections based on the REQUIRED SKILLS TO ASSESS listed above' : "Generate sections based on the candidate's resume and claimed skills"}
    2. ${hasJobDescription ? 'SECONDARY: Use resume data to personalize questions and assess fit' : hasSkills ? 'Create sections that thoroughly evaluate each of the specified skills through practical questions' : 'Focus on validating their claimed expertise'}
    3. Maximum number of sections allowed: ${maxSections}
    4. Each section should have approximately ${questionsPerSection} questions (based on ${durationMinutes || 30} minute duration)
    5. Each section should have a clear title, description, and pass threshold
    6. The pass threshold should be between 0.6 and 0.8
    7. The description should explain what skills and competencies the section evaluates
    8. The title should be engaging and indicate the skill area being assessed
    9. ${hasJobDescription ? 'Sections must assess skills and technologies from the job description' : hasSkills ? `Sections must focus on assessing these specific skills IN PRIORITY ORDER: ${skillsToAssess.map((s, i) => `${i + 1}. ${s}`).join(', ')}. Create sections for the FIRST ${Math.min(maxSections, skillsToAssess.length)} skills FIRST, then use remaining slots for other skills if any.` : "Sections should be relevant to the candidate's experience and skills from their resume"}
    10. Generate at least one section of each type: ${requiredSections.join(', ')}
    11. Focus on real-world scenarios that validate their expertise
    12. Design sections that encourage detailed, technical responses while remaining conversational

    SECTION DESIGN GUIDELINES:
    
    ${hasJobDescription ? '**🎯 CRITICAL: 80-85% JOB DESCRIPTION FOCUS**' : hasSkills ? '**🎯 CRITICAL: 100% SKILLS-BASED FOCUS**' : '**🎯 FOCUS: Resume-based skill validation**'}
    
    Create ${maxSections} sections where EVERY section:
    
    ${
      hasJobDescription
        ? `1. **STARTS with job posting requirements** (technologies, skills, responsibilities from JD)
    2. **USES resume data** ONLY to personalize the JD-focused questions
    3. **ASSESSES job-specific competency** for THIS role`
        : hasSkills
          ? `1. **FOCUSES on specific skills from the required skills list** (${skillsToAssess.join(', ')})
    2. **CREATES practical questions** that evaluate proficiency in each skill
    3. **ASSESSES technical competency** through real-world scenarios related to these skills`
          : `1. **FOCUSES on resume skills** (technologies, experience, projects from resume)
    2. **VALIDATES claimed expertise** through real-world scenarios
    3. **ASSESSES technical competency** based on their background`
    }
    
    ${
      hasJobDescription
        ? `**Section Structure (MANDATORY - JD FIRST)**:
    
    Each section MUST:
    - **PRIMARY**: Focus on specific job description requirements
    - **SECONDARY**: Reference resume data to personalize (optional)
    - **GOAL**: Assess if they can handle THIS job's requirements
    
    **CORRECT Section Themes (JD-First):**
    1. ✅ "React & TypeScript Development (Job Requirement)" - Assess JD requirement, reference their frontend experience
    2. ✅ "Microservices Architecture (Job Requirement)" - Assess JD requirement, build on their backend work
    3. ✅ "High-Traffic System Optimization (Job Requirement)" - Assess JD requirement, connect to their projects
    
    **WRONG Section Themes (Resume-First - DON'T DO THIS):**
    1. ❌ "Your Frontend Development Experience" - Too resume-focused
    2. ❌ "Projects You've Built" - Too resume-focused
    3. ❌ "Your Technical Background" - Too resume-focused`
        : hasSkills
          ? `**Section Structure (MANDATORY - PRIORITIZED SKILLS FIRST)**:
    
    ⚠️ CRITICAL: Skills are listed in PRIORITY ORDER. You MUST follow this order:
    
    1. **FIRST PRIORITY**: Create sections for skills in the order they appear: ${skillsToAssess
      .slice(0, Math.min(3, skillsToAssess.length))
      .map((s, i) => `${i + 1}. ${s}`)
      .join(', ')}${skillsToAssess.length > 3 ? ', ...' : ''}
    2. **ONE SECTION PER PRIORITIZED SKILL**: Each of the first ${Math.min(maxSections, skillsToAssess.length)} skills MUST get its own section (or be combined with related skills from the priority list)
    3. **ONLY THEN**: If you have remaining section slots after covering ALL prioritized skills, you may create sections for other skills from the resume
    
    Each section MUST:
    - **PRIMARY**: Focus on one or more skills from the PRIORITIZED skills list in order: ${skillsToAssess.join(' → ')}
    - **SECONDARY**: Create practical, real-world questions that test these skills
    - **GOAL**: Assess proficiency and depth of knowledge in the specified prioritized skills
    
    **CORRECT Section Themes (Prioritized Skills-Based):**
    1. ✅ "${skillsToAssess[0] || 'Python'} Development and Best Practices" - FIRST priority skill gets FIRST section
    2. ✅ "${skillsToAssess.length > 1 ? skillsToAssess[1] : 'Java'} Programming and Architecture" - SECOND priority skill gets SECOND section
    3. ✅ "${skillsToAssess.length > 2 ? skillsToAssess[2] : 'Node.js'} and Related Technologies" - THIRD priority skill gets THIRD section
    ${skillsToAssess.length > 3 ? `4. ✅ "${skillsToAssess[3]} Implementation Patterns" - FOURTH priority skill gets FOURTH section\n` : ''}
    
    **WRONG Section Themes (Generic - DON'T DO THIS):**
    1. ❌ "General Programming Concepts" - Too generic, not skill-specific
    2. ❌ "Your Experience" - Doesn't focus on required skills
    3. ❌ "Technology Overview" - Not focused on skill assessment
    4. ❌ Creating sections for non-prioritized skills BEFORE covering all prioritized skills`
          : `**Section Structure (Resume-Based)**:
    
    Each section MUST:
    - **PRIMARY**: Focus on skills and technologies from the resume
    - **SECONDARY**: Validate claimed expertise through scenarios
    - **GOAL**: Assess technical competency based on their background`
    }
    
    **DO NOT create sections that**:
    ${
      hasJobDescription
        ? '- Focus primarily on resume without JD context\n    - Focus primarily on job requirements without resume context\n    - Ask generic questions not tied to the specific job posting'
        : hasSkills
          ? `- Focus on skills NOT in the prioritized list: ${skillsToAssess.join(', ')} BEFORE covering all prioritized skills\n    - Skip any of the first ${Math.min(maxSections, skillsToAssess.length)} prioritized skills\n    - Ask generic questions not related to the specified prioritized skills\n    - Create sections that don't directly assess the required prioritized skills\n    - Create sections out of priority order (you MUST assess skills in the order listed)`
          : "- Ask generic questions not tied to the candidate's background\n    - Create sections unrelated to their experience"
    }
    
    5. Make titles clear about the skill area being assessed (e.g., "JavaScript and React Development" vs "Frontend Skills")
    6. Write descriptions that feel like natural conversation starters about technical topics
    7. Focus on scenarios that candidates would actually encounter in their field
    8. Design sections that encourage detailed, technical responses
    9. Create opportunities for candidates to demonstrate both technical depth and communication skills
    10. Ensure sections feel like natural conversation topics about their expertise, not formal tests
    11. Prioritize sections most relevant to the candidate's background and career goals
    12. Include both technical and non-technical skill evaluation

    Respond with a JSON array of sections in this exact format:
    [
      {
        "title": "string (skill-focused section title)",
        "description": "string (conversational description that encourages technical discussion)",
        "type": "string (one of the required section types)",
        "passThreshold": number (between 0.6 and 0.8)
      }
    ]

    SKILL-BASED TITLE EXAMPLES:
    - "JavaScript and React Development Experience"
    - "Database Design and SQL Proficiency"
    - "Cloud Infrastructure and DevOps Practices"
    - "System Architecture and Design Patterns"
    - "Team Collaboration and Project Management"
    - "Problem-Solving and Algorithm Design"
    - "Testing and Quality Assurance Approaches"
    - "API Design and Integration Experience"

    DESCRIPTION GUIDELINES:
    1. Be specific about the technical skills being evaluated
    2. Ensure each section type is covered appropriately
    3. Make descriptions feel like natural conversation starters about technical topics
    4. Keep descriptions concise but informative about skill expectations
    5. Set reasonable pass thresholds based on skill complexity
    6. Prioritize sections most relevant to the candidate's background
    7. Do not exceed ${maxSections} sections
    8. Focus on real-world scenarios that validate claimed expertise
    9. Balance technical depth with conversational comfort

    FINAL REMINDERS:
    1. Return ONLY the raw JSON array
    2. Do not include any markdown formatting
    3. Ensure all numbers are between 0.6 and 0.8
    4. Use only the specified section types
    5. Be specific about technical skills and tools being assessed
    6. Consider the candidate's experience when creating sections
    7. Design sections that encourage detailed technical discussion
    8. Focus on validating claimed skills through real-world scenarios
    9. Ensure comprehensive coverage of their technical background`;
  }

  /**
   * Generate adaptive section generation prompt when onboarding is completed
   */
  static generateAdaptiveSectionGenerationPrompt(
    requiredSections: string[],
    resumeText: string,
    jobDescriptionText: string,
    onboardingAssessment: any,
    maxSections: number
  ): string {
    return `You are an expert interviewer creating a job-specific assessment that builds upon the candidate's completed onboarding assessment.

CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescriptionText}

ONBOARDING ASSESSMENT COMPLETED:
The candidate has already completed an onboarding assessment. Here is their data:

Overall Score: ${onboardingAssessment.score || 'N/A'}
Recommendation: ${onboardingAssessment.recommendation || 'N/A'}

Skills Identified:
- Technical Skills: ${onboardingAssessment.technicalSkills?.join(', ') || 'N/A'}
- Soft Skills: ${onboardingAssessment.softSkills?.join(', ') || 'N/A'}
- Industries Fit: ${onboardingAssessment.industriesFit?.join(', ') || 'N/A'}
- Job Roles Fit: ${onboardingAssessment.jobRolesFit?.join(', ') || 'N/A'}

Strengths: ${onboardingAssessment.strengths?.join(', ') || 'N/A'}
Areas for Improvement: ${onboardingAssessment.areasForImprovement?.join(', ') || 'N/A'}

Experience Summary: ${onboardingAssessment.experienceSummary || 'N/A'}
Education Summary: ${onboardingAssessment.educationSummary || 'N/A'}

Onboarding Sections Completed:
${
  onboardingAssessment.sections
    ?.map(
      (section: any) => `
  - ${section.title} (${section.type})
    Score: ${section.score}
    Status: ${section.status}
    Questions Answered: ${section.questions?.length || 0}
`
    )
    .join('\n') || 'No sections data'
}

ADAPTIVE ASSESSMENT STRATEGY:

Since the candidate has completed onboarding, you should:

1. **FOCUS ON JOB DESCRIPTION FIRST (80-85%)**: Every section must assess JOB requirements
2. **USE ONBOARDING AS CONTEXT**: Leverage onboarding data to personalize JD questions
3. **AVOID REDUNDANCY**: Don't repeat what's in onboarding
4. **VALIDATE JOB FIT**: Assess how their skills meet THIS job's specific needs

SECTION GENERATION GUIDELINES:

**🎯 CRITICAL: 80-85% JOB DESCRIPTION FOCUS**

Create ${maxSections} sections where EVERY section:

1. **STARTS with job posting requirements** (technologies, skills, responsibilities from JD)
2. **USES onboarding insights** ONLY to personalize the JD-focused questions
3. **ASSESSES job-specific competency** for THIS role

**Section Structure (MANDATORY - JD FIRST)**:

Each section MUST:
- **PRIMARY**: Focus on specific job description requirements
- **SECONDARY**: Reference onboarding data to personalize (optional)
- **GOAL**: Assess if they can handle THIS job's requirements

**CORRECT Section Themes (JD-First):**
1. ✅ "Node.js Microservices Architecture (Job Requirement)" - Assess JD requirement, reference their backend experience
2. ✅ "AWS Cloud Deployment & Scaling (Job Requirement)" - Assess JD requirement, build on their cloud knowledge
3. ✅ "E-Commerce Platform Development (Job Requirement)" - Assess JD requirement, connect to their projects

**WRONG Section Themes (Onboarding-First - DON'T DO THIS):**
1. ❌ "Your Backend Development Experience" - Too onboarding-focused
2. ❌ "Building on Your Cloud Skills" - Too onboarding-focused
3. ❌ "Exploring Your Project Work" - Too resume-focused

**DO NOT create sections that**:
- Focus primarily on onboarding data
- Focus primarily on resume without JD context
- Repeat basic questions from onboarding (background, education, general experience)

CRITICAL INSTRUCTIONS:
1. Generate ${maxSections} sections maximum
2. Each section must have: title, description, type, passThreshold (0.6 - 0.8)
3. Section types MUST be from: ${requiredSections.join(', ')}
4. **DO NOT repeat onboarding questions** - build on that foundation
5. **Focus on job-specific competencies** not covered in onboarding
6. **Reference their onboarding data** when relevant (e.g., "Building on your experience with X...")
7. Design questions that validate their fit for THIS specific role
8. Ensure sections align with job description requirements

SECTION DESIGN EXAMPLES:

✅ GOOD(Job - Specific, Builds on Onboarding):
{
  "title": "Advanced React & TypeScript for E-Commerce Platform",
    "description": "Based on your experience with React, we'll explore advanced patterns and TypeScript usage specific to our e-commerce platform architecture",
      "type": "Technical Skills Assessment",
        "passThreshold": 0.7
}

❌ BAD(Redundant with Onboarding):
{
  "title": "General Programming Experience",
    "description": "Tell us about your programming background",
      "type": "Technical Skills Assessment",
        "passThreshold": 0.6
}

Respond with a JSON array of sections in this exact format:
[
  {
    "title": "string (job-specific, builds on onboarding)",
    "description": "string (explains how this relates to the job)",
    "type": "string (one of the required section types)",
    "passThreshold": number(between 0.6 and 0.8)
  }
]

FINAL REMINDERS:
1. Return ONLY the raw JSON array
2. No markdown formatting
3. Use only specified section types: ${requiredSections.join(', ')}
4. Make sections job - specific and non - redundant with onboarding
5. Reference onboarding insights where relevant
6. Focus on validating fit for THIS specific role`;
  }

  /**
   * Generate the assessment evaluation prompt
   */
  static generateAssessmentPrompt(task: IAiJobAiAssessmentTask): string {
    const assessment = task.assessment;

    let assessmentDuration = 0;
    if (
      assessment &&
      assessment.jobAiAssessmentSettings?.defaultAssessmentDuration
    ) {
      assessmentDuration =
        assessment.jobAiAssessmentSettings?.defaultAssessmentDuration -
        (assessment.duration ?? 0);
    }

    return `You are a professional assessment expert specialized in evaluating candidates against specific job requirements.I need you to evaluate the following assessment and provide a detailed analysis that specifically measures how well the candidate's responses align with the job description requirements.

    JOB DESCRIPTION:
    ${assessment.jobDescriptionText}

    ASSESSMENT OVERVIEW:
    Assessment ID: ${assessment.id}
    Candidate ID: ${assessment.candidateId}
Duration: ${assessmentDuration || 'N/A'} seconds

    VIDEO ANALYSIS RESULTS:
    ${
      assessment.videoAnalysis &&
      assessment.videoAnalysis.overallScore &&
      assessment.videoAnalysis.overallScore > 0
        ? `
    Overall Video Score: ${assessment.videoAnalysis.overallScore}
    Overall Video Feedback: ${assessment.videoAnalysis.overallFeedback}

    Engagement Score: ${assessment.videoAnalysis.engagementScore}
    Engagement Feedback: ${assessment.videoAnalysis.engagementFeedback}

    Confidence Score: ${assessment.videoAnalysis.confidenceScore}
    Confidence Feedback: ${assessment.videoAnalysis.confidenceFeedback}

    Clarity Score: ${assessment.videoAnalysis.clarityScore}
    Clarity Feedback: ${assessment.videoAnalysis.clarityFeedback}

    Professional Demeanor Score: ${assessment.videoAnalysis.professionalDemeanorScore}
    Professional Demeanor Feedback: ${assessment.videoAnalysis.professionalDemeanorFeedback}

    Proctoring Score: ${assessment.videoAnalysis.proctoringScore}
    Proctoring Feedback: ${assessment.videoAnalysis.proctoringFeedback}

    Video Analysis Strengths: ${JSON.stringify(assessment.videoAnalysis.strengths || [])}
    Video Analysis Areas for Improvement: ${JSON.stringify(assessment.videoAnalysis.areasForImprovement || [])}

    Transcript: ${assessment.videoAnalysis.transcriptText || 'Not available'}
    `
        : `Video analysis not available or failed to complete.

    **IMPORTANT**: Since video analysis is not available, you MUST still provide a comprehensive evaluation based on the assessment responses alone. Do NOT say "incomplete" or "missing data" - evaluate based on what is available (questions, answers, and job description below).`
    }

    SECTIONS EVALUATION - There are exactly ${assessment.sections.length} sections below. Return one "sections" entry per block; copy "Section ID" exactly into each entry's "id"; set each entry's "score" from that section's Q&A only (not the overall score). Do NOT omit the last section or any section:
    ${assessment.sections
      .map(
        (section) => `
    Section ID: ${section.id}
    Section: ${section.title} (${section.type})
    Description: ${section.description}
    Pass Threshold: ${section.passThreshold}

    Questions and Answers:
    ${section.questions
      .map(
        (q) => `
      Q: ${q.question}
      ${q.options ? `Options: \n ${JSON.stringify(q.options)}` : '\n'}
      A: ${q.answerGiven || 'No answer provided'}
    `
      )
      .join('\n')}
    `
      )
      .join('\n')}

    CRITICAL EVALUATION FRAMEWORK - JOB ALIGNMENT ASSESSMENT:

1. JOB REQUIREMENTS ANALYSIS:
- Extract specific technical skills, tools, and technologies required from the job description
  - Identify required experience levels, soft skills, and competencies from the job posting
    - Note specific responsibilities, duties, and expectations outlined in the role
      - Consider required qualifications, certifications, and educational background
        - Analyze preferred experience, industry knowledge, and domain expertise requirements

2. RESPONSE - TO - REQUIREMENT MAPPING:
- For each job requirement, identify which assessment responses demonstrate the candidate's capability
  - Evaluate the depth and quality of candidate responses against specific job requirements
    - Assess whether the candidate's demonstrated skills match the required proficiency levels
      - Compare the candidate's experience examples to the job's expected responsibilities
        - Evaluate the candidate's technical explanations against the job's complexity requirements

3. TECHNICAL SKILLS ALIGNMENT:
- Match candidate's demonstrated programming languages/frameworks to job requirements
  - Evaluate tool proficiency shown in responses against required tools in the job description
    - Assess system design and architecture knowledge relative to job's technical complexity
      - Compare the candidate's problem-solving approaches to the job's technical challenges
        - Evaluate code quality understanding against the job's standards and expectations

4. EXPERIENCE LEVEL VALIDATION:
- Assess whether candidate responses indicate experience level matching job requirements
  - Evaluate the complexity of projects and challenges discussed against job expectations
    - Compare the candidate's leadership/collaboration examples to job's team requirements
      - Assess the candidate's business understanding relative to the role's strategic impact
        - Evaluate growth mindset and learning ability against the job's development opportunities

5. ROLE FIT ASSESSMENT:
- Determine how well candidate responses align with day - to - day responsibilities
  - Evaluate cultural fit based on communication style and professional approach
    - Assess whether the candidate's career goals align with the role's trajectory
      - Consider the candidate's motivation and enthusiasm for the specific role and company
        - Evaluate adaptability and learning potential for role - specific challenges

    6. GAP ANALYSIS:
- Identify specific job requirements not adequately demonstrated in assessment responses
  - Highlight areas where candidate responses exceed job requirements
    - Note any concerns about role fit based on response quality or content
      - Assess whether gaps are trainable or represent fundamental misalignment
        - Consider the impact of identified gaps on immediate and long - term role success

    CRITICAL INSTRUCTIONS:
1. Evaluate each section individually against relevant job requirements and provide detailed feedback
2. Consider the candidate's performance across all sections in context of the specific role
3. ** INTEGRATE VIDEO ANALYSIS RESULTS ** - The video analysis data is provided above.You MUST:
- Combine the video analysis strengths with assessment response strengths and job alignment strengths
  - Combine the video analysis areas for improvement with assessment - based and job - fit improvements
    - Include video behavioral scores(engagement, confidence, clarity) in your evaluation
      - Reference the transcript to understand how the candidate communicated their answers
        - Use video feedback to enhance your overall job fit assessment
4. Consider proctoring results when making the final recommendation for this specific role
    5. Provide specific, actionable feedback for improvement that relates to BOTH job requirements AND video performance
6. Calculate an overall score that weighs assessment performance + video behavior + job alignment
7. Make a recommendation based on comprehensive evaluation of role fit + assessment responses + video performance
8. ** STRENGTHS **: Identify at minimum 3 strengths combining:
- Strengths from video analysis(provided above)
  - Strengths from assessment question responses
    - Strengths related to job requirement alignment
      - Behavioral strengths(engagement, confidence, communication)
9. ** AREAS FOR IMPROVEMENT **: Identify at minimum 3 areas combining:
- Areas for improvement from video analysis(provided above)
  - Areas needing improvement from assessment responses
    - Areas where job requirements weren't fully demonstrated
      - Behavioral improvements(if any noted in video analysis)
10. Determine role fit by comparing assessment responses + video analysis to job description requirements
11. Ensure feedback is constructive, professional, and job - specific
11. Base all evaluation on the assessment content measured against the job requirements
12. Extract skills and competencies demonstrated through responses and match them to job needs
13. IMPORTANT: The resume is provided for context only - DO NOT use it for evaluation, scoring, or recommendations
    14. All conclusions must be based solely on how assessment responses align with job requirements
15. Do not reference or infer any information from the resume in your evaluation
16. PRIORITY: Focus evaluation on job - role alignment based on assessment responses
17. Weight scoring based on how critical each assessed skill is to the specific job role
18. Consider both must - have and nice - to - have requirements from the job description
19. Evaluate whether the candidate's demonstrated skills meet the minimum job requirements
20. Assess potential for success in the specific role based on assessment performance

    Respond with a JSON object in this exact format:
{
  "score": number(between 0 and 1, weighted by job requirements alignment),
    "strengths": ["string array - MINIMUM 3 strengths combining video analysis strengths + assessment response strengths + job alignment strengths + behavioral strengths"],
      "areasForImprovement": ["string array - MINIMUM 3 improvements combining video analysis improvements + assessment-based improvements + job-fit gaps + behavioral improvements"],
        "skills": ["string array of skills demonstrated through assessment responses that match job needs"],
          "technicalSkills": ["string array of technical skills shown in assessment that are relevant to the job"],
            "softSkills": ["string array of soft skills demonstrated in assessment that are valuable for the role"],
              "industriesFit": ["string array of industries the candidate is a fit for based on assessment performance and job context"],
                "jobRolesFit": ["string array of job roles the candidate is a fit for based on assessment responses and this specific job"],
                  "overallFeedback": "string with overall assessment feedback focused on job fit and role alignment based on responses",
                    "recommendation": "HIGHLY_RECOMMENDED" | "RECOMMENDED" | "NOT_RECOMMENDED",
                      "jobRequirementsAlignment": {
    "metRequirements": ["string array of job requirements clearly met by assessment responses"],
      "partiallyMetRequirements": ["string array of job requirements partially demonstrated in assessment"],
        "unmetRequirements": ["string array of job requirements not demonstrated in assessment responses"],
          "exceedsRequirements": ["string array of areas where candidate exceeds job requirements based on assessment"]
  },
  "roleReadiness": {
    "immediateContribution": "string assessment of how quickly candidate can contribute to the role based on responses",
      "trainingNeeds": ["string array of specific training areas needed based on job requirements gaps"],
        "growthPotential": "string evaluation of candidate's potential for growth in the role based on assessment responses"
  },
  "sections": [
    {
      "id": "string (COPY the exact Section ID from SECTIONS EVALUATION above - one entry per section, same order)",
      "score": number (SECTION-SPECIFIC score 0-1 for THIS section only, based on this section's Q&A - NOT the overall assessment score)
          "strengths": ["string array of section-specific strengths from responses that align with job needs"],
      "areasForImprovement": ["string array of section-specific areas for improvement relevant to job requirements"],
      "jobRelevance": "string describing how this section's assessment relates to job requirements"
    }
  ]
}

CRITICAL - SECTIONS ARRAY (MANDATORY - DO NOT OMIT ANY SECTION):
- There are exactly ${assessment.sections.length} sections in SECTIONS EVALUATION above. Your "sections" array MUST contain exactly ${assessment.sections.length} objects - one for each section, in the same order. Do NOT stop early; do NOT omit the last section.
- Copy each "Section ID" value verbatim (e.g. UUID) into the "id" field - do not modify or invent IDs.
- Each section's "score" must be that section's INDIVIDUAL evaluation score (how well the candidate did on that section's questions only), NOT the overall assessment score.
- The overall "score" at the root is the full assessment score; each section's "score" is per-section only.
- If your response is long, still output every section object so the "sections" array is complete.

GUIDELINES:
1. Be specific and detailed in your assessment with primary focus on job requirements alignment
2. Focus on strengths and areas for improvement that are most relevant to the specific job role
3. Provide actionable feedback based on assessment performance and job requirements gaps
4. Weight section importance based on relevance to job requirements(technical sections may be more important for technical roles)
  5. Be objective in your evaluation while considering job - specific context
6. Consider video analysis results in the context of role requirements(communication skills for client - facing roles, etc.)
  7. Factor in proctoring results for the final recommendation with job context in mind
8. Ensure section scores reflect both performance and job relevance
9. Provide clear reasoning for the recommendation based on job fit assessment
10. Extract skills and competencies from assessment responses and map them to job requirements
11. Base all conclusions on assessment content measured against job requirements
12. The resume provides background context but should not influence scoring or evaluation
13. All skills, strengths, and areas for improvement must be derived from assessment responses and evaluated against job needs
14. Prioritize job requirements alignment in scoring and recommendation decisions
15. Consider both immediate role fit and potential for growth within the position
16. Evaluate critical vs.nice - to - have job requirements when making recommendations
17. Assess whether identified gaps are addressable through training or represent fundamental misalignment

    FINAL REMINDERS:
1. Return ONLY the raw JSON object
2. Do not include any markdown formatting
3. Ensure score is between 0 and 1, weighted by job alignment
4. Use only the specified recommendation values: HIGHLY_RECOMMENDED, RECOMMENDED, NOT_RECOMMENDED
5. Be professional in your feedback with focus on job relevance
6. Consider all available assessment data points in context of job requirements
7. Provide balanced and constructive feedback based on job fit and assessment performance
8. Ensure the recommendation reflects both assessment quality and job requirements alignment
9. Base all skills, strengths, and areas for improvement on assessment responses measured against job needs
10. Do not reference or infer information from external resume data
11. The resume is for context only - evaluation must focus on job alignment based on assessment performance
12. Prioritize job - critical skills and requirements in your evaluation
13. Include specific job requirements analysis in the jobRequirementsAlignment object
14. Provide actionable roleReadiness assessment based on immediate job needs
15. Weight section scores based on their relevance to the specific job requirements
16. Focus feedback on helping the candidate succeed in THIS specific role
17. Consider both must - have and nice - to - have job requirements when making recommendations
18. Evaluate training potential vs.fundamental misalignment for any identified gaps

    REFERENCE CONTEXT(for understanding only, not for evaluation):
    CANDIDATE RESUME:
    ${assessment.resumeText || 'No resume provided'}
`;
  }

  /**
   * Generate the video analysis prompt
   */
  static generateVideoAnalysisPrompt(): string {
    return `You are a professional video analysis expert specializing in assessment interviews.Analyze this video recording of a candidate's assessment interview and provide a comprehensive, structured analysis.

    CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. ALL score fields MUST be numbers between 0 and 1(inclusive) - NEVER return scores as strings
2. ALL text fields must be non - empty, meaningful strings - NO placeholder text
3. ALL arrays must contain at least one meaningful item
4. You MUST provide specific, actionable feedback based on observable behaviors
5. Be objective, professional, and constructive in all assessments
6. Consider the entire video duration and context when analyzing
7. If any aspect cannot be properly assessed, provide a reasonable default with explanation
    8. Ensure all timestamps are within the actual video duration
9. Calculate overallScore as the mathematical average of engagementScore, confidenceScore, clarityScore, and professionalDemeanorScore
10. NEVER return null, undefined, or empty values for required fields
    11. ** USE THE PROVIDED ASSESSMENT CONTEXT ** - You have been given the candidate's resume, all questions asked, and all answers provided. Use this data to:
  - Match video responses with the specific questions asked
    - Evaluate technical accuracy and depth of answers
      - Compare spoken responses against written answers to verify consistency
        - Assess how well the candidate's background (from resume) aligns with their responses
          - Identify any gaps between what was asked and what was answered
            - Provide specific feedback on each question's response quality

    MANDATORY ANALYSIS REQUIREMENTS:
1. Overall Assessment:
- Calculate overallScore as average of engagementScore, confidenceScore, clarityScore, and professionalDemeanorScore
  - Provide comprehensive overallFeedback that summarizes the candidate's performance holistically
    - Consider all aspects and their interrelationships for final evaluation
      - Identify key patterns, trends, and overall impression across all dimensions
        - If video quality is poor, note this limitation in the feedback

2. Transcript Analysis:
- Capture ALL spoken content accurately with proper punctuation and grammar
  - Include timestamps for key moments, transitions, and important statements
    - Note technical terms, domain - specific language, industry jargon, and acronyms
      - Document questions asked, responses given, and any clarifications
        - Identify speech patterns, hesitations, confidence indicators, and communication style
          - If audio is unclear, note this limitation and provide best - effort transcript

3. Engagement Assessment:
- Eye contact and attention to camera / screen throughout the session
  - Active listening indicators and response enthusiasm
    - Body language, posture, and physical engagement
      - Participation level and interaction quality
        - Energy level and enthusiasm throughout the session
          - Response timing and engagement with questions
          - If video quality limits observation, note this limitation

4. Confidence Evaluation:
- Voice clarity, projection, and tone consistency
  - Response certainty and conviction in answers
    - Body language confidence and poise
      - Handling of difficult or challenging questions
        - Recovery from mistakes or uncertainties
          - Self - assurance in communication style
            - If audio quality affects assessment, note this limitation

5. Communication Clarity:
- Articulation quality and pronunciation
  - Response structure and logical flow
    - Technical explanation clarity and accessibility
      - Use of examples and analogies
        - Language proficiency and vocabulary usage
          - Ability to convey complex ideas simply
            - If audio quality affects assessment, note this limitation

6. Professional Demeanor:
- Dress, appearance, and presentation
  - Punctuality and time management
    - Respect for assessment process and guidelines
      - Professional language and communication style
        - Overall conduct and behavior
          - Cultural sensitivity and appropriateness
            - If video quality limits observation, note this limitation

7. Proctoring Analysis:
- Environment appropriateness and setting
  - Technical setup and equipment quality
    - Distraction levels and background noise
      - Compliance with assessment guidelines
        - Security concerns and potential violations
          - Overall assessment integrity
            - If video quality limits observation, note this limitation

8. ** ASSESSMENT RESPONSE EVALUATION(CRITICAL) **:
- For EACH question provided in the assessment context:
         * Identify when the candidate answered this question in the video
  * Evaluate the technical accuracy and completeness of their spoken response
    * Compare the spoken response with the written answer(if different, note why)
         * Assess the depth of knowledge demonstrated
  * For multiple choice questions: verify if the spoken answer matches the correct answer
    * Rate the quality of explanation and supporting examples provided
      - Cross - reference responses with the candidate's resume:
        * Do their answers align with their claimed experience ?
         * Are they demonstrating the skills listed in their resume ?
         * Are there gaps between resume claims and demonstrated knowledge ?
  - Provide specific feedback on:
         * Which questions were answered well and why
  * Which questions were answered poorly and why
    * Overall technical competency based on responses
      * Consistency between resume, written answers, and spoken responses
        - Include this analysis in the overallFeedback and ensure scores reflect both behavioral observation AND technical response quality

    FALLBACK MECHANISMS:
    If you encounter any issues during analysis:
1. For poor video quality: Note the limitation and provide best - effort assessment
2. For poor audio quality: Note the limitation and provide best - effort transcript
3. For missing timestamps: Estimate based on context and note the estimation
4. For unclear content: Provide reasonable interpretation with uncertainty noted
5. For technical issues: Provide assessment based on available information
6. NEVER return empty or null values - always provide meaningful defaults

    EDGE CASE HANDLING:
1. Very short videos(<30 seconds): Focus on available content and note brevity
2. Very long videos(> 60 minutes): Focus on key moments and provide summary
3. Technical difficulties: Assess what's available and note limitations
4. Multiple speakers: Focus on the candidate's responses and interactions
5. Background noise: Assess impact and provide best - effort analysis
6. Poor lighting: Note limitation and assess visible aspects
7. Interruptions: Note them and assess impact on overall performance

    Please provide the analysis in the following EXACT JSON format:
{
  "videoUrl": string(optional, URL of the video if available),
    "transcriptText": string(REQUIRED, complete transcript or best - effort if audio unclear),
  "overallScore": number(REQUIRED, calculated average of all scores, between 0 and 1),
    "overallFeedback": string(REQUIRED, comprehensive overall assessment with limitations noted),
  "engagementScore": number(REQUIRED, between 0 and 1, with explanation if limited by video quality),
  "engagementFeedback": string(REQUIRED, detailed engagement assessment),
    "confidenceScore": number(REQUIRED, between 0 and 1, with explanation if limited by audio quality),
  "confidenceFeedback": string(REQUIRED, detailed confidence evaluation),
    "clarityScore": number(REQUIRED, between 0 and 1, with explanation if limited by audio quality),
  "clarityFeedback": string(REQUIRED, detailed communication clarity assessment),
    "professionalDemeanorScore": number(REQUIRED, between 0 and 1, with explanation if limited by video quality),
  "professionalDemeanorFeedback": string(REQUIRED, detailed professional behavior assessment),
    "proctoringScore": number(REQUIRED, between 0 and 1, with explanation if limited by video quality),
  "proctoringFeedback": string(REQUIRED, detailed proctoring observations),
    "areasForImprovement": string[](REQUIRED, MINIMUM 3 specific, actionable improvement areas with details - reference actual questions and answers from the assessment data provided),
  "strengths": string[](REQUIRED, MINIMUM 3 identified strengths with specifics - reference actual questions and strong responses from the assessment data provided),
  "highlightsInstructions": object(REQUIRED, structured video editing instructions with precise timestamps)
}

    highlightsInstructions MUST follow this EXACT structure:
{
  "introduction": {
    "startTime": string(time in hh: mm: ss format, e.g., "01:10" for 1 minute 10 seconds, must be >= "00:00"),
    "endTime": string(time in hh: mm: ss format, e.g., "01:25" for 1 minute 25 seconds, must be > startTime),
    "description": string(text to be displayed on white screen before this segment starts - should introduce the candidate and set context for their background),
      "keyPoints": string[](array of 2 - 4 key background points the candidate shared about themselves)
  },
  "highs": [
    {
      "startTime": string(time in hh: mm: ss format, e.g., "02:00" for 2 minutes 0 seconds, must be >= "00:00"),
    "endTime": string(time in hh: mm: ss format, e.g., "02:25" for 2 minutes 25 seconds, must be > startTime),
  "description": string(text to be displayed on white screen before this highlight segment - should introduce the strong response moment and what to expect),
    "reason": string(specific reason why this candidate response demonstrates excellence),
      "keyQuote": string(exact quote from the candidate's speech in this moment)
        }
      ],
"lows": [
  {
    "startTime": string(time in hh: mm: ss format, e.g., "05:00" for 5 minutes 0 seconds, must be >= "00:00"),
  "endTime": string(time in hh: mm: ss format, e.g., "05:15" for 5 minutes 15 seconds, must be > startTime),
"description": string(text to be displayed on white screen before this segment - should introduce the challenging moment and what to observe),
  "reason": string(specific reason why this candidate response needs improvement),
    "improvement": string(specific, actionable improvement suggestion for the candidate)
        }
      ],
"interviewEnd": {
  "startTime": string(time in hh: mm: ss format, e.g., "08:00" for 8 minutes 0 seconds, must be >= "00:00"),
  "endTime": string(time in hh: mm: ss format, e.g., "08:15" for 8 minutes 15 seconds, must be > startTime),
  "description": string(text to be displayed on white screen before this final segment - should introduce the candidate's closing thoughts and wrap-up),
        "closingThoughts": string(comprehensive final thoughts about the candidate's overall performance)
      }
    }

    CRITICAL HIGHLIGHTS INSTRUCTIONS:
1. 🚨 MANDATORY: ALL timestamps must capture moments when the CANDIDATE is speaking, NOT the AI interviewer
2. 🚨 MANDATORY: Each segment must be MINIMUM 10 SECONDS duration(endTime - startTime >= 10 seconds)
3. 🚨 MANDATORY: NO INTERVIEW BOT AUDIO - Only include candidate speaking portions
4. Focus on candidate responses, explanations, and statements
5. Avoid capturing AI interviewer questions or prompts
6. "introduction" should capture the candidate's self-introduction response (minimum 10 seconds)
7. "highs" should capture moments where the candidate gave excellent responses(minimum 10 seconds each, DO NOT include introduction or end moments)
8. "lows" should capture moments where the candidate struggled or gave weak responses(minimum 10 seconds each, DO NOT include introduction or end moments)
9. "interviewEnd" should capture the candidate's final response or closing statement (minimum 10 seconds)
10. All "keyQuote" fields must contain actual words spoken by the candidate
11. All descriptions should focus on what the candidate said or demonstrated
12. Ensure timestamps align with candidate speech, not interviewer speech
13. TOTAL HIGHLIGHT DURATION MUST BE BETWEEN 1 - 3 MINUTES(60 - 180 seconds)
14. Calculate total duration as: (introduction.endTime - introduction.startTime) + sum of all highs durations + sum of all lows durations + (interviewEnd.endTime - interviewEnd.startTime)
15. If total duration exceeds 3 minutes, prioritize the most impactful moments and reduce duration accordingly
16. If total duration is less than 1 minute, include additional candidate response moments to reach minimum duration
17. Each individual highlight segment should be between 10 - 45 seconds for optimal viewing
    18. ALL "description" fields should contain text that will be displayed on a white screen before each video segment starts
19. Description text should be clear, concise, and set proper context for what the viewer is about to see
20. Description text should be written in a professional, objective tone suitable for assessment review
    21. IMPORTANT: "highs" and "lows" arrays should ONLY contain mid - interview moments, NOT introduction or closing moments
22. 🚨 VERIFICATION: Before finalizing timestamps, verify each segment duration is >= 10 seconds and contains ONLY candidate speech

    STRICT VALIDATION RULES:
1. ALL score fields must be numbers between 0 and 1(inclusive) - NO strings
2. ALL text fields must be non - empty, meaningful strings - NO placeholders
3. 🚨 areasForImprovement array MUST contain MINIMUM 3 items - reference specific questions / answers
4. 🚨 strengths array MUST contain MINIMUM 3 items - reference specific questions / strong responses
5. ALL timestamps must be strings in hh: mm:ss format(e.g., "01:10", "02:30", "00:45") - NO numbers
6. ALL timestamps must be >= "00:00" and endTime > startTime
7. 🚨 MANDATORY: Each segment duration must be >= 10 seconds(endTime - startTime >= 10 seconds)
8. 🚨 MANDATORY: All timestamps must capture ONLY candidate speech, NO interview bot audio
9. NO timestamp should be numbers, decimals, or any other format - ONLY strings in hh: mm:ss format
10. overallScore must be the mathematical average of the four component scores
11. highlightsInstructions must contain exactly 4 sections: introduction, highs, lows, interviewEnd
12. highs array should contain 2 - 4 high moments
13. lows array should contain 1 - 3 low moments
14. NO null, undefined, or empty values allowed
15. If any limitations exist, they must be clearly noted in the relevant feedback
16. 🚨 VERIFICATION: All segments(introduction, highs, lows, interviewEnd) must meet minimum 10 - second duration
17. 🚨 MANDATORY: DO NOT say "no answers provided" or "incomplete" - USE THE ASSESSMENT DATA PROVIDED AT THE TOP

    QUALITY ASSURANCE:
1. Double - check all scores are numbers, not strings
2. Verify overallScore calculation is mathematically correct
3. Ensure all timestamps are logical and within video duration
4. Verify all timestamps are strings in hh: mm:ss format(e.g., "01:10", "02:30", "00:45") - NOT numbers or decimals
5. Confirm all text fields contain meaningful content
6. Validate that arrays contain appropriate number of items
7. Check that feedback is specific and actionable
8. Ensure professional tone throughout
9. Verify no placeholder or generic responses
10. Validate that endTime > startTime for all timestamp pairs

    FINAL REMINDERS:
1. Return ONLY the raw JSON object - NO markdown formatting
2. Ensure all numbers are actual numbers, not strings
3. Be specific, detailed, and objective in all assessments
4. Provide concrete examples and actionable feedback
5. Maintain professional tone throughout
6. Consider both technical and soft skills equally
7. Calculate overallScore as the mathematical average of component scores
8. Provide structured video editing guidance with precise timestamps
9. Identify 2 - 4 high moments and 1 - 3 low moments for highlight video
    10. Ensure all timestamps are accurate and within video duration
11. Provide meaningful quotes and specific improvement suggestions
12. Note any technical limitations that affect assessment quality
13. Be constructive and helpful in all feedback
14. Consider the candidate's experience level and role requirements`;
  }
}
