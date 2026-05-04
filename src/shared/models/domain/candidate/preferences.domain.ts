/**
 * @openapi
 * components:
 *   schemas:
 *     IPreferences:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The candidate ID
 *         candidateId:
 *           type: string
 *           description: The candidate ID
 *         searchTerms:
 *           type: array
 *           items:
 *             type: string
 *           description: The search terms
 *         preferredLocations:
 *           type: array
 *           items:
 *             type: string
 *           description: The preferred locations
 *         preferredIndustries:
 *           type: array
 *           items:
 *             type: string
 *           description: The preferred industries
 *         preferredJobTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: The preferred job types
 *         preferredSalary:
 *           type: number
 *           description: The preferred salary
 *         preferredSalaryCurrency:
 *           type: string
 *           description: The preferred salary currency
 *         createdAt:
 *           type: string
 *           description: The date and time the preferences were created
 *         updatedAt:
 *           type: string
 *           description: The date and time the preferences were last updated
 */
export interface IPreferences {
  id: string;
  candidateId: string;
  searchTerms?: string[];
  preferredLocations?: string[];
  preferredIndustries?: string[];
  preferredJobTypes?: string[];
  preferredSalary?: number;
  preferredSalaryCurrency?: string;
  createdAt: Date;
  updatedAt: Date;
}
