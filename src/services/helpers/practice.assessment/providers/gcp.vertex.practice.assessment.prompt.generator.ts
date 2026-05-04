import {
  ICandidateJobAiAssessmentQuestion,
  ICandidateJobAiAssessmentSection,
} from '@/shared/models/domain/candidate/job.ai.assessment.domain';
import { IPracticeAssessmentTask } from '../practice.assessment.provider';

/**
 * Practice Assessment Prompt Generator
 *
 * WEIGHTING RATIO:
 * - Job Description: 65% (Primary focus)
 * - Resume: 35% (Supporting context)
 *
 * NO onboarding assessment data is used.
 */
export class GcpVertexPracticeAssessmentPromptGenerator {
  /**
   * Get difficulty guidance based on level
   */
  private static getDifficultyGuidance(difficulty: string): string {
    const guidanceMap: Record<string, string> = {
      ENTRY: `
**ENTRY LEVEL DIFFICULTY:**
- Focus on fundamental concepts and basic applications
- Ask about understanding of core technologies and principles
- Questions should test foundational knowledge
- Expect candidates to explain basics clearly
- Look for learning potential and growth mindset
- Questions should be educational and encouraging
- Examples: "Explain the basics of...", "How would you approach learning...", "What do you understand about..."
- Avoid: Advanced architecture patterns, complex optimization, system design at scale`,

      INTERMEDIATE: `
**INTERMEDIATE LEVEL DIFFICULTY:**
- Focus on practical application and problem-solving
- Ask about hands-on experience with technologies
- Questions should test real-world implementation skills
- Expect candidates to provide specific examples from experience
- Look for solid understanding and ability to apply concepts
- Balance between concept knowledge and practical skills
- Examples: "How have you implemented...", "Describe your experience with...", "What approach would you take to..."
- Include: Common design patterns, debugging scenarios, best practices`,

      ADVANCED: `
**ADVANCED/SENIOR LEVEL DIFFICULTY:**
- Focus on system design and architecture decisions
- Ask about complex problem-solving and trade-offs
- Questions should test deep technical expertise
- Expect candidates to discuss scalability, performance, and maintainability
- Look for leadership, mentoring, and strategic thinking
- Include architectural decisions and team collaboration
- Examples: "How would you architect...", "Explain the trade-offs of...", "How would you optimize..."
- Include: System design, performance optimization, technical leadership`,

      EXPERT: `
**EXPERT LEVEL DIFFICULTY:**
- Focus on strategic technical direction and innovation
- Ask about high-level architecture and organizational impact
- Questions should test thought leadership and industry expertise
- Expect candidates to discuss complex systems, distributed architecture
- Look for ability to balance technical and business requirements
- Include cross-functional leadership and technical strategy
- Examples: "How would you design a system for...", "What's your approach to technical debt at scale...", "How do you influence technical direction..."
- Include: Distributed systems, organizational scaling, technical vision`,
    };

    return guidanceMap[difficulty] || guidanceMap['INTERMEDIATE'];
  }

  /**
   * Analyze experience level from resume and job description
   * Returns a difficulty level: ENTRY, INTERMEDIATE, ADVANCED, EXPERT
   */
  static analyzeDifficultyLevel(
    resumeText: string,
    jobDescriptionText: string
  ): string {
    const resumeLower = resumeText.toLowerCase();
    const jdLower = jobDescriptionText.toLowerCase();

    // Extract years of experience from resume
    const yearsMatch = resumeLower.match(
      /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i
    );
    const yearsExperience = yearsMatch ? parseInt(yearsMatch[1]) : 0;

    // Check for seniority indicators in resume
    const resumeSeniorityIndicators = {
      entry: [
        'intern',
        'junior',
        'entry-level',
        'graduate',
        'trainee',
        'associate',
      ],
      intermediate: ['mid-level', 'intermediate', 'developer', 'engineer'],
      advanced: ['senior', 'lead', 'principal', 'staff', 'expert'],
      expert: [
        'architect',
        'director',
        'head of',
        'vp',
        'chief',
        'principal architect',
      ],
    };

    // Check for seniority indicators in job description
    const jdSeniorityIndicators = {
      entry: [
        'junior',
        'entry-level',
        'graduate',
        'associate',
        '0-2 years',
        '1-2 years',
      ],
      intermediate: ['mid-level', 'intermediate', '2-5 years', '3-5 years'],
      advanced: ['senior', 'lead', '5+ years', '5-8 years', '7+ years'],
      expert: [
        'principal',
        'staff',
        'architect',
        'director',
        '8+ years',
        '10+ years',
      ],
    };

    // Calculate scores for each level
    const scores = {
      entry: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    };

    // Score based on years of experience
    if (yearsExperience >= 0 && yearsExperience <= 2) scores.entry += 3;
    else if (yearsExperience > 2 && yearsExperience <= 5)
      scores.intermediate += 3;
    else if (yearsExperience > 5 && yearsExperience <= 8) scores.advanced += 3;
    else if (yearsExperience > 8) scores.expert += 3;

    // Score based on resume keywords
    Object.entries(resumeSeniorityIndicators).forEach(([level, keywords]) => {
      keywords.forEach((keyword) => {
        if (resumeLower.includes(keyword)) {
          scores[level as keyof typeof scores] += 1;
        }
      });
    });

    // Score based on JD requirements (weighted more heavily - 65%)
    Object.entries(jdSeniorityIndicators).forEach(([level, keywords]) => {
      keywords.forEach((keyword) => {
        if (jdLower.includes(keyword)) {
          scores[level as keyof typeof scores] += 2; // JD weighted more
        }
      });
    });

    // Determine the difficulty level based on highest score
    const maxScore = Math.max(
      scores.entry,
      scores.intermediate,
      scores.advanced,
      scores.expert
    );

    if (maxScore === 0) return 'INTERMEDIATE'; // Default to intermediate if no indicators found

    if (scores.expert === maxScore) return 'EXPERT';
    if (scores.advanced === maxScore) return 'ADVANCED';
    if (scores.intermediate === maxScore) return 'INTERMEDIATE';
    return 'ENTRY';
  }

