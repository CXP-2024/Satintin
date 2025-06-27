import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoginRequest } from '../types/User';
import { ApiService } from '../services/ApiService';
import loginVideo from '../assets/videos/yslogin.mp4';
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
	};	// 测试用户登录函数
	const handleTestLogin = async () => {
		console.log('🧪 [测试登录] 开始测试用户登录');
		setLoading(true);
		setError('');

		try {
			// 模拟网络延迟 - 调整为5秒以匹配视频长度
			await new Promise(resolve => setTimeout(resolve, 5000));

			// 创建测试用户数据
			const testUser = {
				id: 'test-user-001',
				username: '测试用户',
				email: 'testuser@example.com',
				rank: '黄金',
				coins: 5000,
				status: 'online' as const,
				registrationTime: new Date().toISOString()
			};

			const testToken = 'test-token-' + Date.now();

			console.log('👤 [测试登录] 设置测试用户信息:', testUser);
			console.log('🔑 [测试登录] 设置测试令牌:', testToken);

			setUser(testUser);
			setToken(testToken);

			console.log('🧭 [测试登录] 测试登录成功，跳转到游戏主页...');
			navigate('/game');
		} catch (err: any) {
			console.error('💥 [测试登录] 发生错误:', err);
			setError('测试登录失败');
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
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

		// 记录开始时间，确保视频能播放完整
		const startTime = Date.now();

		try {
			console.log('🔄 [登录流程] 开始API调用...');

			// 调用真实的API
			const response = await ApiService.userService.login(formData.username, formData.password);

			console.log('📡 [登录流程] API响应:', response);

			if (!response.success) {
				console.log('❌ [登录流程] 登录失败:', response.message);
				setError(response.message || '登录失败，请检查用户名和密码');
				return;
			}

			// 解构API响应中的用户信息和令牌
			const userData = response.data?.user || response.data;
			const token = response.data?.token || userData?.token;

			if (userData && token) {
				console.log('💾 [登录流程] 开始更新用户状态...');
				console.log('👤 [登录流程] 设置用户信息:', userData);
				// 确保用户数据符合预期的结构
				const user = {
					id: userData.id || userData.userId || '1',
					username: userData.username,
					email: userData.email || `${userData.username}@example.com`,
					rank: userData.rank || '青铜',
					coins: userData.coins || 1000,
					status: userData.status || 'online',
					registrationTime: userData.registrationTime || new Date().toISOString()
				};
				setUser(user);

				console.log('🔑 [登录流程] 设置认证令牌:', token);
				setToken(token);

				// 确保视频至少播放5秒钟
				const elapsedTime = Date.now() - startTime;
				const minDisplayTime = 5000; // 5秒，匹配视频长度
				if (elapsedTime < minDisplayTime) {
					console.log(`⏰ [登录流程] 等待视频播放完成，还需 ${minDisplayTime - elapsedTime}ms`);
					await new Promise(resolve =>
						setTimeout(resolve, minDisplayTime - elapsedTime)
					);
				}

				console.log('🧭 [登录流程] 登录成功，跳转到游戏主页...');
				navigate('/game');
			} else {
				console.log('❌ [登录流程] 登录失败: 无效的用户数据或令牌');
				setError('登录失败，服务器返回的数据无效');
			}
		} catch (err: any) {
			console.error('💥 [登录流程] 发生错误:', err);
			// 尝试从错误对象中提取详细的错误信息
			if (err.message) {
				setError(err.message);
			} else if (typeof err === 'string') {
				setError(err);
			} else {
				setError('网络错误，请重试');
			}
		} finally {
			console.log('🏁 [登录流程] 清理加载状态');
			setLoading(false);
		}
	};

	return (
		<>
			{/* 加载动画覆盖层 */}
			{loading && (
				<div className="loading-overlay">
					<div className="loading-video-container">
						<video
							className="loading-video"
							autoPlay
							loop
							muted
							playsInline
						>
							<source src={loginVideo} type="video/mp4" />
							您的浏览器不支持视频播放。
						</video>

						{/* 底部文字 */}
						<div className="loading-text">
							<h3>正在登录中...</h3>
							<div className="loading-dots">
								<span></span>
								<span></span>
								<span></span>
							</div>
						</div>
					</div>
				</div>
			)}

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

						<div className="test-login-section">
							<div className="test-login-divider">
								<span>或</span>
							</div>
							<button
								type="button"
								className="test-login-btn"
								onClick={handleTestLogin}
								disabled={loading}
								title="跳过后端验证，直接使用测试用户登录"
							>
								{loading ? '测试登录中...' : '🧪 测试用户登录'}
							</button>
							<p className="test-login-hint">
								💡 开发测试专用，无需输入用户名密码
							</p>
						</div>
					</form>

					<div className="login-footer">
						<p>
							还没有账号？ <Link to="/register">立即注册</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	);
};

export default LoginPage;
