export interface User {
	id: string;
	username: string;
	email: string;
	rank: string;
	coins: number;
	status: 'online' | 'offline' | 'in_battle';
	registrationTime: string;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
}

export interface AuthResponse {
	success: boolean;
	message: string;
	user?: User;
	token?: string;
}
