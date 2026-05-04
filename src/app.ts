// IMPORTANT: Import instrument.js at the very top for Sentry to work properly
import '../instrument.js';

import express from 'express';
import { ENV } from '@/config/env';
import { cache } from '@/middleware/cache.middleware';
import { addDelay } from '@/middleware/delay.middleware';
import { corsMiddleware } from '@/middleware/cors.middleware';
import authRoutes from '@/routes/auth/auth.routes';
import clientRoutes from '@/routes/client/signup.routes';
import clientUserInvitationRoutes from '@/routes/client/user.invitation.routes';
import clientUserRoutes from '@/routes/client/user.routes';
import clientProfileRoutes from '@/routes/client/profile.routes';
import clientProfileSetupRoutes from '@/routes/client/profile.setup.route';
import clientProfileByIdRoutes from '@/routes/client/profile.by.id.routes';
import clientUserProfileRoutes from '@/routes/client/user.profile.routes';
import clientSubscriptionRoutes from '@/routes/client/subscription.routes';
import clientJobPostingAssessmentRoutes from '@/routes/client/job.posting.assessment.routes';
import clientJobPostingRoutes from '@/routes/client/job.posting.routes';
import clientJobParsingRoutes from '@/routes/client/job.parsing.routes';
import clientApplicationRoutes from '@/routes/client/application.routes';
import clientJobPostingRecommendationRoutes from '@/routes/client/job.posting.recommendation.routes';
import clientCandidateShortlistRoutes from '@/routes/client/candidate.shortlist.routes';
import clientAdminAnalyticsRoutes from '@/routes/client/client.admin.analytics.routes';
import partnerRoutes from '@/routes/partner/signup.routes';
import partnerUserRoutes from '@/routes/partner/user.routes';
import partnerUserInvitationRoutes from '@/routes/partner/user.invitation.routes';
import partnerUserProfileRoutes from '@/routes/partner/user.profile.routes';
import partnerProfileSetupRoutes from '@/routes/partner/profile.setup.route';
import partnerCandidateRoutes from '@/routes/partner/candidate.route';
import partnerJobPostingRoutes from '@/routes/partner/job.postings.routes';
import partnerJobApplicationRoutes from '@/routes/partner/job.application.routes';
import monitoringRoutes from '@/routes/monitoring/monitoring.routes';
import localUploadsRoutes from '@/routes/storage/local.storage.routes';
import documentRoutes from '@/routes/common/document.routes';
import locationRoutes from '@/routes/common/location.routes';
import { ErrorMonitoringService } from '@/services/monitoring/error.monitoring.service';
import { SentryService } from '@/services/monitoring/sentry.service';
import { ErrorRequestHandler, RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from './docs/swagger';
import { notFoundHandler } from './middleware/not.found.middleware';
import { metricsMiddleware } from './middleware/monitoring.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { compressionMiddleware } from './middleware/performance.middleware';
import { requestId } from './middleware/request.id.middleware';
import { errorHandler, setupSecurityHeaders } from '@/middleware';
import candidateRoutes from '@/routes/candidate/signup.route';
import candidateProfileRoutes from '@/routes/candidate/profile.route';
import candidateProfileByIdRoutes from '@/routes/candidate/profile.by.id.routes';
import candidateProfileSettingsRoutes from '@/routes/candidate/profile.settings.routes';
import candidateSubscriptionRoutes from '@/routes/candidate/subscription.route';
import candidateResumeRoutes from '@/routes/candidate/resume.route';
import candidateRecommendationRoutes from '@/routes/candidate/recommendation.routes';
import candidateApplicationRoutes from '@/routes/candidate/application.routes';
import candidateJobPostingRoutes from '@/routes/candidate/job.posting.routes';
import candidateOnboardingAssessmentRoutes from '@/routes/candidate/onboarding.assessment.routes';
import candidateJobAiAssessmentRoutes from '@/routes/candidate/job.ai.assessment.routes';
import candidateJobAssessmentInviteRoutes from '@/routes/candidate/job.assessment.invite.routes';
import candidateResumeParsingRoutes from '@/routes/candidate/resume.parsing.routes';
import candidateResumeAssessmentRoutes from '@/routes/candidate/resume.assessment.routes';
import demoRoutes from '@/routes/demo/demo.routes';
import searchRoutes from '@/routes/search/search';
import mcpRoutes from '@/routes/docs/mcp';
import ragCronRoutes from '@/routes/cron/rag.cron';
import feedbackEmailCronRoutes from '@/routes/cron/feedback.email.cron.routes';
import subscriptionExpiryCronRoutes from '@/routes/cron/subscription.expiry.cron.routes';
import dailyStatsCronRoutes from '@/routes/cron/daily.stats.cron.routes';
import dailyDigestCronRoutes from '@/routes/cron/daily.digest.cron.routes';
import voiceRoutes from './routes/voice/voice.routes';
import liveKitRoutes from './routes/livekit/livekit.routes';
import partnerProfileRoutes from '@/routes/partner/profile.routes';
import partnerProfileByIdRoutes from '@/routes/partner/profile.by.id.routes';
import supportUserRoutes from '@/routes/support/user.routes';
import supportInvitationRoutes from '@/routes/support/invitation.routes';
import supportClientRoutes from '@/routes/support/client.routes';
import supportLookupRoutes from '@/routes/support/lookup.routes';
import supportPartnersRoutes from '@/routes/support/partners.routes';
import supportCandidatesRoutes from '@/routes/support/candidates.routes';
import supportCandidatesReminderRoutes from '@/routes/support/candidates.reminder.routes';
import supportKpisRoutes from '@/routes/support/kpis.routes';
import supportImpersonationRoutes from '@/routes/support/impersonation.routes';
import supportApplicationRoutes from '@/routes/support/application.routes';
import supportDeelConfigurationRoutes from '@/routes/support/deel.configuration.routes';
import supportOnboardingAssessmentSettingsRoutes from '@/routes/support/onboarding.assessment.settings.routes';
import supportOnboardingAssessmentGlobalSettingsRoutes from '@/routes/support/onboarding.assessment.global.settings.routes';
import supportPracticeAssessmentSettingsRoutes from '@/routes/support/practice.assessment.settings.routes';
import supportJobAiAssessmentGlobalSettingsRoutes from '@/routes/support/job.ai.assessment.global.settings.routes';
import supportGlobalSettingsRoutes from '@/routes/support/global.settings.routes';
import supportFeatureFlagRoutes from '@/routes/support/feature.flag.routes';
import supportPlatformUserRoutes from '@/routes/support/platform.user.routes';
import supportTourDefinitionManagementRoutes from '@/routes/support/tour.definition.management.routes';
import activityRoutes from '@/routes/activity/activity.log.routes';
import stripeRoutes from '@/routes/client/stripe.routes';
import adminRoutes from '@/routes/support/document.config.routes';
import oauthRoutes from '@/routes/oauth/oauth.routes';
import oidcRoutes from '@/routes/oidc/oidc.routes';
import clientJobPanelAssessmentRoutes from '@/routes/client/job.panel.assessment.routes';
import candidatePanelAssessmentRoutes from '@/routes/candidate/job.panel.assessment.routes';
import clientJobAiAssessmentInviteRoutes from '@/routes/client/job.ai.assesment.invite.routes';
import clientIntegrationRoutes from '@/routes/client/integration.routes';
import clientJobInviteRoutes from '@/routes/client/job.invite.routes';

import { BullBoardService } from '@/services/queue/bullboard.service';
import { BullMQBasicAuth } from '@/middleware/bullmq.auth.middleware';
import workableIntegrationRoutes from '@/routes/integration/ats/workable/workable.integration.routes';
import indeedIntegrationRoutes from '@/routes/integration/jobboard/indeed/indeed.routes';
import candidateRecommendationCronRoutes from '@/routes/cron/candidate.recommendation.cron.routes';
import jobRecommendationCronRoutes from '@/routes/cron/job.recommendation.cron.routes';
import featureFlagScheduleCronRoutes from '@/routes/cron/feature.flag.schedule.cron.routes';
import accountManagerAssignmentRoutes from '@/routes/support/account.manager.assignment.routes';
import integrationCommonRoutes from '@/routes/integration/common/integration.common.routes';
import clientAccountManagerRoutes from '@/routes/client/account.manager.routes';
import candidateProfilePublicRoutes from '@/routes/candidate/profile.public.route';
import publicPracticeAssessmentRoutes, {
  candidatePracticeAssessmentsRouter,
} from '@/routes/candidate/public.practice.assessment.routes';
import mcpInterviewPublicRoutes from '@/routes/public/mcp.interview.routes';
import supportJobPostingRoutes from '@/routes/support/job.posting.routes';
import supportJobPostingInviteRoutes from '@/routes/support/job.posting.invite.routes';
import supportJobPostingRecommendationRoutes from '@/routes/support/job.posting.recommendation.routes';
import supportCandidateRecommendationRoutes from '@/routes/support/candidate.recommendations.routes';
import tourGuidanceRoutes from './routes/tour/tour.guidance.routes';
import jobPostingRecruiterAssignmentRoutes from '@/routes/support/job.posting.recruiter.assignment.routes';
import candidateImportRoutes from '@/routes/client/candidate.import.routes';
import supportInvitationImportRoutes from '@/routes/support/invitation.import.routes';
import supportTicketRoutes from '@/routes/support-ticket/support-ticket.routes';
import clientSupportTicketRoutes from './routes/support-ticket/client-support-ticket.routes';
import candidateSupportTicketRoutes from './routes/support-ticket/candidate-support-ticket.routes';
import slaPolicyRoutes from '@/routes/support-ticket/sla-policy.routes';
import accountManagerTicketRoutes from './routes/support-ticket/account-manager-ticket.routes';
import supportTicketActivityRoutes from './routes/support-ticket/support-ticket-activity.routes';
import clientResumeViewRoutes from '@/routes/client/resume.view.routes';
import clientCandidatesRoutes from '@/routes/client/candidates.routes';
import clientMcpClientRoutes from '@/routes/client/mcp.client.routes';
import { createMcpRouter, initializeMcpServer } from '@/mcp';
import { createA2ARouter, createAgentCardRouter } from '@/a2a';

const app = express();

// Initialize MCP Server
initializeMcpServer();

// Initialize error monitoring
ErrorMonitoringService.getInstance();

// Initialize Sentry
const sentryService = new SentryService();

// Group middleware by function
const setupMiddleware = (app: express.Application) => {
  // Security
  app.use(requestId);
  setupSecurityHeaders(app as express.Express);
  app.use(corsMiddleware as RequestHandler);

  // Performance
  app.use(compressionMiddleware);
  if (ENV.API_DELAY_MS > 0) {
    app.use(addDelay);
  }

  // Global JSON middleware with special handling for webhooks
  app.use((req, res, next) => {
    if (req.path === '/api/stripe/webhook') {
      // Skip JSON parsing for Stripe webhooks - handled by route-specific middleware
      // Stripe requires express.raw() for signature verification
      next();
    } else if (req.path === '/api/livekit/webhook') {
      // For LiveKit webhooks: preserve raw body for signature verification
      // Store raw body before JSON parsing
      let rawBody = '';
      req.on('data', (chunk) => {
        rawBody += chunk.toString();
      });
      req.on('end', () => {
        (req as any).rawBody = rawBody;
        // Parse JSON manually after storing raw body
        try {
          req.body = rawBody ? JSON.parse(rawBody) : {};
        } catch (_err) {
          req.body = {};
        }
        next();
      });
    } else {
      // Use JSON parsing for all other routes
      express.json({ limit: '50mb' })(req, res, next);
    }
  });

  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Monitoring
  app.use(loggingMiddleware);
  app.use(metricsMiddleware);
};

setupMiddleware(app);

// Routes
app.get('/', (_req, res) => {
  res.json({ message: `🚀 Hello from ${ENV.APP_NAME}` });
});

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// Debug Sentry endpoint for testing
app.get('/debug-sentry', (_req, _res) => {
  throw new Error('My first Sentry error!');
});

// Auth routes
app.use('/api/auth', authRoutes);

// OAuth routes
app.use('/api/oauth', oauthRoutes);

// OIDC routes (OpenID Connect for Deel SSO Integration)
// Well-known discovery endpoint must be at root level for OIDC compliance
app.use('/', oidcRoutes);
app.use('/api/v1/oidc', oidcRoutes);

/**
 * Client routes
 */

// Client routes
app.use('/api/client', clientRoutes);

// Client user invitation routes
app.use('/api/client/user-invitations', clientUserInvitationRoutes);

// Client user profile routes (for accessing other users' profiles by ID)
app.use('/api/client/user-profile', clientUserProfileRoutes);
app.use('/api/client/user-profile/:clientUserId', clientUserProfileRoutes);

// Client job posting routes
app.use('/api/client/job-postings', clientJobPostingRoutes);

// Client job posting assessment routes
app.use(
  '/api/client/job-posting-assessments',
  clientJobPostingAssessmentRoutes
);

// Client job parsing routes
app.use('/api/client/job-parsing', clientJobParsingRoutes);

// Client candidate recommendation routes
app.use(
  '/api/client/job-posting-recommendations',
  clientJobPostingRecommendationRoutes
);

// Client application routes
app.use('/api/client/applications', clientApplicationRoutes);

// Client candidate shortlist routes
app.use('/api/client/candidate-shortlists', clientCandidateShortlistRoutes);

// Client user routes
app.use('/api/client/users', clientUserRoutes);

// Client profile routes (for client company profile)
app.use('/api/client/profile', clientProfileRoutes);

// Client profile setup routes
app.use('/api/client/profile-setup', clientProfileSetupRoutes);

// Client profile by ID routes (for admin/support purposes)
app.use('/api/client/profile', clientProfileByIdRoutes);

// Client subscription routes
app.use('/api/client/subscription', clientSubscriptionRoutes);

// Common integration routes
app.use('/api/client/integrations/common', integrationCommonRoutes);

// Client integration routes
app.use('/api/client/integrations', clientIntegrationRoutes);

// Client workable integration routes
app.use('/api/client/workable', workableIntegrationRoutes);

// Client indeed integration routes
app.use('/api/client/indeed', indeedIntegrationRoutes);

// Client job panel assessment routes
app.use('/api/client/panel-assessment', clientJobPanelAssessmentRoutes);

// Client job AI assessment invite routes
app.use(
  '/api/client/job-ai-assessment-invites',
  clientJobAiAssessmentInviteRoutes
);

// Client job invite routes
app.use('/api/client/job-invites', clientJobInviteRoutes);

// Client resume view routes
app.use('/api/client/resume', clientResumeViewRoutes);

// Client admin analytics routes
app.use('/api/client/admin/analytics', clientAdminAnalyticsRoutes);

// Client candidate import routes
app.use('/api/client/candidate-import', candidateImportRoutes);

// Client candidates routes (for onboarding assessment video chunks)
app.use('/api/client/candidates', clientCandidatesRoutes);

// Client MCP client management routes
app.use('/api/client/mcp-clients', clientMcpClientRoutes);

/**
 * Demo routes (public endpoints for AI interviewer demo)
 */
app.use('/api/demo', demoRoutes);

/**
 * Partner routes
 */

// Partner routes
app.use('/api/partner', partnerRoutes);

// Partner user routes
app.use('/api/partner/users', partnerUserRoutes);

// Partner profile routes
app.use('/api/partner/profile', partnerProfileRoutes);

// Partner profile setup routes
app.use('/api/partner/profile-setup', partnerProfileSetupRoutes);

// Partner profile by ID routes (for admin/support purposes)
app.use('/api/partner/profile', partnerProfileByIdRoutes);

// Partner user invitation routes
app.use('/api/partner/user-invitations', partnerUserInvitationRoutes);

// Partner user profile routes
app.use('/api/partner/user-profile', partnerUserProfileRoutes);
app.use('/api/partner/user-profile/:partnerUserId', partnerUserProfileRoutes);

// Partner candidate routes
app.use('/api/partner/candidates', partnerCandidateRoutes);

// Partner job posting routes
app.use('/api/partner/job-postings', partnerJobPostingRoutes);

// Partner job application routes
app.use('/api/partner/job-applications', partnerJobApplicationRoutes);

/**
 * Candidate routes
 */

// Candidate profile routes
app.use('/api/candidate/profile', candidateProfileRoutes);

// Public candidate profile and resume route (no auth)
app.use('/api/candidate/profile/public', candidateProfilePublicRoutes);

// Public practice assessment routes (no auth required for creation/getting)
app.use('/api/public/practice-assessments', publicPracticeAssessmentRoutes);

// MCP Interview public routes (for candidate acceptance/decline)
app.use('/api/public/interviews', mcpInterviewPublicRoutes);

// Candidate profile by ID routes (for admin/support purposes)
app.use('/api/candidate/profile', candidateProfileByIdRoutes);

// Candidate resume routes
app.use('/api/candidate/resume', candidateResumeRoutes);

// Candidate recommendation routes
app.use(
  '/api/candidate/:candidateId/recommendations',
  candidateRecommendationRoutes
);

// Candidate resume parsing routes
app.use('/api/candidate/resume/parsing', candidateResumeParsingRoutes);

// Candidate resume assessment routes
app.use('/api/candidate/resume/assessment', candidateResumeAssessmentRoutes);

// Candidate subscription routes
app.use('/api/candidate/subscription', candidateSubscriptionRoutes);

// Candidate application routes
app.use('/api/candidate/applications', candidateApplicationRoutes);

// Candidate job posting routes
app.use('/api/candidate/job-postings', candidateJobPostingRoutes);

// Candidate profile settings routes
app.use('/api/candidate/settings', candidateProfileSettingsRoutes);
// Candidate onboarding assessment routes
app.use(
  '/api/candidate/onboarding-assessments',
  candidateOnboardingAssessmentRoutes
);

// Candidate job assessment routes
app.use('/api/candidate/job-ai-assessments', candidateJobAiAssessmentRoutes);

// Candidate job assessment invite routes
app.use(
  '/api/candidate/job-assessment-invites',
  candidateJobAssessmentInviteRoutes
);

// Candidate panel assessment routes
app.use('/api/candidate/panel-assessment', candidatePanelAssessmentRoutes);

// Candidate practice assessments routes (authenticated)
app.use(
  '/api/candidate/practice-assessments',
  candidatePracticeAssessmentsRouter
);

// Candidate signup routes
app.use('/api/candidate', candidateRoutes);

/**
 * Support routes
 */

// Admin routes
app.use('/api/support', adminRoutes);

// Support ticket activity routes
app.use('/api/support-tickets/', supportTicketActivityRoutes);
// Client support ticket routes (specific routes must come before general routes)
app.use('/api/support-tickets/client', clientSupportTicketRoutes);

// Candidate support ticket routes
app.use('/api/support-tickets/candidates', candidateSupportTicketRoutes);

// Account manager ticket routes
app.use('/api/support-tickets/account-manager', accountManagerTicketRoutes);

// SLA Policy routes
app.use('/api/support-tickets/sla-policies', slaPolicyRoutes);

// Support ticket routes (general route must come last)
app.use('/api/support-tickets', supportTicketRoutes);

// Support routes
app.use('/api/support/users', supportUserRoutes);
app.use('/api/support/platform-users', supportPlatformUserRoutes);
app.use('/api/support/invitations', supportInvitationRoutes);
app.use('/api/support/clients', supportClientRoutes);
app.use('/api/support/job-posting-invites', supportJobPostingInviteRoutes);
app.use(
  '/api/support/candidate-recommendations',
  supportCandidateRecommendationRoutes
);

// Support partners routes
app.use('/api/support/partners', supportPartnersRoutes);

// Support lookup routes
app.use('/api/support/lookups', supportLookupRoutes);
app.use('/api/support/candidates', supportCandidatesRoutes);
app.use('/api/support/candidates', supportCandidatesReminderRoutes);
app.use('/api/support/kpis', supportKpisRoutes);
app.use('/api/support/impersonation', supportImpersonationRoutes);

// Support applications routes
app.use('/api/support/applications', supportApplicationRoutes);

// Support invitation import routes
app.use('/api/support/invitation-import', supportInvitationImportRoutes);

// Support onboarding assessment settings routes
app.use(
  '/api/support/onboarding-assessment-settings',
  supportOnboardingAssessmentSettingsRoutes
);

// Support practice assessment settings routes
app.use(
  '/api/support/practice-assessment-settings',
  supportPracticeAssessmentSettingsRoutes
);

// Support onboarding assessment global settings routes
app.use(
  '/api/support/onboarding-assessment-global-settings',
  supportOnboardingAssessmentGlobalSettingsRoutes
);

// Support job AI assessment global settings routes
app.use(
  '/api/support/job-ai-assessment-global-settings',
  supportJobAiAssessmentGlobalSettingsRoutes
);

// Support global settings routes
app.use('/api/support/global-settings', supportGlobalSettingsRoutes);

// Support feature flag routes (for dynamic feature management)
app.use('/api/support/feature-flags', supportFeatureFlagRoutes);

// Support tour definition management routes
app.use('/api/support/tour-definitions', supportTourDefinitionManagementRoutes);

// Support Deel configuration routes (for managing Deel SSO for clients)
app.use('/api/support/deel', supportDeelConfigurationRoutes);

// Stripe routes with proper webhook handling
app.use(
  '/api/stripe',
  (req, res, next) => {
    if (req.path === '/webhook') {
      // Use raw body middleware for webhook signature verification
      // This is required for Stripe webhook signature validation
      express.raw({ type: 'application/json' })(req, res, next);
    } else {
      // For non-webhook routes, use JSON parsing middleware
      express.json()(req, res, next);
    }
  },
  stripeRoutes
);

// Search routes
app.use('/api/search', searchRoutes);

// Activity log routes
app.use('/api/activity', activityRoutes);

// Document management routes (common across all entity types)
app.use('/api/documents', documentRoutes);

// Location routes
app.use('/api/locations', locationRoutes);

// Local storage routes (for local storage)
app.use('/api/local/uploads', localUploadsRoutes);

// Account manager assignment routes
app.use(
  '/api/support/account-manager-assignment',
  accountManagerAssignmentRoutes
);

// Client account manager routes
app.use('/api/account-manager', clientAccountManagerRoutes);

// Job posting recruiter assignment routes
app.use(
  '/api/support/job-postings/recruiter-assignments',
  jobPostingRecruiterAssignmentRoutes
);

/**
 * Cron routes
 */

// Add RAG cron routes
app.use('/api/cron/rag', ragCronRoutes);

// Add feedback email cron routes
app.use('/api/cron/feedback-email', feedbackEmailCronRoutes);

// Add subscription expiry cron routes
app.use('/api/cron/subscription-expiry-cron', subscriptionExpiryCronRoutes);

// Add daily stats cron routes
app.use('/api/cron/daily-stats', dailyStatsCronRoutes);

// Add daily digest cron routes
app.use('/api/cron/daily-digest', dailyDigestCronRoutes);

/**
 * Tour Guidance routes
 */
app.use('/api/tours', tourGuidanceRoutes);
// Add candidate recommendation cron routes
app.use(
  '/api/cron/candidate-recommendation',
  candidateRecommendationCronRoutes
);

// Add support job posting routes
app.use('/api/support/job-postings', supportJobPostingRoutes);

// Add support job posting recommendation routes
app.use('/api/support/job-postings', supportJobPostingRecommendationRoutes);

// Add job recommendation cron routes
app.use('/api/cron/job-recommendation', jobRecommendationCronRoutes);

// Feature flag schedule cron (process due enable/disable at time)
app.use('/api/cron/feature-flag-schedules', featureFlagScheduleCronRoutes);

// Move monitoring routes before error handler
app.use('/api/monitoring', monitoringRoutes);

if (ENV.ENABLE_BULLMQ_DASHBOARD) {
  // Bull Board Queue Monitoring Dashboard with Basic Auth protection
  const bullBoardService = new BullBoardService();
  app.use('/admin/queues', BullMQBasicAuth, bullBoardService.getRouter());
}

// Voice routes
app.use('/api/voice', voiceRoutes);

// LiveKit routes
app.use('/api/livekit', liveKitRoutes);

// Move Swagger docs before error handler
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    body { margin: 0; padding: 0; }
    html { margin: 0; padding: 0; }
    .swagger-ui { padding-top: 0 !important; }
    body > svg[style*="position:absolute"] {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
  `,
  customSiteTitle: `${ENV.APP_NAME} API Documentation`,
};

// Add Swagger documentation route at root level
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs, swaggerOptions));

// Add route to serve Swagger documentation in JSON format
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Add MCP documentation route
app.use('/api-mcp', mcpRoutes);

// MCP Server routes (Model Context Protocol for AI agent integration)
app.use('/api/mcp', createMcpRouter());

// A2A Server routes (Agent-to-Agent Protocol for agent interoperability)
app.use('/api/a2a', createA2ARouter());

// A2A Agent Card discovery endpoint (standard location)
app.use('/.well-known', createAgentCardRouter());

// A2A Demo Page (for demonstrating A2A protocol)
app.get('/a2a-demo', (_req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data: https:",
      "connect-src 'self'",
    ].join('; ')
  );
  res.sendFile('a2a-demo.html', { root: './public' });
});

// Cache middleware should be before error handler
app.use('/api/users', cache({ duration: 300 }));

// Monitoring routes
app.use('/monitoring', monitoringRoutes);

// Not found handler should be before error handler
app.use(notFoundHandler);

// Setup Sentry Express error handler before custom error handler
sentryService.setupExpressErrorHandler(app);

// Error Handler should be last
const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  return errorHandler(err, req, res, next);
};

app.use(errorMiddleware);

export default app;
