import { singleton } from '@/shared/decorators/singleton';
import {
  VideoIntelligenceServiceClient,
  protos,
} from '@google-cloud/video-intelligence';
import { VertexAI } from '@google-cloud/vertexai';
import { gcpConfig } from '@/config/gcp';
import { logger } from '@/shared/utils/logger';
import prisma from '@/config/database';
import { ENV } from '@/config/env';
import { Prisma } from '@prisma/client';

export interface ChunkAnalysis {
  chunkIndex: number;
  timestamp: number; // Start time in seconds
  facePresence: {
    present: boolean;
    duration: number; // Seconds face was visible
    attentiveness: number; // 0-1 score
  };
  personCount: {
    max: number;
    violation: boolean; // More than 1 person detected
  };
  engagement: {
    positiveEmotions: number; // 0-1 score
    engagement: number; // 0-1 score
  };
  videoTranscript: string; // Backup transcription from video
  activities: string[]; // Detected activities/labels
  confidenceMetrics: {
    overall: number; // 0-1 overall confidence in this chunk's analysis
  };
}

export interface FinalAnalysis {
  transcriptText?: string;
  overallScore?: number;
  overallFeedback?: string;
  engagementScore?: number;
  engagementFeedback?: string;
  confidenceScore?: number;
  confidenceFeedback?: string;
  clarityScore?: number;
  clarityFeedback?: string;
  professionalDemeanorScore?: number;
  professionalDemeanorFeedback?: string;
  proctoringScore?: number;
  proctoringFeedback?: string;
  areasForImprovement?: string[];
  strengths?: string[];
  // Additional metadata from chunk analysis
  _metadata?: {
    chunks: ChunkAnalysis[];
    patterns: {
      engagementTrend: 'improving' | 'declining' | 'stable';
      violations: number;
      facePresenceRate: number;
      transcriptAlignment: number;
    };
    confidence: number;
  };
}

@singleton
export class IntelligentChunkAnalysisService {
  private videoClient: VideoIntelligenceServiceClient;
  private vertexAI: VertexAI;
  private model: string;
  private location: string;
  private projectId: string;

