import {
  IPartnerProfileSetup,
  IPartnerProfileSetupDone,
  IPartnerProfileSetupRequired,
} from '../../domain/partner/profile.setup.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type IPartnerProfileSetupApiRequest = IApiRequest<IPartnerProfileSetup>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSetupApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileSetupDone'
 */
export type IPartnerProfileSetupApiResponse =
  IApiResponse<IPartnerProfileSetupDone>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSetupRequiredApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileSetupRequired'
 */
export type IPartnerProfileSetupRequiredApiResponse =
  IApiResponse<IPartnerProfileSetupRequired>;
