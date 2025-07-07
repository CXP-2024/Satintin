import React from 'react';
import { LoginFormProps } from './loginTypes';

const LoginForm: React.FC<LoginFormProps> = ({
	formData,
	onInputChange,
	onSubmit,
	error,
	isLoading
}) => {
	return (
		<form onSubmit={onSubmit} className="login-form">
			<div className="form-group">
				<label htmlFor="username">用户名</label>
				<input
					type="text"
					id="username"
					name="username"
					value={formData.username}
					onChange={onInputChange}
					placeholder="请输入用户名（至少3个字符）"
					disabled={isLoading}
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
					onChange={onInputChange}
					placeholder="请输入密码（至少6个字符）"
					disabled={isLoading}
					required
				/>
			</div>

			{error && <div className="error-message">{error}</div>}

			<button type="submit" className="login-btn" disabled={isLoading}>
				{isLoading ? '正在登录...' : '登录'}
			</button>
		</form>
	);
};

export default LoginForm;
