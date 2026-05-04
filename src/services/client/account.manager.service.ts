import { PrismaClient } from '@prisma/client';
import { IAccountManagerUserDomain } from '@/shared/models/domain/client/account.manager.domain';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import { StorageFactory } from '../helpers/storage/storage.factory';

export class ClientAccountManagerService {
  private readonly prisma: PrismaClient;
  private readonly storageService: IStorageProvider;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageService = StorageFactory.getInstance().getProvider();
  }

  private toDomain(user: any, assignedAt?: Date): IAccountManagerUserDomain {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      role: user.role,
      status: user.status,
      jobTitle: user.jobTitle,
      image: user.image,
      createdAt: user.createdAt || undefined,
      updatedAt: user.updatedAt || undefined,
      assignedAt: assignedAt || undefined,
    };
  }

  /**
   * Get account manager user details for a client by clientId
   */
  async getAccountManagerByClientId(
    clientId: string
  ): Promise<IAccountManagerUserDomain | null> {
    const assignment =
      await this.prisma.client_account_manager_assignment.findUnique({
        where: { clientId },
        include: { accountManager: { include: { user: true } } },
      });

    if (!assignment?.accountManager?.user) return null;

    let imageUrl = assignment.accountManager.user.image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        const presignedUrl = await this.storageService.generatePreSignedUrl(
          imageUrl,
          'read'
        );
        imageUrl = presignedUrl;
      } catch (_error) {
        imageUrl = null;
      }
    }

    assignment.accountManager.user.image = imageUrl;

    return this.toDomain(assignment.accountManager.user, assignment.assignedAt);
  }
}
