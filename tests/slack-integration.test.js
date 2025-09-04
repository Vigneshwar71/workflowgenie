import { SlackConnector } from '../src/integrations/slack.js';
import dotenv from 'dotenv';

dotenv.config();
const mockPRData = {
  number: 123,
  title: "Add new authentication system",
  body: "This PR introduces a new authentication system with OAuth 2.0 support and improved security features.",
  state: "open",
  author: {
    login: "developer123",
    name: "John Developer",
    email: "john@company.com"
  },
  branch: {
    source: "feature/auth-system",
    target: "main"
  },
  stats: {
    additions: 245,
    deletions: 67,
    changedFiles: 12
  },
  requestedReviewers: [
    { login: "reviewer1", name: "Jane Reviewer" },
    { login: "senior-dev", name: "Senior Developer" }
  ],
  urls: {
    html: "https://github.com/company/repo/pull/123"
  }
};

const mockMeetingData = {
  title: "Code Review: Authentication System",
  description: "Review the new OAuth 2.0 implementation and security improvements",
  time: "Today at 2:00 PM - 2:30 PM",
  duration: "30 minutes",
  attendees: ["John Developer", "Jane Reviewer", "Senior Developer"],
  location: "Google Meet",
  link: "https://meet.google.com/abc-defg-hij"
};

async function testSlackIntegration() {
  console.log('Testing Slack Integration...\n');

  const slack = new SlackConnector();
  await slack.initialize();

  const testToken = process.env.SLACK_TEST_TOKEN;
  
  if (!testToken) {
    console.log('No SLACK_TEST_TOKEN found in environment variables');
    console.log('Create a Slack app at: https://api.slack.com/apps');
    console.log('Add Bot Token (xoxb-...) to your .env file as: SLACK_TEST_TOKEN=your_token_here');
    console.log('\nRequired Slack Bot Scopes:');
    console.log('   - channels:read, channels:write, channels:manage');
    console.log('   - chat:write, chat:write.public'); 
    console.log('   - users:read, users:read.email');
    console.log('   - team:read');
    return;
  }

  try {
    console.log('Test 1: Get workspace information...');
    const workspaceInfo = await slack.getWorkspaceInfo(testToken);
    console.log(`Connected to workspace: ${workspaceInfo.team.name}`);
    console.log(`   Domain: ${workspaceInfo.team.domain}.slack.com`);
    console.log(`   User: ${workspaceInfo.user.name} (${workspaceInfo.user.id})`);
    console.log();

    console.log('Test 2: Test channel name generation...');
    const testNames = [
      "Fix Login Bug PR #123",
      "New Feature: Payment System!",
      "Code Review: API Refactoring (Urgent)",
      "a",
      "This is a very long channel name that exceeds limits"
    ];
    
    testNames.forEach(name => {
      const cleanName = slack.generateChannelName(name, 'review');
      console.log(`   "${name}" → "#${cleanName}"`);
    });
    console.log();

    console.log('Test 3: Build PR message blocks...');
    const prBlocks = slack.buildPullRequestBlocks(mockPRData);
    console.log(`Generated ${prBlocks.length} message blocks for PR`);
    console.log('   Block types:', prBlocks.map(b => b.type).join(', '));
    console.log();

    console.log('Test 4: Build meeting notification blocks...');
    const meetingBlocks = slack.buildMeetingBlocks(mockMeetingData);
    console.log(`Generated ${meetingBlocks.length} blocks for meeting notification`);
    console.log();

    console.log('Test 5: Test user ID resolution...');
    const testMembers = [
      workspaceInfo.user.id,
      'geethapranay.official@gmail.com',
      'U1234567890'
    ];
    
    const resolvedUsers = await slack.resolveUserIds(testMembers, testToken);
    console.log(`Resolved ${resolvedUsers.length}/${testMembers.length} users`);
    console.log('   Valid user IDs:', resolvedUsers);
    console.log();

    console.log('All Slack integration tests passed!');
    console.log('\nTo test channel creation and messaging:');
    console.log('   1. Update SLACK_TEST_CHANNEL in .env with a test channel ID');
    console.log('   2. Run: npm run test:slack:live');

  } catch (error) {
    console.error('Test failed:', error.message);
    
    if (error.data?.error) {
      console.error('Slack API Error:', error.data.error);
      
      switch (error.data.error) {
        case 'invalid_auth':
          console.log('Check that your SLACK_TEST_TOKEN is valid and starts with "xoxb-"');
          break;
        case 'missing_scope':
          console.log('Add the required bot scopes to your Slack app');
          break;
        case 'account_inactive':
          console.log('Make sure your Slack app is installed in the workspace');
          break;
      }
    }
  } finally {
    await slack.cleanup();
  }
}

