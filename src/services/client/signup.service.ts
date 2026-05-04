import { PrismaClient } from '@prisma/client';
import { AppError } from '@/utils/app.error';
import { logger } from '@/shared/utils/logger';
import { ErrorCode } from '@/utils/error.codes';
import { singleton } from '@/shared/decorators/singleton';
import {
  IClientSignup,
  IClientSignupDone,
} from '@/shared/models/domain/client/signup.domain';
import { getAuthToken } from '@/utils/generate.token';

import { toIAuthUser } from '@/shared/models/domain/auth/auth.user.domain';
import { INotificationProvider } from '../notification/notification.interface';
import { ClientSubscriptionService } from './subscription.service';
import { ClientProfileService } from './profile.service';
import { AccountManagerAssignmentService } from '@/services/support/account.manager.assignment.service';
import { hashPassword } from '@/utils/password';
import { VerifyService } from '@/services/auth/verify.service';
import { formatEmail, formatName } from '@/shared/utils/formatters';

const prisma = new PrismaClient();

@singleton
export class ClientSignupService {
  constructor(
    private readonly notificationProvider: INotificationProvider,
    private readonly subscriptionService: ClientSubscriptionService,
    private readonly clientProfileService: ClientProfileService,
    private readonly accountManagerAssignmentService: AccountManagerAssignmentService,
    private readonly verifyService: VerifyService
  ) {}

  /**
   * Registers a new client with an admin user
   * @param signupData Client signup data
   * @returns Client signup result
   */
  async signup(signupData: IClientSignup): Promise<IClientSignupDone> {
    logger.info('Starting client signup process', {
      email: signupData.email,
      context: 'ClientSignupService.signup',
    });

    // Check if user with this email already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: signupData.email },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 409, ErrorCode.ALREADY_EXISTS);
    }

    // Find default subscription package
    const defaultSubscriptionPackage =
      await prisma.client_subscription_package.findFirst({
        where: { isDefault: true, isActive: true },
      });

    if (!defaultSubscriptionPackage) {
      throw new AppError(
        'No default subscription package found',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Use a transaction to ensure all operations are atomic
    interface SignupTransactionResult {
      id: string;
      name: string;
      email: string;
      keycloakId: string;
      clientUser?: any;
      partnerUser?: any;
      candidate?: any;
      supportUser?: any;
      clientId: string;
    }
    const result = (await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: signupData.companyName,
          contactEmail: signupData.email,
          description: `Company profile for ${signupData.companyName}`,
          companyType: 'ENTERPRISE', // Default value, can be updated by client later
          industry: 'TECHNOLOGY', // Default value, can be updated by client later
          size: 'ONE_TO_TEN', // Default value, can be updated by client later
          stage: 'EARLY_STAGE', // Default value, can be updated by client later
          foundedYear: new Date().getFullYear(),
        },
      });

      // Create client
      const client = await tx.client.create({
        data: {
          companyId: company.id,
        },
      });

      // Create client settings with default values
      const defaultClientSettings =
        await this.clientProfileService.getDefaultSettings(client.id);

      await tx.client_settings.create({
        data: {
          clientId: client.id,
          globalSettingsId: defaultClientSettings.globalSettingsId,
          notificationsEnabled: defaultClientSettings.notificationsEnabled,
          emailNotifications: defaultClientSettings.emailNotifications,
          pushNotifications: defaultClientSettings.pushNotifications,
          jobAlerts: defaultClientSettings.jobAlerts,
          candidateAlerts: defaultClientSettings.candidateAlerts,
          applicationAlerts: defaultClientSettings.applicationAlerts,
        },
      });

