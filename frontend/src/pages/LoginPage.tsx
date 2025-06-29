import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalLoading } from '../store/globalLoadingStore';
import PageTransition from '../components/PageTransition';
import { usePageTransition } from '../hooks/usePageTransition';
import './LoginPage.css';
import clickSound from 'assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {getUserToken, setUserInfo, setUserToken} from "Plugins/CommonUtils/Store/UserInfoStore";
import {LoginUserMessage} from "Plugins/UserService/APIs/LoginUserMessage";
import {GetUserInfoMessage} from "Plugins/UserService/APIs/GetUserInfoMessage";

const LoginPage: React.FC = () => {
    const { navigateWithTransition } = usePageTransition();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState<string>('');
    const { showLoading, hideLoading } = useGlobalLoading();

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
    };

    // 测试登录处理
    const handleTestLogin = async () => {
        playClickSound();
        console.log('🧪 [测试登录] 开始测试用户登录');
        showLoading('正在进行测试登录', 'login');
        setError('');

        try {
            // 模拟网络延迟（匹配视频长度5秒）
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 创建测试用户数据
            const testUser = {
                userID: 'test-user-001',
                username: '测试用户',
                email: 'testuser@example.com',
                phoneNumber: '13800138000',
                rank: '黄金',
                coins: 5000,
                status: 'online' as const,
                registrationTime: new Date().toISOString(),
                lastLoginTime: new Date().toISOString(),
                rankPosition: 1000,
                cardDrawCount: 10
            };

            const testToken = 'test-token-' + Date.now();

            console.log('👤 [测试登录] 设置测试用户信息:', testUser);
            console.log('🔑 [测试登录] 设置测试令牌:', testToken);

            // 设置测试用户信息和令牌, use Plugins files
            setUserInfo(testUser);
            setUserToken(testToken);

            console.log('🧭 [测试登录] 测试登录成功，跳转到游戏主页...');
            
            await navigateWithTransition('/game');
        } catch (err: any) {
            console.error('💥 [测试登录] 发生错误:', err);
            setError('测试登录失败');
            hideLoading();
        }
    };


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

        try {
            console.log('🔄 [登录流程] 调用真实API...');

            new LoginUserMessage(formData.username, formData.password).send(
                (Info) => {
                    const UserId = JSON.parse(Info);
                    setUserToken(UserId);
                    console.log('Token set:',getUserToken() );
                    console.log('callback message', Info);
                    new GetUserInfoMessage(getUserToken(), getUserToken()).send(
                        async (userInfo) => {
                            console.log('User info:', userInfo);
                            setUserInfo(userInfo);
                            console.log('User set successfully:', userInfo);
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            navigateWithTransition('/game');
                        }
                    )
                },
                (error: any) => {
                    const errorMessage = JSON.parse(error);
                    setError(errorMessage);
                    console.log('❌ [注册流程] 完整错误对象:', error);
                    hideLoading();
                }
            );
        } catch (err: any) {
            //setMessage(err.message || "登录失败");
        }
    };

    const { isVisible } = useGlobalLoading();

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
