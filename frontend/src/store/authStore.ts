import create from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/User';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setUser: (user: User) => void;
    setToken: (token: string) => void;
    logout: () => void;
}


export const useAuthStore = create<AuthState>(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setUser: (user: User) => {
                console.log('🔄 [AuthStore] 设置用户信息:', user);
                set({ user, isAuthenticated: true });
                console.log('✅ [AuthStore] 用户状态已更新，认证状态:', true);
            },
            setToken: (token: string) => {
                console.log('🔄 [AuthStore] 设置认证令牌:', token);
                set({ token });
                console.log('✅ [AuthStore] 令牌已保存');
            },
            logout: () => {
                console.log('🚪 [AuthStore] 用户退出登录');
                set({ user: null, token: null, isAuthenticated: false });
                console.log('✅ [AuthStore] 用户状态已清除');
            },
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => {
                console.log('💾 [AuthStore] 开始从localStorage恢复状态...');
                return (state) => {
                    if (state) {
                        console.log('✅ [AuthStore] 状态恢复成功:', state);
                    } else {
                        console.log('ℹ️ [AuthStore] 没有找到保存的状态');
                    }
                };
            },
        }
    )
);

