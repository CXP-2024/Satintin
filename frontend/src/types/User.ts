// 为前端表单创建专门的类型
export interface RegisterFormData {
    username: string;
    password: string;
    email: string;
    phoneNumber: string;
    confirmPassword: string;  // 只在前端使用
}
