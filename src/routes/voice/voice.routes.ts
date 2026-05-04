import express from 'express';
import { VoiceController } from '@/controllers/voice/voice.controller';
import { VoiceService } from '@/services/voice/voice.service';
import {
  voiceValidator,
  speechToTextValidator,
} from '@/shared/validators/voice/voice.validators';
import { validateRequest } from '@/middleware';

const router = express.Router();

// Services
const voiceService = new VoiceService();

// Controllers
const voiceController = new VoiceController(voiceService);

/**
 * @openapi
 * /voice/synthesize:
 *   post:
 *     summary: Synthesize text to speech
 *     description: Convert text to speech using Google Cloud Text-to-Speech
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IVoiceSynthesizeRequest'
 *     responses:
 *       200:
 *         description: Speech synthesis successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IVoiceApiResponse'
 */

router.post(
  '/synthesize',
  validateRequest(voiceValidator),
  voiceController.synthesizeSpeech
);

/**
 * @openapi
 * /voice/transcribe:
 *   post:
 *     summary: Transcribe speech to text
 *     description: Convert speech to text using Google Cloud Speech-to-Text
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ISpeechToTextRequest'
 *     responses:
 *       200:
 *         description: Speech transcription successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ISpeechToTextApiResponse'
 */

router.post(
  '/transcribe',
  validateRequest(speechToTextValidator),
  voiceController.transcribeSpeech
);

export default router;
