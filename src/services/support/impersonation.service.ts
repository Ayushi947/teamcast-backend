import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import { INotificationProvider } from '../notification/notification.interface';
import { GcpStorageProvider } from '../helpers/storage/provider/gcp.provider';
import {
  IStartImpersonation,
  IStartImpersonationResponse,
  IStopImpersonation,
  IStopImpersonationResponse,
} from '@/shared/models/domain/support/impersonation.domain';
import {
  UserTypeEnum,
  UserRoleEnum,
  ActivityModuleEnum,
  ActivityEntityTypeEnum,
  ImpersonationActionEnum,
} from '@/shared/models/common/enums';
import { ErrorCode } from '@/utils/error.codes';
import { AppError } from '@/utils/app.error';
import { AuthService } from '@/services/auth/auth.service';

import { ClientSubscriptionService } from '../client/subscription.service';
import { PaymentFactory } from '../subscription/payment.factory';
import { NodemailerProvider } from '../notification/nodemailer.service';

import {
  IAuthUser,
  toIAuthUser,
} from '@/shared/models/domain/auth/auth.user.domain';
import {
  getAuthToken,
  generateImpersonationToken,
  generateRefreshToken,
} from '@/utils/generate.token';
import { UserStatusService } from '../common/user.status.service';
import { IAuthToken } from '@/shared/models/domain/auth/auth.token.domain';

@singleton
export class SupportImpersonationService {
  private readonly prisma: PrismaClient;
  private readonly authService: AuthService;
  private readonly storageService: GcpStorageProvider;
  private readonly userStatusService: UserStatusService;

  constructor(private readonly notificationProvider: INotificationProvider) {
    this.prisma = new PrismaClient();
    this.authService = new AuthService(
      notificationProvider,
      new ClientSubscriptionService(
        new PaymentFactory(),
        new NodemailerProvider()
      )
    );
    this.storageService = new GcpStorageProvider();
    this.userStatusService = new UserStatusService();
  }

