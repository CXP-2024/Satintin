import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '../globals/Config';
import { User, LoginRequest, RegisterRequest } from '../types/User';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class ApiService {
  private userServiceURL: string;
  private token: string | null = null;

  constructor() {
    this.userServiceURL = config.userServiceUrl || '';
  }

  setToken(token: string) {
    this.token = token;
  }

  private getRequestConfig(requestConfig?: AxiosRequestConfig): AxiosRequestConfig {
    const headers: any = {
      'Content-Type': 'application/json',
      ...requestConfig?.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return {
      ...requestConfig,
      headers,
    };
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const requestConfig = this.getRequestConfig(config);
      console.log('🔍 [ApiService] 发送请求:', {
        method,
        url,
        data,
        headers: requestConfig.headers
      });
      
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        data,
        ...requestConfig,
      });

      console.log('✅ [ApiService] 请求成功:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        headers: response.headers
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error('❌ [ApiService] 请求失败:', {
        url,
        method,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        dataType: typeof axiosError.response?.data,
        headers: axiosError.response?.headers,
        message: axiosError.message,
        fullError: axiosError
      });
      
      // 尝试获取更详细的错误信息
      let errorMessage = axiosError.message || '请求失败';
      let errorData = axiosError.response?.data;
      
      if (typeof errorData === 'string' && errorData.trim()) {
        errorMessage = errorData.trim();
      } else if (axiosError.response?.statusText) {
        errorMessage = `${axiosError.response.status} ${axiosError.response.statusText}`;
      }
      
      return {
        success: false,
        error: axiosError.message,
        message: errorMessage,
      };
    }
  }

  // GET请求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  // POST请求
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, config);
  }

  // PUT请求
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, config);
  }

  // DELETE请求
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  // 测试后端健康状态
  async testBackendHealth(): Promise<ApiResponse<string>> {
    try {
      console.log('🔍 [ApiService] 测试后端健康状态...');
      
      // 尝试访问健康检查端点
      const response = await this.request<any>('GET', '/health');
      
      if (response.success) {
        console.log('✅ [ApiService] 后端健康检查通过');
        return {
          success: true,
          data: '后端服务正常',
          message: '后端服务正常运行'
        };
      } else {
        console.log('❌ [ApiService] 后端健康检查失败');
        return {
          success: false,
          message: '后端服务健康检查失败'
        };
      }
    } catch (error) {
      console.error('💥 [ApiService] 后端健康检查异常:', error);
      return {
        success: false,
        message: '无法连接到后端服务'
      };
    }
  }

  // 用户登录 - 增强调试信息
  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      console.log(`🔍 [ApiService] 开始登录请求`);
      console.log('📋 [ApiService] 登录参数:', {
        username: credentials.username,
        password: credentials.password ? '***' : 'null'
      });
      
      // 先测试后端健康状态
      console.log('🔍 [ApiService] 登录前先测试后端状态...');
      const healthCheck = await this.testBackendHealth();
      console.log('🔍 [ApiService] 后端健康状态:', healthCheck);
      
      const requestData = {
        type: "LoginUserMessage",
        username: credentials.username,
        passwordHash: credentials.password
      };
      
      console.log('📤 [ApiService] 发送登录请求数据:', requestData);
      
      const response = await this.request<any>(
        'POST',
        '/api/LoginUserMessage',
        requestData
      );

      console.log('📥 [ApiService] 登录响应完整信息:', {
        success: response.success,
        data: response.data,
        dataType: typeof response.data,
        message: response.message,
        error: response.error
      });

      if (response.success && response.data !== undefined) {
        console.log('✅ [ApiService] 登录成功, 原始响应:', response.data);
        console.log('🔍 [ApiService] 响应数据类型:', typeof response.data);
        console.log('🔍 [ApiService] 响应数据内容:', response.data);
        
        let responseText = response.data;
        
        // 后端返回的是纯字符串，可能是userToken或错误消息
        if (typeof responseText === 'string') {
          responseText = responseText.trim();
          console.log('📝 [ApiService] 处理字符串响应:', responseText);
          
          // 检查是否是错误消息
          if (responseText.includes('错误') || 
              responseText.includes('失败') || 
              responseText.includes('不存在') || 
              responseText.includes('密码不正确') ||
              responseText.includes('用户名不存在') ||
              responseText.includes('Invalid') ||
              responseText.includes('failed') ||
              responseText.includes('error')) {
            console.log('❌ [ApiService] 检测到错误响应:', responseText);
            return {
              success: false,
              message: responseText
            };
          }
          
          // 如果是UUID格式的字符串，认为是登录成功的token
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(responseText)) {
            console.log('🎉 [ApiService] 检测到UUID token:', responseText);
            const userToken = responseText;
            
            // 构造用户信息
            const frontendUser: User = {
              id: userToken, // 使用token作为临时ID
              username: credentials.username,
              email: `${credentials.username}@example.com`,
              phoneNumber: '',
              rank: '青铜',
              gems: 1000,
              status: 'online',
              registrationTime: new Date().toISOString(),
              lastLoginTime: new Date().toISOString(),
              rankPosition: 0,
              cardDrawCount: 0
            };

            this.setToken(userToken);

            return {
              success: true,
              data: { user: frontendUser, token: userToken },
              message: '登录成功'
            };
          }
          
          // 如果响应包含成功关键字
          if (responseText.includes('成功') || responseText.includes('success')) {
            console.log('🎉 [ApiService] 检测到成功响应:', responseText);
            const userToken = 'token-' + Date.now();
            const frontendUser: User = {
              id: userToken,
              username: credentials.username,
              email: `${credentials.username}@example.com`,
              phoneNumber: '',
              rank: '青铜',
              gems: 1000,
              status: 'online',
              registrationTime: new Date().toISOString(),
              lastLoginTime: new Date().toISOString(),
              rankPosition: 0,
              cardDrawCount: 0
            };

            this.setToken(userToken);

            return {
              success: true,
              data: { user: frontendUser, token: userToken },
              message: '登录成功'
            };
          }
          
          // 其他情况认为是错误
          console.log('❌ [ApiService] 无法识别的响应格式:', responseText);
          return {
            success: false,
            message: responseText || '登录失败：无法识别的响应格式'
          };
        }
        
        // 如果不是字符串，尝试处理对象响应
        console.log('🔍 [ApiService] 处理非字符串响应:', responseText);
        return {
          success: false,
          message: '服务器响应格式异常：' + JSON.stringify(responseText)
        };
      }
      
      console.log('❌ [ApiService] 登录请求失败:', response);
      return {
        success: false,
        message: response.message || response.error || '登录失败'
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error('💥 [ApiService] 登录异常:', axiosError);
      return {
        success: false,
        error: axiosError.message,
        message: axiosError.response?.data || axiosError.message || '登录失败',
      };
    }
  }

  // 用户注册 - 增强调试信息和错误处理
  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    try {
      console.log(`🔍 [ApiService] 开始注册请求`);
      console.log('📋 [ApiService] 注册参数:', {
        username: userData.username,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        password: userData.password ? '***' : 'null'
      });
      
      // 先测试后端健康状态
      console.log('🔍 [ApiService] 注册前先测试后端状态...');
      const healthCheck = await this.testBackendHealth();
      console.log('🔍 [ApiService] 后端健康状态:', healthCheck);
      
      // 尝试简单的连接测试
      console.log('🔍 [ApiService] 尝试简单的连接测试...');
      try {
        const pingResponse = await fetch('/api/', { method: 'GET' });
        console.log('🔍 [ApiService] 连接测试结果:', {
          status: pingResponse.status,
          statusText: pingResponse.statusText,
          ok: pingResponse.ok
        });
      } catch (pingError) {
        console.error('🔍 [ApiService] 连接测试失败:', pingError);
      }
      
      const requestData = {
        type: "RegisterUserMessage",
        username: userData.username,
        passwordHash: userData.password,
        email: userData.email,
        phoneNumber: userData.phoneNumber || ''
      };
      
      console.log('📤 [ApiService] 发送注册请求数据:', requestData);
      
      const response = await this.request<any>(
        'POST',
        '/api/RegisterUserMessage',
        requestData
      );

      console.log('📥 [ApiService] 注册响应完整信息:', {
        success: response.success,
        data: response.data,
        dataType: typeof response.data,
        message: response.message,
        error: response.error
      });

      if (response.success && response.data !== undefined) {
        console.log('✅ [ApiService] 注册成功, 原始响应:', response.data);
        
        let responseText = response.data;
        
        // 后端返回的是纯字符串
        if (typeof responseText === 'string') {
          responseText = responseText.trim();
          console.log('📝 [ApiService] 处理注册字符串响应:', responseText);
          
          // 检查是否是错误消息
          if (responseText.includes('错误') || 
              responseText.includes('失败') || 
              responseText.includes('已存在') || 
              responseText.includes('不合法') ||
              responseText.includes('格式') ||
              responseText.includes('Invalid') ||
              responseText.includes('failed') ||
              responseText.includes('error') ||
              responseText.includes('exists')) {
            console.log('❌ [ApiService] 检测到注册错误响应:', responseText);
            return {
              success: false,
              message: responseText
            };
          }
          
          // 如果是UUID格式，认为是注册成功返回的userID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(responseText)) {
            console.log('🎉 [ApiService] 检测到注册成功的UUID:', responseText);
            const userID = responseText;
            
            // 构造用户信息
            const frontendUser: User = {
              id: userID,
              username: userData.username,
              email: userData.email,
              phoneNumber: userData.phoneNumber || '',
              rank: '青铜',
              gems: 1000,
              status: 'online',
              registrationTime: new Date().toISOString(),
              lastLoginTime: new Date().toISOString(),
              rankPosition: 0,
              cardDrawCount: 0
            };

            return {
              success: true,
              data: frontendUser,
              message: '注册成功'
            };
          }
          
          // 其他成功响应
          if (responseText.includes('成功') || responseText.includes('success')) {
            console.log('🎉 [ApiService] 检测到注册成功响应:', responseText);
            const frontendUser: User = {
              id: 'user-' + Date.now(),
              username: userData.username,
              email: userData.email,
              phoneNumber: userData.phoneNumber || '',
              rank: '青铜',
              gems: 1000,
              status: 'online',
              registrationTime: new Date().toISOString(),
              lastLoginTime: new Date().toISOString(),
              rankPosition: 0,
              cardDrawCount: 0
            };

            return {
              success: true,
              data: frontendUser,
              message: responseText
            };
          }
          
          // 默认认为是错误
          console.log('❌ [ApiService] 无法识别的注册响应:', responseText);
          return {
            success: false,
            message: responseText || '注册失败：无法识别的响应格式'
          };
        }
        
        console.log('🔍 [ApiService] 处理非字符串注册响应:', responseText);
        return {
          success: false,
          message: '服务器响应格式异常：' + JSON.stringify(responseText)
        };
      }

      console.log('❌ [ApiService] 注册请求失败:', response);
      return {
        success: false,
        message: response.message || response.error || '注册失败'
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error('💥 [ApiService] 注册异常:', axiosError);
      
      // 特殊处理500错误
      if (axiosError.response?.status === 500) {
        const errorData = axiosError.response?.data;
        console.log('🔍 [ApiService] 500错误详情:', errorData);
        
        let errorMessage = '服务器内部错误，请检查：\n';
        errorMessage += '1. 后端服务是否正常运行\n';
        errorMessage += '2. 数据库连接是否正常\n';
        errorMessage += '3. 服务配置是否正确\n';
        errorMessage += '4. 或尝试使用不同的用户名';
        
        if (typeof errorData === 'string' && errorData.trim()) {
          errorMessage = errorData.trim();
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      return {
        success: false,
        error: axiosError.message,
        message: axiosError.response?.data || axiosError.message || '注册失败',
      };
    }
  }

  // 获取用户信息
  async getUserInfo(): Promise<ApiResponse<User>> {
    try {
      const response = await this.request<any>('POST', '/api/GetUserInfoMessage', {
        type: "GetUserInfoMessage",
        userToken: this.token
      });
      
      if (response.success && response.data) {
        let responseText = response.data;
        
        if (typeof responseText === 'string') {
          // 检查错误
          if (responseText.includes('错误') || responseText.includes('失败') || responseText.includes('无效')) {
            return {
              success: false,
              message: responseText
            };
          }
          
          // 尝试解析为JSON（如果后端返回JSON格式）
          try {
            const userData = JSON.parse(responseText);
            const frontendUser: User = {
              id: userData.userID || userData.id || 'current-user',
              username: userData.username || '当前用户',
              email: userData.email || 'user@example.com',
              phoneNumber: userData.phoneNumber || '',
              rank: userData.rank || '青铜',
              gems: userData.stoneAmount || userData.gems || 1000,
              status: userData.isOnline ? 'online' : 'offline',
              registrationTime: userData.registrationTime || new Date().toISOString(),
              lastLoginTime: userData.lastLoginTime,
              rankPosition: userData.rankPosition || 0,
              cardDrawCount: userData.cardDrawCount || 0
            };

            return {
              success: true,
              data: frontendUser
            };
          } catch (e) {
            // 如果不是JSON，返回默认用户信息
            return {
              success: false,
              message: '无法解析用户信息'
            };
          }
        }
      }

      return {
        success: false,
        message: response.message || '获取用户信息失败'
      };
    } catch (error) {
      console.error('❌ [ApiService] 获取用户信息失败:', error);
      return {
        success: false,
        message: '获取用户信息失败'
      };
    }
  }

  // 用户登出
  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.request<void>('POST', '/api/LogoutUserMessage', {
        type: "LogoutUserMessage",
        userToken: this.token
      });
      this.token = null;
      return { success: true };
    } catch (error) {
      this.token = null; // 即使失败也清除 token
      return {
        success: true, // 登出操作总是成功
        message: '已清除本地登录状态'
      };
    }
  }
}

export const apiService = new ApiService();
