import React, { useState, useEffect } from 'react';
import { useGlobalLoading } from '../../store/globalLoadingStore';
import PageTransition from '../../components/PageTransition';
import './LoginPage.css';
import clickSound from '../../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {
	LoginHeader,
	LoginForm,
	TestLoginButtons,
	LoginFooter,
	useLogin,
	LoginFormData
} from '../../components/login';

const LoginPage: React.FC = () => {
	const { error, handleTestLogin, handleAdminLogin, handleLogin } = useLogin();
	const [formData, setFormData] = useState<LoginFormData>({
		username: '',
		password: ''
	});
	const { isVisible } = useGlobalLoading();

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 处理表单输入变化
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	// 处理表单提交
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleLogin(formData);
	};

	return (
		<PageTransition className="fade-scale">
			<div className="login-container">
				<div className="login-card">
					<LoginHeader 
						title="SaTinTin"
						subtitle="登录游戏" 
					/>

					<LoginForm
						formData={formData}
						onInputChange={handleInputChange}
						onSubmit={handleSubmit}
						error={error}
						isLoading={isVisible}
					/>

					<TestLoginButtons
						onTestLogin={handleTestLogin}
						onAdminLogin={handleAdminLogin}
						isLoading={isVisible}
					/>

					<LoginFooter registerLink="/register" />
				</div>
			</div>
		</PageTransition>
	);
};

export default LoginPage;
