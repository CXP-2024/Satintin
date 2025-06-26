import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../globals/Config';

// 创建一个axios实例
const apiClient = axios.create({
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证令牌
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理错误
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('API错误响应:', error.response.status, error.response.data);

      // 处理401未授权错误
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
        // 可以在这里添加重定向到登录页面的逻辑
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('API请求无响应:', error.request);
    } else {
      // 请求设置时发生了错误
      console.error('API请求错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// API服务类
export class ApiService {
  static async get<T = any>(endpoint: string, params?: any, options?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.get(endpoint, { params, ...options });
    return response.data;
  }

  static async post<T = any>(endpoint: string, data?: any, options?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.post(endpoint, data, options);
    return response.data;
  }

  static async put<T = any>(endpoint: string, data?: any, options?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.put(endpoint, data, options);
    return response.data;
  }

  static async delete<T = any>(endpoint: string, options?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.delete(endpoint, options);
    return response.data;
  }

  // 用户服务API
  static userService = {
    baseUrl: config.userServiceUrl,

    // 在这里添加用户服务特定的方法
    login: async (username: string, password: string) => {
      return ApiService.post(`${config.userServiceUrl}/api/auth/login`, { username, password });
    },

    getCurrentUser: async () => {
      return ApiService.get(`${config.userServiceUrl}/api/users/me`);
    }
  };

  // 卡牌服务API
  static cardService = {
    baseUrl: config.cardServiceUrl,

    // 在这里添加卡牌服务特定的方法
    getPlayerCards: async (playerId: string) => {
      return ApiService.get(`${config.cardServiceUrl}/api/cards/player/${playerId}`);
    },

    upgradeCard: async (cardId: string) => {
      return ApiService.post(`${config.cardServiceUrl}/api/cards/${cardId}/upgrade`);
    }
  };

  // 战斗服务API
  static battleService = {
    baseUrl: config.battleServiceUrl,

    // 在这里添加战斗服务特定的方法
    configureDeck: async (playerId: string, cardIds: string[]) => {
      return ApiService.post(`${config.battleServiceUrl}/api/decks/configure`, { playerId, cardIds });
    }
  };

  // 连接测试API
  static testConnection = async (url: string): Promise<any> => {
    try {
      // 先尝试标准的健康检查端点
      return await ApiService.get(`${url}/health`);
    } catch (error) {
      // 如果标准健康检查失败，尝试备用端点
      try {
        return await ApiService.get(`${url}/api/health`);
      } catch (secondError) {
        // 如果两个健康检查都失败，再尝试最简单的请求
        return await fetch(url, { 
          method: 'GET',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  };
}
