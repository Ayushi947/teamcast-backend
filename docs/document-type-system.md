# Document Type System

## Overview

The document type system has been standardized to prevent inconsistent document type values and provide better validation. Previously, document types could be any string value, which led to data inconsistency and made it difficult to categorize and search documents.

## What Was Fixed

### Before (Problem)

- Document types could be any arbitrary string
- No validation of document type values
- Inconsistent data in the database
- Difficult to categorize and search documents
- Potential for typos and variations (e.g., "contract", "Contract", "CONTRACT", "agreement")

### After (Solution)

- Standardized enum of document types
- Strict validation of document type values
- Consistent data structure
- Easy categorization and searching
- Clear error messages for invalid types

## Document Types

The system now supports the following standardized document types:

| Document Type | Description                              | Category      |
| ------------- | ---------------------------------------- | ------------- |
| `contract`    | Legal contract or agreement document     | Legal         |
| `certificate` | Certificate of completion or achievement | Professional  |
| `legal`       | Legal document or compliance material    | Legal         |
| `resume`      | Professional resume or CV                | Professional  |
| `invoice`     | Invoice or billing document              | Financial     |
| `proposal`    | Business proposal or offer               | Business      |
| `agreement`   | Agreement or memorandum of understanding | Legal         |
| `license`     | License or permit document               | Legal         |
| `permit`      | Permit or authorization document         | Legal         |
| `other`       | Other document type                      | Miscellaneous |

## Implementation Details

### Backend Changes

1. **New Enum**: `DocumentType` enum in `src/shared/models/domain/common/document.domain.ts`
2. **Updated Interface**: `IDocumentUploadRequest` now uses `DocumentType` instead of `string`
3. **Enhanced Validation**: Controller validates document type before processing
4. **Utility Functions**: Helper functions for document type operations in `src/shared/utils/document.utils.ts`
5. **Updated Tests**: Comprehensive test coverage for document type validation

### Frontend Changes

The frontend should send document types using the exact enum values. For example:

```typescript
// ✅ Correct
const uploadRequest = {
  documentType: 'contract',
  fileName: 'agreement.pdf',
  // ... other fields
};

// ❌ Incorrect - will be rejected
const uploadRequest = {
  documentType: 'Contract', // Wrong case
  fileName: 'agreement.pdf',
  // ... other fields
};
```

## API Usage

### Upload Document

```http
POST /api/documents/:entityType/:entityId/upload
Content-Type: multipart/form-data

{
  "file": [binary file data],
  "documentType": "contract",
  "name": "Service Agreement"
}
```

### Valid Document Types

The `documentType` field must be one of the predefined values:

- `contract`
- `certificate`
- `legal`
- `resume`
- `invoice`
- `proposal`
- `agreement`
- `license`
- `permit`
- `other`

### Error Response

If an invalid document type is provided, the API will return:

```json
{
  "success": false,
  "message": "Invalid document type. Must be one of: contract, certificate, legal, resume, invoice, proposal, agreement, license, permit, other",
  "errorCode": "ERR_400"
}
```

## Migration

### Existing Documents

Existing documents in the database will continue to work, but new uploads must use the standardized document types.

### Database Schema

The database schema remains unchanged - the `type` field in document tables still stores strings, but the application now validates that only valid enum values are stored.

## Benefits

1. **Data Consistency**: All documents use standardized type values
2. **Better Search**: Easy to filter and search by document type
3. **Improved UX**: Clear error messages for invalid types
4. **Type Safety**: TypeScript enums provide compile-time safety
5. **Maintainability**: Centralized document type definitions
6. **Scalability**: Easy to add new document types in the future

## Adding New Document Types

To add a new document type:

1. Add the new value to the `DocumentType` enum in `document.domain.ts`
2. Update the utility functions in `document.utils.ts`
3. Add tests for the new type
4. Update documentation

Example:

```typescript
export enum DocumentType {
  // ... existing types ...
  NEW_TYPE = 'new_type',
}
```

## Testing

Run the document controller tests to verify the new validation:

```bash
npm test -- --testPathPattern=document.controller.test.ts
```

## Future Enhancements

Potential future improvements:

1. **Document Type Categories**: Group document types by business function
2. **Custom Document Types**: Allow clients to define custom types
3. **Document Type Metadata**: Additional properties for each document type
4. **Document Type Templates**: Predefined templates for common document types
5. **Document Type Workflows**: Different processing workflows based on document type
