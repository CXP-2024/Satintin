// 登录表单数据接口
export interface LoginFormData {
	username: string;
	password: string;
}


// 登录响应接口
export interface LoginResponse {
	userID: string;
	userToken: string;
}

// 组件 Props 接口
export interface LoginFormProps {
	formData: LoginFormData;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSubmit: (e: React.FormEvent) => void;
	error: string;
	isLoading: boolean;
}

export interface TestLoginButtonsProps {
	onTestLogin: () => void;
	onAdminLogin: () => void;
	isLoading: boolean;
}

export interface LoginHeaderProps {
	title: string;
	subtitle: string;
}

export interface LoginFooterProps {
	registerLink: string;
}