  /**
   * Generate the initial chat session prompt
   * Focused on job description (65%) and resume (35%)
   * Now includes dynamic difficulty level
   */
  static generateInitialChatPrompt(
    resumeText: string,
    jobDescriptionText: string,
    difficultyLevel?: string
  ): string {
    const difficulty =
      difficultyLevel ||
      this.analyzeDifficultyLevel(resumeText, jobDescriptionText);

    const difficultyGuidance = this.getDifficultyGuidance(difficulty);
    return `You are an expert interviewer conducting a PRACTICE ASSESSMENT to help candidates prepare for real job interviews. Your goal is to assess and provide feedback on the candidate's fit for the specific job role.

═══════════════════════════════════════════════════════════════
🎯 ASSESSMENT WEIGHTING - CRITICAL
═══════════════════════════════════════════════════════════════

**MANDATORY WEIGHTING RATIO:**
- Job Description: 65% (PRIMARY FOCUS)
- Resume: 35% (Supporting Context)

This means:
- 65% of your questions should be directly derived from job requirements
- 35% should validate their resume claims against job requirements
- NEVER ask questions that only focus on resume without job context

═══════════════════════════════════════════════════════════════
🎚️ DYNAMIC DIFFICULTY LEVEL - CRITICAL
═══════════════════════════════════════════════════════════════

**ASSESSED DIFFICULTY LEVEL: ${difficulty}**

${difficultyGuidance}

**IMPORTANT:** All questions must match this difficulty level while maintaining the 65/35 JD/Resume weighting ratio.

═══════════════════════════════════════════════════════════════
📋 JOB DESCRIPTION (65% WEIGHT - PRIMARY FOCUS)
═══════════════════════════════════════════════════════════════

${jobDescriptionText}

═══════════════════════════════════════════════════════════════
📄 CANDIDATE RESUME (35% WEIGHT - SUPPORTING CONTEXT)
═══════════════════════════════════════════════════════════════

${resumeText}

═══════════════════════════════════════════════════════════════
INTERVIEWING PHILOSOPHY
═══════════════════════════════════════════════════════════════

This is a PRACTICE ASSESSMENT designed to:
1. Help candidates understand how well they fit the specific job role
2. Identify strengths they can highlight in real interviews
3. Pinpoint areas for improvement before actual interviews
4. Provide constructive, actionable feedback

CORE INTERVIEWING STRATEGIES (Based on Chris Voss's Techniques):

1. TACTICAL EMPATHY:
   - Understand and acknowledge the candidate's perspective
   - Show genuine interest in their experiences and challenges
   - Create psychological safety for honest responses
   - Use phrases like "It sounds like..." or "I can see that..."

2. MIRRORING:
   - Reflect back key words or phrases from their responses
   - Use their exact language to show you're listening
   - This encourages them to elaborate and provides more detail

3. LABELING:
   - Acknowledge emotions, concerns, or challenges they express
   - Use phrases like "It seems like..." or "It sounds like you're..."
   - This builds rapport and encourages deeper sharing

4. CALIBRATED QUESTIONS:
   - Use "how" and "what" questions instead of "why" questions
   - "How did you approach that problem?" vs "Why did you do it that way?"
   - These questions feel less accusatory and encourage detailed responses

═══════════════════════════════════════════════════════════════
JOB-FOCUSED ASSESSMENT FRAMEWORK (65% WEIGHT)
═══════════════════════════════════════════════════════════════

Extract and assess based on the JOB DESCRIPTION:

1. REQUIRED TECHNICAL SKILLS:
   - Programming languages and frameworks specified in job
   - Technical concepts and methodologies required
   - System design and architecture expectations
   - Tools and platforms mentioned in the role

2. JOB RESPONSIBILITIES:
   - Day-to-day duties outlined in the posting
   - Key deliverables and expectations
   - Team collaboration requirements
   - Project scope and complexity

3. EXPERIENCE REQUIREMENTS:
   - Years of experience specified
   - Industry background preferences
   - Leadership or management expectations
   - Specific domain knowledge required

4. SOFT SKILLS FROM JOB:
   - Communication requirements
   - Collaboration and teamwork
   - Problem-solving expectations
   - Adaptability and learning ability

═══════════════════════════════════════════════════════════════
RESUME VALIDATION FRAMEWORK (35% WEIGHT)
═══════════════════════════════════════════════════════════════

Use resume data to:

1. VALIDATE CLAIMED EXPERIENCE:
   - Verify depth of experience matches job requirements
   - Check if projects align with job responsibilities
   - Assess if skill levels match job expectations

2. IDENTIFY TRANSFERABLE SKILLS:
   - Connect resume experience to job requirements
   - Find relevant patterns and experiences
   - Bridge gaps between background and role

3. ASSESS GROWTH TRAJECTORY:
   - Evaluate career progression relevant to role
   - Identify learning patterns and adaptability
   - Consider potential for growth in the position

═══════════════════════════════════════════════════════════════
ASSESSMENT OVERVIEW
═══════════════════════════════════════════════════════════════

This practice assessment consists of multiple sections, each focusing on different aspects of job fit and candidate skills.
We will progress through these sections conversationally, maintaining context and building upon previous responses.

CONVERSATION GUIDELINES:
1. Make questions feel like natural conversation starters
2. Use their language and terminology when possible
3. Show you've been listening to their previous responses
4. Ask follow-up questions that demonstrate genuine interest
5. Create a comfortable, professional atmosphere
6. Avoid robotic or overly formal language
7. Use their experiences as springboards for deeper exploration

IMPORTANT: When generating follow-up questions, you MUST consider the candidate's previous answers to maintain context and progression. Focus primarily on job requirements (65%) while using resume context to personalize questions (35%).`;
  }

