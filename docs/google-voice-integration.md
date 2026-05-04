# Google Voice Integration Guide

This document provides guidelines for integrating with the Teamcast Voice API, which uses Google Cloud's Text-to-Speech and Speech-to-Text services.

## Prerequisites

1. Google Cloud Account with the following APIs enabled:

   - Cloud Text-to-Speech API
   - Cloud Speech-to-Text API

2. Required npm packages:

   ```bash
   npm install @google-cloud/text-to-speech @google-cloud/speech
   ```

3. Google Cloud credentials (either through environment variables or service account key)

## API Endpoints

### 1. Text-to-Speech Synthesis

**Endpoint:** `POST /voice/synthesize`

**Request Body:**

```json
{
  "text": "Text to convert to speech",
  "voice": "en-US-Neural2-F",
  "languageCode": "en-US" // optional
}
```

**Response:**

```json
{
  "audioContent": "base64EncodedAudioContent...",
  "audioConfig": {
    "audioEncoding": "MP3",
    "speakingRate": 1.0,
    "pitch": 0
  }
}
```

### 2. Speech-to-Text Transcription

**Endpoint:** `POST /voice/transcribe`

**Request Body:**

```json
{
  "audioContent": "base64EncodedAudioContent...",
  "languageCode": "en-US", // optional
  "audioEncoding": "MP3" // optional
}
```

**Response:**

```json
{
  "text": "Transcribed text from audio",
  "confidence": 0.95
}
```

## Available Voices

The API supports various voices from Google Cloud Text-to-Speech. Some popular options:

- `en-US-Neural2-F`: Female voice (US English)
- `en-US-Neural2-D`: Male voice (US English)
- `en-GB-Neural2-A`: Female voice (British English)
- `en-GB-Neural2-B`: Male voice (British English)

For a complete list of available voices, refer to the [Google Cloud Text-to-Speech documentation](https://cloud.google.com/text-to-speech/docs/voices).

## Audio Encoding Formats

Supported audio encoding formats for speech-to-text:

- `MP3`
- `LINEAR16`
- `FLAC`
- `MULAW`
- `AMR`
- `AMR_WB`
- `OGG_OPUS`

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "status": 400
  }
}
```

Common error codes:

- `400`: Invalid request (e.g., missing required fields)
- `401`: Unauthorized
- `500`: Internal server error

## Best Practices

1. **Audio Content Size:**

   - Keep audio content under 10MB for transcription
   - For text-to-speech, keep text under 5000 characters

2. **Language Codes:**

   - Use standard language codes (e.g., "en-US", "fr-FR")
   - Always specify language code when working with non-English content

3. **Error Handling:**

   - Implement proper error handling for API responses
   - Handle network timeouts and retries appropriately

4. **Security:**
   - Never expose Google Cloud credentials in client-side code
   - Use environment variables for sensitive configuration

## Example Usage

### Text-to-Speech

```typescript
const response = await fetch('/voice/synthesize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello, this is a test message',
    voice: 'en-US-Neural2-F',
    languageCode: 'en-US',
  }),
});

const { audioContent } = await response.json();
// Play audio using the base64 content
```

### Speech-to-Text

```typescript
// Convert audio file to base64
const audioFile = await fileToBase64(audioBlob);

const response = await fetch('/voice/transcribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    audioContent: audioFile,
    languageCode: 'en-US',
    audioEncoding: 'MP3',
  }),
});

const { text, confidence } = await response.json();
```

## Rate Limits and Quotas

- Text-to-Speech: 100 requests per minute
- Speech-to-Text: 60 requests per minute

Monitor your usage through the Google Cloud Console to avoid hitting quota limits.

## Support

For issues or questions:

1. Check the [Google Cloud documentation](https://cloud.google.com/text-to-speech/docs)
2. Contact the Teamcast support team
3. Open an issue in the project repository
