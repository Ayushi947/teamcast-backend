import { user_type, user_role, user_status } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { hashPassword } from '../../src/utils/password';

import { prisma } from './prisma.client';

// Helper function to get appropriate role based on user type
const getRoleForUserType = (type: user_type): user_role => {
  switch (type) {
    case user_type.SUPPORT:
      return faker.helpers.arrayElement([
        user_role.ADMIN,
        user_role.ACCOUNT_MANAGER,
      ]);
    case user_type.CLIENT:
      return faker.helpers.arrayElement([
        user_role.HR,
        user_role.RECRUITER,
        user_role.ACCOUNTS,
      ]);
    case user_type.PARTNER:
      return faker.helpers.arrayElement([user_role.HR, user_role.ACCOUNTS]);
    case user_type.CANDIDATE:
    default:
      return user_role.INDIVIDUAL;
  }
};

// Helper function to generate a random job title
const getRandomJobTitle = (type: user_type, role?: user_role): string => {
  // Special case for partner resource users
  if (type === user_type.PARTNER && role === user_role.PARTNER_RESOURCE) {
    return faker.person.jobTitle();
  }

  switch (type) {
    case user_type.CLIENT:
      return faker.helpers.arrayElement([
        'HR Manager',
        'Talent Acquisition Specialist',
        'Recruitment Manager',
        'HR Director',
        'Talent Manager',
      ]);
    case user_type.PARTNER:
      return faker.helpers.arrayElement([
        'Partner Manager',
        'Resource Manager',
        'Partner Relations',
        'Partner Success Manager',
      ]);
    case user_type.SUPPORT:
      return faker.helpers.arrayElement([
        'Support Manager',
        'System Administrator',
        'Customer Success Manager',
        'Technical Support Lead',
      ]);
    case user_type.CANDIDATE:
    default:
      return faker.person.jobTitle();
  }
};

// Function to create a single user in database
const createUser = async (type: user_type, role: user_role) => {
  const name = faker.person.fullName();
  const email = faker.internet.email();
  const password = 'Password123!';

  // Determine profileSetup value based on user type and role
  // For client and partner admin users, profileSetup should be false to require setup
  // For partner resource users, profileSetup should be true (they are essentially candidates)
  // For other users, profileSetup should be true (already completed)
  const shouldRequireProfileSetup =
    (type === user_type.CLIENT && role === user_role.ADMIN) ||
    (type === user_type.PARTNER && role === user_role.ADMIN);

  logger.debug(`Created/found user: ${email} with password: ${password}`);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      type,
      role,
      status: faker.helpers.arrayElement(Object.values(user_status)),
      jobTitle: getRandomJobTitle(type, role),
      emailVerified: new Date(),
      image: faker.image.avatar(),
      profileSetup: shouldRequireProfileSetup ? false : true,
    },
  });

  return user;
};

