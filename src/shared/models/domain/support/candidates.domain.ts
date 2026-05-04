import {
  CandidateStatusEnum,
  CandidateAssessmentStageEnum,
  USWorkAuthorizationStatusEnum,
} from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidate:
 *       type: object
 *       description: Domain model representing a candidate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the candidate
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated user
 *         fullName:
 *           type: string
 *           description: Full name of the candidate
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         phone:
 *           type: string
 *           description: Phone number of the candidate
 *         status:
 *           $ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Current status of the candidate
 *         assessmentStage:
 *           type: string
 *           enum: [RESUME_ASSESSMENT, ONBOARDING_ASSESSMENT]
 *           description: Current assessment stage
 *         resumeAssessmentStatus:
 *           type: string
 *           enum: [ASSESSMENT_NOT_DONE, ASSESSMENT_IN_PROGRESS, ASSESSMENT_COMPLETED, ASSESSMENT_FAILED]
 *           description: Status of resume assessment
 *         onboardingAssessmentStatus:
 *           type: string
 *           enum: [ASSESSMENT_NOT_DONE, ASSESSMENT_IN_PROGRESS, ASSESSMENT_COMPLETED, ASSESSMENT_FAILED]
 *           description: Status of onboarding assessment
 *         isPublished:
 *           type: boolean
 *           description: Whether the candidate profile is published
 *         isDirty:
 *           type: boolean
 *           description: Whether the candidate profile has unsaved changes
 *         completionPercentage:
 *           type: number
 *           description: Profile completion percentage
 *         yearsOfExperience:
 *           type: number
 *           description: Total number of years of experience
 *         jobSearchStatus:
 *           type: string
 *           enum: [OPEN_TO_OPPORTUNITIES, NOT_LOOKING]
 *           description: Current job search status
 *         sex:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *           description: Gender of the candidate
 *         birthDate:
 *           type: string
 *           format: date-time
 *           description: Date of birth
 *         maritalStatus:
 *           type: string
 *           enum: [SINGLE, MARRIED, DIVORCED, WIDOWED, PREFER_NOT_TO_SAY]
 *           description: Marital status
 *         image:
 *           type: string
 *           description: Profile image URL
 *         note:
 *           type: string
 *           description: Additional notes about the candidate
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the candidate
 *         updatedBy:
 *           type: string
 *           description: ID of the user who last updated the candidate
 *         resume:
 *           type: object
 *           description: Resume information
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             summary:
 *               type: string
 *             experience:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   title:
 *                     type: string
 *                   company:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *                   description:
 *                     type: string
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         startDate:
 *                           type: string
 *                           format: date
 *                         endDate:
 *                           type: string
 *                           format: date
 *             education:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   institution:
 *                     type: string
 *                   degree:
 *                     type: string
 *                   field:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *             certifications:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   issuer:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *             industries:
 *               type: array
 *               items:
 *                 type: string
 *             totalExperience:
 *               type: number
 *             highestEducationLevel:
 *               type: string
 *         partner:
 *           type: object
 *           description: Associated partner information
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             company:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 contactEmail:
 *                   type: string
 *         settings:
 *           type: object
 *           description: Candidate settings
 *           properties:
 *             id:
 *               type: string
 *             notificationsEnabled:
 *               type: boolean
 *             emailNotifications:
 *               type: boolean
 *             pushNotifications:
 *               type: boolean
 *             jobAlerts:
 *               type: boolean
 *             applicationUpdates:
 *               type: boolean
 *             profileVisibility:
 *               type: boolean
 *             shareDataWithEmployers:
 *               type: boolean
 *             darkMode:
 *               type: boolean
 *             language:
 *               type: string
 *             timezone:
 *               type: string
 *             preferredCommunicationChannel?:
 *               type: string
 *             globalSettings?:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description?:
 *                   type: string
 *         preferences:
 *           type: object
 *           description: Candidate preferences
 *           properties:
 *             preferredIndustries:
 *               type: array
 *               items:
 *                 type: string
 *             preferredLocations:
 *               type: array
 *               items:
 *                 type: string
 *             preferredWorkTypes:
 *               type: array
 *               items:
 *                 type: string
 *             preferredJobTitles:
 *               type: array
 *               items:
 *                 type: string
 *             preferredJobCommitments:
 *               type: array
 *               items:
 *                 type: string
 *             preferredJobSchedules:
 *               type: array
 *               items:
 *                 type: string
 *             preferredSalaryMin:
 *               type: number
 *             preferredSalaryMax:
 *               type: number
 *             preferredSalaryCurrency:
 *               type: string
 *             preferredEquity:
 *               type: boolean
 *             preferredBenefits:
 *               type: array
 *               items:
 *                 type: string
 *             preferredResponsibilities:
 *               type: array
 *               items:
 *                 type: string
 *             preferredTags:
 *               type: array
 *               items:
 *                 type: string
 *         applications:
 *           type: array
 *           description: Job applications
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               jobPostingId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *               submittedAt:
 *                 type: string
 *                 format: date-time
 *               jobPosting:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   title:
 *                     type: string
 *                   company:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *         assessments:
 *           type: array
 *           description: All assessments
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *               score:
 *                 type: number
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *         resumeAssessments:
 *           type: array
 *           description: Resume assessments
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               candidateId:
 *                 type: string
 *               status:
 *                 type: string
 *               result:
 *                 type: string
 *               score:
 *                 type: number
 *               recommendation:
 *                 type: string
 *               overallFeedback?:
 *                 type: string
 *               strengths:
 *                 type: array
 *                 items:
 *                   type: string
 *               areasForImprovement:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               technicalSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               softSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               industriesFit:
 *                 type: array
 *                 items:
 *                   type: string
 *               jobRolesFit:
 *                 type: array
 *                 items:
 *                   type: string
 *               startedAt?:
 *                 type: string
 *                 format: date-time
 *               completedAt?:
 *                 type: string
 *                 format: date-time
 *               task?:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   status:
 *                     type: string
 *                   progress:
 *                     type: number
 *         onboardingAssessments:
 *           type: array
 *           description: Onboarding assessments
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               candidateId:
 *                 type: string
 *               status:
 *                 type: string
 *               result:
 *                 type: string
 *               score:
 *                 type: number
 *               recommendation?:
 *                 type: string
 *               overallFeedback?:
 *                 type: string
 *               strengths:
 *                 type: array
 *                 items:
 *                   type: string
 *               areasForImprovement:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               technicalSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               softSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               startedAt?:
 *                 type: string
 *                 format: date-time
 *               completedAt?:
 *                 type: string
 *                 format: date-time
 *               duration?:
 *                 type: number
 *               sections?:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     result:
 *                       type: string
 *                     score:
 *                       type: number
 *                     order:
 *                       type: number
 *                     feedback?:
 *                       type: string
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                     areasForImprovement:
 *                       type: array
 *                       items:
 *                         type: string
 *                     questions?:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           question:
 *                             type: string
 *                           questionType:
 *                             type: string
 *                           answerGiven?:
 *                             type: string
 *                           score:
 *                             type: number
 *                           maxScore:
 *                             type: number
 *                           feedback?:
 *                             type: string
 *                           isAnswered:
 *                             type: boolean
 *                     videoAnalysis?:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         videoUrl?:
 *                           type: string
 *                         highlightsVideoUrl?:
 *                           type: string
 *                         overallScore?:
 *                           type: number
 *                         overallFeedback?:
 *                           type: string
 *                         engagementScore?:
 *                           type: number
 *                         confidenceScore?:
 *                           type: number
 *                         clarityScore?:
 *                           type: number
 *                         professionalDemeanorScore?:
 *                           type: number
 *                         proctoringScore?:
 *                           type: number
 *                         strengths:
 *                           type: array
 *                           items:
 *                             type: string
 *                         areasForImprovement:
 *                           type: array
 *                           items:
 *                             type: string
 *                     proctoring?:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         warningCount:
 *                           type: number
 *                         tabSwitches:
 *                           type: number
 *                         copyPasteAttempts:
 *                           type: number
 *                         multiplePersonsDetected:
 *                           type: boolean
 *                         automaticallyFailed:
 *                           type: boolean
 *                         manualReviewRequired:
 *                           type: boolean
 *                     settings?:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         greetingMessage?:
 *                           type: string
 *                         defaultAssessmentDuration:
 *                           type: number
 *                         defaultPassingScore:
 *                           type: number
 *                         requiredSections:
 *                           type: array
 *                           items:
 *                             type: string
 *                         maximumAttempts:
 *                           type: number
 *                         cooldownPeriod:
 *                           type: number
 *                         proctoringEnabled:
 *                           type: boolean
 *                         videoRecordingEnabled:
 *                           type: boolean
 *                         aiVideoAnalysisEnabled:
 *                           type: boolean
 *         savedJobs:
 *           type: array
 *           description: Saved job postings
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               jobPosting:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   title:
 *                     type: string
 *                   company:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *         subscription:
 *           type: object
 *           description: Subscription information
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             status:
 *               type: string
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *             autoRenew:
 *               type: boolean
 *             assessmentsUsedThisMonth:
 *               type: number
 *             practiceAssessmentsUsed:
 *               type: number
 *             additionalPracticeAssessmentCredits:
 *               type: number
 *             paymentProvider:
 *               type: string
 *             paymentProviderCustomerId?:
 *               type: string
 *             paymentProviderSubscriptionId?:
 *               type: string
 *             lastBillingDate?:
 *               type: string
 *               format: date-time
 *             nextBillingDate?:
 *               type: string
 *               format: date-time
 *             metadata?:
 *               type: object
 *             package:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 billingCycle:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 isDefault:
 *                   type: boolean
 *                 maxAssessmentsPerMonth:
 *                   type: number
 *                 maxPracticeAssessments:
 *                   type: number
 *                 accessToAllSkills:
 *                   type: boolean
 *                 personalizedFeedback:
 *                   type: boolean
 *                 careerCoaching:
 *                   type: boolean
 *                 paymentProvider:
 *                   type: string
 *                 paymentProviderPriceId?:
 *                   type: string
 *                 paymentProviderProductId?:
 *                   type: string
 *                 features?:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *             creditPurchases?:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   creditType:
 *                     type: string
 *                   creditsAmount:
 *                     type: number
 *                   costPerCredit:
 *                     type: number
 *                   totalCost:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   paymentProvider:
 *                     type: string
 *                   paymentProviderPaymentIntentId?:
 *                     type: string
 *                   paymentProviderInvoiceId?:
 *                     type: string
 *                   isPaid:
 *                     type: boolean
 *                   paidAt?:
 *                     type: string
 *                     format: date-time
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was last updated
 *         partnerApplications?:
 *           type: array
 *           description: Partner applications
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *               jobPostingId:
 *                 type: string
 *                 format: uuid
 *               partnerId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 format: uuid
 *               submittedAt:
 *                 type: string
 *                 format: date-time
 *               jobPosting:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   title:
 *                     type: string
 *                   client:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       company:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *               partner:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   company:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *         jobAiAssessmentInvitations?:
 *           type: array
 *           description: Job AI assessment invitations
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *               jobAiAssessmentId:
 *                 type: string
 *                 format: uuid
 *               invitedById:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *               message?:
 *                 type: string
 *               scheduledDate?:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               jobAiAssessment:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   jobPosting:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       client:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           company:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *               invitedBy:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   user:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *         jobAiAssessments?:
 *           type: array
 *           description: Job AI assessments
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *               jobApplicationId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *               result:
 *                 type: string
 *               score:
 *                 type: number
 *               startedAt?:
 *                 type: string
 *                 format: date-time
 *               completedAt?:
 *                 type: string
 *                 format: date-time
 *               duration?:
 *                 type: number
 *               recommendation?:
 *                 type: string
 *               overallFeedback?:
 *                 type: string
 *               strengths:
 *                 type: array
 *                 items:
 *                   type: string
 *               areasForImprovement:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               technicalSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               softSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               jobPosting:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   client:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       company:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *               sections?:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     result:
 *                       type: string
 *                     score:
 *                       type: number
 *                     order:
 *                       type: number
 *                     feedback?:
 *                       type: string
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                     areasForImprovement:
 *                       type: array
 *                       items:
 *                         type: string
 *                     questions?:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           question:
 *                             type: string
 *                           questionType:
 *                             type: string
 *                           answerGiven?:
 *                             type: string
 *                           score:
 *                             type: number
 *                           maxScore:
 *                             type: number
 *                           feedback?:
 *                             type: string
 *                           isAnswered:
 *                             type: boolean
 *                     videoAnalysis?:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         videoUrl?:
 *                           type: string
 *                         highlightsVideoUrl?:
 *                           type: string
 *                         overallScore?:
 *                           type: number
 *                         overallFeedback?:
 *                           type: string
 *                         engagementScore?:
 *                           type: number
 *                         confidenceScore?:
 *                           type: number
 *                         clarityScore?:
 *                           type: number
 *                         professionalDemeanorScore?:
 *                           type: number
 *                         proctoringScore?:
 *                           type: number
 *                         strengths:
 *                           type: array
 *                           items:
 *                             type: string
 *                         areasForImprovement:
 *                           type: array
 *                           items:
 *                             type: string
 *                     proctoring?:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         warningCount:
 *                           type: number
 *                         tabSwitches:
 *                           type: number
 *                         copyPasteAttempts:
 *                           type: number
 *                         multiplePersonsDetected:
 *                           type: boolean
 *                         automaticallyFailed:
 *                           type: boolean
 *                         manualReviewRequired:
 *                           type: boolean
 *                     settings?:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         greetingMessage?:
 *                           type: string
 *                         defaultAssessmentDuration:
 *                           type: number
 *                         defaultPassingScore:
 *                           type: number
 *                         requiredSections:
 *                           type: array
 *                           items:
 *                             type: string
 *                         maximumAttempts:
 *                           type: number
 *                         cooldownPeriod:
 *                           type: number
 *                         proctoringEnabled:
 *                           type: boolean
 *                         videoRecordingEnabled:
 *                           type: boolean
 *                         aiVideoAnalysisEnabled:
 *                           type: boolean
 *         views?:
 *           type: array
 *           description: Views
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *               clientUserId:
 *                 type: string
 *                 format: uuid
 *               viewedAt:
 *                 type: string
 *                 format: date-time
 *               viewContext?:
 *                 type: string
 *               clientUser:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   user:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   client:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       company:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *               jobPosting?:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *               isImportedCandidate?: boolean;
 *               importedByClientId?: string;
 *               importedJobPostingId?: string;
 *               importedIntegrationId?: string;
 *               resumeAssessmentRecommendation?: string;
 *               onboardingAssessmentRecommendation?: string;
 */
