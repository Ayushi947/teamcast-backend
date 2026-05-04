# Swagger Documentation Guide

This guide shows how to document your API endpoints using Swagger/OpenAPI annotations.

## API Models

For API model files in `src/shared/models/api`, use this format:

```typescript
/**
 * @openapi
 * components:
 *   schemas:
 *     YourModelName:
 *       type: object
 *       required:
 *         - requiredField1
 *         - requiredField2
 *       properties:
 *         field1:
 *           type: string
 *           description: Description of field1
 *           example: Example value
 *         field2:
 *           type: number
 *           description: Description of field2
 *           example: 123
 */
```

## API Routes

For route files in `src/routes`, use this format:

```typescript
/**
 * @openapi
 * /your-route-path:
 *   get:
 *     summary: Short summary of the endpoint
 *     description: Longer description of what the endpoint does
 *     tags:
 *       - YourTagName
 *     parameters:
 *       - name: paramName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourResponseModel'
 *       400:
 *         description: Bad request description
 */
```

## Common Types

### Request Body

```typescript
/**
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: '#/components/schemas/YourRequestModel'
 */
```

### Authentication

```typescript
/**
 * security:
 *   - bearerAuth: []
 */
```

### Common Response Types

```typescript
/**
 * responses:
 *   401:
 *     description: Unauthorized
 */
```

## Data Types Reference

- `string` - For text values
- `number` - For numeric values
- `boolean` - For true/false values
- `object` - For nested objects
- `array` - For arrays/lists
- `integer` - For whole numbers

## Formats

- `string` formats: `email`, `password`, `date-time`, `uuid`, etc.
- `number` formats: `float`, `double`, etc.

## Examples

### Complete User Endpoint Example

```typescript
/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a user's details by their unique ID
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User's unique ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *          description: Unauthorized
 */
```
