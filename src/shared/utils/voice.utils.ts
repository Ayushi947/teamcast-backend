/**
 * Utility functions for voice configuration
 */

// English Dialect Configuration
interface EnglishDialect {
  code: string;
  name: string;
  nameNative: string;
  flag: string;
  voiceOptions: {
    female: string;
    male: string;
  };
}

const createDialect = (
  code: string,
  name: string,
  nameNative: string,
  flag: string,
  fallbackCode?: string // For dialects without Chirp3-HD voices, use fallback
): EnglishDialect => {
  // Use fallback code if provided (e.g., en-CA uses en-US voices)
  const voiceCode = fallbackCode || code;
  return {
    code,
    name,
    nameNative,
    flag,
    voiceOptions: {
      female: `${voiceCode}-Chirp3-HD-Aoede`,
      male: `${voiceCode}-Chirp3-HD-Puck`,
    },
  };
};

const ENGLISH_DIALECTS: EnglishDialect[] = [
  createDialect('en-US', 'American English', 'American English', '🇺🇸'),
  createDialect('en-GB', 'British English', 'British English', '🇬🇧'),
  createDialect('en-AU', 'Australian English', 'Australian English', '🇦🇺'),
  // Canadian English uses US voices as fallback (no en-CA Chirp3-HD voices available)
  createDialect('en-CA', 'Canadian English', 'Canadian English', '🇨🇦', 'en-US'),
  createDialect('en-IN', 'Indian English', 'Indian English', '🇮🇳'),
];

/**
 * Get voice name from dialect code and gender
 * @param dialectCode - Dialect code (e.g., "en-US", "en-GB")
 * @param gender - Voice gender ("female" or "male")
 * @returns Voice name for Google Cloud TTS (e.g., "en-US-Chirp3-HD-Aoede")
 */
export function getVoiceName(
  dialectCode: string,
  gender: 'female' | 'male' = 'female'
): string {
  const dialect = ENGLISH_DIALECTS.find((d) => d.code === dialectCode);
  if (!dialect) {
    // Default to US English if dialect not found
    return gender === 'female'
      ? 'en-US-Chirp3-HD-Aoede'
      : 'en-US-Chirp3-HD-Puck';
  }
  return dialect.voiceOptions[gender];
}

/**
 * Get language code from dialect code
 * @param dialectCode - Dialect code (e.g., "en-US", "en-GB")
 * @returns Language code (e.g., "en-US")
 */
export function getLanguageCode(dialectCode: string): string {
  const dialect = ENGLISH_DIALECTS.find((d) => d.code === dialectCode);
  if (!dialect) {
    return 'en-US'; // Default to US English
  }
  // Extract language code from voice (handles fallback cases like en-CA -> en-US)
  const voiceCode = dialect.voiceOptions.female
    .split('-')
    .slice(0, 2)
    .join('-');
  return voiceCode;
}

/**
 * Get voice configuration for an assessment
 * @param dialectCode - Dialect code (e.g., "en-US", "en-GB")
 * @param gender - Voice gender ("female" or "male")
 * @returns Voice configuration object
 */
export function getVoiceConfig(
  dialectCode: string = 'en-US',
  gender: 'female' | 'male' = 'female'
): {
  voice: string;
  languageCode: string;
} {
  return {
    voice: getVoiceName(dialectCode, gender),
    languageCode: getLanguageCode(dialectCode),
  };
}
