import { useState } from 'react';
import { useGlobalLoading } from '../../store/globalLoadingStore';
import { usePageTransition } from '../usePageTransition';
import { SoundUtils } from 'utils/soundUtils';
import {
    getUserInfo,
    getUserToken,
    setUserInfo,
    setUserToken
} from "Plugins/CommonUtils/Store/UserInfoStore";
import { LoginUserMessage } from "Plugins/UserService/APIs/LoginUserMessage";
import { GetUserInfoMessage } from "Plugins/UserService/APIs/GetUserInfoMessage";
import { QueryAssetStatusMessage } from "Plugins/AssetService/APIs/QueryAssetStatusMessage";
import { LoginAdminMessage } from "Plugins/AdminService/APIs/LoginAdminMessage";
import { LoginFormData } from './loginTypes';
import { UserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

export const useLogin = () => {
    const { navigateWithTransition } = usePageTransition();
    const { showLoading, hideLoading } = useGlobalLoading();
    const [error, setError] = useState<string>('');

    const playClickSound = () => {
        SoundUtils.playClickSound(0.5);
    };

    // 创建测试用户数据
    const createTestUser = (): UserInfo => ({
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
        credits: 200,
        rank: '王者',
        rankPosition: 100,
        friendList: [],
        blackList: [],
        messageBox: [],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=king',
        realName: '王大神'
    });

    // 创建管理员用户数据
    const createAdminUser = (): UserInfo => ({
        userID: 'admin-001',
        userName: '系统管理员',
        email: 'admin@satintin.com',
        phoneNumber: '13900000001',
        registerTime: '2023-01-01',
        permissionLevel: 10,
        banDays: 0,
        isOnline: false,
        matchStatus: 'offline',
        stoneAmount: 999999,
        credits : 999,
        rank: '管理员',
        rankPosition: 0,
        friendList: [],
        blackList: [],
        messageBox: [],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        realName: '系统管理员'
    });

    // 测试登录
    const handleTestLogin = async () => {
        playClickSound();
        console.log('🧪 [测试登录] 开始测试用户登录');
        showLoading('正在进行测试登录', 'login');
        setError('');

        try {
            // 模拟网络延迟（匹配视频长度5秒）
            await new Promise(resolve => setTimeout(resolve, 5000));

            const testUser = createTestUser();
            const testToken = 'test-token-' + Date.now();

            console.log('👤 [测试登录] 设置测试用户信息:', testUser);
            console.log('🔑 [测试登录] 设置测试令牌:', testToken);

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

    // 管理员登录
    const handleAdminLogin = async () => {
        playClickSound();
        console.log('👑 [管理员登录] 开始管理员登录');
        showLoading('正在进行管理员登录', 'login');
        setError('');

        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 3000));

            const adminUser = createAdminUser();
            const adminToken = 'admin-token-' + Date.now();

            console.log('👑 [管理员登录] 设置管理员用户信息:', adminUser);
            console.log('🔑 [管理员登录] 设置管理员令牌:', adminToken);

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

    // 表单验证
    const validateForm = (formData: LoginFormData): boolean => {
        if (!formData.username || !formData.password) {
            console.log('❌ [登录流程] 表单验证失败：缺少必填字段');
            setError('请填写用户名和密码');
            return false;
        }

        if (formData.username.length < 3) {
            setError('用户名至少需要3个字符');
            return false;
        }

        if (formData.password.length < 6) {
            setError('密码至少需要6个字符');
            return false;
        }

        return true;
    };

    // 正式登录
    const handleLogin = async (formData: LoginFormData) => {
        playClickSound();
        console.log('🚀 [登录流程] 开始真实API登录流程');
        console.log('📝 [登录流程] 表单数据:', { username: formData.username, password: '***' });

        if (!validateForm(formData)) {
            return;
        }

        console.log('✅ [登录流程] 表单验证通过');
        showLoading('正在验证登录信息', 'login');
        setError('');

        try {
            console.log('🔄 [登录流程] 调用真实API...');

            new LoginAdminMessage(formData.username, formData.password).send(
                async (Info) => {
                    const usertoken = JSON.parse(Info);
                    setUserToken(usertoken);
                    setUserInfo({
                        ...getUserInfo(),
                        permissionLevel: 1
                    });
                    console.log('Admin Token set:', getUserToken());
                    console.log('callback message', Info);
                    console.log(getUserInfo());
                    await navigateWithTransition('/admin');
                },
                (error: any) => {
                    const errormessage = JSON.parse(error);
                    console.log(errormessage);
                    console.log('fail admin login');

                    new LoginUserMessage(formData.username, formData.password).send(
                        (Response) => {
                            console.log('原始响应:', Response);
                            
                            // 简化JSON解析 - 处理双重编码
                            let Info;
                            if (typeof Response === 'string') {
                                Info = JSON.parse(Response);
                                if (typeof Info === 'string') {
                                    Info = JSON.parse(Info);
                                }
                            } else {
                                Info = Response;
                            }
                            
                            console.log('解析后的响应:', Info);
                            
                            const userId = Info.userID;
                            const userToken = Info.userToken;
                            console.log('userId:', userId);
                            
                            // 验证字段是否存在
                            if (!userId || !userToken) {
                                setError('登录响应数据不完整');
                                hideLoading();
                                return;
                            }
                            
                            // 设置token
                            setUserToken(userToken);

                            // 获取用户信息
                            new GetUserInfoMessage(userId).send(
                                async (userInfo) => {
                                    console.log('User info:', userInfo);
                                    
                                    // 简化用户信息解析
                                    let userInfoParse;
                                    if (typeof userInfo === 'string') {
                                        userInfoParse = JSON.parse(userInfo);
                                        if (typeof userInfoParse === 'string') {
                                            userInfoParse = JSON.parse(userInfoParse);
                                        }
                                    } else {
                                        userInfoParse = userInfo;
                                    }
                                    
                                    setUserInfo(userInfoParse);

                                    // 获取原石数量
                                    new QueryAssetStatusMessage(userId).send(
                                        (stoneJSON) => {
                                            // 简化原石数量解析
                                            let stoneAmount;
                                            if (typeof stoneJSON === 'string') {
                                                stoneAmount = JSON.parse(stoneJSON);
                                                if (typeof stoneAmount === 'string') {
                                                    stoneAmount = JSON.parse(stoneAmount);
                                                }
                                            } else {
                                                stoneAmount = stoneJSON;
                                            }
                                            
                                            console.log('stoneAmount:', stoneAmount);
                                            setUserInfo({
                                                ...userInfoParse,
                                                stoneAmount: stoneAmount
                                            });
                                        }
                                    );

                                    console.log('User set successfully:', getUserInfo());
                                    await new Promise(resolve => setTimeout(resolve, 5000));
                                    navigateWithTransition('/game');
                                },
                                (error: any) => {
                                    console.error('❌ GetUserInfoMessage失败:', error);
                                    setError('获取用户信息失败');
                                    hideLoading();
                                }
                            );
                        },
                        (error: any) => {
                            const errorMessage = typeof error === 'string' ? JSON.parse(error) : error;
                            setError(errorMessage);
                            console.log('❌ [登录流程] 完整错误对象:', error);
                            hideLoading();
                        }
                    );
                }
            );
        } catch (err: any) {
            console.error('登录过程中发生错误:', err);
            setError('登录失败，请稍后重试');
            hideLoading();
        }
    };

    return {
        error,
        setError,
        handleTestLogin,
        handleAdminLogin,
        handleLogin
    };
};