  async startImpersonation(
    supportUserId: string,
    request: IStartImpersonation
  ): Promise<IStartImpersonationResponse> {
    // Verify that the support user is an admin
    const supportUser = await this.prisma.user.findUnique({
      where: { id: supportUserId },
      include: { supportUser: true },
    });

    if (!supportUser || supportUser.type !== UserTypeEnum.SUPPORT) {
      throw new AppError(
        'Only support users can perform impersonation',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const isAdmin = supportUser.role === UserRoleEnum.ADMIN;
    const isAccountManager = supportUser.role === UserRoleEnum.ACCOUNT_MANAGER;
    const isTechnicalSupport =
      supportUser.role === UserRoleEnum.TECHNICAL_SUPPORT;
    const isRecruiter = supportUser.role === UserRoleEnum.RECRUITER;
    const isTargetingClient = request.targetUserType === UserTypeEnum.CLIENT;
    const isTargetingCandidate =
      request.targetUserType === UserTypeEnum.CANDIDATE;

    // Check if user has permission to impersonate
    if (
      !isAdmin &&
      !(isAccountManager && isTargetingClient) &&
      !isTechnicalSupport &&
      !isRecruiter
    ) {
      throw new AppError(
        'Only support admin users, account managers, technical support, or recruiters can perform impersonation',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    // Recruiters can only impersonate candidates
    if (isRecruiter && !isTargetingCandidate) {
      throw new AppError(
        'Support recruiters can only impersonate candidate users',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    // Find the target user
    const targetUser = await this.findTargetUser(
      request.targetUserId,
      request.targetUserType
    );

    // Create impersonation session for audit trail
    const impersonationSession =
      await this.prisma.support_impersonation_session.create({
        data: {
          supportUserId,
          targetUserId: targetUser.id,
          reason: request.reason || 'No reason provided',
          metadata: {
            targetUserId: request.targetUserId,
            targetUserType: request.targetUserType,
            targetUserName: targetUser.name,
            targetUserEmail: targetUser.email,
          } as Record<string, any>,
        },
      });

    // Log activity
    await this.prisma.activity_log.create({
      data: {
        userId: supportUserId,
        module: ActivityModuleEnum.SYSTEM,
        action: ImpersonationActionEnum.IMPERSONATE_START,
        entityId: targetUser.id,
        entityType: this.getEntityTypeFromUserType(targetUser.type),
        description: `Support user signed in as ${targetUser.type.toLowerCase()}`,
        metadata: {
          supportUserId: supportUserId,
          impersonationId: impersonationSession.id,
          reason: request.reason,
          impersonatedUserId: targetUser.id,
          impersonatedUserName: targetUser.name,
        } as Record<string, any>,
      },
    });

    // Create the target user object with impersonation flags
    const impersonatedUser: IAuthUser = {
      ...toIAuthUser(targetUser),
      ...this.getUserTypeSpecificIds(targetUser, request.targetUserType),
      supportUserId:
        request.targetUserType === UserTypeEnum.SUPPORT
          ? targetUser.supportUser?.id
          : supportUserId,
    };

    const accessToken = generateImpersonationToken(impersonatedUser);
    const refreshToken = generateRefreshToken(impersonatedUser.id);

    const token: IAuthToken = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };

    let supportUserImageUrl = null;
    if (supportUser.image) {
      try {
        supportUserImageUrl = await this.storageService.generatePreSignedUrl(
          supportUser.image,
          'read'
        );
      } catch (_error) {
        supportUserImageUrl = supportUser.image;
      }
    } else {
      supportUserImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(supportUser.name)}&background=6366f1&color=ffffff&size=200`;
    }

    return {
      token,
      user: impersonatedUser,
      impersonationId: impersonationSession.id,
      targetUserImage: targetUser.image || null,
      supportUserImage: supportUserImageUrl,
    };
  }

  async stopImpersonation(
    request: IStopImpersonation,
    currentUserId: string
  ): Promise<IStopImpersonationResponse> {
    if (!currentUserId) {
      throw new AppError(
        'Only the original support user can stop this session',
        403,
        ErrorCode.UNAUTHORIZED
      );
    }
    const impersonationSession =
      await this.prisma.support_impersonation_session.findFirst({
        where: { id: request.impersonationId, isActive: true },
      });

    if (!impersonationSession) {
      throw new AppError(
        'Active impersonation session not found',
        404,
        ErrorCode.NOT_FOUND
      );
    }

    if (
      impersonationSession.supportUserId !== currentUserId &&
      impersonationSession.targetUserId !== currentUserId
    ) {
      throw new AppError(
        'You are not authorized to stop this impersonation session',
        403,
        ErrorCode.UNAUTHORIZED
      );
    }

    const endedAt = new Date();
    const duration = Math.floor(
      (endedAt.getTime() - impersonationSession.startedAt.getTime()) / 1000
    );

    await this.prisma.support_impersonation_session.update({
      where: { id: impersonationSession.id },
      data: { isActive: false, endedAt: endedAt, duration: duration },
    });

    // Get the support user
    const supportUser = await this.prisma.user.findUnique({
      where: { id: impersonationSession.supportUserId },
      include: { supportUser: true },
    });

    if (!supportUser?.supportUser) {
      throw new AppError('Support user not found', 404, ErrorCode.NOT_FOUND);
    }

    const sessionMeta =
      (impersonationSession.metadata as Record<string, any>) || {};
    // Log activity
    await this.prisma.activity_log.create({
      data: {
        userId: impersonationSession.supportUserId,
        module: ActivityModuleEnum.SYSTEM,
        action: ImpersonationActionEnum.IMPERSONATE_END,
        entityId: impersonationSession.targetUserId,
        entityType: this.getEntityTypeFromUserType(
          sessionMeta?.targetUserType || UserTypeEnum.CANDIDATE
        ),
        description: `Support user signed out from ${sessionMeta?.targetUserType?.toLowerCase() || 'candidate'} account`,
        metadata: {
          supportUserId: impersonationSession.supportUserId,
          impersonationId: request.impersonationId,
          impersonatedUserId: impersonationSession.targetUserId,
          impersonatedUserName: sessionMeta?.targetUserName,
        } as Record<string, any>,
      },
    });

    // Create support user object
    const supportUserObj: IAuthUser = {
      ...toIAuthUser(supportUser),
      supportUserId: supportUser.supportUser?.id,
    };

    // Generate tokens
    const token = getAuthToken(supportUserObj);

    return { token, user: supportUserObj };
  }

  private async findTargetUser(
    targetUserId: string,
    targetUserType: UserTypeEnum
  ) {
    let data: any;
    let targetUser: any;

    switch (targetUserType) {
      case UserTypeEnum.CANDIDATE:
        data = await this.prisma.candidate.findUnique({
          where: { id: targetUserId },
          include: { user: true },
        });
        if (!data?.user) {
          throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
        }
        targetUser = data.user;
        targetUser.candidateId = data.id;
        break;

      case UserTypeEnum.CLIENT:
        data = await this.prisma.client_user.findUnique({
          where: { id: targetUserId },
          include: { user: true, client: true },
        });
        if (!data?.user) {
          throw new AppError('Client user not found', 404, ErrorCode.NOT_FOUND);
        }
        targetUser = data.user;
        targetUser.clientUserId = data.id;
        targetUser.clientId = data.client.id;
        break;

      case UserTypeEnum.PARTNER:
        data = await this.prisma.partner_user.findUnique({
          where: { id: targetUserId },
          include: { user: true, partner: true },
        });
        if (!data?.user) {
          throw new AppError(
            'Partner user not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }
        targetUser = data.user;
        targetUser.partnerUserId = data.id;
        targetUser.partnerId = data.partner.id;

        if (targetUser.role === UserRoleEnum.PARTNER_RESOURCE) {
          const candidateData = await this.prisma.candidate.findUnique({
            where: { userId: targetUser.id },
          });
          if (candidateData) {
            targetUser.candidateId = candidateData.id;
          }
        }
        break;

      case UserTypeEnum.SUPPORT: {
        let data = await this.prisma.support_user.findUnique({
          where: { id: targetUserId },
          include: { user: true },
        });

        if (!data) {
          data = await this.prisma.support_user.findUnique({
            where: { userId: targetUserId },
            include: { user: true },
          });
        }

        if (!data?.user) {
          throw new AppError(
            'Support user not found',
            404,
            ErrorCode.NOT_FOUND
          );
        }

        targetUser = {
          ...data.user,
          supportUser: {
            id: data.id,
          },
        };
        break;
      }

      default:
        throw new AppError(
          'Invalid user type for impersonation',
          400,
          ErrorCode.INVALID_INPUT
        );
    }

    // Check if the target user is active
    const isUserActive = await this.userStatusService.isUserActive(
      targetUser.id
    );
    if (!isUserActive) {
      throw new AppError(
        `Cannot impersonate ${targetUserType.toLowerCase()} - user account is inactive`,
        400,
        ErrorCode.INVALID_INPUT
      );
    }

    return targetUser;
  }

  private getUserTypeSpecificIds(
    targetUser: any,
    targetUserType: UserTypeEnum
  ) {
    if (targetUserType === UserTypeEnum.SUPPORT) {
      return { supportUserId: targetUser.supportUser?.id };
    }

    switch (targetUserType) {
      case UserTypeEnum.CANDIDATE:
        return { candidateId: targetUser.candidateId };
      case UserTypeEnum.CLIENT:
        return {
          clientUserId: targetUser.clientUserId,
          clientId: targetUser.clientId,
        };
      case UserTypeEnum.PARTNER: {
        const ids: any = {
          partnerUserId: targetUser.partnerUserId,
          partnerId: targetUser.partnerId,
        };
        if (
          targetUser.role === UserRoleEnum.PARTNER_RESOURCE &&
          targetUser.candidateId
        ) {
          ids.candidateId = targetUser.candidateId;
        }

        return ids;
      }
      default:
        return {};
    }
  }

  private getEntityTypeFromUserType(userType?: string): ActivityEntityTypeEnum {
    if (!userType) {
      return ActivityEntityTypeEnum.USER;
    }

    const entityTypeMap: Record<string, ActivityEntityTypeEnum> = {
      [UserTypeEnum.CANDIDATE]: ActivityEntityTypeEnum.CANDIDATE,
      [UserTypeEnum.CLIENT]: ActivityEntityTypeEnum.CLIENT,
      [UserTypeEnum.PARTNER]: ActivityEntityTypeEnum.PARTNER,
      [UserTypeEnum.SUPPORT]: ActivityEntityTypeEnum.USER,
    };

    return entityTypeMap[userType] || ActivityEntityTypeEnum.USER;
  }
}
