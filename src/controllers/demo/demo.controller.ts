import { Request, Response } from 'express';
import { DemoService } from '@/services/demo/demo.service';
import { logger } from '@/shared/utils/logger';
import {
  IDemoAssessmentStartRequest,
  IDemoAnswerSubmitRequest,
  IDemoVideoAnalysisRequest,
} from '@/shared/models/api/demo/demo.api';

export class DemoController {
  private readonly demoService: DemoService;

  constructor(demoService: DemoService) {
    this.demoService = demoService;
    logger.info({
      message: 'DemoController constructor started',
      context: 'DemoController.constructor',
      hasDemoService: !!this.demoService,
    });
  }

  /**
   * Get available demo profiles
   */
  getDemoProfiles = async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.info({
        message: 'Getting demo profiles',
        context: 'DemoController.getDemoProfiles',
      });

      const profiles = await this.demoService.getDemoProfiles();

      res.status(200).json({
        success: true,
        data: profiles,
        message: 'Demo profiles retrieved successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to get demo profiles',
        context: 'DemoController.getDemoProfiles',
        error,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve demo profiles',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get specific demo profile
   */
  getDemoProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { profileId } = req.params;

      logger.info({
        message: 'Getting demo profile',
        context: 'DemoController.getDemoProfile',
        profileId,
      });

      const profile = await this.demoService.getDemoProfile(profileId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Demo profile not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Demo profile retrieved successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to get demo profile',
        context: 'DemoController.getDemoProfile',
        error,
        profileId: req.params.profileId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve demo profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Start demo assessment
   */
  startDemoAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestData: IDemoAssessmentStartRequest = req.body;

      logger.info({
        message: 'Starting demo assessment',
        context: 'DemoController.startDemoAssessment',
        requestData,
      });

      const assessment =
        await this.demoService.startDemoAssessment(requestData);

      res.status(200).json({
        success: true,
        data: assessment,
        message: 'Demo assessment started successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to start demo assessment',
        context: 'DemoController.startDemoAssessment',
        error,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to start demo assessment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get assessment questions
   */
  getAssessmentQuestions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { sessionId } = req.params;

      logger.info({
        message: 'Getting assessment questions',
        context: 'DemoController.getAssessmentQuestions',
        sessionId,
      });

      const questions =
        await this.demoService.getAssessmentQuestions(sessionId);

      res.status(200).json({
        success: true,
        data: questions,
        message: 'Assessment questions retrieved successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to get assessment questions',
        context: 'DemoController.getAssessmentQuestions',
        error,
        sessionId: req.params.sessionId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assessment questions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Submit answer for assessment question
   */
  submitAnswer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const requestData: IDemoAnswerSubmitRequest = req.body;

      logger.info({
        message: 'Submitting answer',
        context: 'DemoController.submitAnswer',
        sessionId,
        requestData,
      });

      const result = await this.demoService.submitAnswer(
        sessionId,
        requestData
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Answer submitted successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to submit answer',
        context: 'DemoController.submitAnswer',
        error,
        sessionId: req.params.sessionId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to submit answer',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Complete demo assessment
   */
  completeAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      logger.info({
        message: 'Completing demo assessment',
        context: 'DemoController.completeAssessment',
        sessionId,
      });

      const result = await this.demoService.completeAssessment(sessionId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Assessment completed successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to complete assessment',
        context: 'DemoController.completeAssessment',
        error,
        sessionId: req.params.sessionId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to complete assessment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get demo assessment results
   */
  getAssessmentResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      logger.info({
        message: 'Getting assessment results',
        context: 'DemoController.getAssessmentResults',
        sessionId,
      });

      const results = await this.demoService.getAssessmentResults(sessionId);

      res.status(200).json({
        success: true,
        data: results,
        message: 'Assessment results retrieved successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to get assessment results',
        context: 'DemoController.getAssessmentResults',
        error,
        sessionId: req.params.sessionId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assessment results',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Analyze demo video
   */
  analyzeVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestData: IDemoVideoAnalysisRequest = req.body;

      logger.info({
        message: 'Analyzing demo video',
        context: 'DemoController.analyzeVideo',
        requestData,
      });

      const analysis = await this.demoService.analyzeVideo(requestData);

      res.status(200).json({
        success: true,
        data: analysis,
        message: 'Video analysis completed successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to analyze video',
        context: 'DemoController.analyzeVideo',
        error,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to analyze video',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get presigned URL for demo video upload
   */
  getPresignedUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileName } = req.query;

      if (!fileName || typeof fileName !== 'string') {
        res.status(400).json({
          success: false,
          message: 'File name is required',
        });
        return;
      }

      logger.info({
        message: 'Getting presigned URL for demo video',
        context: 'DemoController.getPresignedUrl',
        fileName,
      });

      const presignedUrl = await this.demoService.getPresignedUrl(fileName);

      res.status(200).json({
        success: true,
        data: presignedUrl,
        message: 'Presigned URL retrieved successfully',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to get presigned URL',
        context: 'DemoController.getPresignedUrl',
        error,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve presigned URL',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
