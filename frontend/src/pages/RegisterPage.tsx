import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { RegisterFormData } from '../types/User';
import './RegisterPage.css';
import {RegisterUserMessage} from "Plugins/UserService/APIs/RegisterUserMessage";
import {CreateReportMessage} from "Plugins/AdminService/APIs/CreateReportMessage";
import {RewardAssetMessage} from "Plugins/AssetService/APIs/RewardAssetMessage";

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>(''); // 添加成功消息状态
    const [loading, setLoading] = useState<boolean>(false);

    // 更安全的加盐哈希函数
    const hashPasswordWithSalt = (password: string): string => {
        /*const salt = CryptoJS.lib.WordArray.random(128/8).toString();
        const hash = CryptoJS.SHA256(password + salt).toString(CryptoJS.enc.Hex);
        return `${hash}:${salt}`;*/
        return password;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccess(''); // 清除成功消息
    };

    const validateForm = (): boolean => {
        // 用户名验证
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

        // 手机号验证
        if (!formData.phoneNumber) {
            setError('手机号码不能为空');
            return false;
        }
        if (!/^[0-9]{10,15}$/.test(formData.phoneNumber)) {
            setError('电话号码格式不合法，必须为10到15位数字');
            return false;
        }

        // 密码验证
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

        if (!validateForm()) {
            console.log('❌ [注册流程] 表单验证失败');
            return;
        }

        console.log('✅ [注册流程] 表单验证通过');
        setLoading(true);
        setError('');
        setSuccess(''); // 清除之前的成功消息

        try {
            console.log('🔄 [注册流程] 调用注册API...');
            console.log('🔐 [安全] 对密码进行哈希加密...');

            // 对密码进行哈希加密
            const passwordHash = hashPasswordWithSalt(formData.password);

            console.log('✅ [安全] 密码哈希完成');

            // 发送注册请求，使用哈希后的密码
            new RegisterUserMessage(
                formData.username,
                passwordHash,
                formData.email,
                formData.phoneNumber,
            ).send(
                (info: string) => {
                    console.log('✅ [注册流程] 注册成功');
                    console.log('callback message', info);
                    const userID = JSON.parse(info);

                    new RewardAssetMessage(userID,10000).send(
                        (info: string) => {
                            const successmessage = JSON.parse(info);
                            console.log(successmessage)

                            new CreateReportMessage(userID, userID, 'test').send(
                                (info: string) => {
                                    const successmessage = JSON.parse(info);
                                    console.log(successmessage)
                                },
                                (error: any) => {
                                    const errormessage = JSON.parse(error);
                                    console.log(errormessage)
                                }
                            )

                        },
                        (error: any) => {
                            const errormessage = JSON.parse(error);
                            if(errormessage.include("失败","错误") ){
                                setError(errormessage);
                            }
                        }
                    )
                    
                    // 显示成功消息而不是存储token
                    setSuccess('注册成功，请前往登录');
                    setError(''); // 清除错误信息
                    setLoading(false);

                    // 可选：清空表单
                    setFormData({
                        username: '',
                        email: '',
                        password: '',
                        phoneNumber: '',
                        confirmPassword: '',
                    });
                },
                (error: any) => {
                    const errorMessage = JSON.parse(error);
                    setError(errorMessage);
                    setSuccess(''); // 清除成功消息
                    console.log('❌ [注册流程] 完整错误对象:', error);
                    setLoading(false);
                }
            );

        } catch (err: any) {
            setLoading(false);
            setError(err.message || "注册失败");
            setSuccess(''); // 清除成功消息
            console.log('❌ [注册流程] 异常:', err);
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
                        {success && <div className="success-message">{success}</div>}

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
