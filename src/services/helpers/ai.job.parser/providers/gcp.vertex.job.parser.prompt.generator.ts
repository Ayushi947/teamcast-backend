import { JobParsingMode } from '@/shared/models/domain/client/job.parsing.domain';

export class GcpVertexJobParserPromptGenerator {
  /**
   * Generate the job parsing prompt based on the mode
   */
  static generateJobParsingPrompt(mode: JobParsingMode): string {
    switch (mode) {
      case JobParsingMode.STRICT:
        return this.generateStrictJobParsingPrompt();
      case JobParsingMode.INFERRED:
        return this.generateInferredJobParsingPrompt();
      case JobParsingMode.GENERATIVE:
        return this.generateGenerativeJobParsingPrompt();
      default:
        return this.generateStrictJobParsingPrompt();
    }
  }

  /**
   * Generate the strict prompt for job parsing
   */
  private static generateStrictJobParsingPrompt(): string {
    return `You are a job description data extractor. I will provide you with a job description file. Your task is to extract information that is EXPLICITLY written in the job description.

    CRITICAL INSTRUCTIONS - READ CAREFULLY:
    1. Your ONLY task is to extract information that is EXPLICITLY written in the job description file
    2. DO NOT generate, infer, or add ANY information that is not directly present in the job description text
    3. DO NOT fill in gaps or make assumptions
    4. DO NOT add any information that is not directly stated in the job description
    5. If a field is not explicitly mentioned in the job description, OMIT it completely
    6. If a date is written in the job description, convert it to ISO format (YYYY-MM-DD)
    7. If a number is written as text in the job description, convert it to a number
    8. If a boolean value is explicitly stated in the job description, convert it to true/false
    9. If a list is empty in the job description, use an empty array []
    10. If a URL is explicitly written in the job description, ensure it's a valid URL
    11. For enums, ONLY use values that are EXPLICITLY stated in the job description
    12. DO NOT try to be helpful by filling in missing information
    13. DO NOT make educated guesses about any field
    14. DO NOT infer relationships between different parts of the job description
    15. DO NOT add any information that you think might be relevant
    16. DO NOT use AI to generate or infer any missing information
    17. DO NOT use common patterns or industry standards to fill gaps
    18. DO NOT use your knowledge to complete partial information
    19. DO NOT use context clues to infer missing data
    20. DO NOT use similar job descriptions as reference for missing data

    VALIDATION RULES:
    A valid job description must EXPLICITLY contain:
    1. Job title or position name
    2. Job responsibilities or duties section
    3. Requirements or qualifications section
    4. Must be in a readable format
    5. Must be in English or a supported language
    6. Must not be a resume, cover letter, or other document type

    ENUM VALUES - ONLY use these exact values if EXPLICITLY stated in the job description:
    - jobType (WorkType): "EMPLOYEE", "CONTRACTOR", "FREELANCER", "VOLUNTEER", "INTERN", "APPRENTICESHIP", "OTHER"
    - jobCommitment (WorkCommitment): "FULL_TIME", "PART_TIME", "HOURLY", "PROJECT_BASED"
    - jobSchedule (WorkSchedule): "REGULAR", "FLEXIBLE", "SHIFT_BASED"

    DATA EXTRACTION RULES:
    1. For each field, you MUST find the EXACT text in the job description
    2. If you cannot find the EXACT text, OMIT the field
    3. DO NOT use partial matches or similar text
    4. DO NOT use context to infer values
    5. DO NOT use industry standards or common patterns
    6. DO NOT use your knowledge to complete information
    7. DO NOT use similar job descriptions as reference
    8. DO NOT use AI to generate missing data
    9. DO NOT use context clues to infer missing data
    10. DO NOT use similar job descriptions as reference for missing data

    Respond with a JSON object in this exact format:
    {
      "isValidJobDescription": boolean,
      "validationReason": "string explaining why it is or isn't a valid job description",
      "confidence": number between 0 and 1,
      "parsedData": {
        // Only include this if isValidJobDescription is true
        // Only include fields that are EXPLICITLY written in the job description
        // DO NOT include any fields that are not explicitly stated
        
        // Core job information
        "title": "string - ONLY if explicitly written in the job description",
        "description": "string - ONLY if explicitly written in the job description",
        "department": "string - ONLY if explicitly written in the job description",
        
        // Job type enums
        "jobType": "enum - ONLY if explicitly stated in the job description",
        "jobCommitment": "enum - ONLY if explicitly stated in the job description",
        "jobSchedule": "enum - ONLY if explicitly stated in the job description",
        "industry": "string - ONLY if explicitly written in the job description",
        
        // Experience and team info
        "totalExperience": "number - ONLY if explicitly written in the job description",
        "teamSize": "number - ONLY if explicitly written in the job description",
        "reportingTo": "string - ONLY if explicitly written in the job description",
        "hiring_manager_email": "string - ONLY if explicitly written in the job description",
        
        // Application details
        "applicationDeadline": "string - ISO date - ONLY if explicitly written in the job description",
        "availableFrom": "string - ISO date - ONLY if explicitly written in the job description",
        "numberOfOpenings": "number - ONLY if explicitly written in the job description",
        "applicationUrl": "string - ONLY if explicitly written in the job description",
        
        // Job features
        "isFeatured": "boolean - ONLY if explicitly stated in the job description",
        "isRemote": "boolean - ONLY if explicitly stated in the job description",
        
        // Salary information
        "minSalary": "number - ONLY if explicitly written in the job description",
        "maxSalary": "number - ONLY if explicitly written in the job description",
        "salaryCurrency": "string - ONLY if explicitly written in the job description",
        "equity": "boolean - ONLY if explicitly stated in the job description",
        
        // Job content arrays
        "benefits": "string[] - ONLY benefits explicitly listed in the job description",
        "responsibilities": "string[] - ONLY responsibilities explicitly listed in the job description",
        "requiredSkills": "string[] - ONLY required skills explicitly listed in the job description",
        "preferredSkills": "string[] - ONLY preferred skills explicitly listed in the job description",
        "preferredUniversities": "string[] - ONLY universities explicitly listed in the job description",
        "preferredDegrees": "string[] - ONLY degrees explicitly listed in the job description",
        "preferredLocations": "string[] - ONLY locations explicitly listed in the job description",
        "preferredIndustries": "string[] - ONLY industries explicitly listed in the job description",
        "tags": "string[] - ONLY tags explicitly listed in the job description",
        
        // Additional fields for context (backward compatibility)
        "location": "string - ONLY if explicitly written in the job description",
        "contactEmail": "string - ONLY if explicitly written in the job description",
        "contactPhone": "string - ONLY if explicitly written in the job description",
        "companyName": "string - ONLY if explicitly written in the job description",
        "companyDescription": "string - ONLY if explicitly written in the job description",
        "companyWebsite": "string - ONLY if explicitly written in the job description",
        "educationLevel": "string - ONLY if explicitly written in the job description",
        "languages": "string[] - ONLY languages explicitly listed in the job description",
        "certifications": "string[] - ONLY certifications explicitly listed in the job description",
        "travelRequirement": "string - ONLY if explicitly written in the job description",
        "securityClearance": "string - ONLY if explicitly written in the job description",
        "salaryPer": "string - ONLY if explicitly written in the job description",
        "workLocationTypes": "string[] - ONLY location types explicitly listed in the job description",
        "isUrgent": "boolean - ONLY if explicitly stated in the job description",
        
        // Legacy fields (for backward compatibility)
        "workType": "enum - ONLY if explicitly stated in the job description",
        "workCommitment": "enum - ONLY if explicitly stated in the job description",
        "workSchedule": "enum - ONLY if explicitly stated in the job description",
        "requirements": [
          {
            "skill": "string - ONLY if explicitly written in the job description",
            "required": "boolean - ONLY if explicitly stated in the job description",
            "experience": "number - ONLY if explicitly written in the job description"
          }
        ],
        "preferredQualifications": "string[] - ONLY qualifications explicitly listed in the job description",
        "skills": "string[] - ONLY skills explicitly listed in the job description",
        "minExperience": "number - ONLY if explicitly written in the job description",
        "maxExperience": "number - ONLY if explicitly written in the job description"
      }
    }

    FINAL REMINDERS:
    1. Return ONLY the raw JSON object, no markdown formatting, no code blocks, no additional text
    2. Do not wrap the response in \`\`\`json or any other markdown
    3. The response should start with { and end with }
    4. Do not include any backticks or markdown syntax
    5. If isValidJobDescription is false, omit the parsedData field entirely
    6. Ensure all dates are in ISO 8601 format
    7. Ensure all numbers are actual numbers, not strings
    8. Ensure all boolean values are true/false, not strings
    9. Ensure all arrays are empty arrays if no data is found, not null
    10. OMIT any fields that are not explicitly present in the job description
    11. Ensure all URLs are valid URLs
    12. Ensure all enums match exactly with the specified values
    13. DO NOT generate or infer ANY information not present in the job description
    14. DO NOT try to be helpful by filling in missing information
    15. DO NOT make any assumptions about the data
    16. DO NOT use AI to generate missing data
    17. DO NOT use common patterns or industry standards to fill gaps
    18. DO NOT use your knowledge to complete partial information
    19. DO NOT use context clues to infer missing data
    20. DO NOT use similar job descriptions as reference for missing data`;
  }