async function testSlackLive() {
  console.log('Testing Live Slack Operations...\n');

  const slack = new SlackConnector();
  await slack.initialize();

  const testToken = process.env.SLACK_TEST_TOKEN;
  const testChannel = process.env.SLACK_TEST_CHANNEL;
  
  if (!testToken || !testChannel) {
    console.log('Missing SLACK_TEST_TOKEN or SLACK_TEST_CHANNEL');
    console.log('Add both to your .env file for live testing');
    return;
  }

  try {
    console.log('Sending PR notification to test channel...');
    const prMessage = await slack.sendPullRequestMessage(
      testChannel, 
      mockPRData, 
      testToken, 
      'live_test_001'
    );
    console.log(`PR message sent: ${prMessage.messageId}`);
    if (prMessage.permalink) {
      console.log(`   Permalink: ${prMessage.permalink}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\nSending meeting notification...');
    const meetingMessage = await slack.sendMeetingNotification(
      testChannel,
      mockMeetingData,
      testToken,
      'live_test_002'
    );
    console.log(`Meeting notification sent: ${meetingMessage.messageId}`);

    console.log('\nLive Slack tests completed successfully!');
    console.log('   Check your test channel to see the formatted messages');

  } catch (error) {
    console.error('Live test failed:', error.message);
    console.error('Slack error:', error.data?.error);
  } finally {
    await slack.cleanup();
  }
}

async function testChannelCreation() {
  console.log('Testing Channel Creation (creates real channels)...\n');
  
  const slack = new SlackConnector();
  await slack.initialize();

  const testToken = process.env.SLACK_TEST_TOKEN;
  if (!testToken) {
    console.log('No SLACK_TEST_TOKEN found');
    return;
  }

  try {
    const channelData = {
      name: `test-pr-${Date.now()}`,
      type: 'review',
      topic: 'Test channel for WorkflowGenie MCP server',
      purpose: 'Testing automated channel creation',
      private: false,
      members: [],
      context: {
        purpose: 'This is a test channel created by WorkflowGenie',
        prNumber: '123',
        repository: 'company/test-repo',
        links: [
          {
            title: 'Pull Request #123',
            url: 'https://github.com/company/test-repo/pull/123'
          }
        ]
      }
    };

    console.log('Creating test channel...');
    const channel = await slack.createReviewChannel(channelData, testToken, 'channel_test_001');
    
    console.log(`Channel created successfully!`);
    console.log(`   Name: #${channel.name}`);
    console.log(`   ID: ${channel.id}`);
    console.log(`   URL: ${channel.webUrl}`);
    
    await slack.sendPullRequestMessage(channel.id, mockPRData, testToken, 'channel_msg_001');
    console.log('Test message sent to new channel');

    console.log('\nRemember to clean up test channels manually!');

  } catch (error) {
    console.error('Channel creation test failed:', error.message);
  } finally {
    await slack.cleanup();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const testType = process.argv[2] || 'basic';
  
  switch (testType) {
    case 'live':
      await testSlackLive();
      break;
    case 'channel':
      await testChannelCreation();
      break;
    default:
      await testSlackIntegration();
  }
}