export interface ISupportCandidate {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  status: CandidateStatusEnum;
  assessmentStage: string;
  resumeAssessmentStatus: string;
  onboardingAssessmentStatus: string;
  isPublished: boolean;
  isDirty: boolean;
  completionPercentage: number;
  yearsOfExperience?: number;
  jobSearchStatus: string;
  sex?: string;
  birthDate?: Date;
  maritalStatus?: string;
  image?: string;
  note?: string;
  createdBy?: string;
  updatedBy?: string;
  resume?: {
    id: string;
    summary: string;
    currentJobTitle: string;
    currentCompany: string;
    currentWorkLocation: string;
    currentSalary: number;
    currentSalaryCurrency: string;
    currentWorkType: string;
    experience: Array<{
      id: string;
      title: string;
      company: string;
      startDate: Date;
      endDate?: Date;
      description: string;
      projects: Array<{
        id: string;
        name: string;
        description: string;
        startDate: Date;
        endDate?: Date;
      }>;
    }>;
    education: Array<{
      id: string;
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: Date;
      endDate?: Date;
    }>;
    certifications: Array<{
      id: string;
      name: string;
      issuer: string;
      date: Date;
    }>;
    skills: string[];
    industries: string[];
    totalExperience: number;
    highestEducationLevel: string;
    isUSWorkAuthorized?: boolean;
    requiresUSVisaSponsorship?: boolean;
    usWorkAuthorizationStatus?: USWorkAuthorizationStatusEnum;
    usWorkAuthorizationDetails?: string;
  };
  partner?: {
    id: string;
    name: string;
    company: {
      name: string;
      contactEmail: string;
    };
  };
  settings?: {
    id: string;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    jobAlerts: boolean;
    applicationUpdates: boolean;
    profileVisibility: boolean;
    shareDataWithEmployers: boolean;
    darkMode: boolean;
    language: string;
    timezone: string;
    preferredCommunicationChannel?: string;
    globalSettings?: {
      id: string;
    };
  };
  preferences?: {
    preferredIndustries: string[];
    preferredLocations: string[];
    preferredWorkTypes: string[];
    preferredJobTitles: string[];
    preferredJobCommitments: string[];
    preferredJobSchedules: string[];
    preferredSalaryMin?: number;
    preferredSalaryMax?: number;
    preferredSalaryCurrency?: string;
    preferredEquity?: boolean;
    preferredBenefits: string[];
    preferredResponsibilities: string[];
    preferredTags: string[];
  };
  applications?: Array<{
    id: string;
    jobPostingId: string;
    status: string;
    submittedAt: Date;
    jobPosting: {
      id: string;
      title: string;
      company: {
        name: string;
      };
    };
  }>;
  assessments?: Array<{
    id: string;
    type: string;
    status: string;
    score: number;
    completedAt: Date;
  }>;
  resumeAssessments?: Array<{
    id: string;
    candidateId: string;
    status: string;
    result: string;
    score: number;
    recommendation: string;
    overallFeedback?: string;
    strengths: string[];
    areasForImprovement: string[];
    skills: string[];
    technicalSkills: string[];
    softSkills: string[];
    industriesFit: string[];
    jobRolesFit: string[];
    startedAt?: Date;
    completedAt?: Date;
    task?: {
      id: string;
      status: string;
      progress: number;
    };
  }>;
  onboardingAssessments?: Array<{
    id: string;
    candidateId: string;
    status: string;
    result: string;
    score: number;
    recommendation?: string;
    overallFeedback?: string;
    strengths: string[];
    areasForImprovement: string[];
    skills: string[];
    technicalSkills: string[];
    softSkills: string[];
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    sections?: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      status: string;
      result: string;
      score: number;
      order: number;
      feedback?: string;
      strengths: string[];
      areasForImprovement: string[];
      questions?: Array<{
        id: string;
        question: string;
        questionType: string;
        answerGiven?: string;
        score: number;
        maxScore: number;
        feedback?: string;
        isAnswered: boolean;
      }>;
    }>;
    videoAnalysis?: {
      id: string;
      videoUrl?: string;
      highlightsVideoUrl?: string;
      overallScore?: number;
      overallFeedback?: string;
      engagementScore?: number;
      confidenceScore?: number;
      clarityScore?: number;
      professionalDemeanorScore?: number;
      proctoringScore?: number;
      strengths: string[];
      areasForImprovement: string[];
    };
    proctoring?: {
      id: string;
      warningCount: number;
      tabSwitches: number;
      copyPasteAttempts: number;
      multiplePersonsDetected: boolean;
      automaticallyFailed: boolean;
      manualReviewRequired: boolean;
    };
    settings?: {
      id: string;
      greetingMessage?: string;
      defaultAssessmentDuration: number;
      defaultPassingScore: number;
      requiredSections: string[];
      maximumAttempts: number;
      cooldownPeriod: number;
      proctoringEnabled: boolean;
      videoRecordingEnabled: boolean;
      aiVideoAnalysisEnabled: boolean;
    };
  }>;
  savedJobs?: Array<{
    id: string;
    jobPosting: {
      id: string;
      title: string;
      company: {
        name: string;
      };
    };
  }>;
  subscription?: {
    id: string;
    status: string;
    startDate: Date;
    endDate?: Date;
    autoRenew: boolean;
    assessmentsUsedThisMonth: number;
    practiceAssessmentsUsed: number;
    additionalPracticeAssessmentCredits: number;
    paymentProvider: string;
    paymentProviderCustomerId?: string;
    paymentProviderSubscriptionId?: string;
    lastBillingDate?: Date;
    nextBillingDate?: Date;
    metadata?: any;
    package?: {
      id: string;
      name: string;
      description: string;
      price: number;
      currency: string;
      billingCycle: string;
      isActive: boolean;
      isDefault: boolean;
      maxAssessmentsPerMonth: number;
      maxPracticeAssessments: number;
      accessToAllSkills: boolean;
      personalizedFeedback: boolean;
      careerCoaching: boolean;
      paymentProvider: string;
      paymentProviderPriceId?: string;
      paymentProviderProductId?: string;
      features?: any;
      createdAt: Date;
      updatedAt: Date;
    };
    creditPurchases?: Array<{
      id: string;
      creditType: string;
      creditsAmount: number;
      costPerCredit: number;
      totalCost: number;
      currency: string;
      paymentProvider: string;
      paymentProviderPaymentIntentId?: string;
      paymentProviderInvoiceId?: string;
      isPaid: boolean;
      paidAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
  partnerApplications?: Array<{
    id: string;
    candidateId: string;
    jobPostingId: string;
    partnerId: string;
    status: string;
    submittedAt: Date;
    jobPosting: {
      id: string;
      title: string;
      client: {
        id: string;
        company: {
          name: string;
        };
      };
    };
    partner: {
      id: string;
      company: {
        name: string;
      };
    };
  }>;
  jobAiAssessmentInvitations?: Array<{
    id: string;
    candidateId: string;
    jobAiAssessmentId: string;
    invitedById: string;
    type: string;
    status: string;
    message?: string;
    scheduledDate?: Date;
    expiresAt: Date;
    createdAt: Date;
    jobAiAssessment: {
      id: string;
      jobPosting: {
        title: string;
        client: {
          id: string;
          company: {
            name: string;
          };
        };
      };
    };
    invitedBy: {
      id: string;
      user: {
        name: string;
        email: string;
      };
    };
  }>;
  jobAiAssessments?: Array<{
    id: string;
    candidateId: string;
    jobApplicationId: string;
    status: string;
    result: string;
    score: number;
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    recommendation?: string;
    overallFeedback?: string;
    strengths: string[];
    areasForImprovement: string[];
    skills: string[];
    technicalSkills: string[];
    softSkills: string[];
    jobPosting: {
      title: string;
      client: {
        id: string;
        company: {
          name: string;
        };
      };
    };
    sections?: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      status: string;
      result: string;
      score: number;
      order: number;
      feedback?: string;
      strengths: string[];
      areasForImprovement: string[];
      questions?: Array<{
        id: string;
        question: string;
        questionType: string;
        answerGiven?: string;
        score: number;
        maxScore: number;
        feedback?: string;
        isAnswered: boolean;
      }>;
    }>;
    videoAnalysis?: {
      id: string;
      videoUrl?: string;
      highlightsVideoUrl?: string;
      overallScore?: number;
      overallFeedback?: string;
      engagementScore?: number;
      confidenceScore?: number;
      clarityScore?: number;
      professionalDemeanorScore?: number;
      proctoringScore?: number;
      strengths: string[];
      areasForImprovement: string[];
    };
    proctoring?: {
      id: string;
      warningCount: number;
      tabSwitches: number;
      copyPasteAttempts: number;
      multiplePersonsDetected: boolean;
      automaticallyFailed: boolean;
      manualReviewRequired: boolean;
    };
    settings?: {
      id: string;
      greetingMessage?: string;
      defaultAssessmentDuration: number;
      defaultPassingScore: number;
      requiredSections: string[];
      maximumAttempts: number;
      cooldownPeriod: number;
      proctoringEnabled: boolean;
      videoRecordingEnabled: boolean;
      aiVideoAnalysisEnabled: boolean;
    };
  }>;
  publicPracticeAssessments?: Array<{
    id: string;
    candidateId?: string;
    title: string;
    description: string;
    sourceJobUrl: string;
    candidateEmail: string;
    candidateName: string;
    skillsFocus: string[];
    difficulty: string;
    status: string;
    result: string;
    score: number;
    duration: number;
    startedAt?: Date;
    completedAt?: Date;
    overallFeedback?: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendation?: string;
    selectedForNextRound: boolean;
    skills: string[];
    technicalSkills: string[];
    softSkills: string[];
    industriesFit: string[];
    jobRolesFit: string[];
    experienceSummary?: string;
    educationSummary?: string;
    linkedAt?: Date;
    termsAccepted: boolean;
    termsAcceptedAt?: Date;
    sections?: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      status: string;
      result: string;
      score: number;
      order: number;
      strengths: string[];
      areasForImprovement: string[];
      questions?: Array<{
        id: string;
        question: string;
        questionType: string;
        answerGiven?: string;
        score: number;
        maxScore: number;
        feedback?: string;
        isAnswered: boolean;
      }>;
    }>;
    videoAnalysis?: {
      id: string;
      videoUrl?: string;
      highlightsVideoUrl?: string;
      overallScore?: number;
      overallFeedback?: string;
      engagementScore?: number;
      confidenceScore?: number;
      clarityScore?: number;
      professionalDemeanorScore?: number;
      proctoringScore?: number;
      strengths: string[];
      areasForImprovement: string[];
    };
    proctoring?: {
      id: string;
      warningCount: number;
      tabSwitches: number;
      copyPasteAttempts: number;
      multiplePersonsDetected: boolean;
      automaticallyFailed: boolean;
      manualReviewRequired: boolean;
    };
    settings?: {
      id: string;
      greetingMessage?: string;
      defaultAssessmentDuration: number;
      defaultPassingScore: number;
      requiredSections: string[];
      maximumAttempts: number;
      cooldownPeriod: number;
      proctoringEnabled: boolean;
      videoRecordingEnabled: boolean;
      aiVideoAnalysisEnabled: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
  views?: Array<{
    id: string;
    candidateId: string;
    clientUserId: string;
    viewedAt: Date;
    viewContext?: string;
    clientUser: {
      id: string;
      user: {
        name: string;
        email: string;
      };
      client: {
        id: string;
        company: {
          name: string;
        };
      };
    };
    jobPosting?: {
      title: string;
    };
  }>;

  isImportedCandidate?: boolean;
  importedByClientId?: string;
  importedJobPostingId?: string;
  importedIntegrationId?: string;
  resumeAssessmentRecommendation?: string;
  onboardingAssessmentRecommendation?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateCreate:
 *       type: object
 *       description: Payload for creating a new candidate
 *       properties:
 *         firstName:
 *           type: string
 *           description: First name of the candidate
 *         lastName:
 *           type: string
 *           description: Last name of the candidate
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         phone:
 *           type: string
 *           description: Phone number of the candidate
 *         status:
 *           $ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Current status of the candidate
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated partner
 */
export type ISupportCandidateCreate = Omit<
  ISupportCandidate,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateUpdate:
 *       type: object
 *       description: Comprehensive payload for updating an existing candidate - support can modify almost all fields
 *       properties:
 *         firstName:
 *           type: string
 *           description: First name of the candidate
 *         lastName:
 *           type: string
 *           description: Last name of the candidate
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         phone:
 *           type: string
 *           description: Phone number of the candidate
 *         status:
 *           $ref: '#/components/schemas/CandidateStatusEnum'
 *           description: Current status of the candidate
 *         assessmentStage:
 *           type: string
 *           description: Current assessment stage
 *         resumeAssessmentStatus:
 *           type: string
 *           description: Status of resume assessment
 *         onboardingAssessmentStatus:
 *           type: string
 *           description: Status of onboarding assessment
 *         isPublished:
 *           type: boolean
 *           description: Whether candidate profile is published
 *         isDirty:
 *           type: boolean
 *           description: Whether candidate profile has unsaved changes
 *         completionPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Profile completion percentage
 *         jobSearchStatus:
 *           type: string
 *           description: Job search status
 *         sex:
 *           type: string
 *           description: Gender
 *         birthDate:
 *           type: string
 *           format: date-time
 *           description: Birth date
 *         maritalStatus:
 *           type: string
 *           description: Marital status
 *         image:
 *           type: string
 *           description: Profile image URL
 *         createdBy:
 *           type: string
 *           description: User who created the candidate
 *         resume:
 *           type: object
 *           description: Complete resume data
 *           properties:
 *             summary:
 *               type: string
 *               description: Resume summary
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *               description: Skills list
 *             industries:
 *               type: array
 *               items:
 *                 type: string
 *               description: Industries list
 *             totalExperience:
 *               type: number
 *               description: Total experience in years
 *             highestEducationLevel:
 *               type: string
 *               description: Highest education level
 *             experience:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Experience ID (for updates)
 *                   title:
 *                     type: string
 *                     description: Job title
 *                   company:
 *                     type: string
 *                     description: Company name
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     description: Start date
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     description: End date
 *                   description:
 *                     type: string
 *                     description: Job description
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Project ID (for updates)
 *                         name:
 *                           type: string
 *                           description: Project name
 *                         description:
 *                           type: string
 *                           description: Project description
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *               description: Work experience list
 *             education:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Education ID (for updates)
 *                   institution:
 *                     type: string
 *                     description: Institution name
 *                   degree:
 *                     type: string
 *                     description: Degree name
 *                   field:
 *                     type: string
 *                     description: Field of study
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *               description: Education list
 *             certifications:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Certification ID (for updates)
 *                   name:
 *                     type: string
 *                     description: Certification name
 *                   issuer:
 *                     type: string
 *                     description: Issuing organization
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     description: Issue date
 *               description: Certifications list
 *         partner:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: Partner ID
 *         settings:
 *           type: object
 *           description: Candidate settings
 *           properties:
 *             notificationsEnabled:
 *               type: boolean
 *               description: Enable notifications
 *             emailNotifications:
 *               type: boolean
 *               description: Enable email notifications
 *             pushNotifications:
 *               type: boolean
 *               description: Enable push notifications
 *             jobAlerts:
 *               type: boolean
 *               description: Enable job alerts
 *             applicationUpdates:
 *               type: boolean
 *               description: Enable application updates
 *             profileVisibility:
 *               type: boolean
 *               description: Profile visibility
 *             shareDataWithEmployers:
 *               type: boolean
 *               description: Share data with employers
 *             darkMode:
 *               type: boolean
 *               description: Dark mode preference
 *             language:
 *               type: string
 *               description: Language preference
 *             timezone:
 *               type: string
 *               description: Timezone preference
 *             preferredCommunicationChannel:
 *               type: string
 *               description: Preferred communication channel
 *             globalSettings:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: Global settings ID
 *         preferences:
 *           type: object
 *           description: Candidate job preferences
 *           properties:
 *             preferredIndustries:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred industries
 *             preferredLocations:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred locations
 *             preferredWorkTypes:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred work types
 *             preferredJobTitles:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred job titles
 *             preferredJobCommitments:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred job commitments
 *             preferredJobSchedules:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred job schedules
 *             preferredSalaryMin:
 *               type: number
 *               description: Minimum preferred salary
 *             preferredSalaryMax:
 *               type: number
 *               description: Maximum preferred salary
 *             preferredSalaryCurrency:
 *               type: string
 *               description: Preferred salary currency
 *             preferredEquity:
 *               type: boolean
 *               description: Interested in equity
 *             preferredBenefits:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred benefits
 *             preferredResponsibilities:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred responsibilities
 *             preferredTags:
 *               type: array
 *               items:
 *                 type: string
 *               description: Preferred tags
 *         subscription:
 *           type: object
 *           description: Subscription management (limited fields for support)
 *           properties:
 *             status:
 *               type: string
 *               description: Subscription status
 *             endDate:
 *               type: string
 *               format: date-time
 *               description: Subscription end date
 *             autoRenew:
 *               type: boolean
 *               description: Auto renewal setting
 *             assessmentsUsedThisMonth:
 *               type: number
 *               description: Assessments used this month
 *             practiceAssessmentsUsed:
 *               type: number
 *               description: Practice assessments used
 *             additionalPracticeAssessmentCredits:
 *               type: number
 *               description: Additional practice assessment credits
 *         resumeAssessments:
 *           type: array
 *           description: Resume assessments editing
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Assessment ID (for updates)
 *               status:
 *                 type: string
 *                 description: Assessment status
 *               result:
 *                 type: string
 *                 description: Assessment result
 *               score:
 *                 type: number
 *                 description: Assessment score
 *               recommendation:
 *                 type: string
 *                 description: Assessment recommendation
 *               overallFeedback:
 *                 type: string
 *                 description: Overall feedback
 *               strengths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Identified strengths
 *               areasForImprovement:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Areas for improvement
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Skills identified
 *               technicalSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Technical skills
 *               softSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Soft skills
 *               industriesFit:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Industries fit
 *               jobRolesFit:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Job roles fit
 *         onboardingAssessments:
 *           type: array
 *           description: Onboarding assessments editing
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Assessment ID (for updates)
 *               status:
 *                 type: string
 *                 description: Assessment status
 *               result:
 *                 type: string
 *                 description: Assessment result
 *               score:
 *                 type: number
 *                 description: Assessment score
 *               recommendation:
 *                 type: string
 *                 description: Assessment recommendation
 *               overallFeedback:
 *                 type: string
 *                 description: Overall feedback
 *               strengths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Identified strengths
 *               areasForImprovement:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Areas for improvement
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Skills identified
 *               technicalSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Technical skills
 *               softSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Soft skills
 *               duration:
 *                 type: number
 *                 description: Assessment duration
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Section ID
 *                     title:
 *                       type: string
 *                       description: Section title
 *                     description:
 *                       type: string
 *                       description: Section description
 *                     type:
 *                       type: string
 *                       description: Section type
 *                     status:
 *                       type: string
 *                       description: Section status
 *                     result:
 *                       type: string
 *                       description: Section result
 *                     score:
 *                       type: number
 *                       description: Section score
 *                     order:
 *                       type: number
 *                       description: Section order
 *                     feedback:
 *                       type: string
 *                       description: Section feedback
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Section strengths
 *                     areasForImprovement:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Section areas for improvement
 *         jobAiAssessments:
 *           type: array
 *           description: Job AI assessments editing
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Assessment ID (for updates)
 *               status:
 *                 type: string
 *                 description: Assessment status
 *               result:
 *                 type: string
 *                 description: Assessment result
 *               score:
 *                 type: number
 *                 description: Assessment score
 *               recommendation:
 *                 type: string
 *                 description: Assessment recommendation
 *               overallFeedback:
 *                 type: string
 *                 description: Overall feedback
 *               strengths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Identified strengths
 *               areasForImprovement:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Areas for improvement
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Skills identified
 *               technicalSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Technical skills
 *               softSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Soft skills
 *               duration:
 *                 type: number
 *                 description: Assessment duration
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Section ID
 *                     title:
 *                       type: string
 *                       description: Section title
 *                     description:
 *                       type: string
 *                       description: Section description
 *                     type:
 *                       type: string
 *                       description: Section type
 *                     status:
 *                       type: string
 *                       description: Section status
 *                     result:
 *                       type: string
 *                       description: Section result
 *                     score:
 *                       type: number
 *                       description: Section score
 *                     order:
 *                       type: number
 *                       description: Section order
 *                     feedback:
 *                       type: string
 *                       description: Section feedback
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Section strengths
 *                     areasForImprovement:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Section areas for improvement
 */
export interface ISupportCandidateUpdate {
  // Basic candidate information
  fullName?: string;
  email?: string;
  phone?: string;
  image?: string;

  // Status and assessment fields
  status?: CandidateStatusEnum;
  assessmentStage?: string;
  resumeAssessmentStatus?: string;
  onboardingAssessmentStatus?: string;
  jobSearchStatus?: string;

  // Profile flags
  isPublished?: boolean;
  isDirty?: boolean;
  completionPercentage?: number;

  // Personal information
  sex?: string;
  birthDate?: Date | string;
  maritalStatus?: string;

  // Note field
  note?: string;

  // System fields
  createdBy?: string;

  // Complex nested objects
  resume?: {
    summary?: string;
    skills?: string[];
    industries?: string[];
    totalExperience?: number;
    highestEducationLevel?: string;
    experience?: Array<{
      id?: string;
      title: string;
      company: string;
      startDate: Date | string;
      endDate?: Date | string;
      description: string;
      projects?: Array<{
        id?: string;
        name: string;
        description: string;
        startDate: Date | string;
        endDate?: Date | string;
      }>;
    }>;
    education?: Array<{
      id?: string;
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: Date | string;
      endDate?: Date | string;
    }>;
    certifications?: Array<{
      id?: string;
      name: string;
      issuer: string;
      date: Date | string;
    }>;

    isUSWorkAuthorized?: boolean;
    requiresUSVisaSponsorship?: boolean;
    usWorkAuthorizationStatus?: USWorkAuthorizationStatusEnum;
    usWorkAuthorizationDetails?: string;
  };

  // Partner relationship
  partnerId?: string;

  // Settings
  settings?: {
    notificationsEnabled?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    jobAlerts?: boolean;
    applicationUpdates?: boolean;
    profileVisibility?: boolean;
    shareDataWithEmployers?: boolean;
    darkMode?: boolean;
    language?: string;
    timezone?: string;
    preferredCommunicationChannel?: string;
    globalSettings?: {
      id: string;
    };
  };

  // Preferences
  preferences?: {
    preferredIndustries?: string[];
    preferredLocations?: string[];
    preferredWorkTypes?: string[];
    preferredJobTitles?: string[];
    preferredJobCommitments?: string[];
    preferredJobSchedules?: string[];
    preferredSalaryMin?: number;
    preferredSalaryMax?: number;
    preferredSalaryCurrency?: string;
    preferredEquity?: boolean;
    preferredBenefits?: string[];
    preferredResponsibilities?: string[];
    preferredTags?: string[];
  };

  // Subscription (limited fields for support)
  subscription?: {
    status?: string;
    endDate?: Date | string;
    autoRenew?: boolean;
    assessmentsUsedThisMonth?: number;
    practiceAssessmentsUsed?: number;
    additionalPracticeAssessmentCredits?: number;
  };

  // Assessment editing capabilities
  resumeAssessments?: Array<{
    id?: string; // For updates
    status?: string;
    result?: string;
    score?: number;
    recommendation?: string;
    overallFeedback?: string;
    strengths?: string[];
    areasForImprovement?: string[];
    skills?: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    industriesFit?: string[];
    jobRolesFit?: string[];
  }>;

  onboardingAssessments?: Array<{
    id?: string; // For updates
    status?: string;
    result?: string;
    score?: number;
    recommendation?: string;
    overallFeedback?: string;
    strengths?: string[];
    areasForImprovement?: string[];
    skills?: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    duration?: number;
    sections?: Array<{
      id?: string;
      title?: string;
      description?: string;
      type?: string;
      status?: string;
      result?: string;
      score?: number;
      order?: number;
      feedback?: string;
      strengths?: string[];
      areasForImprovement?: string[];
    }>;
    videoAnalysis?: {
      strengths?: string[];
      areasForImprovement?: string[];
    };
  }>;

  jobAiAssessments?: Array<{
    id?: string; // For updates
    status?: string;
    result?: string;
    score?: number;
    recommendation?: string;
    overallFeedback?: string;
    strengths?: string[];
    areasForImprovement?: string[];
    skills?: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    duration?: number;
    sections?: Array<{
      id?: string;
      title?: string;
      description?: string;
      type?: string;
      status?: string;
      result?: string;
      score?: number;
      order?: number;
      feedback?: string;
      strengths?: string[];
      areasForImprovement?: string[];
    }>;
    videoAnalysis?: {
      strengths?: string[];
      areasForImprovement?: string[];
    };
  }>;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportCandidateIdParams:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *         description: ID of the candidate
 */
export interface ISupportCandidateIdParams {
  id: string;
}

/**
 * @openapi
 * components:
 *   parameters:
 *     ISupportCandidateFilterQuery:
 *       in: query
 *       name: partnerId
 *       required: false
 *       schema:
 *         type: string
 *         format: uuid
 *         description: Filter by partner ID
 */
export interface ISupportCandidateFilterQuery {
  status?: CandidateStatusEnum;
  assessmentStage?: CandidateAssessmentStageEnum;
  search?: string;
}

/**
 * Helper function to convert database models to domain models
 */
export const toSupportCandidateDomain = (candidate: any): ISupportCandidate => {
  return {
    id: candidate.id,
    userId: candidate.userId,
    fullName: candidate.user?.name || '',
    email: candidate.user?.email,
    phone: candidate.resume?.phone,
    status: candidate.status,
    assessmentStage: candidate.assessmentStage,
    resumeAssessmentStatus: candidate.resumeAssessmentStatus,
    onboardingAssessmentStatus: candidate.onboardingAssessmentStatus,
    isPublished: candidate.isPublished,
    isDirty: candidate.isDirty,
    completionPercentage: candidate.completionPercentage,
    yearsOfExperience: candidate.resume?.totalExperience,
    jobSearchStatus: candidate.jobSearchStatus,
    sex: candidate.sex,
    birthDate: candidate.birthDate,
    maritalStatus: candidate.maritalStatus,
    image: candidate.user?.image,
    note: candidate.note,
    createdBy: candidate.createdBy,
    updatedBy: candidate.updatedBy,
    resume: candidate.resume
      ? {
          id: candidate.resume.id,
          summary: candidate.resume.summary,
          currentJobTitle: candidate.resume.currentJobTitle,
          currentCompany: candidate.resume.currentCompany,
          currentWorkLocation: candidate.resume.currentWorkLocation,
          currentSalary: candidate.resume.currentSalary,
          currentSalaryCurrency: candidate.resume.currentSalaryCurrency,
          currentWorkType: candidate.resume.currentWorkType,
          experience:
            candidate.resume.experience?.map((exp: any) => ({
              id: exp.id,
              title: exp.title ?? exp.position ?? '',
              company: exp.company,
              startDate: exp.startDate,
              endDate: exp.endDate,
              description: exp.description,
              projects:
                exp.projects?.map((proj: any) => ({
                  id: proj.id,
                  name: proj.name,
                  description: proj.description,
                  startDate: proj.startDate,
                  endDate: proj.endDate,
                })) || [],
            })) || [],
          education:
            candidate.resume.education?.map((edu: any) => ({
              id: edu.id,
              institution: edu.institution,
              degree: edu.degree,
              fieldOfStudy: edu.fieldOfStudy,
              startDate: edu.startDate,
              endDate: edu.endDate,
            })) || [],
          certifications:
            candidate.resume.certifications?.map((cert: any) => ({
              id: cert.id,
              name: cert.name,
              issuer: cert.issuer,
              date: cert.date,
            })) || [],
          skills: candidate.resume.resumeSkills || [],
          industries: candidate.resume.industries || [],
          totalExperience: candidate.resume.totalExperience,
          highestEducationLevel: candidate.resume.highestEducationLevel,
          isUSWorkAuthorized: candidate.resume.isUSWorkAuthorized,
          requiresUSVisaSponsorship: candidate.resume.requiresUSVisaSponsorship,
          usWorkAuthorizationStatus: candidate.resume.usWorkAuthorizationStatus,
          usWorkAuthorizationDetails:
            candidate.resume.usWorkAuthorizationDetails,
        }
      : undefined,
    partner: candidate.partner
      ? {
          id: candidate.partner.id,
          name: candidate.partner.company?.name || 'Unknown Company',
          company: {
            name: candidate.partner.company?.name || 'Unknown Company',
            contactEmail: candidate.partner.company?.contactEmail || '',
          },
        }
      : undefined,
    settings: candidate.settings
      ? {
          id: candidate.settings.id,
          notificationsEnabled: candidate.settings.notificationsEnabled,
          emailNotifications: candidate.settings.emailNotifications,
          pushNotifications: candidate.settings.pushNotifications,
          jobAlerts: candidate.settings.jobAlerts,
          applicationUpdates: candidate.settings.applicationUpdates,
          profileVisibility: candidate.settings.profileVisibility,
          shareDataWithEmployers: candidate.settings.shareDataWithEmployers,
          darkMode: candidate.settings.darkMode,
          language: candidate.settings.language,
          timezone: candidate.settings.timezone,
          preferredCommunicationChannel:
            candidate.settings.preferredCommunicationChannel,
          globalSettings: candidate.settings.globalSettings
            ? {
                id: candidate.settings.globalSettings.id,
              }
            : undefined,
        }
      : undefined,
    preferences: candidate.preferences
      ? {
          preferredIndustries: candidate.preferences.preferredIndustries || [],
          preferredLocations: candidate.preferences.preferredLocations || [],
          preferredWorkTypes: candidate.preferences.preferredWorkTypes || [],
          preferredJobTitles: candidate.preferences.preferredJobTitles || [],
          preferredJobCommitments:
            candidate.preferences.preferredJobCommitments || [],
          preferredJobSchedules:
            candidate.preferences.preferredJobSchedules || [],
          preferredSalaryMin: candidate.preferences.preferredSalaryMin,
          preferredSalaryMax: candidate.preferences.preferredSalaryMax,
          preferredSalaryCurrency:
            candidate.preferences.preferredSalaryCurrency,
          preferredEquity: candidate.preferences.preferredEquity,
          preferredBenefits: candidate.preferences.preferredBenefits || [],
          preferredResponsibilities:
            candidate.preferences.preferredResponsibilities || [],
          preferredTags: candidate.preferences.preferredTags || [],
        }
      : undefined,
    applications:
      candidate.applications?.map((app: any) => ({
        id: app.id,
        jobPostingId: app.jobPostingId,
        status: app.status,
        submittedAt: app.appliedAt,
        jobPosting: {
          id: app.jobPosting?.id,
          title: app.jobPosting?.title,
          company: {
            name: app.jobPosting?.client?.company?.name || 'Unknown Company',
          },
        },
      })) || [],
    assessments:
      candidate.assessments?.map((assessment: any) => ({
        id: assessment.id,
        type: assessment.type,
        status: assessment.status,
        score: assessment.score,
        completedAt: assessment.completedAt,
      })) || [],
    resumeAssessments:
      candidate.resumeAssessments?.map((assessment: any) => ({
        id: assessment.id,
        candidateId: assessment.candidateId,
        status: assessment.status,
        result: assessment.result,
        score: assessment.score,
        recommendation: assessment.recommendation,
        overallFeedback: assessment.overallFeedback,
        strengths: assessment.strengths || [],
        areasForImprovement: assessment.areasForImprovement || [],
        skills: assessment.skills || [],
        technicalSkills: assessment.technicalSkills || [],
        softSkills: assessment.softSkills || [],
        industriesFit: assessment.industriesFit || [],
        jobRolesFit: assessment.jobRolesFit || [],
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        task: assessment.task,
      })) || [],
    onboardingAssessments:
      candidate.onboardingAssessments?.map((assessment: any) => ({
        id: assessment.id,
        candidateId: assessment.candidateId,
        status: assessment.status,
        result: assessment.result,
        score: assessment.score,
        recommendation: assessment.recommendation,
        overallFeedback: assessment.overallFeedback,
        strengths: assessment.strengths || [],
        areasForImprovement: assessment.areasForImprovement || [],
        skills: assessment.skills || [],
        technicalSkills: assessment.technicalSkills || [],
        softSkills: assessment.softSkills || [],
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        duration: assessment.duration,
        sections:
          assessment.sections?.map((section: any) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            type: section.type,
            status: section.status,
            result: section.result,
            score: section.score,
            order: section.order,
            feedback: section.feedback,
            strengths: section.strengths || [],
            areasForImprovement: section.areasForImprovement || [],
            questions:
              section.questions?.map((question: any) => ({
                id: question.id,
                question: question.question,
                questionType: question.questionType,
                answerGiven: question.answerGiven,
                score: question.score,
                maxScore: question.maxScore,
                feedback: question.feedback,
                isAnswered: question.isAnswered,
              })) || [],
          })) || [],
        videoAnalysis: assessment.videoAnalysis
          ? {
              id: assessment.videoAnalysis.id,
              videoUrl: assessment.videoAnalysis.videoUrl,
              highlightsVideoUrl: assessment.videoAnalysis.highlightsVideoUrl,
              overallScore: assessment.videoAnalysis.overallScore,
              overallFeedback: assessment.videoAnalysis.overallFeedback,
              engagementScore: assessment.videoAnalysis.engagementScore,
              confidenceScore: assessment.videoAnalysis.confidenceScore,
              clarityScore: assessment.videoAnalysis.clarityScore,
              professionalDemeanorScore:
                assessment.videoAnalysis.professionalDemeanorScore,
              proctoringScore: assessment.videoAnalysis.proctoringScore,
              strengths: assessment.videoAnalysis.strengths || [],
              areasForImprovement:
                assessment.videoAnalysis.areasForImprovement || [],
            }
          : undefined,
        proctoring: assessment.proctoring
          ? {
              id: assessment.proctoring.id,
              warningCount: assessment.proctoring.warningCount,
              tabSwitches: assessment.proctoring.tabSwitches,
              copyPasteAttempts: assessment.proctoring.copyPasteAttempts,
              multiplePersonsDetected:
                assessment.proctoring.multiplePersonsDetected,
              automaticallyFailed: assessment.proctoring.automaticallyFailed,
              manualReviewRequired: assessment.proctoring.manualReviewRequired,
            }
          : undefined,
        settings: assessment.jobAiAssessmentSettings
          ? {
              id: assessment.jobAiAssessmentSettings.id,
              greetingMessage:
                assessment.jobAiAssessmentSettings.greetingMessage,
              defaultAssessmentDuration:
                assessment.jobAiAssessmentSettings.defaultAssessmentDuration,
              defaultPassingScore:
                assessment.jobAiAssessmentSettings.defaultPassingScore,
              requiredSections:
                assessment.jobAiAssessmentSettings.requiredSections || [],
              maximumAttempts:
                assessment.jobAiAssessmentSettings.maximumAttempts,
              cooldownPeriod: assessment.jobAiAssessmentSettings.cooldownPeriod,
              proctoringEnabled:
                assessment.jobAiAssessmentSettings.proctoringEnabled,
              videoRecordingEnabled:
                assessment.jobAiAssessmentSettings.videoRecordingEnabled,
              aiVideoAnalysisEnabled:
                assessment.jobAiAssessmentSettings.aiVideoAnalysisEnabled,
            }
          : undefined,
      })) || [],
    savedJobs:
      candidate.savedJobs?.map((saved: any) => ({
        id: saved.id,
        jobPosting: {
          id: saved.jobPosting?.id,
          title: saved.jobPosting?.title,
          company: {
            name: saved.jobPosting?.client?.company?.name || 'Unknown Company',
          },
        },
      })) || [],
    subscription: candidate.candidateSubscription
      ? {
          id: candidate.candidateSubscription.id,
          status: candidate.candidateSubscription.status,
          startDate: candidate.candidateSubscription.startDate,
          endDate: candidate.candidateSubscription.endDate,
          autoRenew: candidate.candidateSubscription.autoRenew,
          assessmentsUsedThisMonth:
            candidate.candidateSubscription.assessmentsUsedThisMonth,
          practiceAssessmentsUsed:
            candidate.candidateSubscription.practiceAssessmentsUsed,
          additionalPracticeAssessmentCredits:
            candidate.candidateSubscription.additionalPracticeAssessmentCredits,
          paymentProvider: candidate.candidateSubscription.paymentProvider,
          paymentProviderCustomerId:
            candidate.candidateSubscription.paymentProviderCustomerId,
          paymentProviderSubscriptionId:
            candidate.candidateSubscription.paymentProviderSubscriptionId,
          lastBillingDate: candidate.candidateSubscription.lastBillingDate,
          nextBillingDate: candidate.candidateSubscription.nextBillingDate,
          metadata: candidate.candidateSubscription.metadata,
          package: candidate.candidateSubscription.package
            ? {
                id: candidate.candidateSubscription.package.id,
                name: candidate.candidateSubscription.package.name,
                description:
                  candidate.candidateSubscription.package.description,
                price: candidate.candidateSubscription.package.price,
                currency: candidate.candidateSubscription.package.currency,
                billingCycle:
                  candidate.candidateSubscription.package.billingCycle,
                isActive: candidate.candidateSubscription.package.isActive,
                isDefault: candidate.candidateSubscription.package.isDefault,
                maxAssessmentsPerMonth:
                  candidate.candidateSubscription.package
                    .maxAssessmentsPerMonth,
                maxPracticeAssessments:
                  candidate.candidateSubscription.package
                    .maxPracticeAssessments,
                accessToAllSkills:
                  candidate.candidateSubscription.package.accessToAllSkills,
                personalizedFeedback:
                  candidate.candidateSubscription.package.personalizedFeedback,
                careerCoaching:
                  candidate.candidateSubscription.package.careerCoaching,
                paymentProvider:
                  candidate.candidateSubscription.package.paymentProvider,
                paymentProviderPriceId:
                  candidate.candidateSubscription.package
                    .paymentProviderPriceId,
                paymentProviderProductId:
                  candidate.candidateSubscription.package
                    .paymentProviderProductId,
                features: candidate.candidateSubscription.package.features,
                createdAt: candidate.candidateSubscription.package.createdAt,
                updatedAt: candidate.candidateSubscription.package.updatedAt,
              }
            : undefined,
          creditPurchases:
            candidate.candidateSubscription.creditPurchases?.map(
              (credit: any) => ({
                id: credit.id,
                creditType: credit.creditType,
                creditsAmount: credit.creditsAmount,
                costPerCredit: credit.costPerCredit,
                totalCost: credit.totalCost,
                currency: credit.currency,
                paymentProvider: credit.paymentProvider,
                paymentProviderPaymentIntentId:
                  credit.paymentProviderPaymentIntentId,
                paymentProviderInvoiceId: credit.paymentProviderInvoiceId,
                isPaid: credit.isPaid,
                paidAt: credit.paidAt,
                createdAt: credit.createdAt,
                updatedAt: credit.updatedAt,
              })
            ) || [],
          createdAt: candidate.candidateSubscription.createdAt,
          updatedAt: candidate.candidateSubscription.updatedAt,
        }
      : undefined,
    partnerApplications:
      candidate.partnerApplications?.map((app: any) => ({
        id: app.id,
        candidateId: app.candidateId,
        jobPostingId: app.jobPostingId,
        partnerId: app.partnerId,
        status: app.status,
        submittedAt: app.appliedAt,
        jobPosting: {
          id: app.jobPosting?.id,
          title: app.jobPosting?.title,
          client: app.jobPosting?.client
            ? {
                id: app.jobPosting?.client?.id,
                company: {
                  name:
                    app.jobPosting?.client?.company?.name || 'Unknown Company',
                },
              }
            : null,
        },
        partner: app.partner
          ? {
              id: app.partner.id,
              company: {
                name: app.partner.company?.name || 'Unknown Company',
              },
            }
          : null,
      })) || [],
    jobAiAssessmentInvitations:
      candidate.jobAiAssessmentInvitations?.map((invitation: any) => ({
        id: invitation.id,
        candidateId: invitation.candidateId,
        jobAiAssessmentId: invitation.jobAiAssessmentId,
        invitedById: invitation.invitedById,
        type: invitation.type,
        status: invitation.status,
        message: invitation.message,
        scheduledDate: invitation.scheduledDate,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        jobAiAssessment: {
          id: invitation.jobAiAssessment?.id,
          jobPosting: {
            title: invitation.jobAiAssessment?.jobPosting?.title,
            client: invitation.jobAiAssessment?.jobPosting?.client
              ? {
                  id: invitation.jobAiAssessment?.jobPosting?.client?.id,
                  company: {
                    name:
                      invitation.jobAiAssessment?.jobPosting?.client?.company
                        ?.name || 'Unknown Company',
                  },
                }
              : null,
          },
        },
        invitedBy: {
          id: invitation.invitedBy?.id,
          user: {
            name: invitation.invitedBy?.user?.name,
            email: invitation.invitedBy?.user?.email,
          },
        },
      })) || [],
    jobAiAssessments:
      candidate.jobAiAssessments?.map((assessment: any) => ({
        id: assessment.id,
        candidateId: assessment.candidateId,
        jobApplicationId: assessment.jobApplicationId,
        status: assessment.status,
        result: assessment.result,
        score: assessment.score,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        duration: assessment.duration,
        recommendation: assessment.recommendation,
        overallFeedback: assessment.overallFeedback,
        strengths: assessment.strengths || [],
        areasForImprovement: assessment.areasForImprovement || [],
        skills: assessment.skills || [],
        technicalSkills: assessment.technicalSkills || [],
        softSkills: assessment.softSkills || [],
        jobPosting: {
          title: assessment.jobPosting?.title || 'Unknown Job',
          client: {
            id: assessment.jobPosting?.client?.id || '',
            company: {
              name:
                assessment.jobPosting?.client?.company?.name ||
                'Unknown Company',
            },
          },
        },
        sections:
          assessment.sections?.map((section: any) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            type: section.type,
            status: section.status,
            result: section.result,
            score: section.score,
            order: section.order,
            feedback: section.feedback,
            strengths: section.strengths || [],
            areasForImprovement: section.areasForImprovement || [],
            questions:
              section.questions?.map((question: any) => ({
                id: question.id,
                question: question.question,
                questionType: question.questionType,
                answerGiven: question.answerGiven,
                score: question.score,
                maxScore: question.maxScore,
                feedback: question.feedback,
                isAnswered: question.isAnswered,
              })) || [],
          })) || [],
        videoAnalysis: assessment.videoAnalysis
          ? {
              id: assessment.videoAnalysis.id,
              videoUrl: assessment.videoAnalysis.videoUrl,
              highlightsVideoUrl: assessment.videoAnalysis.highlightsVideoUrl,
              overallScore: assessment.videoAnalysis.overallScore,
              overallFeedback: assessment.videoAnalysis.overallFeedback,
              engagementScore: assessment.videoAnalysis.engagementScore,
              confidenceScore: assessment.videoAnalysis.confidenceScore,
              clarityScore: assessment.videoAnalysis.clarityScore,
              professionalDemeanorScore:
                assessment.videoAnalysis.professionalDemeanorScore,
              proctoringScore: assessment.videoAnalysis.proctoringScore,
              strengths: assessment.videoAnalysis.strengths || [],
              areasForImprovement:
                assessment.videoAnalysis.areasForImprovement || [],
            }
          : undefined,
        proctoring: assessment.proctoring
          ? {
              id: assessment.proctoring.id,
              warningCount: assessment.proctoring.warningCount,
              tabSwitches: assessment.proctoring.tabSwitches,
              copyPasteAttempts: assessment.proctoring.copyPasteAttempts,
              multiplePersonsDetected:
                assessment.proctoring.multiplePersonsDetected,
              automaticallyFailed: assessment.proctoring.automaticallyFailed,
              manualReviewRequired: assessment.proctoring.manualReviewRequired,
            }
          : undefined,
        settings: assessment.jobAiAssessmentSettings
          ? {
              id: assessment.jobAiAssessmentSettings.id,
              greetingMessage:
                assessment.jobAiAssessmentSettings.greetingMessage,
              defaultAssessmentDuration:
                assessment.jobAiAssessmentSettings.defaultAssessmentDuration,
              defaultPassingScore:
                assessment.jobAiAssessmentSettings.defaultPassingScore,
              requiredSections:
                assessment.jobAiAssessmentSettings.requiredSections || [],
              maximumAttempts:
                assessment.jobAiAssessmentSettings.maximumAttempts,
              cooldownPeriod: assessment.jobAiAssessmentSettings.cooldownPeriod,
              proctoringEnabled:
                assessment.jobAiAssessmentSettings.proctoringEnabled,
              videoRecordingEnabled:
                assessment.jobAiAssessmentSettings.videoRecordingEnabled,
              aiVideoAnalysisEnabled:
                assessment.jobAiAssessmentSettings.aiVideoAnalysisEnabled,
            }
          : undefined,
      })) || [],
    publicPracticeAssessments:
      candidate.publicPracticeAssessments?.map((assessment: any) => ({
        id: assessment.id,
        candidateId: assessment.candidateId,
        title: assessment.title,
        description: assessment.description,
        sourceJobUrl: assessment.sourceJobUrl,
        candidateEmail: assessment.candidateEmail,
        candidateName: assessment.candidateName,
        skillsFocus: assessment.skillsFocus || [],
        difficulty: assessment.difficulty,
        status: assessment.status,
        result: assessment.result,
        score: assessment.score,
        duration: assessment.duration,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        overallFeedback: assessment.overallFeedback,
        strengths: assessment.strengths || [],
        areasForImprovement: assessment.areasForImprovement || [],
        recommendation: assessment.recommendation,
        selectedForNextRound: assessment.selectedForNextRound || false,
        skills: assessment.skills || [],
        technicalSkills: assessment.technicalSkills || [],
        softSkills: assessment.softSkills || [],
        industriesFit: assessment.industriesFit || [],
        jobRolesFit: assessment.jobRolesFit || [],
        experienceSummary: assessment.experienceSummary,
        educationSummary: assessment.educationSummary,
        linkedAt: assessment.linkedAt,
        termsAccepted: assessment.termsAccepted || false,
        termsAcceptedAt: assessment.termsAcceptedAt,
        sections:
          assessment.sections?.map((section: any) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            type: section.type,
            status: section.status,
            result: section.result,
            score: section.score,
            order: section.order,
            strengths: section.strengths || [],
            areasForImprovement: section.areasForImprovement || [],
            questions:
              section.questions?.map((question: any) => ({
                id: question.id,
                question: question.question,
                questionType: question.questionType,
                answerGiven: question.answerGiven,
                score: question.score,
                maxScore: question.maxScore,
                feedback: question.feedback,
                isAnswered: question.isAnswered || false,
              })) || [],
          })) || [],
        videoAnalysis: assessment.videoAnalysis
          ? {
              id: assessment.videoAnalysis.id,
              videoUrl: assessment.videoAnalysis.videoUrl,
              highlightsVideoUrl: assessment.videoAnalysis.highlightsVideoUrl,
              overallScore: assessment.videoAnalysis.overallScore,
              overallFeedback: assessment.videoAnalysis.overallFeedback,
              engagementScore: assessment.videoAnalysis.engagementScore,
              confidenceScore: assessment.videoAnalysis.confidenceScore,
              clarityScore: assessment.videoAnalysis.clarityScore,
              professionalDemeanorScore:
                assessment.videoAnalysis.professionalDemeanorScore,
              proctoringScore: assessment.videoAnalysis.proctoringScore,
              strengths: assessment.videoAnalysis.strengths || [],
              areasForImprovement:
                assessment.videoAnalysis.areasForImprovement || [],
            }
          : undefined,
        proctoring: assessment.proctoring
          ? {
              id: assessment.proctoring.id,
              warningCount: assessment.proctoring.warningCount,
              tabSwitches: assessment.proctoring.tabSwitches,
              copyPasteAttempts: assessment.proctoring.copyPasteAttempts,
              multiplePersonsDetected:
                assessment.proctoring.multiplePersonsDetected,
              automaticallyFailed: assessment.proctoring.automaticallyFailed,
              manualReviewRequired: assessment.proctoring.manualReviewRequired,
            }
          : undefined,
        settings: assessment.settings
          ? {
              id: assessment.settings.id,
              greetingMessage: assessment.settings.greetingMessage,
              defaultAssessmentDuration:
                assessment.settings.defaultAssessmentDuration,
              defaultPassingScore: assessment.settings.defaultPassingScore,
              requiredSections: assessment.settings.requiredSections || [],
              maximumAttempts: assessment.settings.maximumAttempts,
              cooldownPeriod: assessment.settings.cooldownPeriod,
              proctoringEnabled: assessment.settings.proctoringEnabled,
              videoRecordingEnabled: assessment.settings.videoRecordingEnabled,
              aiVideoAnalysisEnabled:
                assessment.settings.aiVideoAnalysisEnabled,
            }
          : undefined,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
      })) || [],
    views:
      candidate.views?.map((view: any) => ({
        id: view.id,
        candidateId: view.candidateId,
        clientUserId: view.clientUserId,
        viewedAt: view.viewedAt,
        viewContext: view.viewContext,
        clientUser: {
          id: view.clientUser?.id,
          user: {
            name: view.clientUser?.user?.name,
            email: view.clientUser?.user?.email,
          },
          client: view.clientUser?.client
            ? {
                id: view.clientUser?.client?.id,
                company: {
                  name:
                    view.clientUser?.client?.company?.name || 'Unknown Company',
                },
              }
            : null,
        },
        jobPosting: view.jobPosting
          ? { title: view.jobPosting.title }
          : undefined,
      })) || [],
    createdAt: candidate.user?.createdAt,
    updatedAt: candidate.user?.updatedAt,
  };
};

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateListResponse:
 *       type: object
 *       description: Response model for candidate list items
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the candidate
 *         fullName:
 *           type: string
 *           description: Full name of the candidate
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         phone:
 *           type: string
 *           nullable: true
 *           description: Phone number of the candidate
 *         status:
 *           type: string
 *           description: Current status of the candidate
 *         assessmentStage:
 *           type: string
 *           description: Current assessment stage
 *         jobSearchStatus:
 *           type: string
 *           description: Current job search status
 *         partner:
 *           type: object
 *           description: Associated partner information
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *         completionPercentage:
 *           type: number
 *           description: Profile completion percentage
 *         resumeAssessmentStatus:
 *           type: string
 *           description: Status of resume assessment
 *         onboardingAssessmentStatus:
 *           type: string
 *           description: Status of onboarding assessment
 *         resumeAssessmentRecommendation:
 *           $ref: '#/components/schemas/ResumeAssessmentRecommendationEnum'
 *           description: Recommendation from the latest resume assessment
 *         onboardingAssessmentRecommendation:
 *           $ref: '#/components/schemas/OnboardingAssessmentRecommendationEnum'
 *           description: Recommendation from the latest onboarding assessment
 *         isImportedCandidate:
 *           type: boolean
 *           description: Whether the candidate was imported from an external source
 *         importedByClientId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the client who imported this candidate
 *         importedJobPostingId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the job posting this candidate was imported for
 *         importedIntegrationId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the integration provider used for import
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was created
 */
