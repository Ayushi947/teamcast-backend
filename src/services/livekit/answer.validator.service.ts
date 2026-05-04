/**
 * Answer Validator Service
 *
 * Validates candidate answers to ensure they're actual answer attempts
 * and not conversational interactions (repeats, clarifications, noise).
 *
 * This serves as a backend safety net to prevent non-answers from
 * triggering unnecessary question generation.
 */

import { logger } from '@/shared/utils/logger';

/**
 * Types of response intents detected
 */
export enum ResponseIntent {
  ANSWER_ATTEMPT = 'answer_attempt',
  INCOMPLETE_ANSWER = 'incomplete_answer',
  CLARIFICATION_REQUEST = 'clarification',
  REPEAT_REQUEST = 'repeat',
  ACKNOWLEDGMENT = 'acknowledgment',
  THINKING_ALOUD = 'thinking',
  OFF_TOPIC = 'off_topic',
  TECHNICAL_ISSUE = 'technical',
  ENVIRONMENTAL_NOISE = 'noise',
  UNKNOWN = 'unknown',
}

/**
 * Result of answer validation
 */
export interface IAnswerValidationResult {
  isValid: boolean;
  intent: ResponseIntent;
  reason?: string;
  shouldRetry?: boolean; // If true, agent should ask the question again
}

/**
 * Answer Validator Service
 */
