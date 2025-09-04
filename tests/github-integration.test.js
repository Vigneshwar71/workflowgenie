import { GitHubConnector } from '../src/integrations/github.js';
import dotenv from 'dotenv';

dotenv.config();

async function testGitHubIntegration() {
  console.log('Testing GitHub Integration...\n');

  const github = new GitHubConnector();
  await github.initialize();

  const testToken = process.env.GITHUB_TEST_TOKEN;
  
  if (!testToken) {
    console.log('No GITHUB_TEST_TOKEN found in environment variables');
    console.log('Create a token at: https://github.com/settings/tokens');
    console.log('Add it to your .env file as: GITHUB_TEST_TOKEN=your_token_here');
    return;
  }

  try {
    console.log('Test 1: Get current user...');
    const user = await github.getCurrentUser(testToken);
    console.log(`Current user: ${user.name} (@${user.login})`);
    console.log();

    console.log('Test 2: Search repositories...');
    const repos = await github.searchRepositories('javascript MCP', testToken, { limit: 3 });
    console.log(`Found ${repos.length} repositories:`);
    repos.forEach(repo => {
      console.log(`   - ${repo.fullName} (${repo.stars} stars)`);
    });
    console.log();

    console.log('Test 3: Get repository details...');
    const repoInfo = await github.getRepository('microsoft/vscode', testToken, 'test_001');
    console.log(`Repository: ${repoInfo.name}`);
    console.log(`   Description: ${repoInfo.description?.substring(0, 100)}...`);
    console.log(`   Language: ${repoInfo.language}`);
    console.log(`   Stars: ${repoInfo.stats.stars}`);
    console.log(`   Recent commits: ${repoInfo.recentCommits.length}`);
    console.log();

    console.log('Test 4: Validate repository access...');
    const access = await github.validateRepositoryAccess('microsoft/vscode', testToken);
    console.log(`Access to microsoft/vscode:`);
    console.log(`   Can read: ${access.canRead}`);
    console.log(`   Can write: ${access.canWrite}`);
    console.log(`   Permission: ${access.permission}`);
    console.log();

    console.log('All GitHub integration tests passed!');

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await github.cleanup();
  }
}

async function testPullRequest() {
  console.log('Testing Pull Request Integration...\n');

  const github = new GitHubConnector();
  await github.initialize();

  const testToken = process.env.GITHUB_TEST_TOKEN;
  if (!testToken) {
    console.log('No GITHUB_TEST_TOKEN found');
    return;
  }

  try {
    const repository = 'facebook/react';
    const prNumber = '28000';

    console.log(`Testing PR #${prNumber} from ${repository}...`);
    
    const prDetails = await github.getPullRequest(repository, prNumber, testToken, 'test_pr_001');
    
    console.log(`Pull Request Details:`);
    console.log(`   Title: ${prDetails.title}`);
    console.log(`   Author: ${prDetails.author.login}`);
    console.log(`   State: ${prDetails.state}`);
    console.log(`   Files changed: ${prDetails.stats.changedFiles}`);
    console.log(`   Additions: +${prDetails.stats.additions}, Deletions: -${prDetails.stats.deletions}`);
    console.log(`   Reviews: ${prDetails.reviews.length}`);
    console.log(`   Requested reviewers: ${prDetails.requestedReviewers.length}`);

    console.log('\nTesting suggested reviewers...');
    const suggestions = await github.getSuggestedReviewers(repository, prNumber, testToken, 'test_suggest_001');
    console.log(`Found ${suggestions.length} suggested reviewers:`);
    suggestions.forEach((reviewer, i) => {
      console.log(`   ${i + 1}. ${reviewer.name} (@${reviewer.login}) - ${reviewer.reason}`);
    });

    console.log('\nPull Request tests passed!');

  } catch (error) {
    console.error('PR Test failed:', error.message);
    
    if (error.message.includes('not found')) {
      console.log('Try updating the repository and PR number in the test');
    }
  } finally {
    await github.cleanup();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting GitHub Integration Tests\n');
  
  await testGitHubIntegration();
  console.log('\n' + '='.repeat(50) + '\n');
  await testPullRequest();
  
  console.log('\nGitHub testing complete!');
  console.log('\nNext: Test this integration by running:');
  console.log('   node tests/github-integration.test.js');
}