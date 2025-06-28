import { MD5 } from 'crypto-js';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/User';
import { commonSend } from '../plugins/CommonUtils/Send/CommonSend';
import { API } from '../plugins/CommonUtils/Send/API';
import { config } from '../globals/Config';

// 类型安全的响应类型定义
interface LoginSuccess {
    success: true;
    data: { user: User; token: string };
    message?: string;
}

interface LoginFailure {
    success: false;
    message: string;
    error?: string;
}

type LoginResponse = LoginSuccess | LoginFailure;

interface RegisterSuccess {
    success: true;
    data: User;
    message?: string;
}

interface RegisterFailure {
    success: false;
    message: string;
    error?: string;
}

type RegisterResponse = RegisterSuccess | RegisterFailure;

interface GetUserInfoSuccess {
    success: true;
    data: User;
}

interface GetUserInfoFailure {
    success: false;
    message: string;
}

type GetUserInfoResponse = GetUserInfoSuccess | GetUserInfoFailure;

interface LogoutSuccess {
    success: true;
    message?: string;
}

interface LogoutFailure {
    success: false;
    message: string;
}

type LogoutResponse = LogoutSuccess | LogoutFailure;

// 重新定义消息类，匹配后端期望的格式
class LoginUserMessage extends API {
  public readonly type = "LoginUserMessage";
  
  constructor(
    public username: string,
    public passwordHash: string
  ) {
    super();
    this.serviceName = 'UserService';
  }
  
  getURL(): string {
    // 在开发环境使用代理，生产环境使用完整URL
    if (process.env.NODE_ENV === 'development') {
      return `/api/LoginUserMessage`;  // 使用代理
    } else {
      return `${config.protocol}://${config.userServiceUrl}/api/LoginUserMessage`;
    }
  }
}

class RegisterUserMessage extends API {
  public readonly type = "RegisterUserMessage";
  
  constructor(
    public username: string,
    public passwordHash: string,
    public email: string,
    public phoneNumber: string
  ) {
    super();
    this.serviceName = 'UserService';
  }
  
  getURL(): string {
    // 在开发环境使用代理，生产环境使用完整URL
    if (process.env.NODE_ENV === 'development') {
      return `/api/RegisterUserMessage`;  // 使用代理
    } else {
      return `${config.protocol}://${config.userServiceUrl}/api/RegisterUserMessage`;
    }
  }
}

class GetUserInfoMessage extends API {
  public readonly type = "GetUserInfoMessage";
  
  constructor(public userToken: string) {
    super();
    this.serviceName = 'UserService';
  }
  
  getURL(): string {
    if (process.env.NODE_ENV === 'development') {
      return `/api/GetUserInfoMessage`;
    } else {
      return `${config.protocol}://${config.userServiceUrl}/api/GetUserInfoMessage`;
    }
  }
}

// 定义登出消息类
class LogoutUserMessage extends API {
  public readonly type = "LogoutUserMessage";
  
  constructor(public userToken: string) {
    super();
    this.serviceName = 'UserService';
  }
  
  getURL(): string {
    if (process.env.NODE_ENV === 'development') {
      return `/api/LogoutUserMessage`;
    } else {
      return `${config.protocol}://${config.userServiceUrl}/api/LogoutUserMessage`;
    }
  }
}

export class ApiService {
  private token: string | null = null;

  constructor() {
    console.log('🔧 [ApiService] 初始化，使用配置:', {
      protocol: config.protocol,
      userServiceUrl: config.userServiceUrl,
      environment: config.environment
    });
  }

  setToken(token: string) {
    this.token = token;
    console.log('🔑 [ApiService] 设置认证令牌');
  }

  // 🔑 密码处理方法 - 根据后端测试文件，直接发送原始密码
  private preparePassword(password: string): string {
    // 根据后端测试文件的注释：Send as plain text, your backend handles hashing
    console.log('🔍 [密码处理] 发送原始密码给后端处理哈希');
    return password; // 直接返回原始密码
  }