export interface ISupportCandidateListResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  assessmentStage: string;
  jobSearchStatus: string;
  partner?: {
    id: string;
    name: string;
  };
  completionPercentage: number;
  resumeAssessmentStatus: string;
  onboardingAssessmentStatus: string;
  jobAiAssessmentStatus?: string;
  resumeAssessmentRecommendation?: string;
  onboardingAssessmentRecommendation?: string;
  jobAiAssessmentRecommendation?: string;
  isImportedCandidate: boolean;
  importedByClientId: string | null;
  importedJobPostingId: string | null;
  importedIntegrationId: string | null;
  createdAt: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateCreateSimple:
 *       type: object
 *       description: Simplified interface for creating a candidate via support
 *       properties:
 *         fullName:
 *           type: string
 *           description: Full name of the candidate
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         jobTitle:
 *           type: string
 *           description: Job title of the candidate
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated partner
 */
export interface ISupportCandidateCreateSimple {
  fullName: string;
  email: string;
  jobTitle?: string;
  partnerId?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateCreateDone:
 *       type: object
 *       description: Response after creating a candidate
 *       properties:
 *         fullName:
 *           type: string
 *           description: Full name of the candidate
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         jobTitle:
 *           type: string
 *           description: Job title of the candidate
 *         message:
 *           type: string
 *           description: Success message with login credentials information
 */
export interface ISupportCandidateCreateDone {
  fullName: string;
  email: string;
  jobTitle?: string;
  message?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportRecommendedCandidate:
 *       type: object
 *       description: Candidate with onboarding assessment recommendation
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the candidate
 *         fullName:
 *           type: string
 *           description: Full name of the candidate
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the candidate
 *         phone:
 *           type: string
 *           nullable: true
 *           description: Phone number of the candidate
 *         status:
 *           type: string
 *           description: Current status of the candidate
 *         isPublished:
 *           type: boolean
 *           description: Whether the candidate profile is published
 *         completionPercentage:
 *           type: number
 *           description: Profile completion percentage
 *         onboardingAssessment:
 *           type: object
 *           description: Latest onboarding assessment details
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             status:
 *               type: string
 *             score:
 *               type: number
 *             recommendation:
 *               type: string
 *               enum: [HIGHLY_RECOMMENDED, RECOMMENDED, NOT_RECOMMENDED]
 *             completedAt:
 *               type: string
 *               format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the candidate was created
 */
export interface ISupportRecommendedCandidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;
  isPublished: boolean;
  completionPercentage: number;
  onboardingAssessment?: {
    id: string;
    status: string;
    score: number;
    recommendation: string;
    completedAt: string;
  };
  createdAt: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateResetOnboardingAssessmentRequest:
 *       type: object
 *       description: Request data for resetting onboarding assessment
 *       properties:
 *         reason:
 *           type: string
 *           description: Optional reason for resetting the assessment
 *           example: "Assessment corrupted, candidate request"
 */
export interface ISupportCandidateResetOnboardingAssessmentRequest {
  reason?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateResetOnboardingAssessmentResponse:
 *       type: object
 *       description: Response data for reset onboarding assessment operation
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Onboarding assessment reset successfully"
 *         historyId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the history record created (only present for reset operations, null for resubmit operations)
 */
export interface ISupportCandidateResetOnboardingAssessmentResponse {
  message: string;
  historyId: string | null;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportCandidateActionResponse:
 *       type: object
 *       description: Response data for candidate action (publish/do not publish) operation
 *       properties:
 *         processedCount:
 *           type: number
 *           description: Number of candidates successfully processed
 *           example: 1
 *         failedCount:
 *           type: number
 *           description: Number of candidates that failed to process
 *           example: 0
 *         failedCandidates:
 *           type: array
 *           description: List of candidates that failed to process with reasons
 *           items:
 *             type: object
 *             properties:
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the candidate that failed
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               reason:
 *                 type: string
 *                 description: Reason for failure
 *                 example: "Candidate not found or does not meet criteria for publishing"
 */
export interface ISupportCandidateActionResponse {
  processedCount: number;
  failedCount: number;
  failedCandidates: Array<{
    candidateId: string;
    reason: string;
  }>;
}
