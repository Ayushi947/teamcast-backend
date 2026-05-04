/**
 * A2A Skill Registry
 * Manages registration and execution of A2A skills
 */

import { logger } from '@/shared/utils/logger';
import {
  A2ASkill,
  A2ARegisteredSkill,
  A2ASkillHandler,
  A2AContext,
  A2ATaskState,
  A2AArtifact,
  A2AMessageRole,
  A2APartType,
  A2ATextPart,
} from '../core/a2a.types';
import { A2A_SKILLS } from '../config/a2a.config';

/**
 * Skill execution result
 */
export interface SkillExecutionResult {
  state: A2ATaskState;
  text?: string;
  data?: Record<string, unknown>;
  artifacts?: A2AArtifact[];
}

/**
 * A2A Skill Registry
 * Singleton for managing A2A skills
 */
export class A2ASkillRegistry {
  private static instance: A2ASkillRegistry;
  private skills: Map<string, A2ARegisteredSkill> = new Map();

  private constructor() {
    // Initialize with skill definitions from config
    // Handlers will be registered separately
    for (const skill of A2A_SKILLS) {
      this.skills.set(skill.id, {
        ...skill,
        handler: this.createPlaceholderHandler(skill.id),
      });
    }
  }

  static getInstance(): A2ASkillRegistry {
    if (!A2ASkillRegistry.instance) {
      A2ASkillRegistry.instance = new A2ASkillRegistry();
    }
    return A2ASkillRegistry.instance;
  }

  /**
   * Register a skill handler
   */
  registerHandler(
    skillId: string,
    handler: A2ASkillHandler,
    requiredScopes?: string[]
  ): void {
    const existingSkill = this.skills.get(skillId);

    if (existingSkill) {
      existingSkill.handler = handler;
      if (requiredScopes) {
        existingSkill.requiredScopes = requiredScopes;
      }
      logger.info('A2A skill handler registered', {
        context: 'A2ASkillRegistry.registerHandler',
        skillId,
      });
    } else {
      logger.warn('Attempted to register handler for unknown skill', {
        context: 'A2ASkillRegistry.registerHandler',
        skillId,
      });
    }
  }

  /**
   * Register a complete skill with handler
   */
  registerSkill(
    skill: A2ASkill,
    handler: A2ASkillHandler,
    requiredScopes?: string[]
  ): void {
    this.skills.set(skill.id, {
      ...skill,
      handler,
      requiredScopes,
    });

    logger.info('A2A skill registered', {
      context: 'A2ASkillRegistry.registerSkill',
      skillId: skill.id,
      name: skill.name,
    });
  }

  /**
   * Get skill by ID
   */
  getSkill(skillId: string): A2ARegisteredSkill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Get all skills (for Agent Card)
   */
  getAllSkills(): A2ASkill[] {
    return Array.from(this.skills.values()).map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      inputSchema: skill.inputSchema,
      outputSchema: skill.outputSchema,
      tags: skill.tags,
      examples: skill.examples,
    }));
  }

  /**
   * Check if skill exists
   */
  hasSkill(skillId: string): boolean {
    return this.skills.has(skillId);
  }

  /**
   * Execute a skill
   */
  async executeSkill(
    skillId: string,
    params: Record<string, unknown>,
    context: A2AContext
  ): Promise<SkillExecutionResult> {
    const skill = this.skills.get(skillId);

    if (!skill) {
      return {
        state: A2ATaskState.FAILED,
        text: `Unknown skill: ${skillId}`,
        data: { error: 'SKILL_NOT_FOUND', skillId },
      };
    }

    // Check required scopes if specified
    // Note: Scope checking would typically be done with context.scopes
    // For now, we'll skip scope validation as it's handled at the MCP level

    logger.info('Executing A2A skill', {
      context: 'A2ASkillRegistry.executeSkill',
      skillId,
      clientId: context.clientId,
    });

    try {
      const startTime = Date.now();
      const result = await skill.handler(params, context);

      logger.info('A2A skill execution completed', {
        context: 'A2ASkillRegistry.executeSkill',
        skillId,
        state: result.state,
        duration: Date.now() - startTime,
      });

      return {
        state: result.state,
        text: result.message?.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as { text: string }).text)
          .join('\n'),
        data: result.message?.parts
          .filter((p) => p.type === 'data')
          .reduce(
            (acc, p) => ({
              ...acc,
              ...(p as { data: Record<string, unknown> }).data,
            }),
            {}
          ),
        artifacts: result.artifacts,
      };
    } catch (error) {
      logger.error('A2A skill execution failed', {
        context: 'A2ASkillRegistry.executeSkill',
        skillId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        state: A2ATaskState.FAILED,
        text: error instanceof Error ? error.message : 'Skill execution failed',
        data: {
          error: 'SKILL_EXECUTION_ERROR',
          skillId,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Create placeholder handler for skills not yet implemented
   */
  private createPlaceholderHandler(skillId: string): A2ASkillHandler {
    return async (_params, _context) => {
      return {
        state: A2ATaskState.FAILED,
        message: {
          messageId: `msg_placeholder_${Date.now()}`,
          role: A2AMessageRole.AGENT,
          parts: [
            {
              type: A2APartType.TEXT,
              text: `Skill ${skillId} handler not implemented`,
            } as A2ATextPart,
          ],
          timestamp: new Date().toISOString(),
        },
      };
    };
  }

  /**
   * List all registered skill IDs
   */
  listSkillIds(): string[] {
    return Array.from(this.skills.keys());
  }

  /**
   * Get skill count
   */
  getSkillCount(): number {
    return this.skills.size;
  }
}