  // Rate limiting for Google Cloud Video Intelligence API
  // API limit: 60 calls per minute
  private readonly MAX_CALLS_PER_MINUTE = 60;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  private callTimestamps: number[] = [];
  private analysisQueue: Array<{
    chunkGcsUri: string;
    chunkIndex: number;
    assessmentId: string;
    assessmentType?: 'onboarding' | 'job' | 'public-practice';
    resolve: (value: ChunkAnalysis) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessingQueue = false;

  constructor() {
    this.videoClient = gcpConfig.getVideoIntelligenceClient();
    this.vertexAI = gcpConfig.getVertexAI();
    this.model = ENV.GOOGLE_CLOUD_VERTEX_AI_MODEL;
    this.location = ENV.GOOGLE_CLOUD_VERTEX_AI_LOCATION;
    this.projectId = ENV.GOOGLE_CLOUD_PROJECT_ID;

    logger.info('IntelligentChunkAnalysisService initialized', {
      model: this.model,
      location: this.location,
      projectId: this.projectId,
      rateLimitConfig: {
        maxCallsPerMinute: this.MAX_CALLS_PER_MINUTE,
        windowMs: this.RATE_LIMIT_WINDOW_MS,
      },
    });
  }

  /**
   * Check if we can make an API call without exceeding rate limit
   */
  private canMakeApiCall(): boolean {
    const now = Date.now();
    // Remove timestamps older than the rate limit window
    this.callTimestamps = this.callTimestamps.filter(
      (timestamp) => now - timestamp < this.RATE_LIMIT_WINDOW_MS
    );
    return this.callTimestamps.length < this.MAX_CALLS_PER_MINUTE;
  }

  /**
   * Record an API call timestamp
   */
  private recordApiCall(): void {
    this.callTimestamps.push(Date.now());
  }

  /**
   * Calculate delay needed before next API call
   */
  private getDelayUntilNextCall(): number {
    if (this.canMakeApiCall()) {
      return 0;
    }
    // Wait until the oldest call expires
    const oldestCall = this.callTimestamps[0];
    const now = Date.now();
    const delay = this.RATE_LIMIT_WINDOW_MS - (now - oldestCall) + 100; // Add 100ms buffer
    return Math.max(0, delay);
  }

  /**
   * Process the analysis queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return; // Already processing
    }

    this.isProcessingQueue = true;

    while (this.analysisQueue.length > 0) {
      // Check if we can make an API call
      if (!this.canMakeApiCall()) {
        const delay = this.getDelayUntilNextCall();
        logger.info('Rate limit reached, waiting before next analysis', {
          queueLength: this.analysisQueue.length,
          delayMs: delay,
          currentCallsInWindow: this.callTimestamps.length,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Get next item from queue
      const item = this.analysisQueue.shift();
      if (!item) break;

      try {
        // Record the API call
        this.recordApiCall();

        // Perform the analysis
        const result = await this.performChunkAnalysis(
          item.chunkGcsUri,
          item.chunkIndex,
          item.assessmentId,
          item.assessmentType
        );
        item.resolve(result);
      } catch (error) {
        item.reject(error as Error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Analyze individual video chunk (with rate limiting)
   * This method queues the analysis request and returns a promise
   */
  async analyzeChunk(
    chunkGcsUri: string,
    chunkIndex: number,
    assessmentId: string,
    assessmentType?: 'onboarding' | 'job' | 'public-practice'
  ): Promise<ChunkAnalysis> {
    logger.info('Queueing chunk analysis', {
      chunkIndex,
      assessmentId,
      chunkGcsUri,
      currentQueueLength: this.analysisQueue.length,
    });

    // Create a promise that will be resolved when the analysis completes
    return new Promise<ChunkAnalysis>((resolve, reject) => {
      // Add to queue
      this.analysisQueue.push({
        chunkGcsUri,
        chunkIndex,
        assessmentId,
        assessmentType,
        resolve,
        reject,
      });

      // Start processing queue if not already processing
      this.processQueue().catch((error) => {
        logger.error('Error processing analysis queue', {
          error: error instanceof Error ? error.message : error,
        });
      });
    });
  }

  /**
   * Perform the actual chunk analysis (called by queue processor)
   */
  private async performChunkAnalysis(
    chunkGcsUri: string,
    chunkIndex: number,
    assessmentId: string,
    assessmentType?: 'onboarding' | 'job' | 'public-practice'
  ): Promise<ChunkAnalysis> {
    logger.info('Starting chunk analysis (from queue)', {
      chunkIndex,
      assessmentId,
      chunkGcsUri,
    });

    try {
      // Submit video analysis job to Google Video Intelligence API
      const operation = await this.videoClient.annotateVideo({
        inputUri: chunkGcsUri,
        features: [
          protos.google.cloud.videointelligence.v1.Feature.FACE_DETECTION,
          protos.google.cloud.videointelligence.v1.Feature.PERSON_DETECTION,
          protos.google.cloud.videointelligence.v1.Feature.SPEECH_TRANSCRIPTION,
          protos.google.cloud.videointelligence.v1.Feature.LABEL_DETECTION,
        ],
        videoContext: {
          faceDetectionConfig: {
            includeBoundingBoxes: true,
            includeAttributes: true, // Emotions, headwear, etc.
          },
          personDetectionConfig: {
            includeBoundingBoxes: true,
            includePoseLandmarks: true, // Body posture
            includeAttributes: true,
          },
          speechTranscriptionConfig: {
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
            enableWordConfidence: true,
          },
        },
      });

      logger.info('Video Intelligence operation started', {
        chunkIndex,
        operationName: operation[0]?.name,
      });

      // Wait for analysis to complete
      const [response] = await operation[0].promise();

      logger.info('Video Intelligence analysis complete', {
        chunkIndex,
      });

      // Process results
      const analysis = this.processChunkResults(
        response,
        chunkIndex,
        assessmentId
      );

      // Generate signed URL for playback
      let publicUrl: string | undefined;
      try {
        const { GcpStorageProvider } = await import(
          '@/services/helpers/storage/provider/gcp.provider'
        );
        const storageProvider = new GcpStorageProvider();
        const filePath = chunkGcsUri.replace(`gs://${ENV.BUCKET_NAME}/`, '');

        // Generate signed URL (TTL from ENV.PRE_SIGNED_URL_EXPIRY_SECONDS)
        publicUrl = await storageProvider.generatePreSignedUrl(
          filePath,
          'read'
        );

        logger.info('Generated signed URL for chunk', {
          chunkIndex,
          assessmentId,
          ttlSeconds: ENV.PRE_SIGNED_URL_EXPIRY_SECONDS,
        });
      } catch (error) {
        logger.warn('Failed to generate signed URL for chunk', {
          chunkIndex,
          assessmentId,
          error: error instanceof Error ? error.message : error,
        });
      }

      // Upsert chunk record - create if doesn't exist, update if it does
      // Use the correct table based on assessment type
      if (assessmentType === 'public-practice') {
        const existingChunk =
          await prisma.public_practice_assessment_video_chunk_analysis.findFirst(
            {
              where: { assessmentId, chunkIndex },
              select: { sectionId: true, questionId: true },
            }
          );

        if (!existingChunk) {
          logger.warn('Chunk not found for analysis - skipping DB update', {
            assessmentId,
            chunkIndex,
            note: 'Chunk should be created by recordChunkUpload before analysis',
          });
          return analysis; // Return analysis but don't update DB
        }

        // Use upsert with sectionId from existing chunk
        await prisma.public_practice_assessment_video_chunk_analysis.upsert({
          where: {
            public_practice_video_chunk_analysis_assessment_id_chunk_index_section_id_key:
              {
                assessmentId,
                chunkIndex,
                sectionId: existingChunk.sectionId ?? null,
              } as Prisma.public_practice_assessment_video_chunk_analysisWhereUniqueInput['public_practice_video_chunk_analysis_assessment_id_chunk_index_section_id_key'],
          },
          create: {
            assessmentId,
            chunkIndex,
            sectionId: existingChunk.sectionId || null,
            questionId: existingChunk.questionId || null,
            gcsUri: chunkGcsUri,
            publicUrl,
            analysis: analysis as any,
            status: 'completed',
            processedAt: new Date(),
            isRelevant: !!existingChunk.questionId,
          },
          update: {
            publicUrl,
            analysis: analysis as any,
            status: 'completed',
            processedAt: new Date(),
          },
        });
      } else if (assessmentType === 'job') {
        const existingChunk =
          await prisma.jobAiAssessmentVideoChunkAnalysis.findFirst({
            where: { assessmentId, chunkIndex },
            select: { sectionId: true, questionId: true },
          });

        if (!existingChunk) {
          logger.warn('Chunk not found for analysis - skipping DB update', {
            assessmentId,
            chunkIndex,
            note: 'Chunk should be created by recordChunkUpload before analysis',
          });
          return analysis; // Return analysis but don't update DB
        }

        // Use upsert with sectionId from existing chunk
        await prisma.jobAiAssessmentVideoChunkAnalysis.upsert({
          where: {
            job_ai_video_chunk_analysis_assessment_id_chunk_index_section_id_key:
              {
                assessmentId,
                chunkIndex,
                sectionId: existingChunk.sectionId ?? null,
              } as Prisma.JobAiAssessmentVideoChunkAnalysisWhereUniqueInput['job_ai_video_chunk_analysis_assessment_id_chunk_index_section_id_key'],
          },
          create: {
            assessmentId,
            chunkIndex,
            sectionId: existingChunk.sectionId || null,
            questionId: existingChunk.questionId || null,
            gcsUri: chunkGcsUri,
            publicUrl,
            analysis: analysis as any,
            status: 'completed',
            processedAt: new Date(),
            isRelevant: !!existingChunk.questionId,
          },
          update: {
            publicUrl,
            analysis: analysis as any,
            status: 'completed',
            processedAt: new Date(),
          },
        });
      } else {
        // Default to onboarding table
        await prisma.videoChunkAnalysis.upsert({
          where: {
            video_chunk_analysis_assessment_id_chunk_index_key: {
              assessmentId,
              chunkIndex,
            },
          },
          create: {
            assessmentId,
            chunkIndex,
            gcsUri: chunkGcsUri,
            publicUrl,
            analysis: analysis as any,
            status: 'completed',
            processedAt: new Date(),
            isRelevant: true,
          },
          update: {
            publicUrl,
            analysis: analysis as any,
            status: 'completed',
            processedAt: new Date(),
          },
        });
      }

      logger.info('Chunk analysis saved to database', {
        chunkIndex,
        assessmentId,
      });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing video chunk', {
        chunkIndex,
        assessmentId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Process Video Intelligence API results
   */
  private processChunkResults(
    response: any,
    chunkIndex: number,
    _assessmentId: string
  ): ChunkAnalysis {
    const annotations = response.annotationResults?.[0];

    if (!annotations) {
      logger.warn('No annotation results found', { chunkIndex });
      return this.getEmptyAnalysis(chunkIndex);
    }

    return {
      chunkIndex,
      timestamp: chunkIndex * 30, // 30-second chunks
      facePresence: this.analyzeFacePresence(
        annotations.faceDetectionAnnotations
      ),
      personCount: this.analyzePersonCount(
        annotations.personDetectionAnnotations
      ),
      engagement: this.calculateEngagement(annotations),
      videoTranscript: this.extractTranscript(annotations.speechTranscriptions),
      activities: this.extractActivities(annotations.segmentLabelAnnotations),
      confidenceMetrics: {
        overall: this.calculateOverallConfidence(annotations),
      },
    };
  }

  private analyzeFacePresence(
    faceAnnotations: any[]
  ): ChunkAnalysis['facePresence'] {
    if (!faceAnnotations || faceAnnotations.length === 0) {
      return { present: false, duration: 0, attentiveness: 0 };
    }

    const totalFrames = faceAnnotations.length;
    const framesWithFace = faceAnnotations.filter(
      (f) => f.tracks && f.tracks.length > 0
    ).length;
    const facePresenceRate = framesWithFace / totalFrames;

    return {
      present: facePresenceRate > 0.8, // 80% threshold
      duration: facePresenceRate * 30, // 30-second chunk
      attentiveness: facePresenceRate,
    };
  }

  private analyzePersonCount(
    personAnnotations: any[]
  ): ChunkAnalysis['personCount'] {
    if (!personAnnotations || personAnnotations.length === 0) {
      return { max: 0, violation: false };
    }

    const maxPersons = Math.max(
      ...personAnnotations.map((p) => p.tracks?.length || 0),
      0
    );

    return {
      max: maxPersons,
      violation: maxPersons > 1,
    };
  }

  private calculateEngagement(annotations: any): ChunkAnalysis['engagement'] {
    // Simple engagement calculation based on face presence and movement
    const facePresence = this.analyzeFacePresence(
      annotations.faceDetectionAnnotations
    );

    return {
      positiveEmotions: 0.5, // Placeholder - would analyze facial emotions if available
      engagement: facePresence.attentiveness,
    };
  }

  private extractTranscript(speechTranscriptions: any[]): string {
    if (!speechTranscriptions || speechTranscriptions.length === 0) {
      return '';
    }

    return speechTranscriptions
      .map((t) => t.alternatives?.[0]?.transcript || '')
      .filter(Boolean)
      .join(' ');
  }

  private extractActivities(labelAnnotations: any[]): string[] {
    if (!labelAnnotations || labelAnnotations.length === 0) {
      return [];
    }

    return labelAnnotations
      .map((l) => l.entity?.description)
      .filter(Boolean)
      .slice(0, 5); // Top 5 activities
  }

  private calculateOverallConfidence(annotations: any): number {
    // Simple confidence calculation - would be more sophisticated in production
    const hasFace = annotations.faceDetectionAnnotations?.length > 0;
    const hasTranscript = annotations.speechTranscriptions?.length > 0;

    return (hasFace ? 0.5 : 0) + (hasTranscript ? 0.5 : 0);
  }

  private getEmptyAnalysis(chunkIndex: number): ChunkAnalysis {
    return {
      chunkIndex,
      timestamp: chunkIndex * 30,
      facePresence: { present: false, duration: 0, attentiveness: 0 },
      personCount: { max: 0, violation: false },
      engagement: { positiveEmotions: 0, engagement: 0 },
      videoTranscript: '',
      activities: [],
      confidenceMetrics: { overall: 0 },
    };
  }

  /**
   * Synthesize final analysis from all chunks
   */
  async synthesizeFinalAnalysis(
    assessmentId: string,
    assessmentType?: 'onboarding' | 'job' | 'public-practice'
  ): Promise<FinalAnalysis> {
    logger.info('Synthesizing final analysis', {
      assessmentId,
      assessmentType,
    });

    // Get all RELEVANT chunk analyses (excluding superseded attempts)
    // Try public-practice table first, then job AI assessment table, then fall back to onboarding table
    let chunks: any[] = [];

    if (assessmentType === 'public-practice') {
      chunks =
        await prisma.public_practice_assessment_video_chunk_analysis.findMany({
          where: {
            assessmentId,
            isRelevant: true,
            status: 'completed',
          },
          orderBy: { chunkIndex: 'asc' },
        });
    }

    if (chunks.length === 0 && (assessmentType === 'job' || !assessmentType)) {
      chunks = await prisma.jobAiAssessmentVideoChunkAnalysis.findMany({
        where: {
          assessmentId,
          isRelevant: true,
          status: 'completed',
        },
        orderBy: { chunkIndex: 'asc' },
      });
    }

    // If no chunks found in job table, try onboarding table
    if (
      chunks.length === 0 &&
      (assessmentType === 'onboarding' || !assessmentType)
    ) {
      chunks = await prisma.videoChunkAnalysis.findMany({
        where: {
          assessmentId,
          isRelevant: true,
          status: 'completed',
        },
        orderBy: { chunkIndex: 'asc' },
      });
    }

    if (chunks.length === 0) {
      throw new Error('No chunk analyses found for assessment');
    }

    logger.info('Found relevant chunks for final analysis', {
      assessmentId,
      chunkCount: chunks.length,
    });

    const chunkAnalyses: ChunkAnalysis[] = chunks.map((c) => c.analysis as any);

    // Calculate temporal patterns
    const patterns = {
      engagementTrend: this.calculateEngagementTrend(chunkAnalyses),
      violations: chunkAnalyses.filter((c) => c.personCount.violation).length,
      facePresenceRate:
        chunkAnalyses.filter((c) => c.facePresence.present).length /
        chunks.length,
      transcriptAlignment: 0.9, // Placeholder - would compare video STT with live STT
    };

    // Extract full transcript from all chunks
    const transcriptText = chunkAnalyses
      .map((c) => c.videoTranscript)
      .filter(Boolean)
      .join(' ');

    // Use Vertex AI Gemini to synthesize insights
    const generativeModel = this.vertexAI.preview.getGenerativeModel({
      model: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}`,
    });

    const prompt = `You are an expert interview evaluator analyzing video-based interview performance. Analyze this interview based on chunk-by-chunk video analysis data and provide a comprehensive assessment.

CHUNK ANALYSIS DATA:
${JSON.stringify(chunkAnalyses, null, 2)}

TEMPORAL PATTERNS:
${JSON.stringify(patterns, null, 2)}

TRANSCRIPT:
${transcriptText || 'No transcript available'}

Provide a comprehensive assessment with the following structure (respond ONLY with valid JSON):

{
  "overallScore": number (0-1, average of engagement, confidence, clarity, and professionalDemeanor scores),
  "overallFeedback": string (comprehensive overall assessment with specific observations),

  "engagementScore": number (0-1, based on face presence, attentiveness, and engagement patterns),
  "engagementFeedback": string (detailed feedback on candidate's engagement level throughout the interview),

  "confidenceScore": number (0-1, based on speech patterns, body language, and engagement trend),
  "confidenceFeedback": string (detailed feedback on candidate's confidence and composure),

  "clarityScore": number (0-1, based on transcript quality and speech transcription data),
  "clarityFeedback": string (detailed feedback on communication clarity and articulation),

  "professionalDemeanorScore": number (0-1, based on activities detected, face presence, and overall behavior),
  "professionalDemeanorFeedback": string (detailed feedback on professional behavior and presentation),

  "proctoringScore": number (0-1, based on person count violations, face presence rate, and suspicious activities - 1.0 means no violations),
  "proctoringFeedback": string (detailed feedback on proctoring compliance, violations detected, and integrity concerns),

  "strengths": array of strings (3-5 specific strengths with timestamps when possible),
  "areasForImprovement": array of strings (3-5 specific areas for improvement with timestamps when possible)
}

CRITICAL REQUIREMENTS:
1. ALL scores must be between 0 and 1
2. overallScore MUST be calculated as: (engagementScore + confidenceScore + clarityScore + professionalDemeanorScore) / 4
3. proctoringScore should be 1.0 if no violations detected (violations = 0), lower if violations exist
4. Each feedback field must be detailed (minimum 2-3 sentences) with specific observations
5. Include timestamps in strengths and areasForImprovement when relevant (e.g., "At 1:30, demonstrated strong...")
6. Consider temporal patterns - mention if candidate improved or declined over time
7. Respond ONLY with the JSON object, no additional text

Respond with ONLY the JSON object:`;

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Parse Gemini's response
    let parsedAnalysis: any;
    try {
      // Extract JSON from response (handle markdown code blocks if present)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      parsedAnalysis = JSON.parse(jsonString);
    } catch (error) {
      logger.error('Failed to parse Gemini response', {
        assessmentId,
        error: error instanceof Error ? error.message : error,
        responseText,
      });
      // Provide fallback analysis
      parsedAnalysis = this.generateFallbackAnalysis(
        chunkAnalyses,
        patterns,
        transcriptText
      );
    }

    // Calculate overall confidence
    const confidence = this.calculateFinalConfidence(chunkAnalyses, patterns);

    const finalAnalysis: FinalAnalysis = {
      transcriptText,
      overallScore: parsedAnalysis.overallScore ?? 0.5,
      overallFeedback:
        parsedAnalysis.overallFeedback ?? 'Analysis completed successfully.',
      engagementScore: parsedAnalysis.engagementScore ?? 0.5,
      engagementFeedback:
        parsedAnalysis.engagementFeedback ??
        'Engagement analysis not available.',
      confidenceScore: parsedAnalysis.confidenceScore ?? 0.5,
      confidenceFeedback:
        parsedAnalysis.confidenceFeedback ??
        'Confidence analysis not available.',
      clarityScore: parsedAnalysis.clarityScore ?? 0.5,
      clarityFeedback:
        parsedAnalysis.clarityFeedback ?? 'Clarity analysis not available.',
      professionalDemeanorScore:
        parsedAnalysis.professionalDemeanorScore ?? 0.5,
      professionalDemeanorFeedback:
        parsedAnalysis.professionalDemeanorFeedback ??
        'Professional demeanor analysis not available.',
      proctoringScore: parsedAnalysis.proctoringScore ?? 1.0,
      proctoringFeedback:
        parsedAnalysis.proctoringFeedback ??
        'No proctoring violations detected.',
      strengths: parsedAnalysis.strengths ?? [],
      areasForImprovement: parsedAnalysis.areasForImprovement ?? [],
      _metadata: {
        chunks: chunkAnalyses,
        patterns,
        confidence,
      },
    };

    logger.info('Final analysis complete', {
      assessmentId,
      confidence,
      violations: patterns.violations,
      overallScore: finalAnalysis.overallScore,
      engagementScore: finalAnalysis.engagementScore,
      confidenceScore: finalAnalysis.confidenceScore,
      clarityScore: finalAnalysis.clarityScore,
      professionalDemeanorScore: finalAnalysis.professionalDemeanorScore,
      proctoringScore: finalAnalysis.proctoringScore,
    });

    return finalAnalysis;
  }

  private calculateEngagementTrend(
    chunks: ChunkAnalysis[]
  ): 'improving' | 'declining' | 'stable' {
    if (chunks.length < 2) return 'stable';

    const firstHalf = chunks.slice(0, Math.floor(chunks.length / 2));
    const secondHalf = chunks.slice(Math.floor(chunks.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, c) => sum + c.engagement.engagement, 0) /
      firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, c) => sum + c.engagement.engagement, 0) /
      secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  private calculateFinalConfidence(
    chunks: ChunkAnalysis[],
    patterns: any
  ): number {
    let confidence = 1.0;

    // Reduce confidence for violations
    if (patterns.violations > 0) confidence *= 0.5;

    // Reduce confidence for poor face presence
    if (patterns.facePresenceRate < 0.7) confidence *= 0.7;

    // Reduce confidence if chunks have low individual confidence
    const avgChunkConfidence =
      chunks.reduce((sum, c) => sum + c.confidenceMetrics.overall, 0) /
      chunks.length;
    confidence *= avgChunkConfidence;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate fallback analysis when Gemini parsing fails
   */
  private generateFallbackAnalysis(
    chunks: ChunkAnalysis[],
    patterns: any,
    transcriptText: string
  ): any {
    // Calculate average engagement from chunks
    const avgEngagement =
      chunks.reduce((sum, c) => sum + c.engagement.engagement, 0) /
      chunks.length;

    // Calculate proctoring score based on violations
    const proctoringScore =
      patterns.violations === 0
        ? 1.0
        : Math.max(0, 1.0 - patterns.violations * 0.2);

    // Estimate confidence based on engagement trend
    const confidenceScore =
      patterns.engagementTrend === 'improving'
        ? 0.7
        : patterns.engagementTrend === 'declining'
          ? 0.4
          : 0.6;

    // Estimate clarity based on transcript availability
    const clarityScore = transcriptText ? 0.6 : 0.3;

    // Estimate professional demeanor based on face presence
    const professionalDemeanorScore = patterns.facePresenceRate;

    // Calculate overall score
    const overallScore =
      (avgEngagement +
        confidenceScore +
        clarityScore +
        professionalDemeanorScore) /
      4;

    return {
      overallScore,
      overallFeedback: `Automated analysis completed with ${chunks.length} video chunks analyzed. Face presence rate: ${(patterns.facePresenceRate * 100).toFixed(1)}%. Engagement trend: ${patterns.engagementTrend}. ${patterns.violations > 0 ? `${patterns.violations} proctoring violation(s) detected.` : 'No proctoring violations detected.'}`,
      engagementScore: avgEngagement,
      engagementFeedback: `Candidate demonstrated ${avgEngagement > 0.7 ? 'strong' : avgEngagement > 0.5 ? 'moderate' : 'limited'} engagement throughout the interview. Engagement trend was ${patterns.engagementTrend} over the course of the interview.`,
      confidenceScore,
      confidenceFeedback: `Based on engagement patterns and behavioral analysis, candidate showed ${confidenceScore > 0.7 ? 'strong' : confidenceScore > 0.5 ? 'moderate' : 'developing'} confidence levels.`,
      clarityScore,
      clarityFeedback: transcriptText
        ? 'Speech transcription was captured successfully. Communication appeared clear based on available audio data.'
        : 'Limited audio transcription available. Unable to fully assess communication clarity.',
      professionalDemeanorScore,
      professionalDemeanorFeedback: `Professional demeanor assessed based on video presence. Face visibility rate: ${(patterns.facePresenceRate * 100).toFixed(1)}%. ${patterns.facePresenceRate > 0.8 ? 'Maintained consistent professional presence.' : 'Some gaps in video presence noted.'}`,
      proctoringScore,
      proctoringFeedback:
        patterns.violations === 0
          ? 'No proctoring violations detected. Candidate maintained proper interview environment.'
          : `${patterns.violations} proctoring violation(s) detected, including ${patterns.violations > 1 ? 'multiple person detection or other' : ''} integrity concerns.`,
      strengths: [
        patterns.facePresenceRate > 0.8 &&
          'Maintained consistent video presence throughout interview',
        avgEngagement > 0.6 && 'Demonstrated good engagement levels',
        patterns.violations === 0 &&
          'Maintained interview integrity with no violations',
      ].filter(Boolean),
      areasForImprovement: [
        patterns.facePresenceRate < 0.7 &&
          'Improve camera positioning and video presence',
        avgEngagement < 0.5 &&
          'Work on maintaining engagement and attentiveness',
        patterns.violations > 0 && 'Ensure proper interview environment setup',
        !transcriptText &&
          'Improve audio quality for better communication assessment',
      ].filter(Boolean),
    };
  }
}
