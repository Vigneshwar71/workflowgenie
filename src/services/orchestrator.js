import { GitHubConnector } from '../integrations/github.js';
import { SlackConnector } from '../integrations/slack.js';
import { logger } from '../utils/logger.js';

export class WorkflowOrchestrator {
  constructor() {
    this.github = new GitHubConnector();
    this.slack = new SlackConnector();
    this.isInitialized = false;
  }

  async initialize() {
    logger.info('Initializing WorkflowOrchestrator...');
    
    await this.github.initialize();
    await this.slack.initialize();
    
    this.isInitialized = true;
    logger.info('WorkflowOrchestrator initialized successfully');
  }

  async scheduleCodeReview(args, userContext, requestId) {
    const startTime = Date.now();
    
    try {
      logger.info('Starting code review workflow', {
        requestId,
        repository: args.repository,
        prNumber: args.pr_number
      });

      const prDetails = await this.github.getPullRequest(
        args.repository,
        args.pr_number,
        userContext.githubToken,
        requestId
      );

      const channelData = {
        name: `pr-${args.pr_number}-${prDetails.title}`,
        type: 'review',
        topic: `Code review for PR #${args.pr_number}`,
        purpose: `Review: ${prDetails.title}`,
        private: false,
        members: [],
        context: {
          purpose: `Code review for ${args.repository} PR #${args.pr_number}`,
          prNumber: args.pr_number,
          repository: args.repository,
          links: [
            {
              title: `Pull Request #${args.pr_number}`,
              url: prDetails.urls.html
            }
          ]
        }
      };

      const channel = await this.slack.createReviewChannel(
        channelData,
        userContext.slackToken,
        requestId
      );

      await this.slack.sendPullRequestMessage(
        channel.id,
        prDetails,
        userContext.slackToken,
        requestId
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        message: `Code review scheduled for PR #${args.pr_number}`,
        executionTime: `${executionTime}ms`,
        details: {
          repository: args.repository,
          pr_number: args.pr_number,
          slack_channel: `#${channel.name}`,
          github_pr: prDetails.urls.html,
          meeting: {
            time: 'Will be scheduled based on team availability',
            attendees: prDetails.requestedReviewers.map(r => r.name)
          }
        }
      };

    } catch (error) {
      logger.error('Code review workflow failed', {
        requestId,
        error: error.message
      });

      return {
        success: false,
        message: `Failed to schedule code review: ${error.message}`,
        executionTime: `${Date.now() - startTime}ms`
      };
    }
  }

  async createProjectKickoff(args, userContext, requestId) {
    return {
      success: false,
      message: 'Project kickoff workflow not implemented yet',
      executionTime: '0ms'
    };
  }

  async handleIncidentResponse(args, userContext, requestId) {
    return {
      success: false,
      message: 'Incident response workflow not implemented yet',
      executionTime: '0ms'
    };
  }

  async cleanup() {
    logger.info('Cleaning up WorkflowOrchestrator...');
    
    if (this.github) {
      await this.github.cleanup();
    }
    
    if (this.slack) {
      await this.slack.cleanup();
    }
    
    logger.info('WorkflowOrchestrator cleanup complete');
  }
}