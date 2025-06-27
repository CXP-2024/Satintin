import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePageTransition } from '../hooks/usePageTransition';
import { useGlobalLoading } from '../hooks/useGlobalLoading';
import PageTransition from '../components/PageTransition';
import { apiService } from '../services/ApiService';
import './LoginPage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';

const LoginPage: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState<string>('');

	const { setUser, setToken } = useAuthStore();
	const { showLoading, hideLoading } = useGlobalLoading();
	const { navigateWithTransition } = usePageTransition();

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
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
		playClickSound();
		console.log('🧪 [测试登录] 开始测试用户登录');
		showLoading('正在进行测试登录', 'login');
		setError('');

        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 创建测试用户数据
            const testUser = {
                id: 'test-user-001',
                username: '测试用户',
                email: 'testuser@example.com',
                phoneNumber: '13800138000',
                rank: '黄金',
                gems: 5000,
                status: 'online' as const,
                registrationTime: new Date().toISOString(),
                lastLoginTime: new Date().toISOString(),
                rankPosition: 1000,
                cardDrawCount: 10
            };

            const testToken = 'test-token-' + Date.now();

            console.log('👤 [测试登录] 设置测试用户信息:', testUser);
            console.log('🔑 [测试登录] 设置测试令牌:', testToken);

            setUser(testUser);
            setToken(testToken);

            console.log('🧭 [测试登录] 测试登录成功，跳转到游戏主页...');
            await navigateWithTransition('/game');
        } catch (err: any) {
            console.error('💥 [测试登录] 发生错误:', err);
            setError('测试登录失败');
            hideLoading();
        }
    };

    // 主要登录逻辑 - 只使用真实API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
		playClickSound();

        console.log('🚀 [登录流程] 开始真实API登录流程');
        console.log('📝 [登录流程] 表单数据:', { username: formData.username, password: '***' });

        // 表单验证
        if (!formData.username || !formData.password) {
            console.log('❌ [登录流程] 表单验证失败：缺少必填字段');
            setError('请填写用户名和密码');
            return;
        }

        if (formData.username.length < 3) {
            setError('用户名至少需要3个字符');
            return;
        }

        if (formData.password.length < 6) {
            setError('密码至少需要6个字符');
            return;
        }

        console.log('✅ [登录流程] 表单验证通过');
        showLoading('正在验证登录信息', 'login');
        setError('');

        const startTime = Date.now();

        try {
            console.log('🔄 [登录流程] 调用真实API...');

            // 只调用真实的API，不再有模拟数据
            const response = await apiService.login({
                username: formData.username,
                password: formData.password
            });

            console.log('📡 [登录流程] API响应:', response);

            if (response.success && response.data) {
                console.log('✅ [登录流程] 登录成功');

                const { user, token } = response.data;

                if (user && token) {
                    console.log('💾 [登录流程] 更新用户状态...');

                    // 确保用户数据完整性
                    const userData = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        phoneNumber: user.phoneNumber || '',
                        rank: user.rank || '青铜',
                        gems: user.gems || 1000,
                        status: user.status || 'online' as 'online' | 'offline' | 'in_battle',
                        registrationTime: user.registrationTime,
                        lastLoginTime: user.lastLoginTime,
                        rankPosition: user.rankPosition || 0,
                        cardDrawCount: user.cardDrawCount || 0
                    };

                    setUser(userData);
                    setToken(token);

                    // 确保加载动画至少显示3秒
                    const elapsedTime = Date.now() - startTime;
                    const minDisplayTime = 3000;
                    if (elapsedTime < minDisplayTime) {
                        console.log(`⏰ [登录流程] 等待动画完成，还需 ${minDisplayTime - elapsedTime}ms`);
                        await new Promise(resolve =>
                            setTimeout(resolve, minDisplayTime - elapsedTime)
                        );
                    }

                    console.log('🧭 [登录流程] 跳转到游戏主页...');
                    await navigateWithTransition('/game');
                } else {
                    console.error('❌ [登录流程] 响应数据结构异常');
                    setError('服务器响应数据异常，请稍后重试');
                }
            } else {
                console.error('❌ [登录流程] 登录失败:', response.message || response.error);
                setError(response.message || response.error || '登录失败，请检查用户名和密码');
            }

            hideLoading();
        } catch (error: any) {
            console.error('💥 [登录流程] 发生网络错误:', error);
            const errorMessage = error.response?.data?.message || error.message || '网络连接失败，请检查网络后重试';
            console.log('📋 [登录流程] 设置错误信息:', errorMessage);
            setError(errorMessage);
            hideLoading();
        }
    };

	const { isVisible } = useGlobalLoading();

	return (
		<PageTransition className="fade-scale">
			<div className="login-container">
				<div className="login-card">
					<div className="login-header">
						<h1>Satin</h1>
					</div>
    return (
        <PageTransition className="fade-scale">
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
                                placeholder="请输入用户名（至少3个字符）"
                                disabled={isVisible}
                                required
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
                                disabled={isVisible}
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="login-btn" disabled={isVisible}>
                            {isVisible ? '正在登录...' : '登录'}
                        </button>

                        {/* 开发环境才显示测试登录 */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="test-login-section">
                                <div className="test-login-divider">
                                    <span>开发测试</span>
                                </div>
                                <button
                                    type="button"
                                    className="test-login-btn"
                                    onClick={handleTestLogin}
                                    disabled={isVisible}
                                    title="开发测试专用，跳过后端验证"
                                >
                                    {isVisible ? '测试登录中...' : '🧪 测试登录'}
                                </button>
                                <p className="test-login-hint">
                                    💡 开发测试专用，无需输入用户名密码
                                </p>
                            </div>
                        )}
                    </form>

                    <div className="login-footer">
                        <p>
                            还没有账号？ <Link to="/register">立即注册</Link>
                        </p>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default LoginPage;
