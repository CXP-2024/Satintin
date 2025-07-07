import React from 'react';
import { TestLoginButtonsProps } from './loginTypes';

const TestLoginButtons: React.FC<TestLoginButtonsProps> = ({
	onTestLogin,
	onAdminLogin,
	isLoading
}) => {
	// 只在开发环境显示
	if (process.env.NODE_ENV !== 'development') {
		return null;
	}

	return (
		<div className="test-login-section">
			<div className="test-login-divider">
				<span>开发测试</span>
			</div>
			<button
				type="button"
				className="test-login-btn"
				onClick={onTestLogin}
				disabled={isLoading}
				title="开发测试专用，跳过后端验证"
			>
				{isLoading ? '测试登录中...' : '🧪 测试登录'}
			</button>
			<button
				type="button"
				className="test-login-btn admin-login-btn"
				onClick={onAdminLogin}
				disabled={isLoading}
				title="管理员登录，跳过后端验证"
				style={{ marginTop: '10px', backgroundColor: '#8e44ad' }}
			>
				{isLoading ? '管理员登录中...' : '👑 管理员登录'}
			</button>
			<p className="test-login-hint">
				💡 开发测试专用，无需输入用户名密码
			</p>
		</div>
	);
};

export default TestLoginButtons;
