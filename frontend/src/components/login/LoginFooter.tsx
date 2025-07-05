import React from 'react';
import { Link } from 'react-router-dom';
import { LoginFooterProps } from './loginTypes';

const LoginFooter: React.FC<LoginFooterProps> = ({ registerLink }) => {
	return (
		<div className="login-footer">
			<p>
				还没有账号？ <Link to={registerLink}>立即注册</Link>
			</p>
		</div>
	);
};

export default LoginFooter;
