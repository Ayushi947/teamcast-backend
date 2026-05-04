import { PrismaClient } from '@prisma/client';
import { singleton } from '@/shared/decorators/singleton';
import {
  ICandidateProfile,
  ICandidateProfileBasicUpdate,
  ICandidateProfilePasswordChange,
  ICandidateProfilePhotoUrl,
  toCandidateProfileDomain,
} from '@/shared/models/domain/candidate/profile.domain';
import { AppError } from '@/utils/app.error';
import { ErrorCode } from '@/utils/error.codes';
import { logger } from '@/shared/utils/logger';
import { IStorageProvider } from '../helpers/storage/storage.interface';
import {
  CandidateResumeAssessmentStatusEnum,
  CandidateStatusEnum,
} from '@/shared/models/common/enums';
import { getBucketFolderPathToCandidateProfilePhoto } from '@/utils/presigned.urls';
import { CandidateResumeService } from './resume.service';
import { OnboardingAssessmentService } from './onboarding.assessment.service';
import { CandidateResumeAssessmentService } from './resume.assessment.service';
import { comparePassword, hashPassword } from '@/utils/password';
import { ICandidateOnboardingAssessment } from '@/shared/models/domain/candidate/onboarding.assessment.domain';

@singleton
export class CandidateProfileService {
  private readonly prisma: PrismaClient;
  private candidateResumeService: CandidateResumeService | undefined;
  private onboardingAssessmentService: OnboardingAssessmentService | undefined;
  private candidateResumeAssessmentService:
    | CandidateResumeAssessmentService
    | undefined;

  constructor(private readonly storageService: IStorageProvider) {
    this.prisma = new PrismaClient();
  }

  setResumeService(candidateResumeService: CandidateResumeService) {
    this.candidateResumeService = candidateResumeService;
  }

  setOnboardingAssessmentService(
    onboardingAssessmentService: OnboardingAssessmentService
  ) {
    this.onboardingAssessmentService = onboardingAssessmentService;
  }

  setResumeAssessmentService(
    candidateResumeAssessmentService: CandidateResumeAssessmentService
  ) {
    this.candidateResumeAssessmentService = candidateResumeAssessmentService;
  }

  /**
   * Get a candidate's profile
   */
  async getProfile(candidateId: string): Promise<ICandidateProfile> {
    try {
      // Find the candidate by ID
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
        include: {
          user: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      if (
        candidate.status === CandidateStatusEnum.NEW &&
        candidate.resumeAssessmentStatus ===
          CandidateResumeAssessmentStatusEnum.ASSESSMENT_NOT_DONE
      ) {
        // Calculate profile completeness
        await this.calculateProfileCompleteness(candidateId);
      }

      // Generate presigned URL for profile picture if it exists
      let imageUrl = candidate.user.image;
      if (imageUrl && !imageUrl.startsWith('http')) {
        try {
          const presignedUrl = await this.storageService.generatePreSignedUrl(
            imageUrl,
            'read'
          );
          imageUrl = presignedUrl;
        } catch (_error) {
          // If generating presigned URL fails, set image to null
          imageUrl = null;
        }
      }

      const userForResponse = {
        ...candidate.user,
        image: imageUrl,
      };

      // Convert to domain model
      return toCandidateProfileDomain(userForResponse, candidate);
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate profile',
        context: 'CandidateProfileService.getProfile',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get a candidate's profile by email ID
   */

  async getProfileByEmailID(email: string): Promise<ICandidateProfile> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        throw new AppError(
          'User not registered as a candidate',
          200,
          ErrorCode.SECTION_NOT_FOUND
        );
      }

      // Find the candidate by ID
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          userId: user.id,
        },
        include: {
          user: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      if (
        candidate.status === CandidateStatusEnum.NEW &&
        candidate.resumeAssessmentStatus ===
          CandidateResumeAssessmentStatusEnum.ASSESSMENT_NOT_DONE
      ) {
        // Calculate profile completeness
        await this.calculateProfileCompleteness(candidate.id);
      }

      // Generate presigned URL for profile picture if it exists
      let imageUrl = candidate.user.image;
      if (imageUrl && !imageUrl.startsWith('http')) {
        try {
          const presignedUrl = await this.storageService.generatePreSignedUrl(
            imageUrl,
            'read'
          );
          imageUrl = presignedUrl;
        } catch (_error) {
          // If generating presigned URL fails, set image to null
          imageUrl = null;
        }
      }

      const userForResponse = {
        ...candidate.user,
        image: imageUrl,
      };

      // Convert to domain model
      return toCandidateProfileDomain(userForResponse, candidate);
    } catch (error) {
      logger.error({
        message: 'Failed to get candidate profile by email ID',
        context: 'CandidateProfileService.getProfileByEmailID',
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
      });
      throw error;
    }
  }

