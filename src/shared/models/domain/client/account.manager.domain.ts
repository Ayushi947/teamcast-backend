/**
 * @openapi
 * components:
 *   schemas:
 *     IAccountManagerUserDomain:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The ID of the account manager user
 *         name:
 *           type: string
 *           description: The name of the account manager user
 *         email:
 *           type: string
 *           description: The email of the account manager user
 *         type:
 *           type: string
 *           description: The type of the account manager user
 *         role:
 *           type: string
 *           description: The role of the account manager user
 *         status:
 *           type: string
 *           description: The status of the account manager user
 *         jobTitle:
 *           type: string
 *           description: The job title of the account manager user
 *         image:
 *           type: string
 *           description: The image of the account manager user
 *         createdAt:
 *           type: string
 *           description: The created at date of the account manager user
 *         updatedAt:
 *           type: string
 *           description: The updated at date of the account manager user
 *         assignedAt:
 *           type: string
 *           description: The date when the account manager was assigned to the client
 *         clientId:
 *           type: string
 *           format: uuid
 */
export interface IAccountManagerUserDomain {
  id: string;
  name: string;
  email: string;
  type: string;
  role: string;
  status: string;
  jobTitle?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
  assignedAt?: Date;
  // Add other user fields as needed
}
