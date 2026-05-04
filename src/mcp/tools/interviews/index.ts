/**
 * MCP Interview Tools
 * Tools for agent-initiated interview requests
 */

import { registerRequestInterviewTool } from './request-interview.tool';
import { registerInterviewResultTools } from './get-interview-results.tool';

export { registerRequestInterviewTool, registerInterviewResultTools };

/**
 * Register all interview tools
 */
export function registerInterviewTools(): void {
  registerRequestInterviewTool();
  registerInterviewResultTools();
}
