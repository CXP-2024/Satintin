import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { RegisterRequest, AuthResponse } from '../types/User';
import { ApiService } from '../services/ApiService';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
	const [formData, setFormData] = useState<RegisterRequest>({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
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
	};

	const validateForm = (): boolean => {
		if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
			setError('请填写所有字段');
			return false;
		}

		if (formData.username.length < 3) {
			setError('用户名至少需要3个字符');
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setError('请输入有效的邮箱地址');
			return false;
		}

		if (formData.password.length < 6) {
			setError('密码至少需要6个字符');
			return false;
		}

		if (formData.password !== formData.confirmPassword) {
			setError('两次输入的密码不一致');
			return false;
		}

		return true;
	}; const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		console.log('📝 [注册流程] 开始注册流程');
		console.log('📋 [注册流程] 表单数据:', { ...formData, password: '***', confirmPassword: '***' });

		if (!validateForm()) {
			console.log('❌ [注册流程] 表单验证失败');
			return;
		}

		console.log('✅ [注册流程] 表单验证通过');
		setLoading(true);
		setError('');

		try {
			console.log('🔄 [注册流程] 开始注册API调用...');

			// 调用实际的注册API
			const response = await ApiService.userService.register(
				formData.username,
				formData.email,
				formData.password
			);

			console.log('📡 [注册流程] API响应:', response);

			if (!response.success) {
				console.log('❌ [注册流程] 注册失败:', response.message);
				setError(response.message || '注册失败，请稍后再试');
				return;
			}

			// 解构API响应中的用户信息和令牌
			const userData = response.data?.user || response.data;
			const token = response.data?.token || userData?.token;

			if (userData && token) {
				console.log('💾 [注册流程] 注册成功，自动登录用户...');
				// 确保用户数据符合预期的结构
				const user = {
					id: userData.id || userData.userId || Math.random().toString(36).substr(2, 9),
					username: userData.username,
					email: userData.email,
					rank: userData.rank || '青铜',
					coins: userData.coins || 500,
					status: userData.status || 'online',
					registrationTime: userData.registrationTime || new Date().toISOString()
				};
				setUser(user);
				setToken(token);
				console.log('🧭 [注册流程] 跳转到游戏主页...');
				navigate('/game');
				console.log('✨ [注册流程] 注册和登录流程完成！');
			} else {
				console.log('❌ [注册流程] 注册失败: 无效的用户数据或令牌');
				setError('注册失败，服务器返回的数据无效');
			}
		} catch (err: any) {
			console.error('💥 [注册流程] 发生错误:', err);
			// 尝试从错误对象中提取详细的错误信息
			if (err.message) {
				setError(err.message);
			} else if (typeof err === 'string') {
				setError(err);
			} else {
				setError('网络错误，请重试');
			}
		} finally {
			console.log('🏁 [注册流程] 清理加载状态');
			setLoading(false);
		}
	};

	return (
		<div className="register-container">
			<div className="register-card">
				<div className="register-header">
					<h1>阵面对战</h1>
					<h2>创建账号</h2>
				</div>

				<form onSubmit={handleSubmit} className="register-form">
					<div className="form-group">
						<label htmlFor="username">用户名</label>
						<input
							type="text"
							id="username"
							name="username"
							value={formData.username}
							onChange={handleInputChange}
							placeholder="请输入用户名（至少3个字符）"
							disabled={loading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="email">邮箱</label>
						<input
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleInputChange}
							placeholder="请输入邮箱地址"
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
							placeholder="请输入密码（至少6个字符）"
							disabled={loading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="confirmPassword">确认密码</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							value={formData.confirmPassword}
							onChange={handleInputChange}
							placeholder="请再次输入密码"
							disabled={loading}
						/>
					</div>

					{error && <div className="error-message">{error}</div>}

					<button type="submit" className="register-btn" disabled={loading}>
						{loading ? '注册中...' : '注册'}
					</button>
				</form>

				<div className="register-footer">
					<p>
						已有账号？ <Link to="/login">立即登录</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default RegisterPage;
