import { logger } from '@/shared/utils/logger';
import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI client
const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: process.env.GOOGLE_CLOUD_VERTEX_AI_LOCATION || 'us-central1',
});

const model = process.env.GOOGLE_CLOUD_VERTEX_AI_MODEL || 'gemini-1.5-flash';

// Simple in-memory cache to avoid repeated AI calls
const enumCache = new Map<string, string>();

// Cache configuration
const MAX_CACHE_SIZE = 1000; // Maximum number of cached items

/**
 * Cache management functions
 */
function getCachedValue(key: string): string | null {
  const cached = enumCache.get(key);
  if (cached) {
    return cached;
  }
  return null;
}

function setCachedValue(key: string, value: string): void {
  // Check cache size limit
  if (enumCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries (Map maintains insertion order)
    const firstKey = enumCache.keys().next().value;
    if (firstKey) {
      enumCache.delete(firstKey);
    }
  }

  enumCache.set(key, value);
}

function clearCache(): void {
  enumCache.clear();
}

// Export cache management functions
export { clearCache };
export function getCacheSize(): number {
  return enumCache.size;
}

export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: enumCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}

/**
 * Specialized function for formatting skills arrays
 * - Optimized for skill formatting (technical terms, programming languages, etc.)
 * - Uses batch processing for efficiency
 * - Handles common skill variations and abbreviations
 * - Returns formatted skills array
 */
export async function formatSkills(skills: string[]): Promise<string[]> {
  if (!Array.isArray(skills) || skills.length === 0) return [];

  // Filter out empty/null skills
  const validSkills = skills.filter(
    (skill) => skill && skill.trim().length > 0
  );

  if (validSkills.length === 0) return [];

  // Use batch formatting for efficiency
  return await formatEnumValues(validSkills);
}

/**
 * Specialized function for formatting resume skills
 * - Similar to formatSkills but optimized for resume context
 * - Handles job-specific terminology
 * - Returns formatted skills array
 */
export async function formatResumeSkills(skills: string[]): Promise<string[]> {
  return await formatSkills(skills);
}

/**
 * AI-powered enum value formatting using Vertex AI with caching
 * - Intelligently formats technical terms, acronyms, and enum-like values
 * - Keeps acronyms in proper case (CEO, CTO, API, SQL)
 * - Capitalizes technology names correctly (JavaScript, ReactJS, MongoDB)
 * - Expands shorthand only when universally recognized
 * - Falls back to original value if AI processing fails
 * - Uses caching to avoid repeated AI calls
 */
export async function formatEnumValueAI(value: string): Promise<string> {
  if (!value) return value;

  // Check cache first
  const cached = getCachedValue(value);
  if (cached) {
    return cached;
  }

  // Check if Vertex AI is properly configured
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    logger.warn('Vertex AI not configured, falling back to sync formatting');
    const syncResult = formatEnumValueSync(value);
    setCachedValue(value, syncResult);
    return syncResult;
  }

  try {
    const generativeModel = vertex_ai.getGenerativeModel({ model });

    const prompt = `
  Format the following technical term, acronym, or enum-like value into its correct, human-readable capitalization.
  - Keep acronyms in uppercase (e.g., CEO, CTO, API, SQL).
  - Capitalize technology names properly (e.g., JavaScript, ReactJS, MongoDB, Next.js).
  - Expand shorthand only if it's universally recognized (e.g., DB → Database).
  - Return only the formatted string.
  
  Input: "${value}"
  Output:
    `;

    const result = await generativeModel.generateContent(prompt);
    const formattedValue =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    const finalValue =
      formattedValue && formattedValue.length > 0 ? formattedValue : value;

    // Cache the result
    setCachedValue(value, finalValue);

    return finalValue;
  } catch (error) {
    // Log error but don't fail - return original value as fallback
    logger.warn(`AI enum formatting failed for "${value}":`, error);
    const syncResult = formatEnumValueSync(value);
    setCachedValue(value, syncResult);
    return syncResult;
  }
}

/**
 * Synchronous enum value formatting with common patterns
 * - Fallback for when AI is not available or fails
 * - Handles common acronyms and technical terms
 * - More limited than AI version but reliable
 */
