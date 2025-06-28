import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalLoading } from '../store/globalLoadingStore';
import PageTransition from '../components/PageTransition';
import './LoginPage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';
import {setUserToken} from "../Plugins/CommonUtils/Store/UserInfoStore";
import {LoginUserMessage} from "../Plugins/UserService/APIs/LoginUserMessage";

const LoginPage: React.FC = () => {
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
                (info:string)=>{
                    const token=JSON.parse(info)
                    setUserToken(token)
                }
            )
        } catch (err: any) {
            setMessage(err.message || "登录失败");
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
jian
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