export class AnswerValidatorService {
  // Patterns for different intent types (case-insensitive)
  private static readonly patterns: Record<ResponseIntent, RegExp[]> = {
    [ResponseIntent.REPEAT_REQUEST]: [
      /\b(repeat|again|say that again|one more time|come again)\b/i,
      /\b(didn't (catch|hear|get) that)\b/i,
      /\b(pardon|sorry|excuse me)\?/i,
      /\b(what was (that|the question))\b/i,
      /\b(could you (repeat|say that))\b/i,
    ],

    [ResponseIntent.CLARIFICATION_REQUEST]: [
      /\b(what do you mean|can you (explain|clarify|elaborate))\b/i,
      /\b(I don't understand|not sure (what|if))\b/i,
      /\b(could you (clarify|rephrase|explain))\b/i,
      /\b(what exactly|specifically)\b.*\?/i,
      /\b(meaning of|define|definition)\b/i,
    ],

    [ResponseIntent.ACKNOWLEDGMENT]: [
      /^\s*(okay|ok|sure|alright|got it|I see|yeah|yes|yep|mhm|uh-huh)\s*$/i,
      /^\s*(right|correct|exactly|absolutely|definitely)\s*$/i,
      /^\s*(thanks|thank you)\s*$/i,
    ],

    [ResponseIntent.THINKING_ALOUD]: [
      /^\s*(um+|uh+|hmm+|err+|ah+)\s*$/i,
      /^\s*(let me (think|see)|give me a (second|moment))\s*$/i,
      /^\s*(well+|so+)\s*$/i,
      /^\s*(I guess|maybe|perhaps)\s*$/i,
    ],

    [ResponseIntent.TECHNICAL_ISSUE]: [
      /\b(can't hear|audio (problem|issue)|sound|volume)\b/i,
      /\b(connection|disconnect|lag|freeze)\b/i,
      /\b(microphone|mic|speaker)\b/i,
      /\b(technical (problem|issue|difficulty))\b/i,
    ],

    [ResponseIntent.OFF_TOPIC]: [
      /\b(by the way|speaking of|random|whatever)\b/i,
      /\b(weather|pizza|cat|dog|movie|game)\b/i,
      /\b(yesterday|last week|tomorrow)\b/i,
    ],

    [ResponseIntent.ANSWER_ATTEMPT]: [],
    [ResponseIntent.INCOMPLETE_ANSWER]: [],
    [ResponseIntent.ENVIRONMENTAL_NOISE]: [],
    [ResponseIntent.UNKNOWN]: [],
  };

  // Minimum word count for valid answers
  private static readonly MIN_ANSWER_WORDS = 8;
  private static readonly MAX_THINKING_WORDS = 5;

  // Patterns to detect incomplete/broken speech
  private static readonly INCOMPLETE_PATTERNS: RegExp[] = [
    /\.\.\.\s*$/i, // Trailing off: "I have worked..."
    /\b(um|uh|hmm)\.\.\.\s*$/i, // Hesitation trailing: "Um..."
    /-\s*$/i, // Interrupted: "I was thinking-"
    /\bbreak\b/i, // Explicit break: "I understand.. break"
    /^(so|well|like)\s+\w+\s*$/i, // Fragmented start: "So basically"
  ];

  /**
   * Validate if the answer is a genuine answer attempt or a conversational interaction
   *
   * @param answer - The candidate's response text
   * @param question - The question that was asked (for context)
   * @returns Validation result with intent classification
   */
  static validateAnswer(
    answer: string,
    question?: string
  ): IAnswerValidationResult {
    if (!answer || !answer.trim()) {
      return {
        isValid: false,
        intent: ResponseIntent.ENVIRONMENTAL_NOISE,
        reason: 'Empty or whitespace-only answer',
        shouldRetry: true,
      };
    }

    const text = answer.trim();
    const textLower = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;

    logger.info('Validating answer', {
      context: 'AnswerValidatorService.validateAnswer',
      answerPreview: text.substring(0, 100),
      wordCount,
      questionPreview: question?.substring(0, 100),
    });

    // 1. Check for very short responses (likely noise or acknowledgment)
    if (wordCount <= 2) {
      return {
        isValid: false,
        intent: ResponseIntent.ENVIRONMENTAL_NOISE,
        reason: `Too short: ${wordCount} words`,
        shouldRetry: true,
      };
    }

    // 2. Check pattern-based intents
    for (const [intent, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(textLower)) {
          logger.info('Matched intent pattern', {
            context: 'AnswerValidatorService.validateAnswer',
            intent,
            pattern: pattern.source,
          });

          return {
            isValid: false,
            intent: intent as ResponseIntent,
            reason: `Matched pattern for ${intent}`,
            shouldRetry: true,
          };
        }
      }
    }

    // 3. Check for very short acknowledgments
    if (wordCount <= 3) {
      return {
        isValid: false,
        intent: ResponseIntent.ACKNOWLEDGMENT,
        reason: `Very short response: ${wordCount} words`,
        shouldRetry: true,
      };
    }

    // 4. Check for question marks (likely clarification request)
    if (text.endsWith('?') && wordCount < 15) {
      return {
        isValid: false,
        intent: ResponseIntent.CLARIFICATION_REQUEST,
        reason: 'Response ends with question mark',
        shouldRetry: true,
      };
    }

    // 5. Check for thinking aloud patterns
    if (wordCount <= this.MAX_THINKING_WORDS) {
      const hesitationWords = ['um', 'uh', 'hmm', 'err', 'well', 'so', 'like'];
      if (
        hesitationWords.some((word) => textLower.split(/\s+/).includes(word))
      ) {
        return {
          isValid: false,
          intent: ResponseIntent.THINKING_ALOUD,
          reason: 'Contains hesitation words',
          shouldRetry: true,
        };
      }
    }

    // 6. Check for incomplete/broken speech patterns
    for (const pattern of this.INCOMPLETE_PATTERNS) {
      if (pattern.test(text)) {
        logger.info('Answer detected as incomplete/broken speech', {
          context: 'AnswerValidatorService.validateAnswer',
          pattern: pattern.source,
        });

        return {
          isValid: false,
          intent: ResponseIntent.INCOMPLETE_ANSWER,
          reason: 'Incomplete or broken speech pattern detected',
          shouldRetry: true,
        };
      }
    }

    // 7. Check if answer has sufficient length
    if (wordCount >= this.MIN_ANSWER_WORDS) {
      logger.info('Answer validated as valid attempt', {
        context: 'AnswerValidatorService.validateAnswer',
        wordCount,
      });

      return {
        isValid: true,
        intent: ResponseIntent.ANSWER_ATTEMPT,
        shouldRetry: false,
      };
    }

    // 8. Ambiguous case - require more words for confidence
    return {
      isValid: false,
      intent: ResponseIntent.UNKNOWN,
      reason: `Ambiguous response: ${wordCount} words (minimum ${this.MIN_ANSWER_WORDS} required)`,
      shouldRetry: true,
    };
  }

  /**
   * Check if an answer should trigger new question generation
   *
   * @param answer - The candidate's response text
   * @param question - The question that was asked
   * @returns True if should generate next question, false otherwise
   */
  static shouldGenerateNextQuestion(
    answer: string,
    question?: string
  ): boolean {
    const validation = this.validateAnswer(answer, question);
    return validation.isValid;
  }
}