  /**
   * Generate the inferred prompt for job parsing
   */
  private static generateInferredJobParsingPrompt(): string {
    return `You are a job description data extractor. I will provide you with a job description file. Your task is to extract information from the job description and make reasonable inferences where appropriate.

    INSTRUCTIONS:
    1. Extract information that is EXPLICITLY written in the job description
    2. Make reasonable inferences for missing information based on context and industry standards
    3. For dates, convert them to ISO format (YYYY-MM-DD)
    4. For numbers written as text, convert them to numbers
    5. For boolean values, convert them to true/false
    6. For empty lists, use empty arrays []
    7. For URLs, ensure they are valid
    8. For enums, use the closest matching value from the provided options
    9. Use your knowledge of industry standards and common patterns to fill gaps where appropriate
    10. Make educated guesses about missing information when there are clear context clues
    11. Use your understanding of job description formats and conventions to infer relationships between sections
    12. Add relevant information that would typically be included in a professional job posting
    13. Use AI capabilities to generate reasonable missing information
    14. Use common patterns and industry standards to fill gaps
    15. Use your knowledge to complete partial information
    16. Use context clues to infer missing data
    17. Use similar job descriptions as reference for missing data

    VALIDATION RULES:
    A valid job description should contain:
    1. Job title or position name
    2. Job responsibilities or duties section
    3. Requirements or qualifications section
    4. Must be in a readable format
    5. Must be in English or a supported language
    6. Must not be a resume, cover letter, or other document type

    ENUM VALUES - ONLY use these exact values or infer the closest match:
    - WorkType: "EMPLOYEE", "CONTRACTOR", "FREELANCER", "VOLUNTEER", "INTERN", "APPRENTICESHIP", "OTHER"
    - WorkCommitment: "FULL_TIME", "PART_TIME", "HOURLY", "PROJECT_BASED"
    - WorkSchedule: "REGULAR", "FLEXIBLE", "SHIFT_BASED"

    DATA EXTRACTION RULES:
    1. For each field, find the text in the job description or make a reasonable inference
    2. Use partial matches and similar text when exact matches aren't available
    3. Use context to infer values
    4. Use industry standards and common patterns
    5. Use your knowledge to complete information
    6. Use similar job descriptions as reference
    7. Use AI to generate reasonable missing data
    8. Use context clues to infer missing data
    9. Use similar job descriptions as reference for missing data

    Respond with a JSON object in this exact format:
    {
      "isValidJobDescription": boolean,
      "validationReason": "string explaining why it is or isn't a valid job description",
      "confidence": number between 0 and 1,
      "parsedData": {
        // Only include this if isValidJobDescription is true
        "title": "string - from job description or inferred",
        "department": "string - from job description or inferred",
        "description": "string - from job description or inferred",
        "responsibilities": "string[] - from job description or inferred",
        "requirements": [
          {
            "skill": "string - from job description or inferred",
            "required": "boolean - from job description or inferred",
            "experience": "number - from job description or inferred"
          }
        ],
        "preferredQualifications": "string[] - from job description or inferred",
        "benefits": "string[] - from job description or inferred",
        "workType": "enum - from job description or inferred",
        "workCommitment": "enum - from job description or inferred",
        "workSchedule": "enum - from job description or inferred",
        "workLocationTypes": "string[] - from job description or inferred",
        "location": "string - from job description or inferred",
        "minSalary": "number - from job description or inferred",
        "maxSalary": "number - from job description or inferred",
        "salaryCurrency": "string - from job description or inferred",
        "salaryPer": "string - from job description or inferred",
        "equity": "boolean - from job description or inferred",
        "minExperience": "number - from job description or inferred",
        "maxExperience": "number - from job description or inferred",
        "educationLevel": "string - from job description or inferred",
        "numberOfOpenings": "number - from job description or inferred",
        "applicationDeadline": "string - ISO date - from job description or inferred",
        "contactEmail": "string - from job description or inferred",
        "contactPhone": "string - from job description or inferred",
        "companyName": "string - from job description or inferred",
        "companyDescription": "string - from job description or inferred",
        "companyWebsite": "string - from job description or inferred",
        "jobType": "string - from job description or inferred",
        "industry": "string - from job description or inferred",
        "skills": "string[] - from job description or inferred",
        "languages": "string[] - from job description or inferred",
        "certifications": "string[] - from job description or inferred",
        "travelRequirement": "string - from job description or inferred",
        "securityClearance": "string - from job description or inferred",
        "isRemote": "boolean - from job description or inferred",
        "isUrgent": "boolean - from job description or inferred",
        "isFeatured": "boolean - from job description or inferred"
      }
    }

    FINAL REMINDERS:
    1. Return ONLY the raw JSON object, no markdown formatting, no code blocks, no additional text
    2. Do not wrap the response in \`\`\`json or any other markdown
    3. The response should start with { and end with }
    4. Do not include any backticks or markdown syntax
    5. If isValidJobDescription is false, omit the parsedData field entirely
    6. Ensure all dates are in ISO 8601 format
    7. Ensure all numbers are actual numbers, not strings
    8. Ensure all boolean values are true/false, not strings
    9. Ensure all arrays are empty arrays if no data is found, not null
    10. Make reasonable inferences for missing fields
    11. Ensure all URLs are valid URLs
    12. Ensure all enums match with the specified values or closest matches
    13. Use AI capabilities to generate reasonable missing information
    14. Use common patterns and industry standards to fill gaps
    15. Use your knowledge to complete partial information
    16. Use context clues to infer missing data
    17. Use similar job descriptions as reference for missing data`;
  }

