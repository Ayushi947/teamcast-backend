/**
 * @openapi
 * components:
 *   schemas:
 *     IPaymentMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID of the payment method
 *         type:
 *           type: string
 *           description: Type of payment method (card, bank_account, etc.)
 *         last4:
 *           type: string
 *           description: Last 4 digits of the payment method
 *         expMonth:
 *           type: integer
 *           description: Expiration month
 *         expYear:
 *           type: integer
 *           description: Expiration year
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default payment method
 *         brand:
 *           type: string
 *           description: Brand of the card (Visa, Mastercard, etc.)
 *         name:
 *           type: string
 *           description: Name on the payment method
 */
export interface IPaymentMethod {
  id: string;
  type: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  brand?: string;
  name?: string;
}
