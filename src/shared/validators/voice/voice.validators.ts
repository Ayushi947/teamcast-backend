import { z } from 'zod';

/**
 * Validator for voice synthesis requests
 */
export const voiceValidator = z.object({
  body: z.object({
    text: z
      .string()
      .min(1, { message: 'Text cannot be empty' })
      .max(5000, { message: 'Text must be at most 5000 characters long' }),
    voice: z
      .string()
      .min(1, { message: 'Voice must be specified' })
      .max(100, { message: 'Voice name must be at most 100 characters long' }),
    languageCode: z
      .string()
      .regex(/^[a-z]{2}-[A-Z]{2}$/, {
        message: "Language code must be in format 'xx-XX' (e.g., 'en-US')",
      })
      .optional(),
  }),
});

/**
 * Validator for speech to text requests
 */
export const speechToTextValidator = z.object({
  body: z
    .object({
      audioContent: z
        .string()
        .min(1, { message: 'Audio content cannot be empty' })
        .max(10000000, { message: 'Audio content must be at most 10MB' })
        .optional(),
      gcsUri: z
        .string()
        .url({ message: 'Invalid GCS URI format' })
        .regex(/^gs:\/\/[^/]+\/[^/]+.*$/, {
          message: "GCS URI must be in format 'gs://bucket-name/path/to/file'",
        })
        .optional(),
      languageCode: z
        .string()
        .regex(/^[a-z]{2}-[A-Z]{2}$/, {
          message: "Language code must be in format 'xx-XX' (e.g., 'en-US')",
        })
        .optional(),
      audioEncoding: z
        .string()
        .regex(
          /^(MP3|LINEAR16|FLAC|MULAW|AMR|AMR_WB|OGG_OPUS|WEBM_OPUS|SPEEX_WITH_HEADER_BYTE)$/,
          {
            message: 'Invalid audio encoding format',
          }
        )
        .optional(),
    })
    .refine((data) => data.audioContent || data.gcsUri, {
      message: 'Either audioContent or gcsUri must be provided',
    }),
});
