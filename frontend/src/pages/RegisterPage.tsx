import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import { RegisterFormData } from '../types/User';  // 使用专门的表单类型
import { apiService } from '../services/ApiService';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState<RegisterFormData>({  // 使用正确的类型
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const { setUser, setToken } = useAuthStore();
    const { navigateWithTransition } = usePageTransition();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    // 严格按照后端验证规则
    const validateForm = (): boolean => {
        // 用户名验证 - 根据后端 UserRegistrationProcess.scala
        if (!formData.username) {
            setError('用户名不能为空');
            return false;
        }
        if (formData.username.length < 3 || formData.username.length > 20) {
            setError('用户名长度必须在3到20个字符之间');
            return false;
        }
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
            setError('用户名只能包含字母、数字和下划线');
            return false;
        }

        // 邮箱验证
        if (!formData.email) {
            setError('邮箱不能为空');
            return false;
        }
        if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(formData.email)) {
            setError('邮箱格式不正确');
            return false;
        }

        // 手机号验证 - 根据后端要求
        if (!formData.phoneNumber) {
            setError('手机号码不能为空');
            return false;
        }
        if (!/^[0-9]{10,15}$/.test(formData.phoneNumber)) {
            setError('电话号码格式不合法，必须为10到15位数字');
            return false;
        }

        // 密码验证 - 根据后端规则
        if (!formData.password) {
            setError('密码不能为空');
            return false;
        }
        if (formData.password.length < 8 || formData.password.length > 32) {
            setError('密码长度必须在8到32个字符之间');
            return false;
        }
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
            setError('密码必须同时包含字母和数字');
            return false;
        }

        // 确认密码验证
        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('📝 [注册流程] 开始注册流程');
        console.log('📋 [注册流程] 表单数据:', { 
            username: formData.username,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            password: '***',
            confirmPassword: '***'
        });

        if (!validateForm()) {
            console.log('❌ [注册流程] 表单验证失败');
            return;
        }

        console.log('✅ [注册流程] 表单验证通过');
        setLoading(true);
        setError('');

        // 记录开始时间
        const startTime = Date.now();

        try {
            console.log('🔄 [注册流程] 调用注册API...');

            // 只调用真实API，不发送 confirmPassword 到后端
            const response = await apiService.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phoneNumber
                // 注意：不包含 confirmPassword
            });

            console.log('📡 [注册流程] API响应:', response);

            if (response.success && response.data) {
                console.log('✅ [注册流程] 注册成功');

                // 设置完整的用户信息
                const userData = {
                    id: response.data.id,
                    username: response.data.username,
                    email: response.data.email,
                    phoneNumber: response.data.phoneNumber || formData.phoneNumber,
                    rank: response.data.rank || '青铜',
                    coins: response.data.coins || 1000,
                    status: response.data.status || 'online' as 'online' | 'offline' | 'in_battle',
                    registrationTime: response.data.registrationTime,
                    lastLoginTime: response.data.lastLoginTime,
                    rankPosition: response.data.rankPosition || 0,
                    cardDrawCount: response.data.cardDrawCount || 0
                };

                setUser(userData);

                // 确保加载动画至少显示3秒
                const elapsedTime = Date.now() - startTime;
                const minDisplayTime = 3000;
                if (elapsedTime < minDisplayTime) {
                    console.log(`⏰ [注册流程] 等待动画完成，还需 ${minDisplayTime - elapsedTime}ms`);
                    await new Promise(resolve =>
                        setTimeout(resolve, minDisplayTime - elapsedTime)
                    );
                }

                console.log('🧭 [注册流程] 跳转到游戏主页...');
                await navigateWithTransition('/game');
            } else {
                console.error('❌ [注册流程] 注册失败:', response.message);
                setError(response.message || '注册失败，请检查输入信息');
            }
        } catch (err: any) {
            console.error('💥 [注册流程] 发生错误:', err);
            
            // 提取详细错误信息
            let errorMessage = '注册失败，请稍后重试';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }
            
            setError(errorMessage);
        } finally {
            console.log('🏁 [注册流程] 清理加载状态');
            setLoading(false);
        }
    };

	return (
		<PageTransition className="fade-scale">
			<div className="register-container">
				<div className="register-card">
					<div className="register-header">
						<h1>SaTT</h1>
						<h2>创建账号</h2>
					</div>

                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="form-group">
                            <label htmlFor="username">用户名 *</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="3-20个字符，支持字母数字下划线"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">邮箱 *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="请输入有效的邮箱地址"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneNumber">手机号码 *</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="10-15位数字"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">密码 *</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="8-32位，必须包含字母和数字"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">确认密码 *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="请再次输入密码"
                                disabled={loading}
                                required
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
        </PageTransition>
    );
};

export default RegisterPage;
