### Model Layers

1. **Data Models**

   - Generated from Prisma schema
   - Located in the database layer
   - Should never be modified directly
   - Represent the database structure

2. **Domain Models**

   - Located in `src/shared/models/domain`
   - Core data structures used throughout the application
   - Independent of external concerns (database, API)
   - Define the business objects and their relationships

3. **API Models**
   - Located in `src/shared/models/api`
   - Extend from common interfaces (`IApiResponse`, `IApiRequest`, `IPaginatedResponse`)
   - Define the contract between clients and the API
   - Separate request and response models

### Data Models and Prisma Schema

The data models in `src/shared/models/data` are automatically generated from the Prisma schema. These models:

1. **Generation Process**

   - Generated using Prisma's type generation
   - Automatically updated when schema changes
   - Located in `src/shared/models/data`
   - Represent the exact database structure

2. **Usage Guidelines**

   - Should not be modified manually
   - Used as the base for domain models
   - Provide type safety for database operations
   - Include all database fields and relationships

3. **Relationship with Domain Models**

   - Domain models often extend or transform data models
   - Can exclude sensitive fields from data models
   - May combine multiple data models into a single domain model
   - Example:

     ```typescript
     // Data model (generated from Prisma)
     interface IClientUserData {
       id: string;
       email: string;
       password: string; // sensitive field
       createdAt: Date;
     }

     // Domain model (excludes sensitive fields)
     type IClientUserDomain = Omit<IClientUserData, "password">;
     ```

4. **Best Practices**
   - Always use domain models in business logic
   - Convert data models to domain models before returning to API layer
   - Use data models only for database operations
   - Keep data models separate from API concerns
