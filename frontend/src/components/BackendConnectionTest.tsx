import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import { config } from '../globals/Config';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'loading' | 'connected' | 'error';
  message?: string;
}

const BackendConnectionTest: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: '主API', url: config.apiBaseUrl, status: 'loading' },
    { name: '用户服务', url: config.userServiceUrl, status: 'loading' },
    { name: '卡牌服务', url: config.cardServiceUrl, status: 'loading' },
    { name: '管理服务', url: config.adminServiceUrl, status: 'loading' },
    { name: '资产服务', url: config.assetServiceUrl, status: 'loading' },
    { name: '战斗服务', url: config.battleServiceUrl, status: 'loading' },
  ]);

  useEffect(() => {
    const testConnection = async () => {
      const updatedServices = [...services];

      for (let i = 0; i < updatedServices.length; i++) {
        const service = updatedServices[i];
        try {
          // 尝试连接到服务
          try {
            // 先尝试健康检查端点
            await fetch(`${service.url}/health`, { 
              method: 'GET',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
              // 设置短超时，避免等待太久
              signal: AbortSignal.timeout(5000) 
            });
          } catch (healthError) {
            // 如果健康检查失败，尝试根端点
            await fetch(service.url, { 
              method: 'GET',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(5000) 
            });
          }

          // 如果没有抛出错误，则认为连接成功
          updatedServices[i] = { 
            ...service, 
            status: 'connected',
            message: '连接成功！' 
          };
        } catch (error) {
          console.error(`连接 ${service.name} 失败:`, error);
          updatedServices[i] = { 
            ...service, 
            status: 'error',
            message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}` 
          };
        }

        // 更新状态，使UI反映当前进度
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
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{service.url}</td>
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
        <h2>高级API测试</h2>
        <button 
          onClick={async () => {
            try {
              // 尝试连接用户服务
              try {
                // 先尝试健康检查端点
                const result = await ApiService.get(`${config.userServiceUrl}/health`);
                alert('API调用成功 (health): ' + JSON.stringify(result));
              } catch (healthError) {
                try {
                  // 如果健康检查失败，尝试API健康检查端点
                  const result = await ApiService.get(`${config.userServiceUrl}/api/health`);
                  alert('API调用成功 (api/health): ' + JSON.stringify(result));
                } catch (apiHealthError) {
                  // 如果API健康检查也失败，尝试根端点
                  const response = await fetch(config.userServiceUrl);
                  alert('连接成功 (根端点): ' + response.status);
                }
              }
            } catch (error) {
              alert('API调用失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
          测试用户服务
        </button>

        <button 
          onClick={async () => {
            try {
              // 尝试连接卡牌服务
              try {
                // 先尝试健康检查端点
                const result = await ApiService.get(`${config.cardServiceUrl}/health`);
                alert('API调用成功 (health): ' + JSON.stringify(result));
              } catch (healthError) {
                try {
                  // 如果健康检查失败，尝试API健康检查端点
                  const result = await ApiService.get(`${config.cardServiceUrl}/api/health`);
                  alert('API调用成功 (api/health): ' + JSON.stringify(result));
                } catch (apiHealthError) {
                  // 如果API健康检查也失败，尝试根端点
                  const response = await fetch(config.cardServiceUrl);
                  alert('连接成功 (根端点): ' + response.status);
                }
              }
            } catch (error) {
              alert('API调用失败: ' + (error instanceof Error ? error.message : '未知错误'));
            }
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          测试卡牌服务
        </button>
      </div>
    </div>
  );
};

export default BackendConnectionTest;
