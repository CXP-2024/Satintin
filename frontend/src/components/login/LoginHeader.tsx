import React from 'react';
import { LoginHeaderProps } from './loginTypes';

const LoginHeader: React.FC<LoginHeaderProps> = ({ title, subtitle }) => {
	return (
		<div className="login-header">
			<h1>{title}</h1>
			<h2>{subtitle}</h2>
		</div>
	);
};

export default LoginHeader;
