/**
 * Deel Configuration Service for Support Admin
 *
 * This service allows TeamCast support admins to:
 * - Enable/disable Deel SSO for specific clients
 * - View Deel configuration status for clients
 * - Track who configured Deel and when
 *
 * Only support admins should have access to these operations.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/utils/app.error';
import {
  IDeelConfiguration,
  IEnableDeelRequest,
  IDisableDeelRequest,
} from '@/shared/models/domain/support/deel.configuration.domain';

// Create module-level Prisma instance
const prisma = new PrismaClient();

export class DeelConfigurationService {
  constructor() {}

  /**
   * Enable Deel SSO for a client
   * Only support admins can call this
   *
   * @param request - EnableDeelRequest with clientId and adminUserId
   */
  async enableDeelForClient(
    request: IEnableDeelRequest
  ): Promise<IDeelConfiguration> {
    const { clientId, adminUserId } = request;

    try {
      logger.info(
        `Support admin ${adminUserId} is enabling Deel for client ${clientId}`
      );

      // Check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
          settings: true,
        },
      });

      if (!client) {
        throw new AppError(`Client not found: ${clientId}`, 404);
      }

      // Check if client settings exist, create if not
      let settings = client.settings;
      if (!settings) {
        settings = await prisma.client_settings.create({
          data: {
            clientId: clientId,
          },
        });
      }

      // Enable Deel for this client
      const updatedSettings = await prisma.client_settings.update({
        where: { id: settings.id },
        data: {
          isDeelEnabled: true,
          deelConfiguredAt: new Date(),
          deelConfiguredBy: adminUserId,
        },
      });

      logger.info(
        `Deel enabled successfully for client ${clientId} by admin ${adminUserId}`
      );

      // Get admin user info
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId },
      });

      return {
        clientId: clientId,
        companyName: client.company.name,
        isDeelEnabled: updatedSettings.isDeelEnabled,
        deelConfiguredAt: updatedSettings.deelConfiguredAt,
        deelConfiguredBy: updatedSettings.deelConfiguredBy,
        deelConfiguredByName: adminUser?.name || undefined,
      };
    } catch (error) {
      logger.error(`Failed to enable Deel for client ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Disable Deel SSO for a client
   * Only support admins can call this
   *
   * @param request - DisableDeelRequest with clientId and adminUserId
   */
  async disableDeelForClient(
    request: IDisableDeelRequest
  ): Promise<IDeelConfiguration> {
    const { clientId, adminUserId } = request;

    try {
      logger.info(
        `Support admin ${adminUserId} is disabling Deel for client ${clientId}`
      );

      // Check if client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
          settings: true,
        },
      });

      if (!client) {
        throw new AppError(`Client not found: ${clientId}`, 404);
      }

      if (!client.settings) {
        throw new AppError(
          `Client settings not found for client: ${clientId}`,
          404
        );
      }

      // Disable Deel for this client
      const updatedSettings = await prisma.client_settings.update({
        where: { id: client.settings.id },
        data: {
          isDeelEnabled: false,
          // Keep the configuration history
          // deelConfiguredAt and deelConfiguredBy remain unchanged
        },
      });

      logger.info(
        `Deel disabled successfully for client ${clientId} by admin ${adminUserId}`
      );

      // Get admin user info
      const adminUser = await prisma.user.findUnique({
        where: { id: updatedSettings.deelConfiguredBy || '' },
      });

      return {
        clientId: clientId,
        companyName: client.company.name,
        isDeelEnabled: updatedSettings.isDeelEnabled,
        deelConfiguredAt: updatedSettings.deelConfiguredAt,
        deelConfiguredBy: updatedSettings.deelConfiguredBy,
        deelConfiguredByName: adminUser?.name || undefined,
      };
    } catch (error) {
      logger.error(`Failed to disable Deel for client ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Get Deel configuration status for a client
   * Can be called by support admins or by the client themselves
   *
   * @param clientId - Client ID
   */
  async getDeelConfiguration(clientId: string): Promise<IDeelConfiguration> {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          company: true,
          settings: true,
        },
      });

      if (!client) {
        throw new AppError(`Client not found: ${clientId}`, 404);
      }

      const settings = client.settings;

      // Get admin user info if Deel was configured
      let adminUser = null;
      if (settings?.deelConfiguredBy) {
        adminUser = await prisma.user.findUnique({
          where: { id: settings.deelConfiguredBy },
        });
      }

      return {
        clientId: clientId,
        companyName: client.company.name,
        isDeelEnabled: settings?.isDeelEnabled || false,
        deelConfiguredAt: settings?.deelConfiguredAt || null,
        deelConfiguredBy: settings?.deelConfiguredBy || null,
        deelConfiguredByName: adminUser?.name || undefined,
      };
    } catch (error) {
      logger.error(
        `Failed to get Deel configuration for client ${clientId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all clients with Deel enabled
   * Only support admins can call this
   */
  async getAllClientsWithDeelEnabled(): Promise<IDeelConfiguration[]> {
    try {
      const clients = await prisma.client.findMany({
        where: {
          settings: {
            isDeelEnabled: true,
          },
        },
        include: {
          company: true,
          settings: true,
        },
      });

      const result: IDeelConfiguration[] = [];

      for (const client of clients) {
        let adminUser = null;
        if (client.settings?.deelConfiguredBy) {
          adminUser = await prisma.user.findUnique({
            where: { id: client.settings.deelConfiguredBy },
          });
        }

        result.push({
          clientId: client.id,
          companyName: client.company.name,
          isDeelEnabled: client.settings?.isDeelEnabled || false,
          deelConfiguredAt: client.settings?.deelConfiguredAt || null,
          deelConfiguredBy: client.settings?.deelConfiguredBy || null,
          deelConfiguredByName: adminUser?.name || undefined,
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to get all clients with Deel enabled', error);
      throw error;
    }
  }

  /**
   * Check if Deel is enabled for a client
   * Used by OIDC service before initiating SSO
   *
   * @param clientId - Client ID
   * @returns boolean - Whether Deel is enabled for this client
   */
  async isDeelEnabledForClient(clientId: string): Promise<boolean> {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          settings: true,
        },
      });

      if (!client) {
        return false;
      }

      return client.settings?.isDeelEnabled || false;
    } catch (error) {
      logger.error(`Failed to check Deel status for client ${clientId}`, error);
      return false;
    }
  }

  /**
   * Close database connection
   * Call this on application shutdown
   */
  async close(): Promise<void> {
    await prisma.$disconnect();
  }
}
