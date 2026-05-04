/**
 * MCP Tools Registry
 * Registers all available MCP tools for external AI agents
 */

import { logger } from '@/shared/utils/logger';
import {
  registerCreateJobPostingTool,
  registerSendJobInviteTool,
  registerGetInterviewResultsTool,
} from './jobs';
import {
  registerSearchCandidatesTool,
  registerDynamicSearchTool,
} from './candidates';
import { registerInterviewTools } from './interviews';

/**
 * Register all MCP tools
 */
export function registerAllMcpTools(): void {
  logger.info('Registering MCP tools', { context: 'mcpTools.registerAll' });

  // Job-related tools
  registerCreateJobPostingTool();
  registerSendJobInviteTool();
  registerGetInterviewResultsTool();

  // Candidate search tools
  registerSearchCandidatesTool();
  registerDynamicSearchTool();

  // Interview tools (agent-initiated interviews)
  registerInterviewTools();

  logger.info('MCP tools registered successfully', {
    context: 'mcpTools.registerAll',
    tools: [
      'teamcast.jobs.createPosting',
      'teamcast.jobs.sendInvite',
      'teamcast.jobs.getInterviewResults',
      'teamcast.candidates.search',
      'teamcast.search.dynamic',
      'teamcast.interviews.request',
      'teamcast.interviews.getStatus',
      'teamcast.interviews.getResults',
      'teamcast.interviews.list',
      'teamcast.interviews.cancel',
    ],
  });
}