      // Create client AI assessment settings with default values
      const defaultAiAssessmentSettings =
        await this.clientProfileService.getDefaultAiAssessmentSettings(
          client.id
        );
      if (!defaultAiAssessmentSettings) {
        throw new AppError(
          'No default AI assessment settings found',
          500,
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      await tx.client_ai_assessment_settings.create({
        data: {
          clientId: client.id,
          globalJobAiAssessmentSettingsId:
            defaultAiAssessmentSettings.globalSettingsId,
          greetingMessage: defaultAiAssessmentSettings.greetingMessage,
          defaultAssessmentDuration:
            defaultAiAssessmentSettings.defaultAssessmentDuration,
          defaultPassingScore: defaultAiAssessmentSettings.defaultPassingScore,
          requiredSections: defaultAiAssessmentSettings.requiredSections,
          maximumAttempts: defaultAiAssessmentSettings.maximumAttempts,
          cooldownPeriod: defaultAiAssessmentSettings.cooldownPeriod,
          maxSections: defaultAiAssessmentSettings.maxSections,
          maxQuestionsPerSection:
            defaultAiAssessmentSettings.maxQuestionsPerSection,
          proctoringEnabled: defaultAiAssessmentSettings.proctoringEnabled,
          maxWarnings: defaultAiAssessmentSettings.maxWarnings,
          tabSwitchLimit: defaultAiAssessmentSettings.tabSwitchLimit,
          copyPasteAllowed: defaultAiAssessmentSettings.copyPasteAllowed,
          videoRecordingEnabled:
            defaultAiAssessmentSettings.videoRecordingEnabled,
          minimumVideoLength: defaultAiAssessmentSettings.minimumVideoLength,
          aiVideoAnalysisEnabled:
            defaultAiAssessmentSettings.aiVideoAnalysisEnabled,
          autoPublishOnSuccess:
            defaultAiAssessmentSettings.autoPublishOnSuccess,
          autoNotifyOnComplete:
            defaultAiAssessmentSettings.autoNotifyOnComplete,
          sectionTemplates: defaultAiAssessmentSettings.sectionTemplates,
          questionTemplates: defaultAiAssessmentSettings.questionTemplates,
          customStyles: defaultAiAssessmentSettings.customStyles,
          customInstructions: defaultAiAssessmentSettings.customInstructions,
          customPrompts: defaultAiAssessmentSettings.customPrompts,
          skillWeightings: defaultAiAssessmentSettings.skillWeightings,
        },
      });

      // Create user in our database
      const user = await tx.user.create({
        data: {
          name: formatName(signupData.name),
          email: formatEmail(signupData.email),
          password: await hashPassword(signupData.password), // Hash password
          type: 'CLIENT',
          role: 'ADMIN',
          status: 'ACTIVE',
          jobTitle: signupData.jobTitle,
          emailVerified: null, // Require email verification
        },
      });

      // Create client user relationship
      const clientUser = await tx.client_user.create({
        data: {
          clientId: client.id,
          userId: user.id,
        },
      });

      await tx.client_user_settings.create({
        data: {
          clientUserId: clientUser.id,
          globalSettingsId: defaultClientSettings.globalSettingsId,
          notificationsEnabled: defaultClientSettings.notificationsEnabled,
          emailNotifications: defaultClientSettings.emailNotifications,
          pushNotifications: defaultClientSettings.pushNotifications,
        },
      });

      // Assign account manager within the transaction (optional - won't fail signup if no managers available)
      try {
        await this.accountManagerAssignmentService.assignAccountManagerToClient(
          client.id,
          tx
        );
      } catch (error) {
        // Log the error but don't fail the signup process
        logger.warn('Failed to assign account manager during client signup', {
          clientId: client.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'ClientSignupService.signup',
        });
        // Continue with signup process without account manager assignment
      }

      // Return user with client relationship and clientId
      const userResult = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          clientUser: {
            include: {
              client: true,
            },
          },
          partnerUser: {
            include: {
              partner: true,
            },
          },
          candidate: true,
          supportUser: true,
        },
      });

      return { ...userResult, clientId: client.id };
    })) as SignupTransactionResult;

    if (!result) {
      throw new AppError(
        'Failed to create client',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
    if (!result.clientId) {
      throw new AppError(
        'Client ID missing after signup transaction',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Create subscription with default package
    await this.subscriptionService.createDefaultSubscription(
      result.clientId as string,
      signupData.selectedPlan,
      signupData.validity
    );

    // Send OTP verification email
    try {
      await this.verifyService.sendOtpVerification({
        email: result.email,
      });
    } catch (emailError) {
      logger.warn('Failed to send OTP verification email', {
        error:
          emailError instanceof Error ? emailError.message : 'Unknown error',
        email: result.email,
        context: 'ClientSignupService.signup',
      });
    }

    // Send account manager notification email if assignment was successful
    try {
      const accountManager =
        await this.accountManagerAssignmentService.getAccountManagerByClientId(
          result.clientId as string
        );

      // Get company details for the email
      const clientWithCompany = await prisma.client.findUnique({
        where: { id: result.clientId as string },
        include: { company: true },
      });

      if (accountManager && clientWithCompany) {
        await this.notificationProvider.sendAccountManagerClientOnboardedEmail(
          accountManager.email,
          accountManager.name,
          result.name,
          result.email,
          clientWithCompany.company.name,
          new Date().toLocaleDateString(),
          clientWithCompany.company.companyType || 'ENTERPRISE'
        );

        logger.info('Account manager client onboarded email sent', {
          context: 'ClientSignupService.signup',
          clientId: result.clientId,
          accountManagerEmail: accountManager.email,
          clientName: result.name,
        });
      }
    } catch (emailError) {
      // Log the error but don't fail the signup process
      logger.warn('Failed to send account manager client onboarded email', {
        error:
          emailError instanceof Error ? emailError.message : 'Unknown error',
        clientId: result.clientId,
        context: 'ClientSignupService.signup',
      });
    }

    // Generate auth token for immediate login
    const authUser = toIAuthUser(result);
    const authToken = getAuthToken(authUser);

    logger.info('Client signup completed successfully', {
      userId: result.id,
      email: result.email,
      context: 'ClientSignupService.signup',
    });

    return {
      message:
        'Client registered successfully. Please check your email to verify your account.',
      user: authUser,
      token: authToken,
    };
  }
}
