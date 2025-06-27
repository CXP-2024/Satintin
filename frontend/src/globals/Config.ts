/**
 * 服务配置接口
 */
export interface ServiceConfig {
  protocol: string;
  userServiceUrl: string;
  battleServiceUrl: string;
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
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig: ServiceConfig = {
    protocol: 'http',
    // 如果使用代理，userServiceUrl 应该为空或相对路径
    userServiceUrl: process.env.REACT_APP_USER_SERVICE_URL || '', // 代理模式下为空
    battleServiceUrl: process.env.REACT_APP_BATTLE_SERVICE_URL || 'http://localhost:10011',
    cardServiceUrl: process.env.REACT_APP_CARD_SERVICE_URL || 'http://localhost:10012',
    adminServiceUrl: process.env.REACT_APP_ADMIN_SERVICE_URL || 'http://localhost:10013',
    assetServiceUrl: process.env.REACT_APP_ASSET_SERVICE_URL || 'http://localhost:10014',
    wsBaseUrl: process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:10015',
    environment: env as 'development' | 'production' | 'test',
    serviceName: 'satintin-frontend',
    version: '1.0.0',
    hubURL: process.env.REACT_APP_HUB_URL || 'localhost:10016',
    wsProtocol: process.env.REACT_APP_WS_PROTOCOL || 'ws'
  };

  return baseConfig;
}

/**
 * 全局配置对象
 */
export const config: ServiceConfig = getEnvironmentConfig();