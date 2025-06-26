import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoginRequest, AuthResponse } from '../types/User';
import './LoginPage.css';

const LoginPage: React.FC = () => {
	const [formData, setFormData] = useState<LoginRequest>({
		username: '',
		password: '',
	});
	const [error, setError] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);

	const navigate = useNavigate();
	const { setUser, setToken } = useAuthStore();

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		setError('');
	}; const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		console.log('🚀 [登录流程] 开始登录流程');
		console.log('📝 [登录流程] 表单数据:', formData);

		if (!formData.username || !formData.password) {
			console.log('❌ [登录流程] 表单验证失败：缺少必填字段');
			setError('请填写用户名和密码');
			return;
		}

		console.log('✅ [登录流程] 表单验证通过');
		setLoading(true);
		setError('');

		try {
			console.log('🔄 [登录流程] 开始模拟API调用...');

			// 模拟网络延迟
			await new Promise(resolve => setTimeout(resolve, 800));

			// 模拟API调用 - 实际项目中应该调用真实的API
			const mockResponse: AuthResponse = {
				success: true,
				message: '登录成功',
				user: {
					id: '1',
					username: formData.username,
					email: `${formData.username}@example.com`,
					rank: '青铜',
					coins: 1000,
					status: 'online',
					registrationTime: new Date().toISOString(),
				},
				token: 'mock-jwt-token'
			};

			console.log('📡 [登录流程] API响应:', mockResponse);

			if (mockResponse.success && mockResponse.user && mockResponse.token) {
				console.log('💾 [登录流程] 开始更新用户状态...');
				console.log('👤 [登录流程] 设置用户信息:', mockResponse.user);
				setUser(mockResponse.user);

				console.log('🔑 [登录流程] 设置认证令牌:', mockResponse.token);
				setToken(mockResponse.token);

				console.log('🧭 [登录流程] 准备跳转到游戏主页...');
				navigate('/game');
				console.log('✨ [登录流程] 登录流程完成！');
			} else {
				console.log('❌ [登录流程] 登录失败:', mockResponse.message);
				setError(mockResponse.message || '登录失败');
			}
		} catch (err) {
			console.error('💥 [登录流程] 发生错误:', err);
			setError('网络错误，请重试');
		} finally {
			console.log('🏁 [登录流程] 清理加载状态');
			setLoading(false);
		}
	};

	return (
		<div className="login-container">
			<div className="login-card">
				<div className="login-header">
					<h1>阵面对战</h1>
					<h2>登录游戏</h2>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<div className="form-group">
						<label htmlFor="username">用户名</label>
						<input
							type="text"
							id="username"
							name="username"
							value={formData.username}
							onChange={handleInputChange}
							placeholder="请输入用户名"
							disabled={loading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">密码</label>
						<input
							type="password"
							id="password"
							name="password"
							value={formData.password}
							onChange={handleInputChange}
							placeholder="请输入密码"
							disabled={loading}
						/>
					</div>

					{error && <div className="error-message">{error}</div>}

					<button type="submit" className="login-btn" disabled={loading}>
						{loading ? '登录中...' : '登录'}
					</button>
				</form>

				<div className="login-footer">
					<p>
						还没有账号？ <Link to="/register">立即注册</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