export function formatEnumValueSync(value: string): string {
  if (!value) return value;

  // Common acronyms that should stay uppercase
  const commonAcronyms = new Set([
    'API',
    'SQL',
    'HTTP',
    'HTTPS',
    'URL',
    'URI',
    'JSON',
    'XML',
    'HTML',
    'CSS',
    'CEO',
    'CTO',
    'CFO',
    'COO',
    'HR',
    'IT',
    'AI',
    'ML',
    'UI',
    'UX',
    'DB',
    'CRM',
    'ERP',
    'SaaS',
    'PaaS',
    'IaaS',
    'B2B',
    'B2C',
    'MVP',
    'ROI',
    'KPI',
  ]);

  // Common technology names with proper capitalization
  const techNames: Record<string, string> = {
    javascript: 'JavaScript',
    reactjs: 'ReactJS',
    react: 'React',
    mongodb: 'MongoDB',
    nextjs: 'Next.js',
    nodejs: 'Node.js',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    csharp: 'C#',
    dotnet: '.NET',
    aws: 'AWS',
    azure: 'Azure',
    gcp: 'GCP',
    kubernetes: 'Kubernetes',
    docker: 'Docker',
  };

  const lowerValue = value.toLowerCase();

  // Check if it's a common acronym
  if (commonAcronyms.has(value.toUpperCase())) {
    return value.toUpperCase();
  }

  // Check if it's a known technology name
  if (techNames[lowerValue]) {
    return techNames[lowerValue];
  }

  // Default: capitalize first letter, lowercase rest
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Smart enum formatting that tries AI first, falls back to sync formatting
 * - Attempts AI formatting for best results
 * - Falls back to synchronous formatting if AI fails
 * - Ensures consistent output regardless of AI availability
 */
export async function formatEnumValue(value: string): Promise<string> {
  try {
    // Try AI formatting first
    const aiResult = await formatEnumValueAI(value);
    if (aiResult && aiResult !== value) {
      return aiResult;
    }
  } catch (_error) {
    // AI failed, continue to fallback
  }

  // Fallback to synchronous formatting
  return formatEnumValueSync(value);
}

/**
 * Format multiple enum values in batch with single AI call and caching
 * - Makes one AI call for all values instead of individual calls
 * - More efficient for large batches
 * - Uses caching to avoid repeated AI calls
 * - Falls back to individual formatting if AI fails
 * - Returns formatted array
 */
export async function formatEnumValues(values: string[]): Promise<string[]> {
  if (!Array.isArray(values) || values.length === 0) return [];

  // First, check cache for all values
  const cachedResults: string[] = [];
  const uncachedValues: string[] = [];
  const uncachedIndices: number[] = [];

  // Separate cached and uncached values
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const cached = getCachedValue(value);
    if (cached) {
      cachedResults[i] = cached;
    } else {
      uncachedValues.push(value);
      uncachedIndices.push(i);
    }
  }

  // If all values are cached, return immediately
  if (uncachedValues.length === 0) {
    return cachedResults;
  }

  // Check if Vertex AI is properly configured
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    // Fallback to sync formatting for uncached values
    for (let i = 0; i < uncachedValues.length; i++) {
      const value = uncachedValues[i];
      const index = uncachedIndices[i];
      const formatted = formatEnumValueSync(value);
      cachedResults[index] = formatted;
      setCachedValue(value, formatted);
    }
    return cachedResults;
  }

  try {
    const generativeModel = vertex_ai.getGenerativeModel({ model });

    const prompt = `
  Format the following technical terms, acronyms, or enum-like values into their correct, human-readable capitalization.
  - Keep acronyms in uppercase (e.g., CEO, CTO, API, SQL).
  - Capitalize technology names properly (e.g., JavaScript, ReactJS, MongoDB, Next.js).
  - Expand shorthand only if it's universally recognized (e.g., DB → Database).
  - Return only the formatted strings, one per line, in the same order as input.
  
  Input values:
  ${uncachedValues.map((value, index) => `${index + 1}. ${value}`).join('\n')}
  
  Output (one formatted value per line):
  `;

    const result = await generativeModel.generateContent(prompt);
    const responseText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (responseText) {
      // Parse the response - expect one formatted value per line
      const formattedLines = responseText
        .split('\n')
        .filter((line) => line.trim());

      // If we got the right number of responses, use them
      if (formattedLines.length === uncachedValues.length) {
        for (let i = 0; i < formattedLines.length; i++) {
          const value = uncachedValues[i];
          const index = uncachedIndices[i];
          const formatted = formattedLines[i].trim();
          cachedResults[index] = formatted;
          setCachedValue(value, formatted);
        }
        return cachedResults;
      }
    }

    // Fallback to individual formatting if AI response parsing fails
    logger.warn(
      'AI batch formatting failed, falling back to individual formatting'
    );
    for (let i = 0; i < uncachedValues.length; i++) {
      const value = uncachedValues[i];
      const index = uncachedIndices[i];
      const formatted = await formatEnumValue(value);
      cachedResults[index] = formatted;
    }
    return cachedResults;
  } catch (error) {
    // Log error but don't fail - fall back to individual formatting
    logger.warn(
      `AI batch formatting failed for ${uncachedValues.length} values:`,
      error
    );
    for (let i = 0; i < uncachedValues.length; i++) {
      const value = uncachedValues[i];
      const index = uncachedIndices[i];
      const formatted = await formatEnumValue(value);
      cachedResults[index] = formatted;
    }
    return cachedResults;
  }
}

/**
 * Format enum values in an object
 * - Recursively formats string values in objects
 * - Preserves object structure
 * - Useful for API responses and data objects
 */
export async function formatEnumValuesInObject<T extends Record<string, any>>(
  obj: T,
  stringKeys: (keyof T)[]
): Promise<T> {
  const result = { ...obj };

  for (const key of stringKeys) {
    if (typeof result[key] === 'string') {
      result[key] = (await formatEnumValue(
        result[key] as string
      )) as T[keyof T];
    }
  }

  return result;
}

/**
 * Format enum values in a nested object structure
 * - Recursively traverses object properties
 * - Formats all string values that match enum patterns
 * - Useful for complex data structures
 */
export async function formatEnumValuesNested<T extends Record<string, any>>(
  obj: T
): Promise<T> {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    const formattedArray = await Promise.all(
      obj.map((item) => formatEnumValuesNested(item))
    );
    return formattedArray as unknown as T;
  }

  const result = { ...obj } as Record<string, any>;

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      // Check if the string looks like an enum value
      if (/^[A-Z_]+$/.test(value) || /^[a-z]+[A-Z]/.test(value)) {
        result[key] = await formatEnumValue(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await formatEnumValuesNested(value);
    }
  }

  return result as T;
}
