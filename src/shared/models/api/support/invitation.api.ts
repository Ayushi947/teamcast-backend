import {
  ISupportInvitation,
  ISupportInvitationSend,
  ISupportInvitationAccepted,
  ISupportInvitationFilterQuery,
  ISupportInvitationAcceptParams,
  ISupportInvitationIdParams,
  ISupportInvitationListResponse,
} from '../../domain/support/invitation.domain';
import {
  IApiRequest,
  IApiResponse,
  IApiPaginatedRequest,
} from '../common/common.api';

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationSendApiRequest:
 *       type: object
 *       description: API request model for sending a support invitation
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitationSend'
 *           description: Invitation data
 *       required:
 *         - data
 */
export interface ISupportInvitationSendApiRequest extends IApiRequest {
  data: ISupportInvitationSend;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationSendApiResponse:
 *       type: object
 *       description: API response model for sending a support invitation
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitation'
 *           description: Created invitation
 *       required:
 *         - data
 */
export type ISupportInvitationSendApiResponse =
  IApiResponse<ISupportInvitation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationGetApiRequest:
 *       type: object
 *       description: API request model for getting a support invitation
 *       properties:
 *         params:
 *           $ref: '#/components/schemas/ISupportInvitationIdParams'
 *           description: Invitation ID parameters
 *       required:
 *         - params
 */
export interface ISupportInvitationGetApiRequest extends IApiRequest {
  params: ISupportInvitationIdParams;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationGetApiResponse:
 *       type: object
 *       description: API response model for getting a support invitation
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitation'
 *           description: Invitation data
 *       required:
 *         - data
 */
export type ISupportInvitationGetApiResponse = IApiResponse<ISupportInvitation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationWithdrawApiRequest:
 *       type: object
 *       description: API request model for withdrawing a support invitation
 *       properties:
 *         params:
 *           $ref: '#/components/schemas/ISupportInvitationIdParams'
 *           description: Invitation ID parameters
 *       required:
 *         - params
 */
export interface ISupportInvitationWithdrawApiRequest extends IApiRequest {
  params: ISupportInvitationIdParams;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationWithdrawApiResponse:
 *       type: object
 *       description: API response model for withdrawing a support invitation
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitation'
 *           description: Updated invitation
 *       required:
 *         - data
 */
export type ISupportInvitationWithdrawApiResponse =
  IApiResponse<ISupportInvitation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationResendApiRequest:
 *       type: object
 *       description: API request model for resending a support invitation
 *       properties:
 *         params:
 *           $ref: '#/components/schemas/ISupportInvitationIdParams'
 *           description: Invitation ID parameters
 *       required:
 *         - params
 */
export interface ISupportInvitationResendApiRequest extends IApiRequest {
  params: ISupportInvitationIdParams;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationResendApiResponse:
 *       type: object
 *       description: API response model for resending a support invitation
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitation'
 *           description: Updated invitation
 *       required:
 *         - data
 */
export type ISupportInvitationResendApiResponse =
  IApiResponse<ISupportInvitation>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationAcceptApiRequest:
 *       type: object
 *       description: API request model for accepting a support invitation
 *       properties:
 *         params:
 *           $ref: '#/components/schemas/ISupportInvitationAcceptParams'
 *           description: Invitation acceptance parameters
 *       required:
 *         - params
 */
export interface ISupportInvitationAcceptApiRequest extends IApiRequest {
  params: ISupportInvitationAcceptParams;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationAcceptApiResponse:
 *       type: object
 *       description: API response model for accepting a support invitation
 *       properties:
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitationAccepted'
 *           description: Accepted invitation data with user and token
 *       required:
 *         - data
 */
export type ISupportInvitationAcceptApiResponse =
  IApiResponse<ISupportInvitationAccepted>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationListApiRequest:
 *       type: object
 *       description: API request model for listing support invitations
 *       properties:
 *         filters:
 *           $ref: '#/components/schemas/ISupportInvitationFilterQuery'
 *           description: Filter criteria
 *         pagination:
 *           $ref: '#/components/schemas/IPaginationRequest'
 *           description: Pagination parameters
 */
export type ISupportInvitationListApiRequest = IApiPaginatedRequest<
  void,
  ISupportInvitationFilterQuery,
  void
>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationListApiResponse:
 *       type: object
 *       description: API response model for listing support invitations
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           $ref: '#/components/schemas/ISupportInvitationListResponse'
 *           description: Invitation list data with pending count
 */
export type ISupportInvitationListApiResponse =
  IApiResponse<ISupportInvitationListResponse>;

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationCopyApiRequest:
 *       type: object
 *       description: API request model for generating a copied invitation token
 *       properties:
 *         params:
 *           $ref: '#/components/schemas/ISupportInvitationIdParams'
 *           description: Invitation ID parameters
 *       required:
 *         - params
 */
export interface ISupportInvitationCopyApiRequest extends IApiRequest {
  params: ISupportInvitationIdParams;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportGenericInvitationExpireApiRequest:
 *       type: object
 *       description: API request model for auto-expiring invitations
 *       properties:
 *         params:
 *           type: object
 *           properties:
 *             invitationType:
 *               type: string
 *               enum: [support, job-posting]
 *               description: Type of invitation to check and expire
 *           required:
 *             - invitationType
 *       required:
 *         - params
 */
export interface ISupportGenericInvitationExpireApiRequest extends IApiRequest {
  params: {
    invitationType: 'support' | 'job-posting';
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportGenericInvitationExpireApiResponse:
 *       type: object
 *       description: API response model for auto-expiring invitations
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           properties:
 *             totalChecked:
 *               type: number
 *               description: Total number of invitations checked
 *             totalExpired:
 *               type: number
 *               description: Number of invitations that were expired
 *             alreadyExpired:
 *               type: number
 *               description: Number of invitations that were already expired
 *             notYetExpired:
 *               type: number
 *               description: Number of invitations that have not expired yet
 *             message:
 *               type: string
 *               description: Summary message of the operation
 *             details:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: Invitation ID
 *                   status:
 *                     type: string
 *                     description: Current status of the invitation
 *                   email:
 *                     type: string
 *                     description: Email address of the invitation
 *                   message:
 *                     type: string
 *                     description: Detailed message for this invitation
 *               description: Detailed results for each invitation processed
 *           required:
 *             - totalChecked
 *             - totalExpired
 *             - alreadyExpired
 *             - notYetExpired
 *             - message
 *             - details
 */
export interface ISupportGenericInvitationExpireApiResponse {
  success: boolean;
  message: string;
  data: {
    totalChecked: number;
    totalExpired: number;
    alreadyExpired: number;
    notYetExpired: number;
    message: string;
    details: Array<{
      id: string;
      status: string;
      email: string;
      message: string;
    }>;
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ISupportInvitationCopyApiResponse:
 *       type: object
 *       description: API response model for generating a copied invitation token
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: Generated JWT token for copied invitation
 *             invitationUrl:
 *               type: string
 *               description: Complete invitation URL with token
 *             expiresInMinutes:
 *               type: number
 *               description: Token expiry time in minutes
 *           required:
 *             - token
 *             - invitationUrl
 *             - expiresInMinutes
 */
export interface ISupportInvitationCopyApiResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    invitationUrl: string;
    expiresInMinutes: number;
  };
}
