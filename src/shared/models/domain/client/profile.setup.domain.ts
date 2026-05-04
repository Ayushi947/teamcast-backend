import { IAuthUser } from '../auth/auth.user.domain';
import { CompanyIndustryEnum, CompanySizeEnum } from '../../common/enums';

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSetup:
 *       type: object
 *       required:
 *         - name
 *         - companyName
 *         - companyIndustry
 *         - companySize
 *         - jobTitle
 *       properties:
 *         name:
 *           type: string
 *           description: Client's full name
 *           example: John Doe
 *         phone:
 *           type: string
 *           description: Client's phone number
 *           example: "+1 (555) 123-4567"
 *         companyName:
 *           type: string
 *           description: Name of the client's company
 *           example: Acme Corporation
 *         companyIndustry:
 *           $ref: '#/components/schemas/CompanyIndustryEnum'
 *           description: Industry of the company
 *         companySize:
 *           $ref: '#/components/schemas/CompanySizeEnum'
 *           description: Size of the company
 *         jobTitle:
 *           type: string
 *           description: Client's job title
 *           example: Chief Technology Officer
 *         companyDescription:
 *           type: string
 *           description: Description of the company
 *           example: A leading technology company
 */

export interface IClientProfileSetup {
  name: string;
  phone?: string;
  companyName: string;
  companyIndustry: CompanyIndustryEnum;
  companySize: CompanySizeEnum;
  jobTitle: string;
  companyDescription?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSetupDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after client profile setup
 *           example: Client profile setup completed successfully
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Updated user information
 */

export interface IClientProfileSetupDone {
  message: string;
  user: IAuthUser;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IClientProfileSetupRequired:
 *       type: object
 *       properties:
 *         required:
 *           type: boolean
 *           description: Whether profile setup is required
 *           example: true
 *         message:
 *           type: string
 *           description: Message explaining the requirement
 *           example: Profile setup is required to complete your registration
 */

export interface IClientProfileSetupRequired {
  required: boolean;
  message: string;
}