  /**
   * Update a candidate's basic profile information
   */
  async updateBasicProfile(
    candidateId: string,
    profileData: ICandidateProfileBasicUpdate
  ): Promise<ICandidateProfile> {
    try {
      // Find the candidate by ID
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
        include: {
          user: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Update the user
      const updatedUser = await this.prisma.user.update({
        where: { id: candidate.userId },
        data: {
          name: profileData.name,
          jobTitle: profileData.jobTitle,
        },
      });

      // Update candidate specific fields
      const updatedCandidate = await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          jobSearchStatus: profileData.jobSearchStatus,
          sex: profileData.sex,
          birthDate: profileData.birthDate,
          maritalStatus: profileData.maritalStatus,
        },
      });

      // Calculate profile completeness
      await this.calculateProfileCompleteness(candidateId);

      // Convert to domain model
      return toCandidateProfileDomain(updatedUser, updatedCandidate);
    } catch (error) {
      logger.error({
        message: 'Failed to update candidate profile',
        context: 'CandidateProfileService.updateBasicProfile',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
        profileData,
      });
      throw error;
    }
  }

  /**
   * Change a candidate's password
   */
  async changePassword(
    candidateId: string,
    passwordData: ICandidateProfilePasswordChange
  ): Promise<void> {
    try {
      // Find the candidate by ID
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
        include: {
          user: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Verify current password if user has one
      if (candidate.user.password) {
        const isCurrentPasswordValid = await comparePassword(
          passwordData.currentPassword,
          candidate.user.password
        );

        if (!isCurrentPasswordValid) {
          throw new AppError(
            'Current password is incorrect',
            400,
            ErrorCode.INVALID_CREDENTIALS
          );
        }
      }

      // Hash new password and update in database
      const hashedNewPassword = await hashPassword(passwordData.newPassword);

      await this.prisma.user.update({
        where: { id: candidate.user.id },
        data: { password: hashedNewPassword },
      });

      logger.info('Password changed successfully', {
        candidateId,
        userId: candidate.user.id,
        context: 'CandidateProfileService.changePassword',
      });
    } catch (error) {
      logger.error({
        message: 'Failed to change password',
        context: 'CandidateProfileService.changePassword',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Update profile photo with direct file upload
   */
  async updateProfilePhoto(
    candidateId: string,
    file: Buffer
  ): Promise<ICandidateProfilePhotoUrl> {
    try {
      // Find the candidate by ID
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
        include: {
          user: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Generate a unique filename for the upload
      const uniqueFileName = `${candidateId}-${Date.now()}.jpg`;
      const { folderPath } =
        getBucketFolderPathToCandidateProfilePhoto(candidateId);
      const filePath = `${folderPath}/${uniqueFileName}`;

      // Upload file directly to storage
      const uploadedUrl = await this.storageService.uploadFile(file, filePath);

      // Update the user's profile photo
      await this.prisma.user.update({
        where: { id: candidate.userId },
        data: { image: uploadedUrl },
      });

      await this.calculateProfileCompleteness(candidateId);

      // Generate a read URL for the uploaded photo
      const presignedUrl = await this.storageService.generatePreSignedUrl(
        uploadedUrl,
        'read'
      );

      return {
        fileName: uniqueFileName,
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to update profile photo',
        context: 'CandidateProfileService.updateProfilePhoto',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get the presigned URL for the profile photo
   */
  async getProfilePhotoPresignedUrl(
    candidateId: string
  ): Promise<ICandidateProfilePhotoUrl> {
    try {
      // Find the candidate by ID
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
        include: {
          user: true,
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      if (!candidate.user.image) {
        throw new AppError(
          'Candidate does not have a profile photo',
          404,
          ErrorCode.NOT_FOUND
        );
      }

      const presignedUrl = await this.storageService.generatePreSignedUrl(
        candidate.user.image,
        'read'
      );

      return {
        fileName: candidate.user.image,
        presignedUrl,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get profile photo presigned URL',
        context: 'CandidateProfileService.getProfilePhotoPresignedUrl',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Calculate the completeness percentage of a candidate's profile
   * Returns a number between 0 and 100 representing the profile completeness percentage
   *
   * Uses a weighted system that prioritizes essential fields for resume assessment:
   * - Essential fields (80%): Core information needed for assessment (meets MIN threshold)
   * - Optional fields (20%): Nice-to-have information for enhanced profiles
   *
   * This ensures STRICT mode parsing can reach 80% with just essential fields,
   * while GENERATIVE mode can reach 100% with all fields populated.
   */
  async calculateProfileCompleteness(candidateId: string): Promise<number> {
    try {
      // Find the candidate by ID with all related data
      const candidate = await this.prisma.candidate.findUnique({
        where: {
          id: candidateId,
        },
        include: {
          user: true,
          resume: {
            include: {
              social: true,
              certifications: true,
              education: true,
              experience: {
                include: {
                  projects: true,
                },
              },
            },
          },
        },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Helper function to check if a value exists (handles 0, false, empty strings)
      const hasValue = (value: any): boolean => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'number') return true; // 0 is a valid value
        if (typeof value === 'boolean') return true;
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(value);
      };

      // ESSENTIAL FIELDS (80% weight) - Required for resume assessment
      const essentialBasicFields = [
        { name: 'name', value: candidate.user.name, weight: 10 },
        { name: 'jobTitle', value: candidate.user.jobTitle, weight: 8 },
        { name: 'image', value: candidate.user.image, weight: 5 },
        {
          name: 'jobSearchStatus',
          value: candidate.jobSearchStatus,
          weight: 7,
        },
      ];

      // OPTIONAL FIELDS (20% weight) - Nice to have
      const optionalBasicFields = [
        { name: 'sex', value: candidate.sex, weight: 3 },
        { name: 'birthDate', value: candidate.birthDate, weight: 3 },
        { name: 'maritalStatus', value: candidate.maritalStatus, weight: 4 },
      ];

      // Calculate basic profile completeness
      let essentialBasicWeight = 0;
      let essentialBasicCompleted = 0;

      for (const field of essentialBasicFields) {
        essentialBasicWeight += field.weight;
        if (hasValue(field.value)) {
          essentialBasicCompleted += field.weight;
        }
      }

      let optionalBasicWeight = 0;
      let optionalBasicCompleted = 0;

      for (const field of optionalBasicFields) {
        optionalBasicWeight += field.weight;
        if (hasValue(field.value)) {
          optionalBasicCompleted += field.weight;
        }
      }

      // If no resume exists, return basic profile completeness
      if (!candidate.resume) {
        const totalBasicWeight = essentialBasicWeight + optionalBasicWeight;
        const totalBasicCompleted =
          essentialBasicCompleted + optionalBasicCompleted;
        return Math.round((totalBasicCompleted / totalBasicWeight) * 100);
      }

      // ESSENTIAL RESUME FIELDS (80% weight)
      // These are fields that STRICT mode can reasonably populate
      const essentialResumeFields = [
        {
          name: 'resumeSkills',
          value: candidate.resume.resumeSkills,
          weight: 15,
        },
        {
          name: 'resumeFileUrl',
          value: candidate.resume.resumeFileUrl,
          weight: 15,
        },
        {
          name: 'summary',
          value: candidate.resume.summary,
          weight: 10,
        },
        {
          name: 'primaryIndustry',
          value: candidate.resume.primaryIndustry,
          weight: 10,
        },
      ];

      // OPTIONAL RESUME FIELDS (20% weight)
      const optionalResumeFields = [
        { name: 'phone', value: candidate.resume.phone, weight: 2 },
        { name: 'location', value: candidate.resume.location, weight: 2 },
        {
          name: 'totalExperience',
          value: candidate.resume.totalExperience,
          weight: 3,
        },
        {
          name: 'currentJobTitle',
          value: candidate.resume.currentJobTitle,
          weight: 3,
        },
        {
          name: 'currentCompany',
          value: candidate.resume.currentCompany,
          weight: 3,
        },
        {
          name: 'currentIndustry',
          value: candidate.resume.currentIndustry,
          weight: 2,
        },
        {
          name: 'currentWorkLocation',
          value: candidate.resume.currentWorkLocation,
          weight: 2,
        },
        {
          name: 'currentWorkType',
          value: candidate.resume.currentWorkType,
          weight: 2,
        },
        {
          name: 'currentWorkCommitment',
          value: candidate.resume.currentWorkCommitment,
          weight: 2,
        },
        {
          name: 'currentWorkSchedule',
          value: candidate.resume.currentWorkSchedule,
          weight: 2,
        },
        {
          name: 'currentSalary',
          value: candidate.resume.currentSalary,
          weight: 2,
        },
        {
          name: 'currentSalaryCurrency',
          value: candidate.resume.currentSalaryCurrency,
          weight: 1,
        },
        {
          name: 'availableFrom',
          value: candidate.resume.availableFrom,
          weight: 2,
        },
        {
          name: 'noticePeriod',
          value: candidate.resume.noticePeriod,
          weight: 2,
        },
        {
          name: 'highestEducationLevel',
          value: candidate.resume.highestEducationLevel,
          weight: 2,
        },
        {
          name: 'industries',
          value: candidate.resume.industries,
          weight: 2,
        },
        {
          name: 'languages',
          value: candidate.resume.languages,
          weight: 1,
        },
      ];

      // Calculate essential resume completeness
      let essentialResumeWeight = 0;
      let essentialResumeCompleted = 0;

      for (const field of essentialResumeFields) {
        essentialResumeWeight += field.weight;
        if (hasValue(field.value)) {
          essentialResumeCompleted += field.weight;
        }
      }

      // Calculate optional resume completeness
      let optionalResumeWeight = 0;
      let optionalResumeCompleted = 0;

      for (const field of optionalResumeFields) {
        optionalResumeWeight += field.weight;
        if (hasValue(field.value)) {
          optionalResumeCompleted += field.weight;
        }
      }

      // Calculate education completeness (ESSENTIAL)
      const educationWeight = 15;
      const educationCompleted = hasValue(candidate.resume.education)
        ? educationWeight
        : 0;

      // Calculate experience completeness (ESSENTIAL)
      const experienceWeight = 15;
      const experienceCompleted = hasValue(candidate.resume.experience)
        ? experienceWeight
        : 0;

      // Calculate certifications completeness (OPTIONAL)
      const certificationsWeight = 3;
      const certificationsCompleted = hasValue(candidate.resume.certifications)
        ? certificationsWeight
        : 0;

      // Calculate social profiles completeness (OPTIONAL)
      const socialWeight = 3;
      const socialCompleted = hasValue(candidate.resume.social)
        ? socialWeight
        : 0;

      // Calculate totals with 80/20 split between essential and optional
      const totalEssentialWeight =
        essentialBasicWeight +
        essentialResumeWeight +
        educationWeight +
        experienceWeight;

      const totalEssentialCompleted =
        essentialBasicCompleted +
        essentialResumeCompleted +
        educationCompleted +
        experienceCompleted;

      const totalOptionalWeight =
        optionalBasicWeight +
        optionalResumeWeight +
        certificationsWeight +
        socialWeight;

      const totalOptionalCompleted =
        optionalBasicCompleted +
        optionalResumeCompleted +
        certificationsCompleted +
        socialCompleted;

      const essentialPercentage =
        totalEssentialWeight > 0
          ? (totalEssentialCompleted / totalEssentialWeight) * 80
          : 0;

      const optionalPercentage =
        totalOptionalWeight > 0
          ? (totalOptionalCompleted / totalOptionalWeight) * 20
          : 0;

      const completeness = Math.min(
        100,
        Math.round(essentialPercentage + optionalPercentage)
      );

      // Update the candidate's completion percentage
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: { completionPercentage: completeness },
      });

      logger.info('Profile completeness calculated', {
        context: 'CandidateProfileService.calculateProfileCompleteness',
        candidateId,
        completeness,
        essentialCompleted: totalEssentialCompleted,
        essentialWeight: totalEssentialWeight,
        optionalCompleted: totalOptionalCompleted,
        optionalWeight: totalOptionalWeight,
      });

      return completeness;
    } catch (error) {
      logger.error({
        message: 'Failed to calculate profile completeness',
        context: 'CandidateProfileService.calculateProfileCompleteness',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Soft delete a candidate's profile photo
   */
  async deleteProfilePhoto(candidateId: string): Promise<void> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { user: true },
      });

      if (!candidate) {
        throw new AppError('Candidate not found', 404, ErrorCode.NOT_FOUND);
      }

      // Soft delete by setting image to null
      await this.prisma.user.update({
        where: { id: candidate.userId },
        data: { image: null },
      });

      await this.calculateProfileCompleteness(candidateId);
    } catch (error) {
      logger.error({
        message: 'Failed to delete profile photo',
        context: 'CandidateProfileService.deleteProfilePhoto',
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateId,
      });
      throw error;
    }
  }

  /**
   * Get both profile and resume for a candidate (public API)
   */
  async getPublicProfileAndResume(candidateId: string) {
    const profile = await this.getProfile(candidateId);
    if (!this.candidateResumeService) {
      throw new AppError(
        'Resume service not initialized',
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
    const resume = await this.candidateResumeService.getResume(candidateId);

    // Get onboarding assessment if service is available
    let onboardingAssessment: ICandidateOnboardingAssessment | null = null;
    if (this.onboardingAssessmentService) {
      try {
        const latestAssessment =
          await this.onboardingAssessmentService.getLatestOnboardingAssessment(
            candidateId
          );
        onboardingAssessment = latestAssessment;

        // If assessment exists, fetch video chunks with playback URLs
        if (onboardingAssessment?.id) {
          try {
            const videoChunks =
              await this.onboardingAssessmentService.getVideoChunksByAssessmentId(
                onboardingAssessment.id,
                {
                  includePlaybackUrls: true,
                  includeAnalysis: false,
                }
              );
            // Add video chunks to the assessment object
            onboardingAssessment.videoChunks = videoChunks;
            logger.info({
              message: 'Added video chunks to onboarding assessment',
              context: 'CandidateProfileService.getPublicProfileAndResume',
              candidateId,
              assessmentId: onboardingAssessment.id,
              chunkCount: videoChunks.length,
            });
          } catch (chunkError) {
            logger.warn({
              message: 'Failed to get video chunks for onboarding assessment',
              context: 'CandidateProfileService.getPublicProfileAndResume',
              error:
                chunkError instanceof Error
                  ? chunkError.message
                  : 'Unknown error',
              candidateId,
              assessmentId: onboardingAssessment.id,
            });
            // Continue without video chunks if there's an error
          }
        }
      } catch (error) {
        logger.warn({
          message: 'Failed to get onboarding assessment',
          context: 'CandidateProfileService.getPublicProfileAndResume',
          error: error instanceof Error ? error.message : 'Unknown error',
          candidateId,
        });
        // Continue without assessment data if there's an error
      }
    }

    // Get resume assessment if service is available
    let resumeAssessment;
    if (this.candidateResumeAssessmentService) {
      try {
        resumeAssessment =
          await this.candidateResumeAssessmentService.getLatestAssessmentForCandidate(
            candidateId
          );
      } catch (error) {
        logger.warn({
          message: 'Failed to get resume assessment',
          context: 'CandidateProfileService.getPublicProfileAndResume',
          error: error instanceof Error ? error.message : 'Unknown error',
          candidateId,
        });
        // Continue without resume assessment data if there's an error
      }
    }

    return { profile, resume, onboardingAssessment, resumeAssessment };
  }
}
