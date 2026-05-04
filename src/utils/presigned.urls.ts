export const getBucketFolderPathToClientUserPhoto = (
  clientId: string,
  clientUserId: string
) => {
  const folderPath = `clients/${clientId}/users/${clientUserId}`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToPartnerUserPhoto = (
  partnerId: string,
  partnerUserId: string
) => {
  const folderPath = `partners/${partnerId}/users/${partnerUserId}`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToCandidateProfilePhoto = (
  candidateId: string
) => {
  const folderPath = `candidates/${candidateId}/profile`;
  return {
    folderPath,
  };
};
export const getBucketFolderPathToCandidateOnboardingAssessmentVideo = (
  candidateId: string,
  assessmentId: string
) => {
  const folderPath = `candidates/${candidateId}/onboarding/${assessmentId}/video`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToCandidateOnboardingAssessmentQuestionAudio = (
  candidateId: string,
  assessmentId: string,
  questionId: string
) => {
  const folderPath = `candidates/${candidateId}/onboarding/${assessmentId}/questions/${questionId}/audio`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToCandidateJobAiAssessmentVideo = (
  candidateId: string,
  assessmentId: string
) => {
  const folderPath = `candidates/${candidateId}/job-ai-assessments/${assessmentId}/video`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToCandidateJobAiAssessmentQuestionAudio = (
  candidateId: string,
  assessmentId: string,
  questionId: string
) => {
  const folderPath = `candidates/${candidateId}/onboarding/${assessmentId}/questions/${questionId}/audio`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToCandidateOnboardingAssessmentVideoChunks = (
  candidateId: string,
  assessmentId: string
) => {
  const folderPath = `candidates/${candidateId}/onboarding/${assessmentId}/video/chunks`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToCandidateJobAiAssessmentVideoChunks = (
  candidateId: string,
  assessmentId: string
) => {
  const folderPath = `candidates/${candidateId}/job-ai-assessments/${assessmentId}/video/chunks`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToPublicPracticeAssessmentVideo = (
  assessmentId: string
) => {
  const folderPath = `public-practice-assessments/${assessmentId}/video`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToPublicPracticeAssessmentVideoChunks = (
  assessmentId: string
) => {
  const folderPath = `public-practice-assessments/${assessmentId}/video/chunks`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToCandidateResume = (candidateId: string) => {
  const folderPath = `candidates/${candidateId}/resumes`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToMcpInterviewResume = (
  interviewId: string
) => {
  const folderPath = `mcp-interviews/${interviewId}/resumes`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToJobPosting = (jobPostingId: string) => {
  const folderPath = `jobs/${jobPostingId}/descriptions`;
  return {
    folderPath,
  };
};

// Generic document folder path functions
export const getBucketFolderPathToEntityDocuments = (
  entityType: string,
  entityId: string
) => {
  const folderPath = `${entityType}s/${entityId}/documents`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToPartnerDocuments = (partnerId: string) => {
  const folderPath = `partners/${partnerId}/documents`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToClientDocuments = (clientId: string) => {
  const folderPath = `clients/${clientId}/documents`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToClientCandidateImport = (
  clientId: string
) => {
  const folderPath = `clients/${clientId}/imports`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToCandidateDocuments = (
  candidateId: string
) => {
  const folderPath = `candidates/${candidateId}/documents`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToSupportUserProfilePhoto = (
  supportUserId: string
) => {
  const folderPath = `support/${supportUserId}/profile`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToSupportDocuments = (
  supportUserId: string
) => {
  const folderPath = `support/${supportUserId}/documents`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToPartnerPhoto = (partnerId: string) => {
  const folderPath = `partners/${partnerId}/profile`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToPartnerUserProfilePhoto = (
  partnerUserId: string
) => {
  const folderPath = `partners/users/${partnerUserId}/profile`;

  return {
    folderPath,
  };
};

export const getBucketFolderPathToClientPhoto = (clientId: string) => {
  const folderPath = `clients/${clientId}/profile`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToSupportInvitationImport = (
  supportUserId: string
) => {
  const folderPath = `support/${supportUserId}/imports`;
  return {
    folderPath,
  };
};

export const getBucketFolderPathToSupportTicketAttachments = (
  userId: string,
  ticketId: string
) => {
  const folderPath = `support/client/${userId}/tickets/${ticketId}/attachments`;
  return {
    folderPath,
  };
};
