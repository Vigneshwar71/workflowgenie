import { GitHubConnector } from '../src/integrations/github.js';
import { SlackConnector } from '../src/integrations/slack.js';
import dotenv from 'dotenv';

dotenv.config();

async function simpleWorkflowTest() {
  console.log('Simple Workflow Test: GitHub PR → Slack Message\n');

  const githubToken = process.env.GITHUB_TEST_TOKEN;
  const slackToken = process.env.SLACK_TEST_TOKEN;

  console.log('Checking tokens...');
  console.log(`GitHub Token: ${githubToken ? 'Found' : 'Missing'}`);
  console.log(`Slack Token: ${slackToken ? 'Found' : 'Missing'}\n`);

  if (!githubToken || !slackToken) {
    console.log('Please add both tokens to your .env file');
    return;
  }

  try {
    console.log('Step 1: Initialize GitHub connector...');
    const github = new GitHubConnector();
    await github.initialize();

    console.log('Step 2: Initialize Slack connector...');
    const slack = new SlackConnector();
    await slack.initialize();

    console.log('Step 3: Fetch PR from GitHub...');
    const repository = 'facebook/react';
    const prNumber = '1000';
    
    const prDetails = await github.getPullRequest(
      repository,
      prNumber,
      githubToken,
      'test_001'
    );

    console.log(`Found PR: ${prDetails.title}`);
    console.log(`Author: ${prDetails.author.login}`);
    console.log(`Files changed: ${prDetails.stats.changedFiles}\n`);

    console.log('Step 4: Send message to Slack...');
    const testChannel = process.env.SLACK_TEST_CHANNEL;
    
    if (!testChannel) {
      console.log('SLACK_TEST_CHANNEL not found in .env');
      console.log('Add SLACK_TEST_CHANNEL=your_channel_id to .env');
      return;
    }

    const message = await slack.sendPullRequestMessage(
      testChannel,
      prDetails,
      slackToken,
      'test_002'
    );

    console.log(`Message sent to Slack!`);
    console.log(`Message ID: ${message.messageId}`);
    if (message.permalink) {
      console.log(`Permalink: ${message.permalink}`);
    }

    console.log('\nWorkflow completed successfully!');
    console.log('Check your Slack channel to see the PR message.');

    await github.cleanup();
    await slack.cleanup();

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

simpleWorkflowTest();
