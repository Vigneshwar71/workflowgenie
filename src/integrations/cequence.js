import { logger } from '../utils/logger.js';

export class CequenceGateway {
  constructor(config) {
    this.config = config;
    this.gatewayUrl = config.gatewayUrl;
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
  }

  async initialize() {
    logger.info('Configuring for Cequence AI Gateway proxy...');
    
    // Cequence handles the heavy lifting - we just need to be aware we're behind it
    this.isProxied = true;
    
    logger.info('✅ Cequence AI Gateway configuration ready');
    logger.info(`📡 Gateway URL: ${this.gatewayUrl}`);
  }

  /**
   * Get connection info for client configuration
   */
  getProxyInfo() {
    return {
      gatewayUrl: this.gatewayUrl,
      isProxied: true,
      features: [
        'rate_limiting',
        'authentication', 
        'request_logging',
        'security_policies',
        'observability'
      ]
    };
  }

  /**
   * Add request metadata for Cequence observability
   */
  enrichRequestMetadata(request, additionalData = {}) {
    return {
      ...request,
      'x-cequence-project': this.projectId,
      'x-cequence-source': 'workflowgenie-mcp',
      'x-cequence-metadata': JSON.stringify({
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        ...additionalData
      })
    };
  }

  /**
   * Log tool execution for Cequence observability
   */
  logToolExecution(toolName, result, userContext) {
    // Cequence automatically captures this through the proxy
    // We just add structured logging for our own monitoring
    logger.info('Tool executed through Cequence proxy', {
      tool: toolName,
      success: result.success,
      executionTime: result.executionTime,
      userId: userContext?.userId,
      servicesUsed: result.servicesUsed || [],
      'x-cequence-tracked': true
    });
  }

  async cleanup() {
    logger.info('✅ Cequence configuration cleanup complete');
  }
}
