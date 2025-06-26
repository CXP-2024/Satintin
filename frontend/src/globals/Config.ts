// 全局配置文件，用于连接后端服务

interface ServiceConfig {
  protocol: string;
  apiBaseUrl: string;
  userServiceUrl: string;
  cardServiceUrl: string;
  adminServiceUrl: string;
  assetServiceUrl: string;
  battleServiceUrl: string;
}

export const config: ServiceConfig = {
  protocol: 'http',
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:10002',
  userServiceUrl: process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:10010',
  cardServiceUrl: process.env.REACT_APP_CARD_SERVICE_URL || 'http://localhost:10011',
  adminServiceUrl: process.env.REACT_APP_ADMIN_SERVICE_URL || 'http://localhost:10013',
  assetServiceUrl: process.env.REACT_APP_ASSET_SERVICE_URL || 'http://localhost:10012',
  battleServiceUrl: process.env.REACT_APP_BATTLE_SERVICE_URL || 'http://localhost:10014'
};