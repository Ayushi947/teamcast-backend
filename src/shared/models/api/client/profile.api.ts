import { IApiRequest, IApiResponse } from '../common/common.api';
import {
  IClientProfile,
  IClientProfileBasic,
  IClientProfileAddress,
  IClientProfileShippingAddress,
  IClientProfileBillingAddress,
  IClientProfileSocial,
  IClientProfileCulture,
  IClientProfileBasicUpdate,
  IClientProfileAddressUpdate,
  IClientProfileShippingAddressUpdate,
  IClientProfileBillingAddressUpdate,
  IClientProfileSocialUpdate,
  IClientProfileCultureUpdate,
  IClientProfileAiAssessmentSettings,
  IClientProfileAiAssessmentSettingsUpdate,
  IClientDocument,
  IClientDocumentCreate,
  IClientDocumentUpdate,
  IClientFinancialData,
  IClientFinancialDataUpdate,
  IClientBankAccount,
  IClientBankAccountCreate,
  IClientBankAccountUpdate,
} from '../../domain/client/profile.domain';

// Full profile API models
export type IClientProfileGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfile'
 */

export type IClientProfileGetApiResponse = IApiResponse<IClientProfile>;

// Basic profile API models
export type IClientProfileBasicGetApiRequest = IApiRequest<void>;
/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileBasicGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileBasic'
 */
export type IClientProfileBasicGetApiResponse =
  IApiResponse<IClientProfileBasic>;

// Basic profile update API models
export type IClientProfileBasicUpdateApiRequest =
  IApiRequest<IClientProfileBasicUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileBasicUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileBasic'
 */
export type IClientProfileBasicUpdateApiResponse =
  IApiResponse<IClientProfileBasic>;

// Address API models
export type IClientProfileAddressGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileAddressGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileAddress'
 */
export type IClientProfileAddressGetApiResponse =
  IApiResponse<IClientProfileAddress>;

// Address update API models
export type IClientProfileAddressUpdateApiRequest =
  IApiRequest<IClientProfileAddressUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileAddressUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileAddress'
 */
export type IClientProfileAddressUpdateApiResponse =
  IApiResponse<IClientProfileAddress>;

// Shipping address API models
export type IClientProfileShippingAddressGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileShippingAddressGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileShippingAddress'
 */
export type IClientProfileShippingAddressGetApiResponse =
  IApiResponse<IClientProfileShippingAddress>;

// Shipping address update API models
export type IClientProfileShippingAddressUpdateApiRequest =
  IApiRequest<IClientProfileShippingAddressUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileShippingAddressUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileShippingAddress'
 */
export type IClientProfileShippingAddressUpdateApiResponse =
  IApiResponse<IClientProfileShippingAddress>;

// Billing address API models
export type IClientProfileBillingAddressGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileBillingAddressGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileBillingAddress'
 */
export type IClientProfileBillingAddressGetApiResponse =
  IApiResponse<IClientProfileBillingAddress>;

// Billing address update API models
export type IClientProfileBillingAddressUpdateApiRequest =
  IApiRequest<IClientProfileBillingAddressUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileBillingAddressUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileBillingAddress'
 */
export type IClientProfileBillingAddressUpdateApiResponse =
  IApiResponse<IClientProfileBillingAddress>;

// Social profile API models
export type IClientProfileSocialGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSocialGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileSocial'
 */
export type IClientProfileSocialGetApiResponse =
  IApiResponse<IClientProfileSocial>;

// Social profile update API models
export type IClientProfileSocialUpdateApiRequest =
  IApiRequest<IClientProfileSocialUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSocialUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileSocial'
 */
export type IClientProfileSocialUpdateApiResponse =
  IApiResponse<IClientProfileSocial>;

// Culture profile API models
export type IClientProfileCultureGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileCultureGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileCulture'
 */
export type IClientProfileCultureGetApiResponse =
  IApiResponse<IClientProfileCulture>;

// Culture profile update API models
export type IClientProfileCultureUpdateApiRequest =
  IApiRequest<IClientProfileCultureUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileCultureUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileCulture'
 */
