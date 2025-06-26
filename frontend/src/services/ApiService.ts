import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '../globals/Config';

// 类型保护函数，用于检查错误是否为 Axios 错误
interface ErrorWithResponse {
  response: {
    data: {
      message?: string;
    };
    status: number;
  };
}

function isAxiosError(error: unknown): error is AxiosError & ErrorWithResponse {
  return axios.isAxiosError(error) && 
         error.response !== undefined && 
         error.response.data !== undefined;
}

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
      // 添加X-Hash头，与Plugins/CommonUtils/Send/SendMessage.ts保持一致
      if (config.data) {
        const cryptoJS = require('crypto-js');
        config.headers['X-Hash'] = cryptoJS.MD5(JSON.stringify(config.data)).toString();
      }
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
    // 检查响应状态和数据
    if (response.status === 200) {
      // 成功的响应
      if (response.data && typeof response.data === 'object') {
        // 如果响应数据中包含成功/失败的明确标志，使用它
        if (response.data.success === false) {
          console.error('API操作失败:', response.data.message || '未知错误');
          // 这里我们不抛出错误，而是让调用者处理业务逻辑错误
        }
      }
      return response;
    } else if (response.status === -1) {
      // token失效
      if (response.data === '错误：用户令牌失效/不存在，请重新登录！' ||
          response.data === '错误: 参数错误 userToken 不能为空') {
        localStorage.removeItem('auth_token');
        console.error('登录凭证已失效，请重新登录');
      }
    } else if (response.status === -2 || response.status === -3) {
      // 连接错误或已在别处登录
      console.error('连接错误或已在别处登录:', response.data);
      if (response.status === -3) {
        localStorage.removeItem('auth_token');
      }
    } else if (response.status === 400 || response.status === 401 || response.status === 404) {
      // 客户端错误，应当明确向用户展示
      console.error('请求错误:', response.status, response.data);
      // 401 未授权，清除token
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
      }
    }
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
      try {
        // 格式与API.tsx中的getURL()方法保持一致: protocol://host/api/route
        const response = await ApiService.post(`${config.protocol}://${new URL(config.userServiceUrl).host}/api/auth/login`, { username, password });

        // 检查响应是否表示成功
        if (response && response.success !== false) {
          return {
            success: true,
            data: response,
            message: '登录成功'
          };
        } else {
          // 返回服务器提供的错误信息
          return {
            success: false,
            message: response?.message || '登录失败，请检查用户名和密码',
            status: response?.status || 400
          };
        }
      } catch (error) {
        console.error('登录失败:', error);
        // 返回格式化的错误信息
        if (isAxiosError(error)) {
          // 根据HTTP状态码返回不同的错误信息
          const status = error.response.status;
          let message = '登录失败';

          switch (status) {
            case 401:
              message = '用户名或密码错误';
              break;
            case 404:
              message = '用户不存在，请先注册';
              break;
            case 403:
              message = '账户被禁用，请联系管理员';
              break;
            default:
              message = error.response.data.message || '登录服务异常，请稍后再试';
          }

          return {
            success: false,
            message,
            status
          };
        } else {
          return {
            success: false,
            message: error instanceof Error ? error.message : '登录服务不可用，请稍后再试',
            status: 500
          };
        }
      }
    },

    getCurrentUser: async () => {
      return ApiService.get(`${config.protocol}://${new URL(config.userServiceUrl).host}/api/users/me`);
    },

    // 注册新用户
    register: async (username: string, email: string, password: string) => {
      try {
        const response = await ApiService.post(`${config.protocol}://${new URL(config.userServiceUrl).host}/api/auth/register`, {
          username,
          email,
          password
        });

        // 检查响应是否表示成功
        if (response && response.success !== false) {
          return {
            success: true,
            data: response,
            message: '注册成功'
          };
        } else {
          // 返回服务器提供的错误信息
          return {
            success: false,
            message: response?.message || '注册失败，请稍后再试',
            status: response?.status || 400
          };
        }
      } catch (error) {
        console.error('注册失败:', error);
        // 返回格式化的错误信息
        if (isAxiosError(error)) {
          // 根据HTTP状态码返回不同的错误信息
          const status = error.response.status;
          let message = '注册失败';

          switch (status) {
            case 409:
              message = '用户名或邮箱已存在';
              break;
            case 400:
              message = error.response.data.message || '请提供有效的注册信息';
              break;
            default:
              message = error.response.data.message || '注册服务异常，请稍后再试';
          }

          return {
            success: false,
            message,
            status
          };
        } else {
          return {
            success: false,
            message: error instanceof Error ? error.message : '注册服务不可用，请稍后再试',
            status: 500
          };
        }
      }
    }
  };

  // 卡牌服务API
  static cardService = {
    baseUrl: config.cardServiceUrl,

    // 在这里添加卡牌服务特定的方法
    getPlayerCards: async (playerId: string) => {
      // 格式与API.tsx中的getURL()方法保持一致: protocol://host/api/route
      return ApiService.get(`${config.protocol}://${new URL(config.cardServiceUrl).host}/api/cards/player/${playerId}`);
    },

    upgradeCard: async (cardId: string) => {
      return ApiService.post(`${config.protocol}://${new URL(config.cardServiceUrl).host}/api/cards/${cardId}/upgrade`);
    }
  };

  // 战斗服务API
  static battleService = {
    baseUrl: config.battleServiceUrl,

    // 在这里添加战斗服务特定的方法
    configureDeck: async (playerId: string, cardIds: string[]) => {
      // 格式与API.tsx中的getURL()方法保持一致: protocol://host/api/route
      return ApiService.post(`${config.protocol}://${new URL(config.battleServiceUrl).host}/api/decks/configure`, { playerId, cardIds });
    }
  };

  // 连接测试API
  static testConnection = async (url: string): Promise<any> => {
    const host = new URL(url).host;
    const protocol = new URL(url).protocol.replace(':', '');

    try {
      // 先尝试标准的健康检查端点
      return await ApiService.get(`${protocol}://${host}/health`);
    } catch (error: unknown) {
      // 如果标准健康检查失败，尝试备用端点
      try {
        return await ApiService.get(`${protocol}://${host}/api/health`);
      } catch (secondError: unknown) {
        // 如果两个健康检查都失败，再尝试最简单的请求
        // 使用完整URL，确保请求格式统一
        return await fetch(`${protocol}://${host}`, { 
          method: 'GET',
          mode: 'cors',
          headers: { 
            'Content-Type': 'application/json',
            // 添加可能需要的其他头部
            'Accept': 'application/json'
          }
        });
      }
    }
  };
}
