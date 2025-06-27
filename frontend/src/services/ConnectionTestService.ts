import { config } from '../globals/Config';

/**
 * 连接测试服务 - 用于测试与后端各服务的连接
 */
export class ConnectionTestService {
  /**
   * 测试与指定URL的连接
   * @param url 要测试的URL
   * @param timeout 超时时间（毫秒）
   * @returns 测试结果
   */
  static async testConnection(url: string, timeout: number = 5000): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const startTime = performance.now();

    try {
      // 创建AbortController以实现超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // 尝试连接到健康检查端点
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      // 清除超时计时器
      clearTimeout(timeoutId);

      // 计算响应时间
      const responseTime = performance.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `连接成功 (${Math.round(responseTime)}ms)`,
          responseTime
        };
      } else {
        return {
          success: false,
          message: `服务器返回错误状态码: ${response.status}`,
          responseTime
        };
      }
    } catch (error) {
      // 计算响应时间（即使是错误）
      const responseTime = performance.now() - startTime;

      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: `连接超时 (>${timeout}ms)`,
          responseTime
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        responseTime
      };
    }
  }

  /**
   * 测试所有配置的后端服务
   * @returns 所有服务的测试结果
   */
  static async testAllServices(): Promise<Record<string, { url: string; result: { success: boolean; message: string; responseTime?: number } }>> {
    const results: Record<string, { url: string; result: { success: boolean; message: string; responseTime?: number } }> = {};

    // 移除主API测试，因为我们使用微服务架构
    // 直接测试各个微服务

    // 测试用户服务
    if (config.userServiceUrl) {
      results.user = {
        url: config.userServiceUrl,
        result: await this.testConnection(config.userServiceUrl)
      };
    } else {
      // 如果 userServiceUrl 为空（使用代理），测试代理端点
      results.user = {
        url: 'Proxy to UserService',
        result: await this.testConnectionToProxy()
      };
    }

    // 测试卡牌服务
    results.card = {
      url: config.cardServiceUrl,
      result: await this.testConnection(config.cardServiceUrl)
    };

    // 测试管理服务
    results.admin = {
      url: config.adminServiceUrl,
      result: await this.testConnection(config.adminServiceUrl)
    };

    // 测试资产服务
    results.asset = {
      url: config.assetServiceUrl,
      result: await this.testConnection(config.assetServiceUrl)
    };

    // 测试战斗服务
    results.battle = {
      url: config.battleServiceUrl,
      result: await this.testConnection(config.battleServiceUrl)
    };

    return results;
  }

  /**
   * 测试代理连接（当 userServiceUrl 为空时）
   */
  private static async testConnectionToProxy(): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const startTime = performance.now();

    try {
      // 尝试通过代理访问用户服务
      const testEndpoints = [
        '/api/health',           // 代理的健康检查
        '/api/',                 // 代理的根端点
        '/health'                // 直接健康检查
      ];

      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000)
          });

          const responseTime = performance.now() - startTime;

          if (response.ok || response.status < 500) {
            return {
              success: true,
              message: `代理连接成功 via ${endpoint} (${Math.round(responseTime)}ms)`,
              responseTime
            };
          }
        } catch (error) {
          // 继续尝试下一个端点
          continue;
        }
      }

      // 所有端点都失败
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        message: `所有代理端点都不可达 (${Math.round(responseTime)}ms)`,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        message: error instanceof Error ? error.message : '代理连接测试失败',
        responseTime
      };
    }
  }

  /**
   * 获取连接测试详细日志信息
   * @returns 格式化的日志信息
   */
  static async getConnectionLog(): Promise<string> {
    const results = await this.testAllServices();
    let log = '===== 后端连接测试报告 =====\n';
    log += `测试时间: ${new Date().toLocaleString()}\n\n`;

    Object.entries(results).forEach(([key, { url, result }]) => {
      const serviceName = this.getServiceName(key);
      log += `${serviceName} (${url}):\n`;
      log += `  状态: ${result.success ? '✅ 成功' : '❌ 失败'}\n`;
      log += `  详情: ${result.message}\n`;
      if (result.responseTime) {
        log += `  响应时间: ${Math.round(result.responseTime)}ms\n`;
      }
      log += '\n';
    });

    return log;
  }

  /**
   * 根据服务键名获取友好的服务名称
   */
  private static getServiceName(key: string): string {
    const names: Record<string, string> = {
      user: '用户服务',
      card: '卡牌服务',
      admin: '管理服务',
      asset: '资产服务',
      battle: '战斗服务'
    };

    return names[key] || key;
  }
}
