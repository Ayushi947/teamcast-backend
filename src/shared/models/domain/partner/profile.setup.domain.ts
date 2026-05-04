import { IAuthUser } from '../auth/auth.user.domain';

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSetup:
 *       type: object
 *       required:
 *         - name
 *         - companyName
 *         - title
 *         - specialization
 *       properties:
 *         name:
 *           type: string
 *           description: Partner's full name
 *           example: John Doe
 *         phone:
 *           type: string
 *           description: Partner's phone number
 *           example: "+1 (555) 123-4567"
 *         companyName:
 *           type: string
 *           description: Name of the partner's company
 *           example: Talent Solutions Inc
 *         title:
 *           type: string
 *           description: Partner's job title
 *           example: Technical Recruiter
 *         specialization:
 *           type: string
 *           description: Partner's area of specialization
 *           example: Frontend Development, DevOps, Data Science
 *         experience:
 *           type: string
 *           description: Partner's experience and services offered
 *           example: 5+ years in technical recruiting with focus on startup ecosystem
 */

export interface IPartnerProfileSetup {
  name: string;
  phone?: string;
  companyName: string;
  title: string;
  specialization: string;
  experience?: string;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSetupDone:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message after partner profile setup
 *           example: Partner profile setup completed successfully
 *         user:
 *           $ref: '#/components/schemas/IAuthUser'
 *           description: Updated user information
 */

export interface IPartnerProfileSetupDone {
  message: string;
  user: IAuthUser;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     IPartnerProfileSetupRequired:
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

export interface IPartnerProfileSetupRequired {
  required: boolean;
  message: string;
}
