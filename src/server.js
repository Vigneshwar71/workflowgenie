import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, validateConfig } from './config/environment.js';
import { CequenceGateway } from './integrations/cequence.js';
import { DescopeAuth } from './integrations/descope.js';
import { WorkflowOrchestrator } from './services/orchestrator.js';
import { logger } from './utils/logger.js';

class WorkflowGenieServer {
  constructor() {
    this.server = new Server({
      name: config.mcp.name,
      version: config.mcp.version,
      description: config.mcp.description
    });
    
    this.cequence = new CequenceGateway(config.cequence);
    this.descope = new DescopeAuth(config.descope);
    this.orchestrator = new WorkflowOrchestrator();
    
    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler("tools/list", async (request) => {
      const enrichedRequest = this.cequence.enrichRequestMetadata(request, {
        action: 'list_tools'
      });
      
      logger.info('Tools list requested via Cequence proxy', {
        'x-cequence-tracked': true
      });
      
      return {
        tools: [
          {
            name: "schedule_code_review",
            description: "Schedule a code review meeting with automatic team coordination across GitHub, Slack, Calendar, and Notion",
            inputSchema: {
              type: "object",
              properties: {
                pr_number: {
                  type: "string",
                  description: "Pull request number (e.g., '123')"
                },
                repository: {
                  type: "string", 
                  description: "Repository name in format 'owner/repo'"
                },
                urgency: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                  default: "medium"
                }
              },
              required: ["pr_number", "repository"]
            }
          }
        ]
      };
    });

    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;
      const requestId = this.generateRequestId();
      
      const enrichedRequest = this.cequence.enrichRequestMetadata(request, {
        action: 'tool_call',
        tool: name,
        requestId
      });
      
      logger.info(`Tool call via Cequence: ${name}`, { 
        requestId,
        'x-cequence-tracked': true 
      });

      try {
        const userContext = await this.descope.validateUser(request.meta?.userToken);
        
        let result;
        switch (name) {
          case "schedule_code_review":
            result = await this.orchestrator.scheduleCodeReview(args, userContext, requestId);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        this.cequence.logToolExecution(name, result, userContext);

        return {
          content: [{
            type: "text",
            text: this.formatToolResponse(result)
          }]
        };

      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, {
          requestId,
          error: error.message,
          'x-cequence-tracked': true
        });

        return {
          content: [{
            type: "text", 
            text: `Error: ${error.message}\n\nRequest ID: ${requestId}`
          }],
          isError: true
        };
      }
    });
  }

  setupResourceHandlers() {
    this.server.setRequestHandler("resources/list", async () => {
      return { resources: [] };
    });
  }

  setupPromptHandlers() {
    this.server.setRequestHandler("prompts/list", async () => {
      return { prompts: [] };
    });
  }

  formatToolResponse(result) {
    if (!result.success) {
      return `Operation Failed\n\n${result.message}`;
    }

    const { message, details, executionTime } = result;
    
    let formatted = `${message}\n\n`;
    
    if (details) {
      if (details.meeting) {
        formatted += `Meeting: ${details.meeting.time}\n`;
        formatted += `Attendees: ${details.meeting.attendees.join(', ')}\n`;
        if (details.meeting.link) {
          formatted += `Calendar Link: ${details.meeting.link}\n`;
        }
      }
      
      if (details.slack_channel) {
        formatted += `Discussion: ${details.slack_channel}\n`;
      }
      
      if (details.github_pr) {
        formatted += `Pull Request: ${details.github_pr}\n`;
      }
      
      if (details.notion_page) {
        formatted += `Documentation: ${details.notion_page}\n`;
      }
      
      if (details.repository) {
        formatted += `Repository: ${details.repository}\n`;
      }
    }
    
    formatted += `\nCompleted in ${executionTime}`;
    
    return formatted;
  }

  generateRequestId() {
    return `wfg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async start() {
    try {
      validateConfig();
      
      await this.cequence.initialize();
      await this.descope.initialize();
      await this.orchestrator.initialize();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info(`WorkflowGenie MCP Server started successfully`, {
        version: config.mcp.version,
        environment: config.nodeEnv
      });
      
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      
    } catch (error) {
      logger.error('Failed to start WorkflowGenie server', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down WorkflowGenie server...');
    
    try {
      await this.orchestrator.cleanup();
      await this.descope.cleanup();
      await this.cequence.cleanup();
      
      logger.info('Server shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new WorkflowGenieServer();
  server.start().catch((error) => {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  });
}

export { WorkflowGenieServer };