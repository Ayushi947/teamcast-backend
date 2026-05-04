import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';
import { support_department, support_level } from '@prisma/client';

export const seedSupportUsers = async (supportUsers: any[]) => {
  try {
    logger.info('Starting support user seed...');

    // Clear existing support users
    await prisma.support_user.deleteMany();

    // Create support users
    const supportUserMappings = await Promise.all(
      supportUsers.map(async (user) => {
        return prisma.support_user.create({
          data: {
            userId: user.id,
            department: faker.helpers.arrayElement(
              Object.values(support_department)
            ),
            supportLevel: faker.helpers.arrayElement(
              Object.values(support_level)
            ),
            settings: {
              create: {
                notificationsEnabled: true,
                emailNotifications: true,
                pushNotifications: true,
                darkMode: faker.datatype.boolean(),
                language: 'en',
                timezone: 'UTC',
              },
            },
          },
        });
      })
    );

    logger.info(
      `Created ${supportUserMappings.length} support users successfully`
    );
    return supportUserMappings;
  } catch (error) {
    logger.error('Error seeding support users:', error);
    throw error;
  }
};

// Function to seed all types of support users
export const seedAllSupportUsers = async (supportUsersData: {
  supportAdminUsers: any[];
  supportAccountManagerUsers: any[];
  supportRecruiterUsers: any[];
  supportHrUsers: any[];
  supportAccountsUsers: any[];
}) => {
  try {
    logger.info('Starting all support users seed...');

    // Clear existing support users and their assignments
    await prisma.support_user_account_manager_assignment.deleteMany();
    await prisma.support_user.deleteMany();

    // Combine all support users
    const allSupportUsers = [
      ...supportUsersData.supportAdminUsers,
      ...supportUsersData.supportAccountManagerUsers,
      ...supportUsersData.supportRecruiterUsers,
      ...supportUsersData.supportHrUsers,
      ...supportUsersData.supportAccountsUsers,
    ];

    // Create support users
    const supportUserMappings = await Promise.all(
      allSupportUsers.map(async (user) => {
        return prisma.support_user.create({
          data: {
            userId: user.id,
            department: faker.helpers.arrayElement(
              Object.values(support_department)
            ),
            supportLevel: faker.helpers.arrayElement(
              Object.values(support_level)
            ),
            settings: {
              create: {
                notificationsEnabled: true,
                emailNotifications: true,
                pushNotifications: true,
                darkMode: faker.datatype.boolean(),
                language: 'en',
                timezone: 'UTC',
              },
            },
          },
        });
      })
    );

    logger.info(
      `Created ${supportUserMappings.length} support users successfully`
    );

    // Assign recruiters to account managers (round-robin assignment)
    const recruiterUsers = supportUserMappings.filter((supportUser) => {
      const originalUserIndex = allSupportUsers.findIndex(
        (u) => u.id === supportUser.userId
      );
      return (
        originalUserIndex >=
          supportUsersData.supportAdminUsers.length +
            supportUsersData.supportAccountManagerUsers.length &&
        originalUserIndex <
          supportUsersData.supportAdminUsers.length +
            supportUsersData.supportAccountManagerUsers.length +
            supportUsersData.supportRecruiterUsers.length
      );
    });

    // Get the account manager support_user records (not the original user records)
    const accountManagerSupportUsers = supportUserMappings.filter(
      (supportUser) => {
        const originalUserIndex = allSupportUsers.findIndex(
          (u) => u.id === supportUser.userId
        );
        return (
          originalUserIndex >= supportUsersData.supportAdminUsers.length &&
          originalUserIndex <
            supportUsersData.supportAdminUsers.length +
              supportUsersData.supportAccountManagerUsers.length
        );
      }
    );

    if (recruiterUsers.length > 0 && accountManagerSupportUsers.length > 0) {
      // Create assignments with upsert to avoid duplicates
      const accountManagerAssignments = await Promise.all(
        recruiterUsers.map(async (recruiter, index) => {
          const accountManager =
            accountManagerSupportUsers[
              index % accountManagerSupportUsers.length
            ];

          return prisma.support_user_account_manager_assignment.upsert({
            where: {
              supportUserId: recruiter.id, // This ensures uniqueness per support user
            },
            update: {
              accountManagerId: accountManager.id,
            },
            create: {
              supportUserId: recruiter.id,
              accountManagerId: accountManager.id,
            },
          });
        })
      );

      logger.info(
        `Created ${accountManagerAssignments.length} recruiter account manager assignments successfully`
      );

      // Log recruiter assignments for testing
      logger.info('=== RECRUITER ACCOUNT MANAGER ASSIGNMENTS ===');
      recruiterUsers.forEach((_recruiter, index) => {
        const _accountManager =
          accountManagerSupportUsers[index % accountManagerSupportUsers.length];
        const originalRecruiterUser =
          supportUsersData.supportRecruiterUsers[index];
        const originalAccountManagerUser =
          supportUsersData.supportAccountManagerUsers[
            index % supportUsersData.supportAccountManagerUsers.length
          ];
        logger.info(
          `${index + 1}. ${originalRecruiterUser.email} → ${originalAccountManagerUser.email}`
        );
      });
      logger.info('=============================================');
    }

    return supportUserMappings;
  } catch (error) {
    logger.error('Error seeding all support users:', error);
    throw error;
  }
};
