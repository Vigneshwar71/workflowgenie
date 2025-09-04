console.log('Debug test starting...');

import dotenv from 'dotenv';
dotenv.config();

console.log('Environment loaded');

try {
  console.log('Testing GitHub integration...');
  const { GitHubConnector } = await import('./src/integrations/github.js');
  console.log('GitHub connector imported');
  
  const github = new GitHubConnector();
  await github.initialize();
  console.log('GitHub initialized');
  
  const githubToken = process.env.GITHUB_TEST_TOKEN;
  if (!githubToken) {
    console.log('No GitHub token found');
    process.exit(1);
  }
  
  console.log('Fetching PR...');
  const prDetails = await github.getPullRequest(
    'facebook/react',
    '1000',
    githubToken,
    'debug_test'
  );
  
  console.log('PR fetched successfully:');
  console.log(`Title: ${prDetails.title}`);
  console.log(`Author: ${prDetails.author.login}`);
  
  await github.cleanup();
  console.log('Test completed successfully!');
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
