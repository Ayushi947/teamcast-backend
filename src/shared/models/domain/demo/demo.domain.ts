/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the demo profile
 *         title:
 *           type: string
 *           description: Job title for the profile
 *         category:
 *           type: string
 *           enum: [technical, non-technical]
 *           description: Category of the profile
 *         experienceLevel:
 *           type: string
 *           description: Required experience level
 *         description:
 *           type: string
 *           description: Profile description
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Required skills for the role
 *         industries:
 *           type: array
 *           items:
 *             type: string
 *           description: Relevant industries
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDemoQuestion'
 *           description: Assessment questions for this profile
 *         assessmentCriteria:
 *           $ref: '#/components/schemas/IDemoAssessmentCriteria'
 *           description: Assessment criteria and weights
 */
export interface IDemoProfile {
  id: string;
  title: string;
  category: 'technical' | 'non-technical';
  experienceLevel: string;
  description: string;
  skills: string[];
  industries: string[];
  questions: IDemoQuestion[];
  assessmentCriteria: IDemoAssessmentCriteria;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoQuestion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the question
 *         type:
 *           type: string
 *           enum: [video, text, multiple-choice]
 *           description: Type of question
 *         question:
 *           type: string
 *           description: The question text
 *         duration:
 *           type: number
 *           description: Expected duration in seconds
 *         expectedSkills:
 *           type: array
 *           items:
 *             type: string
 *           description: Skills this question assesses
 */
export interface IDemoQuestion {
  id: string;
  type: 'video' | 'text' | 'multiple-choice';
  question: string;
  duration: number;
  expectedSkills: string[];
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAssessmentCriteria:
 *       type: object
 *       properties:
 *         technicalSkills:
 *           type: number
 *           description: Weight for technical skills assessment
 *         problemSolving:
 *           type: number
 *           description: Weight for problem solving assessment
 *         communication:
 *           type: number
 *           description: Weight for communication assessment
 *         leadership:
 *           type: number
 *           description: Weight for leadership assessment
 *         strategicThinking:
 *           type: number
 *           description: Weight for strategic thinking assessment
 *         analyticalSkills:
 *           type: number
 *           description: Weight for analytical skills assessment
 *         businessAcumen:
 *           type: number
 *           description: Weight for business acumen assessment
 *         automation:
 *           type: number
 *           description: Weight for automation skills assessment
 *         hrSkills:
 *           type: number
 *           description: Weight for HR skills assessment
 *         marketingSkills:
 *           type: number
 *           description: Weight for marketing skills assessment
 *         customerSkills:
 *           type: number
 *           description: Weight for customer skills assessment
 *         salesSkills:
 *           type: number
 *           description: Weight for sales skills assessment
 *         creativity:
 *           type: number
 *           description: Weight for creativity assessment
 *         relationshipBuilding:
 *           type: number
 *           description: Weight for relationship building assessment
 */
export interface IDemoAssessmentCriteria {
  technicalSkills?: number;
  problemSolving?: number;
  communication?: number;
  leadership?: number;
  strategicThinking?: number;
  analyticalSkills?: number;
  businessAcumen?: number;
  automation?: number;
  hrSkills?: number;
  marketingSkills?: number;
  customerSkills?: number;
  salesSkills?: number;
  creativity?: number;
  relationshipBuilding?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAssessment:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           description: Unique session identifier
 *         profileId:
 *           type: string
 *           description: ID of the selected profile
 *         candidateName:
 *           type: string
 *           description: Name of the candidate
 *         candidateEmail:
 *           type: string
 *           description: Email of the candidate
 *         status:
 *           type: string
 *           enum: [started, in-progress, completed]
 *           description: Current status of the assessment
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the assessment was completed
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDemoQuestion'
 *           description: Assessment questions
 *         answers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDemoAnswer'
 *           description: Submitted answers
 *         currentQuestionIndex:
 *           type: number
 *           description: Index of current question
 *         profile:
 *           $ref: '#/components/schemas/IDemoProfile'
 *           description: Selected profile information
 *         results:
 *           $ref: '#/components/schemas/IDemoResults'
 *           description: Assessment results (available after completion)
 */
export interface IDemoAssessment {
  sessionId: string;
  profileId: string;
  candidateName: string;
  candidateEmail: string;
  status: 'started' | 'in-progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  questions: IDemoQuestion[];
  answers: IDemoAnswer[];
  currentQuestionIndex: number;
  profile: IDemoProfile;
  results?: IDemoResults;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoAnswer:
 *       type: object
 *       properties:
 *         questionId:
 *           type: string
 *           description: ID of the question being answered
 *         answer:
 *           type: string
 *           description: Text answer (if applicable)
 *         videoUrl:
 *           type: string
 *           description: URL of recorded video (if applicable)
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: When the answer was submitted
 *         duration:
 *           type: number
 *           description: Duration of the answer in seconds
 */
export interface IDemoAnswer {
  questionId: string;
  answer?: string;
  videoUrl?: string;
  submittedAt: Date;
  duration: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoResults:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           description: Session identifier
 *         overallScore:
 *           type: number
 *           description: Overall assessment score (0-1)
 *         recommendation:
 *           type: string
 *           enum: [HIGHLY_RECOMMENDED, RECOMMENDED, NOT_RECOMMENDED]
 *           description: AI recommendation
 *         scores:
 *           $ref: '#/components/schemas/IDemoScoreBreakdown'
 *           description: Detailed score breakdown
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: Identified strengths
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: Areas for improvement
 *         detailedFeedback:
 *           $ref: '#/components/schemas/IDemoDetailedFeedback'
 *           description: Detailed feedback by category
 *         videoAnalysis:
 *           $ref: '#/components/schemas/IDemoVideoAnalysis'
 *           description: Video analysis results
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When results were generated
 */
export interface IDemoResults {
  sessionId: string;
  overallScore: number;
  recommendation: 'HIGHLY_RECOMMENDED' | 'RECOMMENDED' | 'NOT_RECOMMENDED';
  scores: IDemoScoreBreakdown;
  strengths: string[];
  areasForImprovement: string[];
  detailedFeedback: IDemoDetailedFeedback;
  videoAnalysis?: IDemoVideoAnalysis;
  completedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoScoreBreakdown:
 *       type: object
 *       properties:
 *         overall:
 *           type: number
 *           description: Overall score
 *         technicalSkills:
 *           type: number
 *           description: Technical skills score
 *         problemSolving:
 *           type: number
 *           description: Problem solving score
 *         communication:
 *           type: number
 *           description: Communication score
 *         leadership:
 *           type: number
 *           description: Leadership score
 *         strategicThinking:
 *           type: number
 *           description: Strategic thinking score
 *         analyticalSkills:
 *           type: number
 *           description: Analytical skills score
 *         businessAcumen:
 *           type: number
 *           description: Business acumen score
 *         automation:
 *           type: number
 *           description: Automation skills score
 *         hrSkills:
 *           type: number
 *           description: HR skills score
 *         marketingSkills:
 *           type: number
 *           description: Marketing skills score
 *         customerSkills:
 *           type: number
 *           description: Customer skills score
 *         salesSkills:
 *           type: number
 *           description: Sales skills score
 *         creativity:
 *           type: number
 *           description: Creativity score
 *         relationshipBuilding:
 *           type: number
 *           description: Relationship building score
 */
export interface IDemoScoreBreakdown {
  overall: number;
  technicalSkills?: number;
  problemSolving?: number;
  communication?: number;
  leadership?: number;
  strategicThinking?: number;
  analyticalSkills?: number;
  businessAcumen?: number;
  automation?: number;
  hrSkills?: number;
  marketingSkills?: number;
  customerSkills?: number;
  salesSkills?: number;
  creativity?: number;
  relationshipBuilding?: number;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoDetailedFeedback:
 *       type: object
 *       properties:
 *         technicalSkills:
 *           type: string
 *           description: Feedback on technical skills
 *         problemSolving:
 *           type: string
 *           description: Feedback on problem solving
 *         communication:
 *           type: string
 *           description: Feedback on communication
 *         leadership:
 *           type: string
 *           description: Feedback on leadership
 *         strategicThinking:
 *           type: string
 *           description: Feedback on strategic thinking
 *         analyticalSkills:
 *           type: string
 *           description: Feedback on analytical skills
 *         businessAcumen:
 *           type: string
 *           description: Feedback on business acumen
 *         automation:
 *           type: string
 *           description: Feedback on automation skills
 *         hrSkills:
 *           type: string
 *           description: Feedback on HR skills
 *         marketingSkills:
 *           type: string
 *           description: Feedback on marketing skills
 *         customerSkills:
 *           type: string
 *           description: Feedback on customer skills
 *         salesSkills:
 *           type: string
 *           description: Feedback on sales skills
 *         creativity:
 *           type: string
 *           description: Feedback on creativity
 *         relationshipBuilding:
 *           type: string
 *           description: Feedback on relationship building
 */
export interface IDemoDetailedFeedback {
  technicalSkills?: string;
  problemSolving?: string;
  communication?: string;
  leadership?: string;
  strategicThinking?: string;
  analyticalSkills?: string;
  businessAcumen?: string;
  automation?: string;
  hrSkills?: string;
  marketingSkills?: string;
  customerSkills?: string;
  salesSkills?: string;
  creativity?: string;
  relationshipBuilding?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoVideoAnalysis:
 *       type: object
 *       properties:
 *         videoUrl:
 *           type: string
 *           description: URL of the analyzed video
 *         transcriptText:
 *           type: string
 *           description: Transcript of the video
 *         overallScore:
 *           type: number
 *           description: Overall video analysis score
 *         overallFeedback:
 *           type: string
 *           description: Overall feedback from video analysis
 *         engagementScore:
 *           type: number
 *           description: Engagement score
 *         engagementFeedback:
 *           type: string
 *           description: Engagement feedback
 *         confidenceScore:
 *           type: number
 *           description: Confidence score
 *         confidenceFeedback:
 *           type: string
 *           description: Confidence feedback
 *         clarityScore:
 *           type: number
 *           description: Clarity score
 *         clarityFeedback:
 *           type: string
 *           description: Clarity feedback
 *         professionalDemeanorScore:
 *           type: number
 *           description: Professional demeanor score
 *         professionalDemeanorFeedback:
 *           type: string
 *           description: Professional demeanor feedback
 *         proctoringScore:
 *           type: number
 *           description: Proctoring score
 *         proctoringFeedback:
 *           type: string
 *           description: Proctoring feedback
 *         areasForImprovement:
 *           type: array
 *           items:
 *             type: string
 *           description: Areas for improvement from video analysis
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *           description: Strengths identified from video analysis
 *         highlightsInstructions:
 *           $ref: '#/components/schemas/IDemoHighlightsInstructions'
 *           description: Instructions for generating highlight video
 */
export interface IDemoVideoAnalysis {
  videoUrl?: string;
  transcriptText?: string;
  overallScore?: number;
  overallFeedback?: string;
  engagementScore?: number;
  engagementFeedback?: string;
  confidenceScore?: number;
  confidenceFeedback?: string;
  clarityScore?: number;
  clarityFeedback?: string;
  professionalDemeanorScore?: number;
  professionalDemeanorFeedback?: string;
  proctoringScore?: number;
  proctoringFeedback?: string;
  areasForImprovement?: string[];
  strengths?: string[];
  highlightsInstructions?: IDemoHighlightsInstructions;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoHighlightsInstructions:
 *       type: object
 *       properties:
 *         introduction:
 *           $ref: '#/components/schemas/IDemoHighlightSegment'
 *           description: Introduction segment
 *         highs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDemoHighlightMoment'
 *           description: High moments
 *         lows:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IDemoHighlightMoment'
 *           description: Low moments
 *         interviewEnd:
 *           $ref: '#/components/schemas/IDemoHighlightSegment'
 *           description: Interview end segment
 */
export interface IDemoHighlightsInstructions {
  introduction: IDemoHighlightSegment;
  highs: IDemoHighlightMoment[];
  lows: IDemoHighlightMoment[];
  interviewEnd: IDemoHighlightSegment;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoHighlightSegment:
 *       type: object
 *       properties:
 *         startTime:
 *           type: string
 *           description: Start time in hh:mm:ss format
 *         endTime:
 *           type: string
 *           description: End time in hh:mm:ss format
 *         description:
 *           type: string
 *           description: Description of the segment
 *         keyPoints:
 *           type: array
 *           items:
 *             type: string
 *           description: Key points for introduction segment
 *         closingThoughts:
 *           type: string
 *           description: Closing thoughts for interview end segment
 */
export interface IDemoHighlightSegment {
  startTime: string;
  endTime: string;
  description: string;
  keyPoints?: string[];
  closingThoughts?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IDemoHighlightMoment:
 *       type: object
 *       properties:
 *         startTime:
 *           type: string
 *           description: Start time in hh:mm:ss format
 *         endTime:
 *           type: string
 *           description: End time in hh:mm:ss format
 *         description:
 *           type: string
 *           description: Description of the moment
 *         reason:
 *           type: string
 *           description: Reason for highlighting this moment
 *         keyQuote:
 *           type: string
 *           description: Key quote from the moment
 *         improvement:
 *           type: string
 *           description: Improvement suggestion for low moments
 */
export interface IDemoHighlightMoment {
  startTime: string;
  endTime: string;
  description: string;
  reason: string;
  keyQuote?: string;
  improvement?: string;
}
