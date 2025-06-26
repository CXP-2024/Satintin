import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage: React.FC = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// TODO: 实现实际的登录逻辑
			console.log('登录尝试:', { username, password });

			// 模拟登录请求
			await new Promise(resolve => setTimeout(resolve, 1000));

			// 模拟成功登录
			localStorage.setItem('authToken', 'mock-token');
			localStorage.setItem('username', username);

			// 跳转到游戏大厅
			navigate('/lobby');
		} catch (error) {
			console.error('登录失败:', error);
			alert('登录失败，请检查用户名和密码');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="login-container">
			<div className="login-card">
				<h1>阵面对战游戏</h1>
				<form onSubmit={handleLogin} className="login-form">
					<div className="form-group">
						<label htmlFor="username">用户名</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="请输入用户名"
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">密码</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="请输入密码"
							required
						/>
					</div>

					<button
						type="submit"
						className="login-button"
						disabled={isLoading}
					>
						{isLoading ? '登录中...' : '登录'}
					</button>
				</form>

				<div className="login-footer">
					<p>还没有账号？<a href="#register">立即注册</a></p>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