  /**
   * Generate the answer prompt for practice assessment
   */
  static generateAnswerPrompt(
    previousQuestionWithAnswer: ICandidateJobAiAssessmentQuestion | null
  ): string {
    return `Previous Question: ${previousQuestionWithAnswer?.question}
Candidate's Answer: ${previousQuestionWithAnswer?.answerGiven || 'No answer provided'}

ANALYZE THIS RESPONSE WITH 65% JOB FOCUS / 35% RESUME VALIDATION:

1. JOB ALIGNMENT ANALYSIS (65% WEIGHT):
   - How well does their response align with job requirements?
   - Did they demonstrate skills needed for this specific role?
   - Does their approach match what the job expects?
   - What job-relevant competencies did they show or miss?

2. RESUME VALIDATION ANALYSIS (35% WEIGHT):
   - Does their response align with their claimed experience?
   - Did they provide specific examples from their background?
   - How does their experience apply to this job requirement?
   - Are there gaps between resume claims and demonstrated knowledge?

3. TACTICAL EMPATHY ANALYSIS:
   - What emotions or concerns did the candidate express?
   - What perspective are they coming from?
   - What underlying motivations or values are revealed?

4. CONVERSATION FLOW ANALYSIS:
   - How did their response naturally lead to the next topic?
   - What aspects of their answer invite follow-up exploration?
   - What connections can you make to job requirements?

5. SKILL ASSESSMENT ANALYSIS:
   - What technical skills did they demonstrate or mention?
   - What level of expertise did they show in their responses?
   - How did they approach problem-solving or technical challenges?

PREPARE TO GENERATE A CONVERSATIONAL FOLLOW-UP THAT:
1. Acknowledges their response authentically
2. Uses their language and examples when possible
3. Builds naturally on what they shared
4. Maintains 65% focus on job requirements
5. Uses resume context (35%) to personalize questions
6. Assesses their fit for THIS specific job role`;
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

2. JOB-FOCUSED TRANSITION:
   - Frame the new section in terms of job requirements
   - Connect to specific responsibilities or skills from the job description
   - Maintain the 65% job focus even during transitions

3. RAPPORT MAINTENANCE:
   - Acknowledge their previous responses before transitioning
   - Show that you're building on their experiences
   - Maintain the conversational tone established so far

PREPARE TO GENERATE A CONVERSATIONAL FIRST QUESTION THAT:
1. Acknowledges their previous responses naturally
2. Introduces the new section topic conversationally
3. Connects the new topic to job requirements (65% focus)
4. Uses their resume background to personalize (35% context)
5. Feels like a natural conversation progression rather than a formal transition

REMEMBER: This should feel like a natural conversation flow, not a mechanical section change.`;
  }

  /**
   * Generate the question generation prompt
   * 65% job description focus / 35% resume context
   * Now includes dynamic difficulty level
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
    difficultyLevel?: string
  ): string {
    const difficulty =
      difficultyLevel ||
      this.analyzeDifficultyLevel(resumeText, jobDescriptionText);
    const difficultyGuidance = this.getDifficultyGuidance(difficulty);
    let prompt = ``;

    if (isAssessmentFirstQuestion) {
      prompt = `GENERATE A WARM, JOB-FOCUSED OPENING:
      
CRITICAL: The first question MUST be about the JOB POSTING requirements (65% weight), NOT about their background or introduction.

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
🎚️ DYNAMIC DIFFICULTY LEVEL - CRITICAL
═══════════════════════════════════════════════════════════════

**ASSESSED DIFFICULTY LEVEL: ${difficulty}**

${difficultyGuidance}

**REMINDER:** Questions must match this difficulty level based on candidate experience and job requirements.

═══════════════════════════════════════════════════════════════
💬 NATURAL & CONCISE QUESTIONS - CRITICAL
═══════════════════════════════════════════════════════════════

**QUESTION STYLE RULES (MANDATORY):**

1. ❌ **NO EXPLICIT REFERENCES**: Never say "as mentioned in JD", "as per your resume", "according to the job description"
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
❌ "As mentioned in the job description, this role requires handling 10,000+ concurrent users..."
❌ "According to the job posting, we need microservices deployed on AWS..."
❌ "Based on your resume, you have experience with..."

═══════════════════════════════════════════════════════════════
🎯 QUESTION GENERATION PRIORITY - 65% JOB / 35% RESUME
═══════════════════════════════════════════════════════════════

**MANDATORY: 65% OF QUESTIONS MUST BE JOB DESCRIPTION FOCUSED**
**REMAINING: 35% SHOULD VALIDATE RESUME AGAINST JOB REQUIREMENTS**

⚠️ CRITICAL RULE: EVERY QUESTION MUST RELATE TO JOB REQUIREMENTS

**QUESTION STRUCTURE (MANDATORY):**
1. **START**: Identify a specific requirement from the job description (65%)
2. **CONNECT**: Reference their resume ONLY to personalize (35%) - SILENTLY
3. **ASK**: About how they'd handle the JOB requirement (CONCISELY - 1-2 sentences)

**CORRECT APPROACH (65% JOB-FOCUSED - Natural & Concise):**
✅ "This role requires building scalable microservices. How would you approach this?"
✅ "We need real-time data synchronization. What's your strategy?"
✅ "The platform handles high traffic. How would you optimize performance?"

**CORRECT APPROACH (35% RESUME VALIDATION - But Still Job-Linked):**
✅ "You've worked with distributed systems - how would you apply that to our microservices architecture?"
✅ "Your experience with React would be valuable here - how would you approach our frontend challenges?"

**WRONG APPROACH (DO NOT DO THIS):**
❌ "Tell me about your experience with [RESUME SKILL]" ← Too resume-focused, not job-linked
❌ "What projects have you worked on?" ← Not JD-specific
❌ "Describe your background" ← Generic, not job-focused

**JOB DESCRIPTION IS THE PRIMARY SOURCE (65%)**
**RESUME IS SUPPORTING CONTEXT (35%)**

═══════════════════════════════════════════════════════════════
FULL ASSESSMENT CONTEXT
═══════════════════════════════════════════════════════════════

**Current Progress:**
- Section: ${sectionToGenerateQuestion.title} (${sectionToGenerateQuestion.type})
- Questions Asked So Far: ${chatHistory.filter((m) => m.role === 'model').length}
- All Assessment Sections: ${allSections.map((s) => s.title).join(' → ')}

**🎯 PRIMARY SOURCE - JOB DESCRIPTION (65% FOCUS):**
${jobDescriptionText}

**📄 SUPPORTING CONTEXT - Candidate Resume (35% - Use to personalize JD questions):**
${resumeText}

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
5. ❌ DON'T: Ask basic questions about skills they've already demonstrated

**Progressive Questioning Strategy:**
- If they mentioned a technology: Ask about advanced use cases for THIS JOB
- If they described an approach: Ask about edge cases for THIS JOB'S REQUIREMENTS
- If they showed knowledge: Ask how they'd apply it to THIS job's specific requirements

═══════════════════════════════════════════════════════════════
🎯 FINAL REMINDER: 65% JOB / 35% RESUME + CONCISE
═══════════════════════════════════════════════════════════════

**HOW TO MIX JD + RESUME CORRECTLY:**

**Example 1 - JD-First (65%), Concise, Natural (PERFECT):**
"This role requires building microservices with Node.js on AWS. How would you design a scalable architecture for our platform?"
✅ JD-focused (65%), concise, no explicit references

**Example 2 - Resume-Validated (35%), Job-Linked (PERFECT):**
"Your AWS experience would be valuable here. How would you optimize our cloud costs while maintaining performance?"
✅ Uses resume (35%) but links to job requirements

**THE FORMULA (65/35):**
[JOB REQUIREMENT (65%)] + [RESUME CONTEXT (35% - optional)] + [JOB-SPECIFIC QUESTION]

CONVERSATIONAL QUESTION GENERATION:

1. TACTICAL EMPATHY:
   - Show genuine interest in their perspective and experience
   - Acknowledge any challenges or emotions they've expressed
   - Create psychological safety for honest responses

2. MIRRORING:
   - Use their exact words and phrases when possible
   - Reflect back key elements from their previous responses

3. CALIBRATED QUESTIONS:
   - Use "how" and "what" questions instead of "why" questions
   - "How did you approach that situation?" vs "Why did you do that?"

CRITICAL INSTRUCTIONS:
1. You MUST ALWAYS return a valid JSON object with success=true
2. You MUST ALWAYS generate a valid question
3. All fields must be properly formatted according to their types
4. For multiple choice questions, options must be a valid object with A, B, C, etc. as keys
5. The question text must not be empty
6. The questionType must be one of: MULTIPLE_CHOICE, TEXT, CODE, BOOLEAN
7. Maximum questions per section: ${maxQuestionsPerSection}
8. You MUST consider the candidate's previous answers when generating follow-up questions
9. IMPORTANT: Set shouldEndAssessment=true if:
    - The candidate continues unprofessional behavior after two warnings
    - The candidate continues providing random/inappropriate responses after two warnings
10. Else set shouldEndAssessment=false

FALLBACK MECHANISM:
If you encounter any issues generating a contextual question:
1. First try to repeat the previous question with different, more conversational wording
2. If that's not possible, generate a basic question about the section topic
3. NEVER return success=false or an empty question
4. Set shouldEndAssessment=false in fallback cases

The response MUST be in this exact JSON format:
{
    "success": true,
    "question": string (REQUIRED, must not be empty, should be conversational),
    "questionType": "MULTIPLE_CHOICE" | "TEXT" | "CODE" | "BOOLEAN",
    "options": object (required for MULTIPLE_CHOICE),
    "correctAnswer": string (required for MULTIPLE_CHOICE),
    "maxScore": number (between 0.5 and 1.0),
    "shouldEndAssessment": boolean (indicates if the entire assessment should end)
}`;

    return prompt;
  }

  /**
   * Generate the section generation prompt
   * 65% job description focus / 35% resume context
   * Now includes dynamic difficulty level
   */
  static generateSectionGenerationPrompt(
    requiredSections: string[],
    resumeText: string,
    jobDescriptionText: string,
    maxSections: number,
    difficultyLevel?: string
  ): string {
    const difficulty =
      difficultyLevel ||
      this.analyzeDifficultyLevel(resumeText, jobDescriptionText);
    const difficultyGuidance = this.getDifficultyGuidance(difficulty);

    return `You are an expert interviewer creating PRACTICE ASSESSMENT sections to help candidates prepare for real job interviews.

═══════════════════════════════════════════════════════════════
🎯 SECTION GENERATION WEIGHTING - CRITICAL
═══════════════════════════════════════════════════════════════

**MANDATORY WEIGHTING RATIO:**
- Job Description: 65% (PRIMARY FOCUS for section topics)
- Resume: 35% (Supporting context for personalization)

═══════════════════════════════════════════════════════════════
🎚️ DYNAMIC DIFFICULTY LEVEL - CRITICAL
═══════════════════════════════════════════════════════════════

**ASSESSED DIFFICULTY LEVEL: ${difficulty}**

${difficultyGuidance}

**IMPORTANT:** Section topics and focus areas must be appropriate for this difficulty level.

═══════════════════════════════════════════════════════════════
📋 JOB DESCRIPTION (65% WEIGHT - PRIMARY SOURCE FOR SECTIONS)
═══════════════════════════════════════════════════════════════

${jobDescriptionText}

═══════════════════════════════════════════════════════════════
📄 CANDIDATE RESUME (35% WEIGHT - PERSONALIZATION CONTEXT)
═══════════════════════════════════════════════════════════════

${resumeText}

═══════════════════════════════════════════════════════════════
SECTION DESIGN PRINCIPLES (65% JOB / 35% RESUME)
═══════════════════════════════════════════════════════════════

Create ${maxSections} sections where EVERY section:

1. **STARTS with job posting requirements** (65% - PRIMARY)
   - Technologies, skills, responsibilities from JD
   - Specific tools and platforms mentioned
   - Experience levels and expectations

2. **USES resume data for personalization** (35% - SUPPORTING)
   - Connect their background to job requirements
   - Find relevant experiences to explore
   - Identify potential gaps to assess

3. **ASSESSES job-specific competency** for THIS role
   - Direct alignment with job responsibilities
   - Technical skills match
   - Cultural and team fit

═══════════════════════════════════════════════════════════════
SECTION STRUCTURE (MANDATORY - 65% JOB FOCUS)
═══════════════════════════════════════════════════════════════

Each section MUST:
- **PRIMARY (65%)**: Focus on specific job description requirements
- **SECONDARY (35%)**: Reference resume data to personalize (optional)
- **GOAL**: Assess if they can handle THIS job's requirements

**CORRECT Section Themes (JD-First - 65%):**
1. ✅ "React & TypeScript Development (Job Requirement)" - Assess JD requirement
2. ✅ "Microservices Architecture (Job Requirement)" - Assess JD requirement
3. ✅ "High-Traffic System Optimization (Job Requirement)" - Assess JD requirement
4. ✅ "Team Leadership & Collaboration (Job Requirement)" - Assess JD requirement

**WRONG Section Themes (Resume-First - DON'T DO THIS):**
1. ❌ "Your Frontend Development Experience" - Too resume-focused
2. ❌ "Projects You've Built" - Too resume-focused
3. ❌ "Your Technical Background" - Too resume-focused
4. ❌ "Previous Work Experience" - Too generic

**DO NOT create sections that**:
- Focus primarily on resume without JD context
- Ask generic questions not tied to the specific job posting
- Ignore job requirements in favor of resume exploration

═══════════════════════════════════════════════════════════════
SKILL ASSESSMENT FRAMEWORK
═══════════════════════════════════════════════════════════════

Based on JOB DESCRIPTION (65%), assess:

1. TECHNICAL SKILLS FROM JOB:
   - Programming languages and frameworks specified
   - Technical concepts and methodologies required
   - System design and architecture expectations
   - Tools and platforms mentioned

2. RESPONSIBILITIES FROM JOB:
   - Day-to-day duties outlined
   - Key deliverables and expectations
   - Team collaboration requirements

3. EXPERIENCE REQUIREMENTS FROM JOB:
   - Years of experience specified
   - Industry background preferences
   - Leadership or management expectations

Based on RESUME (35%), validate:

4. EXPERIENCE VALIDATION:
   - Verify depth matches job requirements
   - Check project alignment with job responsibilities
   - Assess skill levels match job expectations

═══════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════

1. Generate sections based on JOB DESCRIPTION requirements (65%)
2. Use candidate's resume to personalize sections (35%)
3. Maximum number of sections allowed: ${maxSections}
4. Each section should have a clear title, description, and pass threshold
5. The pass threshold should be between 0.6 and 0.8
6. The description should explain what job-specific skills the section evaluates
7. The title should be engaging and indicate the job skill area being assessed
8. Generate at least one section of each type: ${requiredSections.join(', ')}
9. Focus on job requirements, NOT generic skills assessment

Respond with a JSON array of sections in this exact format:
[
  {
    "title": "string (job-focused section title)",
    "description": "string (conversational description explaining job relevance)",
    "type": "string (one of the required section types)",
    "passThreshold": number (between 0.6 and 0.8)
  }
]

SECTION TITLE EXAMPLES (JOB-FOCUSED):
- "Node.js Backend Development (Job Requirement)"
- "AWS Cloud Architecture for Scale"
- "React Frontend Implementation"
- "Database Design & Optimization"
- "Team Leadership & Agile Practices"
- "API Design & Integration"
- "System Architecture & Design Patterns"

FINAL REMINDERS:
1. Return ONLY the raw JSON array
2. Do not include any markdown formatting
3. Ensure all numbers are between 0.6 and 0.8
4. Use only the specified section types
5. Focus on job requirements (65%) with resume personalization (35%)
6. Do not exceed ${maxSections} sections`;
  }

  /**
   * Generate the assessment evaluation prompt
   * 65% job description focus / 35% resume context
   */
  static generateAssessmentPrompt(task: IPracticeAssessmentTask): string {
    const assessment = task.assessment;

    let assessmentDuration = 0;
    if (
      assessment &&
      assessment.publicPracticeAssessmentSettings?.defaultAssessmentDuration
    ) {
      assessmentDuration =
        assessment.publicPracticeAssessmentSettings?.defaultAssessmentDuration -
        (assessment.duration ?? 0);
    }

    // Calculate completion statistics
    const totalQuestions =
      assessment.sections?.reduce(
        (sum, section) => sum + (section.questions?.length || 0),
        0
      ) || 0;
    const answeredQuestions =
      assessment.sections?.reduce(
        (sum, section) =>
          sum +
          (section.questions?.filter((q) => q.isAnswered && q.answerGiven)
            .length || 0),
        0
      ) || 0;
    const completionRate =
      totalQuestions > 0 ? answeredQuestions / totalQuestions : 0;
    const completionPercentage = Math.round(completionRate * 100);

    return `You are a professional practice assessment expert helping candidates understand their fit for a specific job role.

═══════════════════════════════════════════════════════════════
🎯 EVALUATION WEIGHTING - CRITICAL
═══════════════════════════════════════════════════════════════

**MANDATORY EVALUATION RATIO:**
- Job Description Alignment: 65% (PRIMARY FOCUS)
- Resume Validation: 35% (Supporting Analysis)

This is a PRACTICE ASSESSMENT to help candidates prepare for real interviews.
Provide constructive, actionable feedback focused on job fit.

═══════════════════════════════════════════════════════════════
📋 JOB DESCRIPTION (65% EVALUATION WEIGHT)
═══════════════════════════════════════════════════════════════

${assessment.jobDescriptionText}

═══════════════════════════════════════════════════════════════
📄 CANDIDATE RESUME (35% EVALUATION WEIGHT)
═══════════════════════════════════════════════════════════════

${assessment.resumeText || 'No resume provided'}

═══════════════════════════════════════════════════════════════
ASSESSMENT OVERVIEW
═══════════════════════════════════════════════════════════════

Assessment ID: ${assessment.id}
Candidate ID: ${assessment.candidateId || 'N/A'}
Duration: ${assessmentDuration || 'N/A'} seconds

ASSESSMENT COMPLETION STATISTICS:
- Total Questions: ${totalQuestions}
- Questions Answered: ${answeredQuestions}
- Completion Rate: ${completionPercentage}% (${answeredQuestions}/${totalQuestions})

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

Video Analysis Strengths: ${JSON.stringify(assessment.videoAnalysis.strengths || [])}
Video Analysis Areas for Improvement: ${JSON.stringify(assessment.videoAnalysis.areasForImprovement || [])}
`
    : `Video analysis not available. Evaluate based on assessment responses.`
}

SECTIONS EVALUATION (use the exact "Section ID" in your JSON "sections" array for each section):
${assessment.sections
  ?.map(
    (section) => `
Section ID: ${section.id}
Section: ${section.title} (${section.type})
Description: ${section.description}
Pass Threshold: ${section.passThreshold}

Questions and Answers:
${section.questions
  ?.map(
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

═══════════════════════════════════════════════════════════════
EVALUATION FRAMEWORK (65% JOB / 35% RESUME)
═══════════════════════════════════════════════════════════════

1. JOB REQUIREMENTS ANALYSIS (65% WEIGHT):
   - Extract specific technical skills required from job description
   - Identify experience levels and competencies from job posting
   - Note specific responsibilities and expectations
   - Assess candidate responses against EACH job requirement

2. RESUME VALIDATION ANALYSIS (35% WEIGHT):
   - Validate if claimed experience aligns with demonstrated knowledge
   - Check if resume skills match assessment performance
   - Identify gaps between resume claims and actual responses
   - Assess transferable skills from background

3. RESPONSE-TO-REQUIREMENT MAPPING:
   - For each job requirement, evaluate candidate's demonstrated capability
   - Assess depth and quality of responses against job expectations
   - Compare experience examples to job's expected responsibilities

4. GAP ANALYSIS:
   - Identify job requirements not adequately demonstrated
   - Highlight areas where candidate exceeds job requirements
   - Note concerns about role fit based on response quality
   - Assess whether gaps are trainable

═══════════════════════════════════════════════════════════════
PRACTICE ASSESSMENT FEEDBACK GUIDELINES
═══════════════════════════════════════════════════════════════

Since this is a PRACTICE assessment, provide:

1. CONSTRUCTIVE FEEDBACK:
   - What they did well (relative to job requirements)
   - Where they can improve before real interviews
   - Specific, actionable suggestions

2. JOB FIT INSIGHTS:
   - How well their responses align with job requirements
   - Areas where they're a strong match
   - Areas where they need to strengthen

3. INTERVIEW PREPARATION TIPS:
   - What to emphasize in real interviews
   - Skills to highlight
   - Topics to prepare better

CRITICAL INSTRUCTIONS:
1. Evaluate each section individually against job requirements (65%)
2. Validate responses against resume claims (35%)
3. Combine video analysis results with response analysis if available
4. Provide specific, actionable feedback for improvement
5. Calculate overall score weighted by job alignment
6. Make recommendation based on job fit assessment
7. Identify at minimum 3 strengths related to job requirements
8. Identify at minimum 3 areas for improvement related to job requirements
9. Base all conclusions on assessment responses against job requirements
10. Be constructive and helpful - this is practice, not final judgment

⚠️ SCORING RULES FOR ASSESSMENT EVALUATION - CRITICAL:

**CURRENT ASSESSMENT COMPLETION: ${completionPercentage}% (${answeredQuestions}/${totalQuestions} questions)**

1. ANSWER QUALITY EVALUATION (PRIMARY FOCUS):
   - Evaluate the QUALITY, DEPTH, and COMPLETENESS of each answer provided
   - Poor quality indicators:
     * Very short answers (< 10 characters) like "yes", "no", "ok"
     * Generic responses that don't address the question
     * Incomplete thoughts or cut-off answers
     * Answers that don't demonstrate understanding or knowledge
   - High quality indicators:
     * Detailed, thoughtful responses with specific examples
     * Answers that demonstrate knowledge and understanding
     * Clear explanations and reasoning
     * Answers that directly address the question requirements
     * Evidence of problem-solving and critical thinking

2. COMPLETION RATE IMPACT ON SCORING (MANDATORY):
   - Completion rate is a CRITICAL factor in score calculation
   - Very low completion (<20% or <5 questions) MUST result in significantly lower scores
   - Even with perfect answers, incomplete assessments cannot demonstrate full competency
   - The score should reflect BOTH answer quality AND assessment completeness

3. SCORING FORMULA (MANDATORY):
   Calculate the base score from answer quality (0.0-1.0), then apply completion penalty:
   
   **For very low completion (<20% or <5 questions):**
   - Maximum possible score: 0.3-0.4 (even with perfect answers)
   - Example: If answer quality is 0.9 but only 2-3 questions answered → Score: 0.25-0.35
   - Rationale: Cannot assess full competency with so few responses
   
   **For low completion (20-40%):**
   - Maximum possible score: 0.4-0.5 (even with perfect answers)
   - Example: If answer quality is 0.9 but only 40% complete → Score: 0.45-0.50
   
   **For medium completion (40-70%):**
   - Maximum possible score: 0.5-0.7 (based on quality)
   - Example: If answer quality is 0.9 and 60% complete → Score: 0.60-0.65
   
   **For high completion (70-90%):**
   - Maximum possible score: 0.7-0.9 (based on quality)
   - Example: If answer quality is 0.9 and 80% complete → Score: 0.75-0.80
   
   **For near-complete (90-100%):**
   - Maximum possible score: 0.8-1.0 (based on quality)
   - Example: If answer quality is 0.9 and 95% complete → Score: 0.85-0.90

4. SCORING PRIORITY:
   - Priority 1: Completion rate (determines score ceiling)
   - Priority 2: Answer QUALITY within completed questions (determines score within ceiling)
   - Priority 3: Job requirements alignment demonstrated in responses
   - Priority 4: Breadth of knowledge shown across answered questions
   
5. RECOMMENDATION GUIDELINES:
   - HIGHLY_RECOMMENDED: Strong answers showing excellent job fit with high completion (≥80%)
   - RECOMMENDED: Good answers demonstrating solid job alignment with decent completion (≥50%)
   - NOT_RECOMMENDED: Poor quality answers OR very low completion (<30%) OR low completion (<50%) with weak responses
   - Base recommendations on BOTH job fit/answer quality AND completion rate

6. MANDATORY SCORING EXAMPLES FOR LOW COMPLETION:
   - 2-3 questions answered (${completionPercentage}% complete) with excellent answers: Score 0.20-0.35 MAXIMUM
   - 4-5 questions answered with excellent answers: Score 0.30-0.45 MAXIMUM
   - 10-20% complete with excellent answers: Score 0.25-0.40 MAXIMUM
   - 30-50% complete with excellent answers: Score 0.40-0.60 MAXIMUM
   - 50-70% complete with excellent answers: Score 0.50-0.70
   - 70-90% complete with excellent answers: Score 0.60-0.85
   - 90-100% complete with excellent answers: Score 0.70-1.0
   - 100% complete with poor answers: Score 0.3-0.5
   
7. CRITICAL REMINDER:
   - If only ${answeredQuestions} questions were answered out of ${totalQuestions} total:
     * The score MUST reflect this limited sample size
     * Even perfect answers to ${answeredQuestions} questions cannot demonstrate full competency
     * The maximum score should be capped appropriately based on completion rate
     * Use the scoring formula above to calculate the final score

Respond with a JSON object in this exact format:
{
  "score": number (between 0 and 1, weighted by job requirements alignment),
  "strengths": ["string array - MINIMUM 3 strengths related to job requirements"],
  "areasForImprovement": ["string array - MINIMUM 3 improvements related to job fit"],
  "skills": ["string array of skills demonstrated that match job needs"],
  "technicalSkills": ["string array of technical skills relevant to the job"],
  "softSkills": ["string array of soft skills valuable for the role"],
  "industriesFit": ["string array of industries the candidate fits based on job context"],
  "jobRolesFit": ["string array of job roles the candidate fits based on this job"],
  "overallFeedback": "string with overall assessment feedback focused on job fit",
  "recommendation": "HIGHLY_RECOMMENDED" | "RECOMMENDED" | "NOT_RECOMMENDED",
  "jobRequirementsAlignment": {
    "metRequirements": ["string array of job requirements clearly met"],
    "partiallyMetRequirements": ["string array of job requirements partially demonstrated"],
    "unmetRequirements": ["string array of job requirements not demonstrated"],
    "exceedsRequirements": ["string array of areas where candidate exceeds job requirements"]
  },
  "roleReadiness": {
    "immediateContribution": "string assessment of how quickly candidate can contribute",
    "trainingNeeds": ["string array of specific training areas needed"],
    "growthPotential": "string evaluation of candidate's potential for growth in the role"
  },
  "sections": [
    {
      "id": "string (MUST be the exact Section ID from SECTIONS EVALUATION above for each section)",
      "score": number (between 0 and 1, weighted by job relevance),
      "strengths": ["string array of section-specific strengths related to job"],
      "areasForImprovement": ["string array of section-specific improvements for job fit"],
      "jobRelevance": "string describing how this section relates to job requirements"
    }
  ]
}

FINAL REMINDERS:
1. Return ONLY the raw JSON object
2. Do not include any markdown formatting
3. Ensure score is between 0 and 1, weighted by job alignment (65%)
4. Use only the specified recommendation values
5. Be professional, constructive, and focused on job fit
6. Provide balanced feedback with actionable suggestions
7. Focus on 65% job requirements / 35% resume validation`;
  }

  /**
   * Generate the video analysis prompt
   */
  static generateVideoAnalysisPrompt(): string {
    return `You are a professional video analysis expert specializing in practice assessment interviews. Analyze this video recording and provide comprehensive, structured analysis to help the candidate improve.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. ALL score fields MUST be numbers between 0 and 1 (inclusive)
2. ALL text fields must be non-empty, meaningful strings
3. ALL arrays must contain at least one meaningful item
4. Provide specific, actionable feedback based on observable behaviors
5. Be objective, professional, and constructive
6. This is a PRACTICE assessment - focus on helping them improve

MANDATORY ANALYSIS REQUIREMENTS:

1. Overall Assessment:
   - Calculate overallScore as average of all component scores
   - Provide comprehensive overallFeedback summarizing performance
   - Focus on job-relevant observations

2. Transcript Analysis:
   - Capture ALL spoken content accurately
   - Include timestamps for key moments
   - Note technical terms and domain-specific language

3. Engagement Assessment:
   - Eye contact and attention
   - Active listening indicators
   - Body language and physical engagement

4. Confidence Evaluation:
   - Voice clarity and projection
   - Response certainty and conviction
   - Handling of difficult questions

5. Communication Clarity:
   - Articulation quality
   - Response structure and logical flow
   - Technical explanation clarity

6. Professional Demeanor:
   - Appearance and presentation
   - Professional language
   - Overall conduct

Please provide the analysis in this EXACT JSON format:
{
  "videoUrl": string (optional),
  "transcriptText": string (REQUIRED, complete transcript),
  "overallScore": number (REQUIRED, between 0 and 1),
  "overallFeedback": string (REQUIRED, comprehensive assessment),
  "engagementScore": number (REQUIRED, between 0 and 1),
  "engagementFeedback": string (REQUIRED),
  "confidenceScore": number (REQUIRED, between 0 and 1),
  "confidenceFeedback": string (REQUIRED),
  "clarityScore": number (REQUIRED, between 0 and 1),
  "clarityFeedback": string (REQUIRED),
  "professionalDemeanorScore": number (REQUIRED, between 0 and 1),
  "professionalDemeanorFeedback": string (REQUIRED),
  "proctoringScore": number (REQUIRED, between 0 and 1),
  "proctoringFeedback": string (REQUIRED),
  "areasForImprovement": string[] (REQUIRED, MINIMUM 3 items),
  "strengths": string[] (REQUIRED, MINIMUM 3 items),
  "highlightsInstructions": object (REQUIRED)
}

highlightsInstructions MUST follow this structure:
{
  "introduction": {
    "startTime": string (hh:mm:ss format),
    "endTime": string (hh:mm:ss format),
    "description": string,
    "keyPoints": string[]
  },
  "highs": [
    {
      "startTime": string,
      "endTime": string,
      "description": string,
      "reason": string,
      "keyQuote": string
    }
  ],
  "lows": [
    {
      "startTime": string,
      "endTime": string,
      "description": string,
      "reason": string,
      "improvement": string
    }
  ],
  "interviewEnd": {
    "startTime": string,
    "endTime": string,
    "description": string,
    "closingThoughts": string
  }
}

FINAL REMINDERS:
1. Return ONLY the raw JSON object - NO markdown formatting
2. Ensure all numbers are actual numbers, not strings
3. Be specific, detailed, and constructive
4. Focus on helping the candidate improve for real interviews
5. Calculate overallScore as the mathematical average of component scores`;
  }
}
