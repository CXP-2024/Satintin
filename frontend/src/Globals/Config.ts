/**
 * 服务配置接口
 */
export interface ServiceConfig {
  protocol: string;
  userServiceUrl: string;
  battleServiceUrl: string;
  apiBaseUrl: string;
  cardServiceUrl: string;
  adminServiceUrl: string;
  assetServiceUrl: string;
  wsBaseUrl: string;
  environment: 'development' | 'production' | 'test';
  serviceName: string;
  version: string;
  hubURL?: string;
  wsProtocol?: string;
}

/**
 * 根据环境获取配置
 */
function getEnvironmentConfig(): ServiceConfig {
  if (process.env.NODE_ENV === 'production') {
    return {
      protocol: 'https',
      userServiceUrl: 'your-production-domain.com:10010',
      battleServiceUrl: 'your-production-domain.com:10011',
      cardServiceUrl: 'your-production-domain.com:10012',
      adminServiceUrl: 'your-production-domain.com:10013',
      assetServiceUrl: 'your-production-domain.com:10014',
      wsBaseUrl: 'wss://your-production-domain.com:10015',
      apiBaseUrl: 'your-production-domain.com:10016',
      environment: 'production',
      serviceName: 'Satintin',
      version: '1.0.0',
      hubURL: 'https://your-production-domain.com:10016',
      wsProtocol: 'wss'
    };
  } else {
    // 开发环境配置
    return {
      protocol: 'http',
      userServiceUrl: 'localhost:10010',
      battleServiceUrl: 'localhost:10011',
      cardServiceUrl: 'localhost:10012',
      adminServiceUrl: 'localhost:10013',
      assetServiceUrl: 'localhost:10014',
      wsBaseUrl: 'ws://localhost:10015',
      apiBaseUrl: 'localhost:10016',
      environment: 'development',
      serviceName: 'Satintin',
      version: '1.0.0-dev',
      hubURL: 'http://localhost:10016',
      wsProtocol: 'ws'
    };
  }
}

/**
 * 全局配置对象
 */
export const config: ServiceConfig = getEnvironmentConfig();