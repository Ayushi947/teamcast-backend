import { faker } from '@faker-js/faker';
import { logger } from '../../src/shared/utils/logger';
import { prisma } from './prisma.client';
import { CandidateProfileSettingsService } from '../../src/services/candidate/profile.settings.service';

export const seedPartnerResourceUsers = async (
  partnerResourceUsers: any[],
  partners: any[]
) => {
  try {
    logger.info('Starting partner resource user seed...');

    // Check if partners array is empty
    if (!partners || partners.length === 0) {
      logger.warn(
        'No partners available for partner resource users. Skipping partner resource user creation.'
      );
      return [];
    }

    // Clear existing partner resource users (both partner_user and candidate records)
    await prisma.partner_user.deleteMany({
      where: {
        user: {
          role: 'PARTNER_RESOURCE',
        },
      },
    });

    await prisma.candidate.deleteMany({
      where: {
        user: {
          role: 'PARTNER_RESOURCE',
        },
      },
    });

    // Create partner resource users with both partner_user and candidate records
    const partnerResourceMappings = await Promise.all(
      partnerResourceUsers.map(async (user, index) => {
        const partner = partners[index % partners.length];

        // Use the same pattern as partner user invitation service
        const candidateProfileSettingsService =
          new CandidateProfileSettingsService();

        // Create partner_user record first
        const partnerUser = await prisma.partner_user.create({
          data: {
            userId: user.id,
            partnerId: partner.id,
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

        // Create candidate record (following the same pattern as partner user invitation service)
        const candidate = await prisma.candidate.create({
          data: {
            userId: user.id,
            status: 'NEW',
            jobSearchStatus: 'OPEN_TO_OPPORTUNITIES',
            isPublished: false,
            completionPercentage: 0,
            partnerId: partner.id, // Link to the same partner
          },
        });

        // Create candidate settings using the same pattern as invitation service
        const defaultSettings =
          await candidateProfileSettingsService.getDefaultSettings(
            candidate.id
          );
        await prisma.candidate_settings.create({
          data: {
            candidateId: candidate.id,
            globalSettingsId: defaultSettings.globalSettingsId,
            notificationsEnabled: defaultSettings.notificationsEnabled,
            emailNotifications: defaultSettings.emailNotifications,
            pushNotifications: defaultSettings.pushNotifications,
            jobAlerts: defaultSettings.jobAlerts,
            applicationUpdates: defaultSettings.applicationUpdates,
            profileVisibility: defaultSettings.profileVisibility,
            shareDataWithEmployers: defaultSettings.shareDataWithEmployers,
            darkMode: defaultSettings.darkMode,
            language: defaultSettings.language,
            timezone: defaultSettings.timezone,
            preferredCommunicationChannel:
              defaultSettings.preferredCommunicationChannel,
          },
        });

        // Create candidate subscription using default package (same as invitation service)
        const defaultPackage =
          await prisma.candidate_subscription_package.findFirst({
            where: { isDefault: true, isActive: true },
          });
        if (defaultPackage) {
          await prisma.candidate_subscription.create({
            data: {
              candidateId: candidate.id,
              packageId: defaultPackage.id,
              paymentProviderCustomerId: null,
              status: 'ACTIVE',
              startDate: new Date(),
              autoRenew: true,
              practiceAssessmentsUsed: 0,
              paymentProvider: defaultPackage.paymentProvider,
              lastBillingDate: new Date(),
            },
          });
        }

        // Create basic resume (same as invitation service)
        await prisma.resume.create({
          data: {
            candidateId: candidate.id,
            phone: '',
            location: '',
            summary: '',
            primaryIndustry: '',
            totalExperience: 0,
            currentJobTitle: '',
            currentCompany: '',
            currentIndustry: '',
            currentWorkLocation: '',
            currentWorkType: null,
            currentWorkCommitment: null,
            currentWorkSchedule: null,
            currentSalary: 0,
            currentSalaryCurrency: 'USD',
            availableFrom: null,
            noticePeriod: null,
            highestEducationLevel: 'BACHELORS',
          },
        });

        return {
          partnerUser,
          candidate,
          user,
        };
      })
    );

    logger.info(
      `Created ${partnerResourceMappings.length} partner resource users successfully (with both partner_user and candidate records)`
    );
    return partnerResourceMappings;
  } catch (error) {
    logger.error('Error seeding partner resource users:', error);
    throw error;
  }
};
