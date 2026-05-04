# Highlights Video Generation

This document describes the highlights video generation feature that automatically creates condensed video clips from assessment interviews based on AI analysis.

## Overview

The highlights video generation feature uses ffmpeg to create a condensed version of assessment videos that includes:

- Introduction segment
- High-performing moments (2-4 segments)
- Areas for improvement (1-3 segments)
- Interview closing

## How It Works

### 1. Video Analysis

During the assessment process, the AI analyzes the video and generates `highlightsInstructions` that contain:

- Precise timestamps for each segment
- Descriptions of what happens in each segment
- Reasons why segments are classified as highs or lows
- Key quotes from high moments
- Improvement suggestions for low moments

### 2. Video Processing

The `generateHighlightsVideo` function:

- Downloads the source video from storage
- Parses the highlights instructions
- Validates timestamps to ensure they're within video duration
- Uses ffmpeg to extract and concatenate the specified segments
- Uploads the generated highlights video back to storage

### 3. Integration

The highlights video generation is automatically triggered after video analysis is completed in:

- Onboarding assessments
- JD assessments (when highlights instructions are available)

## Usage

### Automatic Generation

Highlights videos are automatically generated when:

1. Video analysis is completed successfully
2. `highlightsInstructions` are present in the video analysis
3. The source video exists in storage

### Manual Generation

You can manually generate highlights videos using:

```typescript
import { generateHighlightsVideo } from "@/utils/video.helper";

const highlightsVideoUrl = await generateHighlightsVideo(
  storageProvider,
  sourceVideoPath,
  highlightsInstructions,
  "highlights.webm"
);
```

### Testing

Use the test function to verify the feature works:

```typescript
import { testHighlightsVideoGeneration } from "@/utils/video.helper";

const testHighlightsUrl = await testHighlightsVideoGeneration(
  storageProvider,
  sourceVideoPath
);
```

## Highlights Instructions Format

The `highlightsInstructions` must follow this JSON structure:

```json
{
  "introduction": {
    "startTime": 0,
    "endTime": 30,
    "description": "Candidate introduction and background",
    "keyPoints": [
      "Professional background",
      "Technical expertise",
      "Career goals"
    ]
  },
  "highs": [
    {
      "startTime": 45,
      "endTime": 90,
      "description": "Strong technical explanation",
      "reason": "Demonstrated deep understanding of the technology",
      "keyQuote": "I've worked extensively with this technology and understand its core principles."
    }
  ],
  "lows": [
    {
      "startTime": 200,
      "endTime": 240,
      "description": "Brief hesitation on complex question",
      "reason": "Took time to formulate response",
      "improvement": "Practice thinking out loud during complex problem-solving"
    }
  ],
  "interviewEnd": {
    "startTime": 300,
    "endTime": 330,
    "description": "Strong closing and summary",
    "closingThoughts": "Candidate demonstrated strong technical skills and good communication."
  }
}
```

## Technical Details

### FFmpeg Command

The system uses ffmpeg with the following parameters:

- Input: Source video file
- Filter complex: Extracts segments and concatenates them
- Output: WebM format with VP9 video codec and Opus audio codec
- Quality: 2Mbps video, 128kbps audio
- Optimization: Real-time encoding with CPU optimization

### File Structure

- Source videos: `{folderPath}/video.webm`
- Highlights videos: `{folderPath}/highlights.webm`
- Temporary files: Cleaned up automatically

### Error Handling

- Invalid timestamps are validated and logged
- Overlapping segments are detected and warned
- Processing errors don't fail the main assessment
- Temporary files are cleaned up even on errors

## Configuration

### Environment Variables

No additional environment variables are required. The feature uses existing storage and ffmpeg configurations.

### Dependencies

- ffmpeg must be installed on the system
- Storage provider must support file download/upload
- Sufficient disk space for temporary video processing

## Monitoring

The feature logs:

- Start and completion of highlights generation
- Number of segments processed
- Total duration of highlights video
- Any errors or warnings during processing

## Future Enhancements

Potential improvements:

- Custom video effects and transitions
- Multiple highlight video formats (short, medium, long)
- Integration with video editing tools
- Real-time highlights generation during live interviews
- Custom branding and overlays
