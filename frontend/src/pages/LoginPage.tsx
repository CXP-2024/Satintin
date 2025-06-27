import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGlobalLoading } from '../store/globalLoadingStore';
import { LoginRequest } from '../types/User';
import { ApiService } from '../services/ApiService';
import './LoginPage.css';

const LoginPage: React.FC = () => {
	const [formData, setFormData] = useState<LoginRequest>({
		username: '',
		password: '',
	});
	const [error, setError] = useState<string>('');

	const navigate = useNavigate();
	const { setUser, setToken } = useAuthStore();
	const { showLoading, startExiting, hideLoading } = useGlobalLoading();

	// 带全局淡出动画的导航函数
	const navigateWithTransition = async (path: string) => {
		console.log('🎬 [页面过渡] 开始页面切换动画');

		// 开始淡出动画
		startExiting();

		// 延迟导航，让淡出动画进行一小段时间
		setTimeout(() => {
			console.log('🧭 [页面过渡] 执行页面导航');
			navigate(path);

			// 再延迟一点隐藏加载层，让新页面有时间开始渲染
			setTimeout(() => {
				console.log('🎬 [页面过渡] 完成页面切换，隐藏加载层');
				hideLoading();
			}, 500); // 给新页面500ms时间开始渲染
		}, 500); // 淡出动画进行500ms后开始导航
	};

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
		showLoading('正在进行测试登录');
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

			// 开始页面切换动画
			await navigateWithTransition('/game');
		} catch (err: any) {
			console.error('💥 [测试登录] 发生错误:', err);
			setError('测试登录失败');
			hideLoading();
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
		showLoading('正在验证登录信息');
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
				hideLoading();
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

				// 开始页面切换动画
				await navigateWithTransition('/game');
			} else {
				console.log('❌ [登录流程] 登录失败: 无效的用户数据或令牌');
				setError('登录失败，服务器返回的数据无效');
				hideLoading();
			}
		} catch (error: any) {
			console.error('💥 [登录流程] 发生错误:', error);
			const errorMessage = error.response?.data?.message || error.message || '登录失败，请稍后重试';
			console.log('📋 [登录流程] 设置错误信息:', errorMessage);
			setError(errorMessage);
			hideLoading();
		}
	};

	const { isVisible } = useGlobalLoading();

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
							disabled={isVisible}
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
							disabled={isVisible}
						/>
					</div>

					{error && <div className="error-message">{error}</div>}

					<button type="submit" className="login-btn" disabled={isVisible}>
						{isVisible ? '登录中...' : '登录'}
					</button>

					<div className="test-login-section">
						<div className="test-login-divider">
							<span>或</span>
						</div>
						<button
							type="button"
							className="test-login-btn"
							onClick={handleTestLogin}
							disabled={isVisible}
							title="跳过后端验证，直接使用测试用户登录"
						>
							{isVisible ? '测试登录中...' : '🧪 测试用户登录'}
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
	);
};

export default LoginPage;