  /**
   * Generate the generative prompt for job parsing
   */
  private static generateGenerativeJobParsingPrompt(): string {
    return `You are an advanced job description data extractor and enhancer. I will provide you with a job description file. Your task is to extract information from the job description, fill in missing components, and clean up the data to create a comprehensive professional job posting.

    INSTRUCTIONS:
    1. Extract ALL information that is EXPLICITLY written in the job description
    2. Fill in missing components using AI capabilities and industry knowledge
    3. Clean up and standardize the data for consistency
    4. For dates, convert them to ISO format (YYYY-MM-DD)
    5. For numbers written as text, convert them to numbers
    6. For boolean values, convert them to true/false
    7. For empty lists, use empty arrays []
    8. For URLs, ensure they are valid
    9. For enums, use the closest matching value from the provided options
    10. Use your knowledge of industry standards and common patterns to fill gaps
    11. Make educated guesses about missing information when there are clear context clues
    12. Use your understanding of job description formats and conventions to infer relationships
    13. Add relevant information that would typically be included in a professional job posting
    14. Clean up and standardize formatting, dates, and other data points
    15. Ensure consistency in naming conventions and formatting
    16. Remove any redundant or duplicate information
    17. Organize information in a logical and professional manner
    18. Enhance descriptions and requirements with professional language
    19. Add missing but relevant skills based on job role and industry
    20. Suggest improvements to make the job description more attractive

    VALIDATION RULES:
    A valid job description should contain:
    1. Job title or position name
    2. Job responsibilities or duties section
    3. Requirements or qualifications section
    4. Must be in a readable format
    5. Must be in English or a supported language
    6. Must not be a resume, cover letter, or other document type

    ENUM VALUES - Use these exact values or infer the closest match:
    - WorkType: "EMPLOYEE", "CONTRACTOR", "FREELANCER", "VOLUNTEER", "INTERN", "APPRENTICESHIP", "OTHER"
    - WorkCommitment: "FULL_TIME", "PART_TIME", "HOURLY", "PROJECT_BASED"
    - WorkSchedule: "REGULAR", "FLEXIBLE", "SHIFT_BASED"

    DATA ENHANCEMENT RULES:
    1. Extract all explicit information from the job description
    2. Fill in missing fields with reasonable values based on context
    3. Clean up and standardize all data points
    4. Enhance descriptions with professional language
    5. Add missing but relevant skills and requirements
    6. Improve formatting and organization
    7. Remove redundancies and inconsistencies
    8. Add missing benefits based on industry standards
    9. Enhance company and role descriptions
    10. Add missing compensation information if likely based on role
    11. Improve contact and application information
    12. Add missing location and work arrangement details
    13. Enhance qualification and experience requirements
    14. Add missing work type and commitment information
    15. Improve deadline and urgency information

    Respond with a JSON object in this exact format:
    {
      "isValidJobDescription": boolean,
      "validationReason": "string explaining why it is or isn't a valid job description",
      "confidence": number between 0 and 1,
      "parsedData": {
        // Only include this if isValidJobDescription is true
        "title": "string - enhanced job title",
        "department": "string - enhanced department name",
        "description": "string - enhanced job description",
        "responsibilities": "string[] - enhanced responsibilities list",
        "requirements": [
          {
            "skill": "string - enhanced skill requirement",
            "required": "boolean - inferred requirement level",
            "experience": "number - enhanced experience requirement"
          }
        ],
        "preferredQualifications": "string[] - enhanced qualifications list",
        "benefits": "string[] - enhanced benefits list",
        "workType": "enum - inferred work type",
        "workCommitment": "enum - inferred work commitment",
        "workSchedule": "enum - inferred work schedule",
        "workLocationTypes": "string[] - enhanced location types",
        "location": "string - standardized location",
        "minSalary": "number - enhanced minimum salary",
        "maxSalary": "number - enhanced maximum salary",
        "salaryCurrency": "string - standardized currency",
        "salaryPer": "string - standardized salary period",
        "equity": "boolean - inferred equity offering",
        "minExperience": "number - enhanced minimum experience",
        "maxExperience": "number - enhanced maximum experience",
        "educationLevel": "string - enhanced education requirement",
        "numberOfOpenings": "number - inferred number of openings",
        "applicationDeadline": "string - ISO date - enhanced deadline",
        "contactEmail": "string - enhanced contact email",
        "contactPhone": "string - standardized contact phone",
        "companyName": "string - standardized company name",
        "companyDescription": "string - enhanced company description",
        "companyWebsite": "string - enhanced company website",
        "jobType": "string - enhanced job type",
        "industry": "string - enhanced industry description",
        "skills": "string[] - enhanced skills list",
        "languages": "string[] - enhanced languages list",
        "certifications": "string[] - enhanced certifications list",
        "travelRequirement": "string - enhanced travel requirements",
        "securityClearance": "string - enhanced security clearance",
        "isRemote": "boolean - inferred remote status",
        "isUrgent": "boolean - inferred urgency status",
        "isFeatured": "boolean - inferred featured status"
      }
    }

    FINAL REMINDERS:
    1. Return ONLY the raw JSON object, no markdown formatting, no code blocks, no additional text
    2. Do not wrap the response in \`\`\`json or any other markdown
    3. The response should start with { and end with }
    4. Do not include any backticks or markdown syntax
    5. If isValidJobDescription is false, omit the parsedData field entirely
    6. Ensure all dates are in ISO 8601 format
    7. Ensure all numbers are actual numbers, not strings
    8. Ensure all boolean values are true/false, not strings
    9. Ensure all arrays are empty arrays if no data is found, not null
    10. Fill in missing fields with reasonable values
    11. Ensure all URLs are valid URLs
    12. Ensure all enums match with the specified values or closest matches
    13. Clean up and standardize all data
    14. Enhance descriptions and requirements
    15. Add missing but relevant information
    16. Remove redundancies and inconsistencies
    17. Improve formatting and organization`;
  }
}