  // 用户登录 - 使用CommonSend系统
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return new Promise((resolve) => {
      console.log(`🔍 [ApiService] 开始登录请求`);
      console.log('📋 [ApiService] 登录参数:', {
        username: credentials.username,
        password: credentials.password ? '***' : 'null'
      });

      // 🔑 准备密码 - 直接发送原始密码
      const passwordHash = this.preparePassword(credentials.password);

      // 创建登录消息
      const loginMessage = new LoginUserMessage(
        credentials.username,
        passwordHash
      );

      console.log('📤 [ApiService] 发送登录消息:', loginMessage);
      console.log('🔑 [ApiService] 密码字段:', passwordHash ? '***' : 'empty');
      console.log('🌐 [ApiService] 请求URL:', loginMessage.getURL());

      // 使用CommonSend发送请求
      commonSend(
        loginMessage,
        // 成功回调
        (response: any) => {
          console.log('✅ [ApiService] 登录成功回调:', response);
          console.log('🔍 [ApiService] 响应类型:', typeof response);
          
          // 处理布尔值响应
          if (typeof response === 'boolean') {
            if (response === true) {
              console.log('🎉 [ApiService] 登录成功 - 后端返回true');
              const userToken = 'auth-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
              
              const frontendUser: User = {
                id: `user-${credentials.username}-${Date.now()}`,
                username: credentials.username,
                email: `${credentials.username}@example.com`,
                phoneNumber: '',
                rank: '青铜',
                coins: 1000,
                status: 'online',
                registrationTime: new Date().toISOString(),
                lastLoginTime: new Date().toISOString(),
                rankPosition: 0,
                cardDrawCount: 0
              };

              this.setToken(userToken);
              resolve({
                success: true,
                data: { user: frontendUser, token: userToken },
                message: '登录成功'
              });
              return;
            } else {
              console.log('❌ [ApiService] 登录失败 - 后端返回false');
              resolve({
                success: false,
                message: '用户名或密码错误'
              });
              return;
            }
          }
          
          // 处理字符串响应
          if (typeof response === 'string') {
            let responseText = response.trim();
            
            // 移除多余的引号
            if (responseText.startsWith('"') && responseText.endsWith('"')) {
              responseText = responseText.slice(1, -1);
            }
            
            console.log('🧹 [ApiService] 清理后的响应:', responseText);
            
            // 处理字符串形式的布尔值
            if (responseText === 'true') {
              console.log('🎉 [ApiService] 登录成功 - 后端返回字符串"true"');
              const userToken = 'auth-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
              
              const frontendUser: User = {
                id: `user-${credentials.username}-${Date.now()}`,
                username: credentials.username,
                email: `${credentials.username}@example.com`,
                phoneNumber: '',
                rank: '青铜',
                coins: 1000,
                status: 'online',
                registrationTime: new Date().toISOString(),
                lastLoginTime: new Date().toISOString(),
                rankPosition: 0,
                cardDrawCount: 0
              };

              this.setToken(userToken);
              resolve({
                success: true,
                data: { user: frontendUser, token: userToken },
                message: '登录成功'
              });
              return;
            }
            
            if (responseText === 'false') {
              console.log('❌ [ApiService] 登录失败 - 后端返回字符串"false"');
              resolve({
                success: false,
                message: '用户名或密码错误'
              });
              return;
            }
            
            // 检查UUID格式的token
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(responseText)) {
              console.log('🎉 [ApiService] 检测到UUID token:', responseText);
              const userToken = responseText;
              
              const frontendUser: User = {
                id: userToken,
                username: credentials.username,
                email: `${credentials.username}@example.com`,
                phoneNumber: '',
                rank: '青铜',
                coins: 1000,
                status: 'online',
                registrationTime: new Date().toISOString(),
                lastLoginTime: new Date().toISOString(),
                rankPosition: 0,
                cardDrawCount: 0
              };

              this.setToken(userToken);
              resolve({
                success: true,
                data: { user: frontendUser, token: userToken },
                message: '登录成功'
              });
              return;
            }
            
            // 检查错误消息
            const errorKeywords = ['错误', '失败', '不存在', '密码', 'Invalid', 'Error'];
            const isError = errorKeywords.some(keyword => responseText.includes(keyword));
            
            if (isError) {
              console.log('❌ [ApiService] 登录失败 - 错误消息:', responseText);
              resolve({
                success: false,
                message: responseText
              });
              return;
            }
            
            // 其他情况当作失败处理
            console.log('⚠️ [ApiService] 未知字符串响应，当作失败处理:', responseText);
            resolve({
              success: false,
              message: responseText || '登录失败'
            });
            return;
          }
          
          // 其他类型当作失败处理
          console.log('⚠️ [ApiService] 未知响应类型，当作失败处理:', typeof response);
          resolve({
            success: false,
            message: '服务器响应格式异常'
          });
        },
        // 失败回调
        (error: any) => {
          console.error('❌ [ApiService] 登录失败回调:', error);
          resolve({
            success: false,
            message: error || '登录失败'
          });
        },
        null, // backdropCall
        null, // timeoutCall
        10000, // timeout
        false, // mock
        true, // isEncrypt
        1 // tryTimes
      );
    });
  }

  // 用户注册 - 使用CommonSend系统
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return new Promise((resolve) => {
      console.log(`🔍 [ApiService] 开始注册请求`);
      console.log('📋 [ApiService] 注册参数:', {
        username: userData.username,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        password: userData.password ? '***' : 'null'
      });

      // 注册也发送原始密码
      const passwordHash = this.preparePassword(userData.password);
      const registerMessage = new RegisterUserMessage(
        userData.username,
        passwordHash,
        userData.email,
        userData.phoneNumber || ''
      );

      console.log('📤 [ApiService] 发送注册消息:', registerMessage);
      console.log('🌐 [ApiService] 请求URL:', registerMessage.getURL());

      commonSend(
        registerMessage,
        // 成功回调
        (response: any) => {
          console.log('✅ [ApiService] 注册成功回调:', response);
          
          if (typeof response === 'string') {
            let responseText = response.trim();
            
            if (responseText.startsWith('"') && responseText.endsWith('"')) {
              responseText = responseText.slice(1, -1);
            }
            
            console.log('🧹 [ApiService] 清理后的响应:', responseText);
            
            // 检查UUID格式的userID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(responseText)) {
              console.log('🎉 [ApiService] 注册成功 - 检测到UUID:', responseText);
              
              const frontendUser: User = {
                id: responseText,
                username: userData.username,
                email: userData.email,
                phoneNumber: userData.phoneNumber || '',
                rank: '青铜',
                coins: 1000,
                status: 'online',
                registrationTime: new Date().toISOString(),
                lastLoginTime: new Date().toISOString(),
                rankPosition: 0,
                cardDrawCount: 0
              };

              resolve({
                success: true,
                data: frontendUser,
                message: '注册成功'
              });
              return;
            }
            
            // 检查错误消息
            const errorKeywords = [
              '错误', '失败', '已存在', '不能为空', '格式错误', '非法',
              'Error', 'Invalid', 'exists', 'failed', 'duplicate'
            ];
            
            const isError = errorKeywords.some(keyword => responseText.includes(keyword));
            
            if (isError) {
              console.log('❌ [ApiService] 注册失败 - 错误消息:', responseText);
              resolve({
                success: false,
                message: responseText
              });
              return;
            }
            
            // 其他情况当作失败处理
            console.log('⚠️ [ApiService] 未知字符串响应，当作失败处理:', responseText);
            resolve({
              success: false,
              message: responseText || '注册失败'
            });
            return;
          }
          
          console.log('⚠️ [ApiService] 非字符串响应，当作失败处理:', typeof response);
          resolve({
            success: false,
            message: '服务器响应格式异常'
          });
        },
        // 失败回调
        (error: any) => {
          console.error('❌ [ApiService] 注册失败回调:', error);
          resolve({
            success: false,
            message: error || '注册失败'
          });
        }
      );
    });
  }

  // 获取用户信息
  async getUserInfo(): Promise<GetUserInfoResponse> {
    if (!this.token) {
      return { success: false, message: '未登录' };
    }

    return new Promise((resolve) => {
      const getUserInfoMessage = new GetUserInfoMessage(this.token!);

      commonSend(
        getUserInfoMessage,
        (response: any) => {
          console.log('✅ [ApiService] 获取用户信息成功:', response);
          
          if (typeof response === 'string') {
            try {
              const userData = JSON.parse(response);
              const frontendUser: User = {
                id: userData.userID || userData.id || 'current-user',
                username: userData.username || '当前用户',
                email: userData.email || 'user@example.com',
                phoneNumber: userData.phoneNumber || '',
                rank: userData.rank || '青铜',
                coins: userData.stoneAmount || userData.coins || 1000,
                status: userData.isOnline ? 'online' : 'offline',
                registrationTime: userData.registrationTime || new Date().toISOString(),
                lastLoginTime: userData.lastLoginTime,
                rankPosition: userData.rankPosition || 0,
                cardDrawCount: userData.cardDrawCount || 0
              };

              resolve({ success: true, data: frontendUser });
            } catch (e) {
              resolve({ success: false, message: '无法解析用户信息' });
            }
          } else {
            resolve({ success: false, message: '获取用户信息失败' });
          }
        },
        (error: any) => {
          console.error('❌ [ApiService] 获取用户信息失败:', error);
          resolve({ success: false, message: '获取用户信息失败' });
        }
      );
    });
  }

  // 用户登出
  async logout(): Promise<LogoutResponse> {
    if (!this.token) {
      return { success: true };
    }

    return new Promise((resolve) => {
      const logoutMessage = new LogoutUserMessage(this.token!);

      commonSend(
        logoutMessage,
        () => {
          this.token = null;
          resolve({ success: true });
        },
        () => {
          this.token = null;
          resolve({ success: true, message: '已清除本地登录状态' });
        }
      );
    });
  }
}

export const apiService = new ApiService();