import { useState, useCallback } from 'react';
import { apiService, LoginRequest, RegisterRequest, User } from '../../services/ApiService';

// 登录Hook
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.login(credentials);
      if (!response.success) {
        setError(response.message || '登录失败');
        return null;
      }
      return response.data;
    } catch (err) {
      setError('登录过程中发生错误');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error };
}

// 注册Hook
export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (userData: RegisterRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.register(userData);
      if (!response.success) {
        setError(response.message || '注册失败');
        return null;
      }
      return response.data;
    } catch (err) {
      setError('注册过程中发生错误');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, loading, error };
}

// 用户信息Hook
export function useUserInfo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchUserInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserInfo();
      if (!response.success) {
        setError(response.message || '获取用户信息失败');
        return null;
      }
      setUser(response.data || null);
      return response.data;
    } catch (err) {
      setError('获取用户信息时发生错误');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, fetchUserInfo, loading, error };
}