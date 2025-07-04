import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalLoading } from '../store/globalLoadingStore';
import PageTransition from '../components/PageTransition';
import { usePageTransition } from '../hooks/usePageTransition';
import './LoginPage.css';
import clickSound from 'assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {
    getUserInfo,
    getUserToken,
    setUserInfo,
    setUserToken
} from "Plugins/CommonUtils/Store/UserInfoStore";
import {LoginUserMessage} from "Plugins/UserService/APIs/LoginUserMessage";
import {GetUserInfoMessage} from "Plugins/UserService/APIs/GetUserInfoMessage";
import {RewardAssetMessage} from "Plugins/AssetService/APIs/RewardAssetMessage";
import {QueryAssetStatusMessage} from "Plugins/AssetService/APIs/QueryAssetStatusMessage";

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
                    userID: 'test-user-003',
                    userName: '王者荣耀',
                    email: 'king@example.com',
                    phoneNumber: '13800138003',
                    registerTime: '1919',
                    permissionLevel: 5,
                    banDays: 0,
                    isOnline: false,
                    matchStatus: 'offline',
                    stoneAmount: 50000,
                    cardDrawCount: 200,
                    rank: '王者',
                    rankPosition: 100,
                    friendList: [
                    ],
                    blackList: [
                    ],
                    messageBox: [
                    ],
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=king',
                    realName: '王大神'
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

    // 管理员登录处理
    const handleAdminLogin = async () => {
        playClickSound();
        console.log('👑 [管理员登录] 开始管理员登录');
        showLoading('正在进行管理员登录', 'login');
        setError('');

        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 创建管理员用户数据
            const adminUser = {
                userID: 'admin-001',
                userName: '系统管理员',
                email: 'admin@satintin.com',
                phoneNumber: '13900000001',
                registerTime: '2023-01-01',
                permissionLevel: 10, // 管理员权限级别更高
                banDays: 0,
                isOnline: false,
                matchStatus: 'offline',
                stoneAmount: 999999,
                cardDrawCount: 999,
                rank: '管理员',
                rankPosition: 0,
                friendList: [],
                blackList: [],
                messageBox: [],
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                realName: '系统管理员'
            };

            const adminToken = 'admin-token-' + Date.now();

            console.log('👑 [管理员登录] 设置管理员用户信息:', adminUser);
            console.log('🔑 [管理员登录] 设置管理员令牌:', adminToken);

            // 设置管理员用户信息和令牌
            setUserInfo(adminUser);
            setUserToken(adminToken);

            console.log('🧭 [管理员登录] 管理员登录成功，跳转到管理员控制台...');

            await navigateWithTransition('/admin');
        } catch (err: any) {
            console.error('💥 [管理员登录] 发生错误:', err);
            setError('管理员登录失败');
            hideLoading();
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        playClickSound();

        console.log('🚀 [登录流程] 开始用户登录流程');
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
            console.log('🔄 [登录流程] 调用用户登录API...');

            // 使用Promise包装API调用，避免嵌套回调
            const loginResponse = await new Promise<any>((resolve, reject) => {
                new LoginUserMessage(formData.username, formData.password).send(
                    (response) => resolve(response),
                    (error) => reject(error)
                );
            });

            console.log('✅ [登录流程] 登录API调用成功:', loginResponse);

            // 解析登录响应
            let loginInfo;
            if (typeof loginResponse === 'string') {
                loginInfo = JSON.parse(loginResponse);
                if (typeof loginInfo === 'string') {
                    loginInfo = JSON.parse(loginInfo);
                }
            } else {
                loginInfo = loginResponse;
            }

            const userId = loginInfo.userID;
            const userToken = loginInfo.userToken;

            if (!userId || !userToken) {
                throw new Error('登录响应数据不完整');
            }

            console.log('🔑 [登录流程] 设置用户Token:', userToken);
            setUserToken(userToken);

            // 获取用户信息
            console.log('👤 [登录流程] 获取用户信息...');
            const userInfoResponse = await new Promise<any>((resolve, reject) => {
                new GetUserInfoMessage(userToken, userId).send(
                    (response) => resolve(response),
                    (error) => reject(error)
                );
            });

            // 解析用户信息
            let userInfo;
            if (typeof userInfoResponse === 'string') {
                userInfo = JSON.parse(userInfoResponse);
                if (typeof userInfo === 'string') {
                    userInfo = JSON.parse(userInfo);
                }
            } else {
                userInfo = userInfoResponse;
            }

            console.log('👤 [登录流程] 用户信息获取成功:', userInfo);

            // 获取资产信息
            console.log('💎 [登录流程] 获取资产信息...');
            const assetResponse = await new Promise<any>((resolve, reject) => {
                new QueryAssetStatusMessage(userToken).send(
                    (response) => resolve(response),
                    (error) => reject(error)
                );
            });

            // 解析资产信息
            let stoneAmount;
            if (typeof assetResponse === 'string') {
                stoneAmount = JSON.parse(assetResponse);
                if (typeof stoneAmount === 'string') {
                    stoneAmount = JSON.parse(stoneAmount);
                }
            } else {
                stoneAmount = assetResponse;
            }

            console.log('💎 [登录流程] 资产信息获取成功:', stoneAmount);

            // 原子性设置用户信息和资产信息
            const completeUserInfo = {
                ...userInfo,
                stoneAmount: stoneAmount
            };

            setUserInfo(completeUserInfo);
            console.log('✅ [登录流程] 用户信息设置完成:', completeUserInfo);

            // 等待动画完成后跳转
            await new Promise(resolve => setTimeout(resolve, 2000));
            hideLoading();
            
            console.log('🧭 [登录流程] 登录成功，跳转到游戏主页...');
            await navigateWithTransition('/game');

        } catch (err: any) {
            console.error('❌ [登录流程] 登录失败:', err);
            
            let errorMessage = '登录失败';
            if (typeof err === 'string') {
                try {
                    const errorObj = JSON.parse(err);
                    errorMessage = errorObj.message || errorObj.error || err;
                } catch {
                    errorMessage = err;
                }
            } else if (err?.message) {
                errorMessage = err.message;
            }
            
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

                        {/* 开发环境才显示测试登录和管理员登录 */}
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
                                <button
                                    type="button"
                                    className="test-login-btn admin-login-btn"
                                    onClick={handleAdminLogin}
                                    disabled={isVisible}
                                    title="管理员登录，跳过后端验证"
                                    style={{ marginTop: '10px', backgroundColor: '#8e44ad' }}
                                >
                                    {isVisible ? '管理员登录中...' : '👑 管理员登录'}
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
