import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * API服务基类
 * 提供统一的HTTP请求处理
 */
export class BaseApiService {
	protected api: AxiosInstance;

	constructor(baseURL: string) {
		this.api = axios.create({
			baseURL,
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// 请求拦截器
		this.api.interceptors.request.use(
			(config) => {
				// 可以在这里添加token等认证信息
				const token = localStorage.getItem('authToken');
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
		this.api.interceptors.response.use(
			(response: AxiosResponse) => {
				return response;
			},
			(error) => {
				// 统一错误处理
				if (error.response?.status === 401) {
					// 未授权，可以跳转到登录页面
					localStorage.removeItem('authToken');
					window.location.href = '/login';
				}
				return Promise.reject(error);
			}
		);
	}

	/**
	 * 发送请求
	 * @param messageInstance 消息实例
	 * @returns Promise<T>
	 */
	protected async sendRequest<T>(messageInstance: any): Promise<T> {
		try {
			const response = await this.api.post('/', messageInstance);
			return response.data;
		} catch (error) {
			console.error('API请求失败:', error);
			throw error;
		}
	}
}
