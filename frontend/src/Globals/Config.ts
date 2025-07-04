/**
 * 服务配置接口
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * This is not used anymore, we use the ServiceConfig.ts interface directly.
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */
export interface ServiceConfigOld {
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
function getEnvironmentConfig(): ServiceConfigOld {
  if (process.env.NODE_ENV === 'production') {
    return {
      protocol: 'https',
      userServiceUrl: 'your-production-domain.com:10010',
      battleServiceUrl: 'your-production-domain.com:10014',
      cardServiceUrl: 'your-production-domain.com:10011',
      adminServiceUrl: 'your-production-domain.com:10013',
      assetServiceUrl: 'your-production-domain.com:10012',
      wsBaseUrl: 'wss://your-production-domain.com:10015',
      apiBaseUrl: 'your-production-domain.com:10016',
      environment: 'production',
      serviceName: 'Satintin',
      version: '1.0.0',
      hubURL: 'https://your-production-domain.com:10016',
      wsProtocol: 'wss'
    };
  } else {
    // 开发环境配置 - 局域网访问
    const LOCAL_IP = '59.66.18.59'; // 你的本机IP地址
    return {
      protocol: 'http',
      userServiceUrl: `${LOCAL_IP}:10010`,
      cardServiceUrl: `${LOCAL_IP}:10011`,
      assetServiceUrl: `${LOCAL_IP}:10012`,
      adminServiceUrl: `${LOCAL_IP}:10013`,
      battleServiceUrl: `${LOCAL_IP}:10014`, // 前面四个都没有用的，只有这个有用
      wsBaseUrl: `ws://${LOCAL_IP}:10014`, // WebSocket地址
      apiBaseUrl: `${LOCAL_IP}:10002`, // TongWen服务地址
      environment: 'development',
      serviceName: 'Satintin',
      version: '1.0.0-dev',
      hubURL: `http://${LOCAL_IP}:10002`,
      wsProtocol: 'ws'
    };
  }
}

/**
 * 全局配置对象
 userServiceUrl: 'localhost:10010',
 cardServiceUrl: 'localhost:10011',
 assetServiceUrl: 'localhost:10012',
 adminServiceUrl: 'localhost:10013',
 battleServiceUrl: 'localhost:10014',
 */
export const config_old: ServiceConfigOld = getEnvironmentConfig();