export type IClientProfileCultureUpdateApiResponse =
  IApiResponse<IClientProfileCulture>;

// AI Assessment Settings API models
export type IClientProfileAiAssessmentSettingsGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileAiAssessmentSettingsGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileAiAssessmentSettings'
 */
export type IClientProfileAiAssessmentSettingsGetApiResponse =
  IApiResponse<IClientProfileAiAssessmentSettings>;

// AI Assessment Settings update API models
export type IClientProfileAiAssessmentSettingsUpdateApiRequest =
  IApiRequest<IClientProfileAiAssessmentSettingsUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileAiAssessmentSettingsUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientProfileAiAssessmentSettings'
 */
export type IClientProfileAiAssessmentSettingsUpdateApiResponse =
  IApiResponse<IClientProfileAiAssessmentSettings>;

// Financial Data API models
export type IClientProfileFinancialDataGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileFinancialDataGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientFinancialData'
 */
export type IClientProfileFinancialDataGetApiResponse =
  IApiResponse<IClientFinancialData>;

export type IClientProfileFinancialDataCreateApiRequest =
  IApiRequest<IClientFinancialDataUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileFinancialDataCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientFinancialData'
 */
export type IClientProfileFinancialDataCreateApiResponse =
  IApiResponse<IClientFinancialData>;

export type IClientProfileFinancialDataUpdateApiRequest =
  IApiRequest<IClientFinancialDataUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileFinancialDataUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientFinancialData'
 */
export type IClientProfileFinancialDataUpdateApiResponse =
  IApiResponse<IClientFinancialData>;

// Bank Account API models
export type IClientBankAccountListApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientBankAccountListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IClientBankAccount'
 */
export type IClientBankAccountListApiResponse = IApiResponse<
  IClientBankAccount[]
>;

export type IClientBankAccountGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientBankAccountGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientBankAccount'
 */
export type IClientBankAccountGetApiResponse = IApiResponse<IClientBankAccount>;

export type IClientBankAccountCreateApiRequest =
  IApiRequest<IClientBankAccountCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientBankAccountCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientBankAccount'
 */
export type IClientBankAccountCreateApiResponse =
  IApiResponse<IClientBankAccount>;

export type IClientBankAccountUpdateApiRequest =
  IApiRequest<IClientBankAccountUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientBankAccountUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientBankAccount'
 */
export type IClientBankAccountUpdateApiResponse =
  IApiResponse<IClientBankAccount>;

export type IClientBankAccountDeleteApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientBankAccountDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
export type IClientBankAccountDeleteApiResponse = IApiResponse<{
  success: boolean;
}>;

// Document API models
export type IClientDocumentListApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientDocumentListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IClientDocument'
 */

export type IClientDocumentListApiResponse = IApiResponse<IClientDocument[]>;

export type IClientDocumentCreateApiRequest =
  IApiRequest<IClientDocumentCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientDocumentCreateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientDocumentCreate'
 *     IClientDocumentCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientDocument'
 */

export type IClientDocumentCreateApiResponse = IApiResponse<IClientDocument>;

export type IClientDocumentUpdateApiRequest =
  IApiRequest<IClientDocumentUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientDocumentUpdateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientDocumentUpdate'
 *     IClientDocumentUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IClientDocument'
 */

export type IClientDocumentUpdateApiResponse = IApiResponse<IClientDocument>;

export type IClientDocumentDeleteApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientDocumentDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */

export type IClientDocumentDeleteApiResponse = IApiResponse<{
  success: boolean;
}>;

// Photo upload API models
export type IClientProfilePhotoUploadApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfilePhotoUploadApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 fileName:
 *                   type: string
 *                   description: The name of the uploaded file
 *                 logoUrl:
 *                   type: string
 *                   description: The URL of the uploaded photo
 */
export type IClientProfilePhotoUploadApiResponse = IApiResponse<{
  fileName: string;
  logoUrl: string;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfilePhotoDeleteApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
export type IClientProfilePhotoDeleteApiResponse = IApiResponse<{
  success: boolean;
}>;
