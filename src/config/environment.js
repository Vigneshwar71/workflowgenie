// src/config/environment.js
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Cequence AI Gateway Configuration
  cequence: {
    apiKey: process.env.CEQUENCE_API_KEY,
    baseUrl: process.env.CEQUENCE_BASE_URL || 'https://api.cequence.ai',
    proxyEndpoint: process.env.CEQUENCE_PROXY_ENDPOINT
  },
  
  // Descope Authentication Configuration
  descope: {
    projectId: process.env.DESCOPE_PROJECT_ID,
    managementKey: process.env.DESCOPE_MANAGEMENT_KEY,
    baseUrl: process.env.DESCOPE_BASE_URL || 'https://api.descope.com'
  },
  
  // External API Configuration
  apis: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      baseUrl: 'https://api.github.com'
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      baseUrl: 'https://slack.com/api'
    },
    googleCalendar: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    },
    notion: {
      clientId: process.env.NOTION_CLIENT_ID,
      clientSecret: process.env.NOTION_CLIENT_SECRET,
      version: '2022-06-28'
    }
  },
  
  // MCP Server Configuration
  mcp: {
    name: 'WorkflowGenie',
    version: '1.0.0',
    description: 'AI-powered workplace orchestration server'
  }
};

// Validation function
export function validateConfig() {
  const required = [
    'CEQUENCE_API_KEY',
    'DESCOPE_PROJECT_ID',
    'GITHUB_CLIENT_ID',
    'SLACK_CLIENT_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment configuration validated');
}

// Export individual configs for convenience
export const { cequence, descope, apis, mcp } = config;