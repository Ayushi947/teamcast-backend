import { logger } from '../../utils/logger';
import {
  IDemoProfile,
  IDemoAssessment,
} from '../../models/domain/demo/demo.domain';

/**
 * Demo Storage Service
 * Handles localStorage operations for the AI Interviewer demo
 */
export class DemoStorageService {
  private readonly STORAGE_KEYS = {
    CURRENT_SESSION: 'demo_current_session',
    SESSIONS: 'demo_sessions',
    PROFILES: 'demo_profiles',
    SETTINGS: 'demo_settings',
  };

  /**
   * Save current demo session
   */
  public saveCurrentSession(session: IDemoAssessment): void {
    try {
      if (!this.isAvailable()) {
        logger.warn('localStorage is not available, cannot save session');
        return;
      }

      if (!this.isValidSession(session)) {
        logger.error('Invalid session structure provided for saving');
        return;
      }

      localStorage.setItem(
        this.STORAGE_KEYS.CURRENT_SESSION,
        JSON.stringify(session)
      );
    } catch (error) {
      logger.error('Failed to save current session:', error);
    }
  }

  /**
   * Get current demo session
   */
  public getCurrentSession(): IDemoAssessment | null {
    try {
      const sessionData = localStorage.getItem(
        this.STORAGE_KEYS.CURRENT_SESSION
      );
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Validate and convert date strings back to Date objects
      if (session.startedAt) {
        session.startedAt = new Date(session.startedAt);
      }
      if (session.completedAt) {
        session.completedAt = new Date(session.completedAt);
      }

      // Convert answer dates
      if (session.answers && Array.isArray(session.answers)) {
        session.answers = session.answers.map((answer: any) => ({
          ...answer,
          submittedAt: new Date(answer.submittedAt),
        }));
      }

      // Validate session structure
      if (!this.isValidSession(session)) {
        logger.warn('Invalid session structure found in localStorage');
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Failed to get current session:', error);
      return null;
    }
  }

  /**
   * Clear current demo session
   */
  public clearCurrentSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION);
    } catch (error) {
      logger.error('Failed to clear current session:', error);
    }
  }

  /**
   * Save demo session to history
   */
  public saveSessionToHistory(session: IDemoAssessment): void {
    try {
      if (!this.isAvailable()) {
        logger.warn(
          'localStorage is not available, cannot save session to history'
        );
        return;
      }

      if (!this.isValidSession(session)) {
        logger.error(
          'Invalid session structure provided for saving to history'
        );
        return;
      }

      const sessions = this.getSessionsHistory();
      sessions.push(session);

      // Keep only last 10 sessions
      if (sessions.length > 10) {
        sessions.splice(0, sessions.length - 10);
      }

      localStorage.setItem(
        this.STORAGE_KEYS.SESSIONS,
        JSON.stringify(sessions)
      );
    } catch (error) {
      logger.error('Failed to save session to history:', error);
    }
  }

  /**
   * Get sessions history
   */
  public getSessionsHistory(): IDemoAssessment[] {
    try {
      const sessionsData = localStorage.getItem(this.STORAGE_KEYS.SESSIONS);
      if (!sessionsData) return [];

      const sessions = JSON.parse(sessionsData);

      // Convert date strings back to Date objects and validate structure
      return sessions
        .map((session: any) => {
          const processedSession = {
            ...session,
            startedAt: session.startedAt
              ? new Date(session.startedAt)
              : new Date(),
            completedAt: session.completedAt
              ? new Date(session.completedAt)
              : undefined,
          };

          // Convert answer dates if they exist
          if (
            processedSession.answers &&
            Array.isArray(processedSession.answers)
          ) {
            processedSession.answers = processedSession.answers.map(
              (answer: any) => ({
                ...answer,
                submittedAt: new Date(answer.submittedAt),
              })
            );
          }

          // Validate session structure
          if (!this.isValidSession(processedSession)) {
            logger.warn('Invalid session structure found in history, skipping');
            return null;
          }

          return processedSession;
        })
        .filter(
          (session: IDemoAssessment | null): session is IDemoAssessment =>
            session !== null
        );
    } catch (error) {
      logger.error('Failed to get sessions history:', error);
      return [];
    }
  }

  /**
   * Save demo profiles
   */
  public saveProfiles(profiles: IDemoProfile[]): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.PROFILES,
        JSON.stringify(profiles)
      );
    } catch (error) {
      logger.error('Failed to save profiles:', error);
    }
  }

  /**
   * Get demo profiles
   */
  public getProfiles(): IDemoProfile[] {
    try {
      const profilesData = localStorage.getItem(this.STORAGE_KEYS.PROFILES);
      if (!profilesData) return [];

      return JSON.parse(profilesData);
    } catch (error) {
      logger.error('Failed to get profiles:', error);
      return [];
    }
  }

  /**
   * Save demo settings
   */
  public saveSettings(settings: Record<string, any>): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      logger.error('Failed to save settings:', error);
    }
  }

  /**
   * Get demo settings
   */
  public getSettings(): Record<string, any> {
    try {
      const settingsData = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      if (!settingsData) return {};

      return JSON.parse(settingsData) as Record<string, any>;
    } catch (error) {
      logger.error('Failed to get settings:', error);
      return {};
    }
  }

  /**
   * Clear all demo data
   */
  public clearAllDemoData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      logger.error('Failed to clear demo data:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  public isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      logger.warn('localStorage is not available:', error);
      return false;
    }
  }

  /**
   * Validate if a session object has the required structure
   */
  private isValidSession(session: any): session is IDemoAssessment {
    return (
      session &&
      typeof session === 'object' &&
      typeof session.sessionId === 'string' &&
      typeof session.profileId === 'string' &&
      typeof session.candidateName === 'string' &&
      typeof session.candidateEmail === 'string' &&
      ['started', 'in-progress', 'completed'].includes(session.status) &&
      session.startedAt instanceof Date &&
      Array.isArray(session.questions) &&
      Array.isArray(session.answers) &&
      typeof session.currentQuestionIndex === 'number' &&
      session.profile &&
      typeof session.profile === 'object'
    );
  }

  /**
   * Get a specific session by ID from history
   */
  public getSessionById(sessionId: string): IDemoAssessment | null {
    try {
      const sessions = this.getSessionsHistory();
      return (
        sessions.find((session) => session.sessionId === sessionId) || null
      );
    } catch (error) {
      logger.error('Failed to get session by ID:', error);
      return null;
    }
  }

  /**
   * Get storage usage info
   */
  public getStorageInfo(): { used: number; available: number; total: number } {
    try {
      if (!this.isAvailable()) {
        return { used: 0, available: 0, total: 0 };
      }

      let used = 0;
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        const data = localStorage.getItem(key);
        if (data) {
          used += data.length;
        }
      });

      // Estimate available space (most browsers have 5-10MB limit)
      const total = 5 * 1024 * 1024; // 5MB
      const available = total - used;

      return { used, available, total };
    } catch (error) {
      logger.error('Failed to get storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }
}
