/**
 * Deel Configuration Domain Models
 * Models for Deel SSO configuration management by support admins
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     IDeelConfiguration:
 *       type: object
 *       properties:
 *         clientId:
 *           type: string
 *           format: uuid
 *           description: ID of the client
 *         companyName:
 *           type: string
 *           description: Name of the company
 *         isDeelEnabled:
 *           type: boolean
 *           description: Whether Deel SSO is enabled for this client
 *         deelConfiguredAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date when Deel was configured/enabled
 *         deelConfiguredBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the support admin who enabled Deel
 *         deelConfiguredByName:
 *           type: string
 *           nullable: true
 *           description: Name of the support admin who enabled Deel
 */
export interface IDeelConfiguration {
  clientId: string;
  companyName: string;
  isDeelEnabled: boolean;
  deelConfiguredAt: Date | null;
  deelConfiguredBy: string | null;
  deelConfiguredByName?: string | null;
}

/**
 * Request interface for enabling Deel for a client
 */
export interface IEnableDeelRequest {
  clientId: string;
  adminUserId: string; // Support admin who is enabling Deel
}

/**
 * Request interface for disabling Deel for a client
 */
export interface IDisableDeelRequest {
  clientId: string;
  adminUserId: string; // Support admin who is disabling Deel
}
