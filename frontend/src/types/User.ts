export interface User {
    id: string;           // 对应后端的 userID
    username: string;
    email: string;
    phoneNumber?: string; // 后端有这个字段
    rank: string;
    coins: number;         // 对应后端的 stoneAmount (修改：gems -> coins)
    status: 'online' | 'offline' | 'in_battle';  // 对应后端的 isOnline 和 matchStatus
    registrationTime: string;
    lastLoginTime?: string;
    rankPosition?: number;
    cardDrawCount?: number;
    ppermissionLevel: number;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    phoneNumber?: string;
    // confirmPassword 只用于前端验证，不发送到后端
}

// 为前端表单创建专门的类型
export interface RegisterFormData {
    username: string;
    password: string;
    email: string;
    phoneNumber: string;
    confirmPassword: string;  // 只在前端使用
}
