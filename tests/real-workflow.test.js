import { GitHubConnector } from '../src/integrations/github.js';
import { SlackConnector } from '../src/integrations/slack.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRealWorkflow() {
  console.log('Testing Real Workflow: GitHub PR → Slack Notification\n');

  const github = new GitHubConnector();
  const slack = new SlackConnector();

  await github.initialize();
  await slack.initialize();

  const githubToken = process.env.GITHUB_TEST_TOKEN;
  const slackToken = process.env.SLACK_TEST_TOKEN;
  const slackChannel = process.env.SLACK_TEST_CHANNEL;

  if (!githubToken || !slackToken || !slackChannel) {
    console.log('Missing required tokens. Please set:');
    console.log('- GITHUB_TEST_TOKEN');
    console.log('- SLACK_TEST_TOKEN');
    console.log('- SLACK_TEST_CHANNEL');
    return;
  }

  try {
    console.log('Step 1: Enter a GitHub repository and PR number to test...');
    
    const repository = process.argv[2] || 'microsoft/vscode';
    const prNumber = process.argv[3] || '1';
    
    console.log(`Repository: ${repository}`);
    console.log(`PR Number: ${prNumber}`);
    console.log('');

    console.log('Step 2: Fetching PR details from GitHub...');
    const prDetails = await github.getPullRequest(repository, prNumber, githubToken, 'real_test_001');
    
    console.log(`PR Title: ${prDetails.title}`);
    console.log(`Author: ${prDetails.author.name} (@${prDetails.author.login})`);
    console.log(`State: ${prDetails.state}`);
    console.log(`Files changed: ${prDetails.stats.changedFiles}`);
    console.log('');

    console.log('Step 3: Creating dedicated Slack channel...');
    const channelData = {
      name: `pr-${prNumber}-review-${Date.now()}`,
      type: 'review',
      topic: `Code review for PR #${prNumber}: ${prDetails.title}`,
      purpose: `Review ${prDetails.title} by ${prDetails.author.name}`,
      private: false,
      members: [],
      context: {
        purpose: `Code review for ${repository} PR #${prNumber}`,
        prNumber: prNumber,
        repository: repository,
        links: [
          {
            title: `Pull Request #${prNumber}`,
            url: prDetails.urls.html
          }
        ]
      }
    };

    const channel = await slack.createReviewChannel(channelData, slackToken, 'real_test_002');
    
    console.log(`Channel created: #${channel.name}`);
    console.log(`Channel ID: ${channel.id}`);
    console.log(`Channel URL: ${channel.webUrl}`);
    console.log('');

    console.log('Step 4: Sending PR notification to new channel...');
    const message = await slack.sendPullRequestMessage(channel.id, prDetails, slackToken, 'real_test_003');
    
    console.log(`Message sent: ${message.messageId}`);
    if (message.permalink) {
      console.log(`Message URL: ${message.permalink}`);
    }
    console.log('');

    console.log('Step 5: Sending follow-up message to existing channel...');
    const followupMessage = await slack.sendPullRequestMessage(slackChannel, prDetails, slackToken, 'real_test_004');
    
    console.log(`Follow-up message sent: ${followupMessage.messageId}`);
    console.log('');

    console.log('SUCCESS: Real workflow completed!');
    console.log('');
    console.log('What happened:');
    console.log(`1. Fetched real PR #${prNumber} from ${repository}`);
    console.log(`2. Created new Slack channel: #${channel.name}`);
    console.log(`3. Sent formatted PR notification to the new channel`);
    console.log(`4. Sent notification to your test channel as well`);
    console.log('');
    console.log('Check your Slack workspace to see the results!');

  } catch (error) {
    console.error('Workflow failed:', error.message);
    
    if (error.message.includes('not found')) {
      console.log('');
      console.log('Try with a different repository and PR number:');
      console.log('  node tests/real-workflow.test.js facebook/react 28000');
      console.log('  node tests/real-workflow.test.js vercel/next.js 71000');
    }
  } finally {
    await github.cleanup();
    await slack.cleanup();
  }
}

async function testWithYourRepo() {
  console.log('To test with YOUR repository:');
  console.log('');
  console.log('1. Create a PR in your GitHub repository');
  console.log('2. Run:');
  console.log('   node tests/real-workflow.test.js YOUR_USERNAME/YOUR_REPO PR_NUMBER');
  console.log('');
  console.log('Example:');
  console.log('   node tests/real-workflow.test.js geethapranay/my-project 5');
  console.log('');
  console.log('The agent will:');
  console.log('- Fetch your real PR details');
  console.log('- Create a dedicated Slack channel');
  console.log('- Send a formatted notification');
  console.log('- Include all PR metadata (files, reviewers, etc.)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === 'help') {
    await testWithYourRepo();
  } else {
    await testRealWorkflow();
  }
}