export const seedSpecificUsers = async (
  role: user_role,
  type: user_type,
  count: number
) => {
  try {
    logger.info('Starting user seed...');

    // Clear existing users
    await prisma.user.deleteMany();

    // Create users
    const users = await Promise.all(
      Array.from({ length: count }, () => createUser(type, role))
    );

    logger.info(`Created ${users.length} users successfully`);
    return users;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};

// Function to clear all user-related data in correct order to avoid foreign key constraints
const clearUserRelatedData = async () => {
  try {
    logger.info('Clearing existing user-related data...');

    // Delete records that reference users (in order of dependency)
    // 1. First delete partner user invitations (they reference users via createdById)
    await prisma.partner_user_invitation.deleteMany();
    logger.info('Cleared partner user invitations');

    // 2. Delete support invitations (they reference users via createdById)
    await prisma.support_invitation.deleteMany();
    logger.info('Cleared support invitations');

    // 3. Delete activity logs (they reference users)
    await prisma.activity_log.deleteMany();
    logger.info('Cleared activity logs');

    // 4. Delete client user invitations if they exist and reference users
    await prisma.client_user_invitation.deleteMany();
    logger.info('Cleared client user invitations');

    // 5. Delete candidate settings (cascade through candidate -> user)
    await prisma.candidate_settings.deleteMany();
    logger.info('Cleared candidate settings');

    // 6. Delete client user settings (cascade through client_user -> user)
    await prisma.client_user_settings.deleteMany();
    logger.info('Cleared client user settings');

    // 7. Delete partner user settings (cascade through partner_user -> user)
    await prisma.partner_user_settings.deleteMany();
    logger.info('Cleared partner user settings');

    // 8. Delete support user settings (cascade through support_user -> user)
    await prisma.support_user_settings.deleteMany();
    logger.info('Cleared support user settings');

    // 9. Delete candidate subscriptions (cascade through candidate -> user)
    await prisma.candidate_subscription.deleteMany();
    logger.info('Cleared candidate subscriptions');

    // 10. Delete client subscriptions (cascade through client -> user)
    await prisma.client_subscription.deleteMany();
    logger.info('Cleared client subscriptions');

    // 11. Delete job applications (cascade through candidate -> user)
    await prisma.job_application.deleteMany();
    logger.info('Cleared job applications');

    // 12. Delete job recommendations (cascade through candidate -> user)
    await prisma.job_posting_recommendation.deleteMany();
    logger.info('Cleared job recommendations');

    // 13. Delete candidate recommendations (cascade through candidate -> user)
    await prisma.candidate_recommendation.deleteMany();
    logger.info('Cleared candidate recommendations');

    // 14. Delete candidate saved jobs (cascade through candidate -> user)
    await prisma.candidate_saved_job.deleteMany();
    logger.info('Cleared candidate saved jobs');

    // 15. Delete candidate views (cascade through candidate -> user)
    await prisma.candidate_view.deleteMany();
    logger.info('Cleared candidate views');

    // 16. Delete job assessment invitations (cascade through candidate -> user)
    await prisma.job_ai_assessment_invitation.deleteMany();
    logger.info('Cleared job assessment invitations');

    // 17. Delete job ai assessments (cascade through candidate -> user)
    await prisma.job_ai_assessment.deleteMany();
    logger.info('Cleared job ai assessments');

    // 18. Delete practice assessments (cascade through candidate -> user)
    await prisma.practice_assessment.deleteMany();
    logger.info('Cleared practice assessments');

    // 19. Delete onboarding assessments (cascade through candidate -> user)
    await prisma.onboarding_assessment.deleteMany();
    logger.info('Cleared onboarding assessments');

    // 20. Delete resume assessments (cascade through candidate -> user)
    await prisma.resume_assessment.deleteMany();
    logger.info('Cleared resume assessments');

    // 21. Delete resumes (cascade through candidate -> user)
    await prisma.resume.deleteMany();
    logger.info('Cleared resumes');

    // 22. Delete job postings (created by client users)
    await prisma.job_posting.deleteMany();
    logger.info('Cleared job postings');

    // 23. Delete candidates (they reference users)
    await prisma.candidate.deleteMany();
    logger.info('Cleared candidates');

    // 24. Delete client users (they reference users)
    await prisma.client_user.deleteMany();
    logger.info('Cleared client users');

    // 25. Delete partner users (they reference users)
    await prisma.partner_user.deleteMany();
    logger.info('Cleared partner users');

    // 26.5. Delete support invitations (they reference support users via createdById)
    await prisma.support_invitation.deleteMany();
    logger.info('Cleared support invitations');

    // 27. Delete support users (they reference users)
    await prisma.support_user.deleteMany();
    logger.info('Cleared support users');

    logger.info('Successfully cleared all user-related data');
  } catch (error) {
    logger.error('Error clearing user-related data:', error);
    throw error;
  }
};

// Function to seed users
export const seedUsers = async () => {
  try {
    logger.info('Starting user seed...');

    // Clear existing user-related data first
    await clearUserRelatedData();

    // Clear existing users
    await prisma.user.deleteMany();
    logger.info('Cleared existing users');

    // Create users
    const clientUsers = await Promise.all(
      Array.from({ length: 20 }, () =>
        createUser(user_type.CLIENT, getRoleForUserType(user_type.CLIENT))
      )
    );

    const partnerUsers = await Promise.all(
      Array.from({ length: 20 }, () =>
        createUser(user_type.PARTNER, getRoleForUserType(user_type.PARTNER))
      )
    );

    const partnerResourceUsers = await Promise.all(
      Array.from({ length: 20 }, () =>
        createUser(user_type.PARTNER, user_role.PARTNER_RESOURCE)
      )
    );

    // Create support users with different roles
    const supportAdminUsers = await Promise.all(
      Array.from({ length: 8 }, () =>
        createUser(user_type.SUPPORT, user_role.ADMIN)
      )
    );

    const supportAccountManagerUsers = await Promise.all(
      Array.from({ length: 5 }, () =>
        createUser(user_type.SUPPORT, user_role.ACCOUNT_MANAGER)
      )
    );

    const supportRecruiterUsers = await Promise.all(
      Array.from({ length: 6 }, () =>
        createUser(user_type.SUPPORT, user_role.RECRUITER)
      )
    );

    const supportHrUsers = await Promise.all(
      Array.from({ length: 4 }, () =>
        createUser(user_type.SUPPORT, user_role.HR)
      )
    );

    const supportAccountsUsers = await Promise.all(
      Array.from({ length: 3 }, () =>
        createUser(user_type.SUPPORT, user_role.ACCOUNTS)
      )
    );

    const candidateUsers = await Promise.all(
      Array.from({ length: 50 }, () =>
        createUser(user_type.CANDIDATE, getRoleForUserType(user_type.CANDIDATE))
      )
    );

    logger.info(`Created ${clientUsers.length} client users successfully`);
    logger.info(`Created ${partnerUsers.length} partner users successfully`);
    logger.info(
      `Created ${partnerResourceUsers.length} partner resource users successfully`
    );
    logger.info(
      `Created ${supportAdminUsers.length} support admin users successfully`
    );
    logger.info(
      `Created ${supportAccountManagerUsers.length} support account manager users successfully`
    );
    logger.info(
      `Created ${supportRecruiterUsers.length} support recruiter users successfully`
    );
    logger.info(
      `Created ${supportHrUsers.length} support HR users successfully`
    );
    logger.info(
      `Created ${supportAccountsUsers.length} support accounts users successfully`
    );
    logger.info(
      `Created ${candidateUsers.length} candidate users successfully`
    );

    // Log sample credentials for testing
    logger.info('=== SAMPLE TEST CREDENTIALS ===');
    logger.info('All users have password: Password123!');
    logger.info('Sample emails:');
    logger.info(`- Client: ${clientUsers[0]?.email}`);
    logger.info(`- Partner: ${partnerUsers[0]?.email}`);
    logger.info(`- Candidate: ${candidateUsers[0]?.email}`);
    logger.info(`- Support Admin: ${supportAdminUsers[0]?.email}`);
    logger.info(
      `- Support Account Manager: ${supportAccountManagerUsers[0]?.email}`
    );
    logger.info(`- Support Recruiter: ${supportRecruiterUsers[0]?.email}`);
    logger.info(`- Support HR: ${supportHrUsers[0]?.email}`);
    logger.info(`- Support Accounts: ${supportAccountsUsers[0]?.email}`);
    logger.info('===============================');

    return {
      clientUsers,
      partnerUsers,
      partnerResourceUsers,
      supportAdminUsers,
      supportAccountManagerUsers,
      supportRecruiterUsers,
      supportHrUsers,
      supportAccountsUsers,
      candidateUsers,
    };
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};
