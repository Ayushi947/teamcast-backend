import {
  IPartnerProfile,
  IPartnerProfileAddress,
  IPartnerProfileAddressUpdate,
  IPartnerProfileAiAssessmentSettings,
  IPartnerProfileAiAssessmentSettingsUpdate,
  IPartnerProfileBasic,
  IPartnerProfileBasicUpdate,
  IPartnerProfileBillingAddress,
  IPartnerProfileBillingAddressUpdate,
  IPartnerProfileCulture,
  IPartnerProfileCultureUpdate,
  IPartnerProfileShippingAddress,
  IPartnerProfileShippingAddressUpdate,
  IPartnerProfileSocial,
  IPartnerProfileSocialUpdate,
  IPartnerFinancialData,
  IPartnerFinancialDataUpdate,
  IPartnerDocument,
  IPartnerDocumentCreate,
  IPartnerDocumentUpdate,
  IPartnerBankAccount,
  IPartnerBankAccountCreate,
  IPartnerBankAccountUpdate,
  IPartnerProfilePhotoUrl,
} from '../../domain/partner/profile.domain';
import { IApiRequest, IApiResponse } from '../common/common.api';

export type IPartnerProfileGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfile'
 */

export type IPartnerProfileGetApiResponse = IApiResponse<IPartnerProfile>;

// Basic profile API models
export type IPartnerProfileBasicGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileBasicGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileBasic'
 */

export type IPartnerProfileBasicGetApiResponse =
  IApiResponse<IPartnerProfileBasic>;

// Basic profile update API models
export type IPartnerProfileBasicUpdateApiRequest =
  IApiRequest<IPartnerProfileBasicUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileBasicUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileBasic'
 */

export type IPartnerProfileBasicUpdateApiResponse =
  IApiResponse<IPartnerProfileBasic>;

// Address API models
export type IPartnerProfileAddressGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileAddressGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileAddress'
 */

export type IPartnerProfileAddressGetApiResponse =
  IApiResponse<IPartnerProfileAddress>;

// Address update API models
export type IPartnerProfileAddressUpdateApiRequest =
  IApiRequest<IPartnerProfileAddressUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileAddressUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileAddress'
 */

export type IPartnerProfileAddressUpdateApiResponse =
  IApiResponse<IPartnerProfileAddress>;

// Shipping address API models
export type IPartnerProfileShippingAddressGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileShippingAddressGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileShippingAddress'
 */

export type IPartnerProfileShippingAddressGetApiResponse =
  IApiResponse<IPartnerProfileShippingAddress>;

// Shipping address update API models
export type IPartnerProfileShippingAddressUpdateApiRequest =
  IApiRequest<IPartnerProfileShippingAddressUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileShippingAddressUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileShippingAddress'
 */

export type IPartnerProfileShippingAddressUpdateApiResponse =
  IApiResponse<IPartnerProfileShippingAddress>;

// Billing address API models
export type IPartnerProfileBillingAddressGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileBillingAddressGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileBillingAddress'
 */

export type IPartnerProfileBillingAddressGetApiResponse =
  IApiResponse<IPartnerProfileBillingAddress>;

// Billing address update API models
export type IPartnerProfileBillingAddressUpdateApiRequest =
  IApiRequest<IPartnerProfileBillingAddressUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileBillingAddressUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileBillingAddress'
 */

export type IPartnerProfileBillingAddressUpdateApiResponse =
  IApiResponse<IPartnerProfileBillingAddress>;

// Social profile API models
export type IPartnerProfileSocialGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSocialGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileSocial'
 */

export type IPartnerProfileSocialGetApiResponse =
  IApiResponse<IPartnerProfileSocial>;

// Social profile update API models
export type IPartnerProfileSocialUpdateApiRequest =
  IApiRequest<IPartnerProfileSocialUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSocialUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileSocial'
 */

export type IPartnerProfileSocialUpdateApiResponse =
  IApiResponse<IPartnerProfileSocial>;

// Culture profile API models
export type IPartnerProfileCultureGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileCultureGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileCulture'
 */

