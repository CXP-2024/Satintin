import React, { useState, useEffect } from 'react';
import { config } from '../Globals/Config';
import { apiService } from '../services/ApiService';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'loading' | 'connected' | 'error';
  message?: string;
}

const BackendConnectionTest: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: '用户服务', url: config.userServiceUrl || 'via Proxy', status: 'loading' },
    { name: '卡牌服务', url: config.cardServiceUrl, status: 'loading' },
    { name: '管理服务', url: config.adminServiceUrl, status: 'loading' },
    { name: '资产服务', url: config.assetServiceUrl, status: 'loading' },
    { name: '战斗服务', url: config.battleServiceUrl, status: 'loading' },
  ]);  

  useEffect(() => {
    const testConnection = async () => {
      const updatedServices: ServiceStatus[] = [
        { name: '用户服务', url: config.userServiceUrl || 'via Proxy', status: 'loading' },
        { name: '卡牌服务', url: config.cardServiceUrl, status: 'loading' },
        { name: '管理服务', url: config.adminServiceUrl, status: 'loading' },
        { name: '资产服务', url: config.assetServiceUrl, status: 'loading' },
        { name: '战斗服务', url: config.battleServiceUrl, status: 'loading' },
      ];

      for (let i = 0; i < updatedServices.length; i++) {
        const service = updatedServices[i];
        try {
          let connected = false;
          let lastError = null;

          if (service.name === '用户服务' && !config.userServiceUrl) {
            // 用户服务使用代理，测试代理端点
            const proxyEndpoints = ['/api/health', '/api/', '/health'];
            for (const endpoint of proxyEndpoints) {
              try {
                await fetch(endpoint, { 
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(3000) 
                });
                connected = true;
                break;
              } catch (error) {
                lastError = error;
                continue;
              }
            }
          } else if (service.url && service.url !== 'via Proxy') {
            // 其他服务，测试直接连接
            const testEndpoints = [`${service.url}/health`, service.url];
            for (const endpoint of testEndpoints) {
              try {
                await fetch(endpoint, { 
                  method: 'GET',
                  mode: 'cors',
                  headers: { 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(3000) 
                });
                connected = true;
                break;
              } catch (error) {
                lastError = error;
                continue;
              }
            }
          }

          if (connected) {
            updatedServices[i] = { 
              ...service, 
              status: 'connected',
              message: '连接成功！' 
            };
          } else {
            updatedServices[i] = { 
              ...service, 
              status: 'error',
              message: `连接失败: ${lastError instanceof Error ? lastError.message : '所有端点不可达'}` 
            };
          }
        } catch (error) {
          updatedServices[i] = { 
            ...service, 
            status: 'error',
            message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}` 
          };
        }

        setServices([...updatedServices]);
      }
    };

    testConnection();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green';
      case 'error': return 'red';
      default: return 'orange';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>后端连接测试</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>环境变量配置检查</h2>
        <pre style={{ 
          backgroundColor: '#f4f4f4', 
          padding: '10px', 
          borderRadius: '5px',
          overflow: 'auto' 
        }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      <div>
        <h2>服务连接状态</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>服务名称</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>URL</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>状态</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>详情</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{service.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{service.url || '使用代理'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <span style={{ 
                    color: getStatusColor(service.status),
                    fontWeight: 'bold'
                  }}>
                    {service.status === 'loading' ? '测试中...' : 
                     service.status === 'connected' ? '已连接' : '连接失败'}
                  </span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{service.message || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>API 端点测试</h2>
        
        <button 
          onClick={async () => {
            try {
              console.log('🔍 开始测试用户API端点...');
              
              // 使用正确的格式测试登录端点
              const testResponse = await fetch('/api/LoginUserMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: 'test_user',
                  passwordHash: 'test_hash'  // 使用 passwordHash 而不是 password
                })
              });
              
              const result = await testResponse.text();
              console.log('🔍 测试响应状态:', testResponse.status);
              console.log('🔍 测试响应内容:', result);
              
              alert(`用户服务API测试响应 (${testResponse.status}): ${result}`);
            } catch (error) {
              console.error('🔍 测试失败:', error);
              alert('用户服务API测试失败: ' + (error instanceof Error ? error.message : '未知错误'));
            }
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          测试用户API端点
        </button>

        <button 
          onClick={async () => {
            try {
              console.log('🔍 测试注册API端点...');
              
              // 使用正确的格式测试注册端点
              const testResponse = await fetch('/api/RegisterUserMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: 'test_user_' + Date.now(),
                  passwordHash: 'test123',  // 使用 passwordHash
                  email: 'test@example.com',
                  phoneNumber: '15300559913'
                })
              });
              
              const result = await testResponse.text();
              console.log('🔍 注册测试响应状态:', testResponse.status);
              console.log('🔍 注册测试响应内容:', result);
              
              alert(`注册API测试响应 (${testResponse.status}): ${result}`);
            } catch (error) {
              console.error('🔍 测试失败:', error);
              alert('注册API测试失败: ' + (error instanceof Error ? error.message : '未知错误'));
            }
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          测试注册API端点
        </button>

        <button 
          onClick={async () => {
            try {
              console.log('🔍 测试代理连接...');
              
              const testResponse = await fetch('/api/', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              const result = await testResponse.text();
              alert(`代理连接测试结果:\n状态: ${testResponse.status}\n响应: ${result}`);
            } catch (error) {
              console.error('🔍 代理测试失败:', error);
              alert('代理连接失败: ' + (error instanceof Error ? error.message : '未知错误'));
            }
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          测试代理连接
        </button>

        <button 
          onClick={async () => {
            try {
              console.log('🔍 测试真实注册流程...');
              
              const response = await apiService.register({
                username: 'testuser_' + Date.now(),
                password: 'testpass123',
                email: 'test@example.com',
                phoneNumber: '13800138000'
              });

              // 类型安全的处理方式
              if (response.success) {
                alert(`注册测试结果:\n 成功: ${response.success}\n消息: ${response.message || '注册成功'}\n数据: ${JSON.stringify(response.data, null, 2)}`);
              } else {
                alert(`注册测试结果:\n 成功: ${response.success}\n消息: ${response.message}`);
              }
            } catch (error) {
              alert('注册测试失败: ' + (error instanceof Error ? error.message : '未知错误'));
            }
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          测试注册流程
        </button>
      </div>
    </div>
  );
};

export default BackendConnectionTest;
