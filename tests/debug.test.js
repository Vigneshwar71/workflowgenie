import dotenv from 'dotenv';

console.log('Starting debug test...');

dotenv.config();

console.log('Environment loaded');

const githubToken = process.env.GITHUB_TEST_TOKEN;
const slackToken = process.env.SLACK_TEST_TOKEN;

console.log(`GitHub Token: ${githubToken ? 'Found' : 'Missing'}`);
console.log(`Slack Token: ${slackToken ? 'Found' : 'Missing'}`);

console.log('Basic test completed');
