export interface User {
    id: string;           // 对应后端的 userID
    username: string;
    email: string;
    phoneNumber?: string; // 后端有这个字段
    rank: string;
    gems: number;         // 对应后端的 stoneAmount
    status: 'online' | 'offline' | 'in_battle';  // 对应后端的 isOnline 和 matchStatus
    registrationTime: string;
    lastLoginTime?: string;
    rankPosition?: number;
    cardDrawCount?: number;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;  // 根据后端，这个字段是必需的
    confirmPassword: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: User;
    token?: string;
}