export type IPartnerProfileCultureGetApiResponse =
  IApiResponse<IPartnerProfileCulture>;

// Culture profile update API models
export type IPartnerProfileCultureUpdateApiRequest =
  IApiRequest<IPartnerProfileCultureUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileCultureUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileCulture'
 */

export type IPartnerProfileCultureUpdateApiResponse =
  IApiResponse<IPartnerProfileCulture>;

// Settings API models
export type IPartnerProfileAiAssessmentSettingsGetApiRequest =
  IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileAiAssessmentSettingsGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileAiAssessmentSettings'
 */

export type IPartnerProfileAiAssessmentSettingsGetApiResponse =
  IApiResponse<IPartnerProfileAiAssessmentSettings>;

// AI Assessment Settings update API models
export type IPartnerProfileAiAssessmentSettingsUpdateApiRequest =
  IApiRequest<IPartnerProfileAiAssessmentSettingsUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileAiAssessmentSettingsUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfileAiAssessmentSettings'
 */

export type IPartnerProfileAiAssessmentSettingsUpdateApiResponse =
  IApiResponse<IPartnerProfileAiAssessmentSettings>;

// Financial Data API models
export type IPartnerProfileFinancialDataGetApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileFinancialDataGetApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerFinancialData'
 */

export type IPartnerProfileFinancialDataGetApiResponse =
  IApiResponse<IPartnerFinancialData>;

// Financial Data update API models
export type IPartnerProfileFinancialDataUpdateApiRequest =
  IApiRequest<IPartnerFinancialDataUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileFinancialDataUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerFinancialData'
 */

export type IPartnerProfileFinancialDataUpdateApiResponse =
  IApiResponse<IPartnerFinancialData>;

// Financial Data create API models
export type IPartnerProfileFinancialDataCreateApiRequest =
  IApiRequest<IPartnerFinancialDataUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileFinancialDataCreateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerFinancialDataUpdate'
 *     IPartnerProfileFinancialDataCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerFinancialData'
 */

export type IPartnerProfileFinancialDataCreateApiResponse =
  IApiResponse<IPartnerFinancialData>;

// Bank Account API models
export type IPartnerBankAccountCreateApiRequest =
  IApiRequest<IPartnerBankAccountCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerBankAccountCreateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerBankAccountCreate'
 *     IPartnerBankAccountCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerBankAccount'
 */

export type IPartnerBankAccountCreateApiResponse =
  IApiResponse<IPartnerBankAccount>;

export type IPartnerBankAccountUpdateApiRequest =
  IApiRequest<IPartnerBankAccountUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerBankAccountUpdateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerBankAccountUpdate'
 *     IPartnerBankAccountUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerBankAccount'
 */

export type IPartnerBankAccountUpdateApiResponse =
  IApiResponse<IPartnerBankAccount>;

// Document API models
export type IPartnerDocumentListApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerDocumentListApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IPartnerDocument'
 */

export type IPartnerDocumentListApiResponse = IApiResponse<IPartnerDocument[]>;

export type IPartnerDocumentCreateApiRequest =
  IApiRequest<IPartnerDocumentCreate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerDocumentCreateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerDocumentCreate'
 *     IPartnerDocumentCreateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerDocument'
 */

export type IPartnerDocumentCreateApiResponse = IApiResponse<IPartnerDocument>;

export type IPartnerDocumentUpdateApiRequest =
  IApiRequest<IPartnerDocumentUpdate>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerDocumentUpdateApiRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiRequest'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerDocumentUpdate'
 *     IPartnerDocumentUpdateApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerDocument'
 */

export type IPartnerDocumentUpdateApiResponse = IApiResponse<IPartnerDocument>;

export type IPartnerDocumentDeleteApiRequest = IApiRequest<void>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerDocumentDeleteApiResponse:
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

export type IPartnerDocumentDeleteApiResponse = IApiResponse<{
  success: boolean;
}>;

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfilePhotoUrlApiResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/IApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/IPartnerProfilePhotoUrl'
 */
export type IPartnerProfilePhotoUrlApiResponse =
  IApiResponse<IPartnerProfilePhotoUrl>;
