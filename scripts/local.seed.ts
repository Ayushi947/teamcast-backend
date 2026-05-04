import { seedClientUsers } from './local.seed/client.user.seed';
import { seedCandidateUsers } from './local.seed/candidate.user.seed';
import { seedClientSubscriptionPackages } from './local.seed/client.subscription.packages';
import { seedCandidateSubscriptionPackages } from './local.seed/candidate.subscription.packages';
import { seedResumeAssessments } from './local.seed/resume.assessment.seed';
import { seedOnboardingAssessments } from './local.seed/onboarding.assessment.seed';
import { seedJobAiAssessments } from './local.seed/job.ai.assessment.seed';
import { logger } from '../src/shared/utils/logger';
import { seedUsers } from './local.seed/user.seed';
import { seedCompanies } from './local.seed/company.seed';
import { seedPartners } from './local.seed/partner.seed';
import { seedClients } from './local.seed/client.seed';
import { seedPartnerUsers } from './local.seed/partner.user.seed';
import { seedPartnerResourceUsers } from './local.seed/partner.resource.user.seed';
import { seedCandidateResumes } from './local.seed/candidate.resume.seed';
import { seedJobPostings } from './local.seed/job.posting.seed';
import { seedJobApplications } from './local.seed/job.application.seed';
import { seedJobRecommendations } from './local.seed/job.recommendation.seed';
import { seedCandidateRecommendations } from './local.seed/candidate.recommendation.seed';
import { seedGlobalSettings } from './local.seed/global.settings.seed';
import { seedAllSupportUsers } from './local.seed/support.user.seed';
import { createPageSpecificOnboardingTours } from './local.seed/page-specific-candidate-onboarding-tour';

import { seedIntegrationProviders } from './local.seed/integration.providers.seed';
import { migrateLookups } from './shared/migrate-lookups';
import { seedSlaPolicies } from './add-sla-policy';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seed = async () => {
  try {
    logger.info('Starting development seed...');

    // Clear impersonation sessions
    await prisma.support_impersonation_session.deleteMany();
    logger.info('Cleared support_impersonation_session table');

    // Migrate lookups first
    await migrateLookups(prisma);

    // Seed integration providers
    await seedIntegrationProviders();

    // Seed global settings
    const globalSettings = await seedGlobalSettings();

    // Seed users first
    const users = await seedUsers();

    // Seed all support users (admin, account manager, recruiter, hr, accounts)
    const supportUsers = await seedAllSupportUsers(users);

    // Seed subscription packages
    const clientSubscriptionPackages = await seedClientSubscriptionPackages();
    const candidateSubscriptionPackages =
      await seedCandidateSubscriptionPackages();

    const companies = await seedCompanies();

    // Seed partners and partner users and partner resource users
    const partners = await seedPartners(companies.partnerCompanies);
    const partnerUsers = await seedPartnerUsers(users.partnerUsers, partners);
    const partnerResourceUsers = await seedPartnerResourceUsers(
      users.partnerResourceUsers,
      partners
    );

    // Seed clients and client users
    const clients = await seedClients(
      companies.clientCompanies,
      clientSubscriptionPackages
    );
    const clientUsers = await seedClientUsers(users.clientUsers, clients);

    // Seed candidate users
    const candidateUsers = await seedCandidateUsers(
      users.candidateUsers,
      candidateSubscriptionPackages,
      partners
    );
    const candidateResumes = await seedCandidateResumes(candidateUsers);

    // Seed assessments
    const resumeAssessments = await seedResumeAssessments(candidateUsers);
    const onboardingAssessments =
      await seedOnboardingAssessments(candidateUsers);

    // Seed job postings and applications
    const jobPostings = await seedJobPostings(clientUsers);

    const jobApplications = await seedJobApplications(
      candidateUsers,
      jobPostings
    );

    // Seed job ai assessments (requires job postings)
    const jobAiAssessments = await seedJobAiAssessments(jobApplications);

    const jobRecommendations = await seedJobRecommendations(
      candidateUsers,
      jobPostings
    );

    const candidateRecommendations = await seedCandidateRecommendations(
      candidateUsers,
      jobPostings
    );

    // Seed page-specific onboarding tours
    const pageSpecificTours = await createPageSpecificOnboardingTours();

    // Seed SLA policies
    await seedSlaPolicies();

    logger.info('Development seed completed successfully');
    // Log summary of seeded data
    logger.info('=== Seed Summary ===');
    logger.info(
      `Global Settings Resume Assessment Settings: ${globalSettings.globalSettings}`
    );
    logger.info(
      `Global Settings AI Assessment Settings: ${globalSettings.jobAiAssessmentSettings}`
    );
    logger.info(
      `Global Settings Onboarding Assessment Settings: ${globalSettings.onboardingSettings}`
    );
    logger.info(
      `Base Users` +
        `- Partner Resource Users: ${users.partnerResourceUsers.length}` +
        `- Candidate Users: ${users.candidateUsers.length}` +
        `- Client Users: ${users.clientUsers.length}` +
        `- Partner Users: ${users.partnerUsers.length}` +
        `- Support Users: ${supportUsers.length}`
    );
    logger.info(`- Clients: ${clients.length}`);
    logger.info(`- Client Users: ${clientUsers.length}`);

    logger.info(`- Partners: ${partners.length}`);
    logger.info(`- Partner Users: ${partnerUsers.length}`);
    logger.info(
      `- Partner Resource Users: ${partnerResourceUsers.length} (with both partner_user and candidate records)`
    );

    logger.info(`- Candidate Users: ${candidateUsers.length}`);
    logger.info(`- Candidate Resumes: ${candidateResumes.length}`);

    logger.info(
      `Subscription Packages: ${clientSubscriptionPackages.length + candidateSubscriptionPackages.length} total`
    );
    logger.info(`- Client Packages: ${clientSubscriptionPackages.length}`);
    logger.info(
      `- Candidate Packages: ${candidateSubscriptionPackages.length}`
    );

    logger.info(
      `Assessments: ${resumeAssessments.length + onboardingAssessments.length + jobAiAssessments.length} total`
    );
    logger.info(`- Resume Assessments: ${resumeAssessments.length}`);
    logger.info(`- Onboarding Assessments: ${onboardingAssessments.length}`);
    logger.info(`- Job AI Assessments: ${jobAiAssessments.length}`);

    logger.info(`- Job Postings: ${jobPostings.length}`);
    logger.info(`- Job Applications: ${jobApplications.length}`);

    logger.info(`- Job Recommendations: ${jobRecommendations.length}`);
    logger.info(
      `- Candidate Recommendations: ${candidateRecommendations.length}`
    );

    logger.info(
      `- Page-Specific Tours: ${pageSpecificTours ? 'Created/Updated' : 'Failed'}`
    );

    logger.info('Development seed completed successfully');
  } catch (error) {
    logger.error('Error during development seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

seed();
