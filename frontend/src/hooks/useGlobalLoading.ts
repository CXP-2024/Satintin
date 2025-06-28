import { useState } from 'react';

interface LoadingState {
  isVisible: boolean;
  message: string;
  type: 'login' | 'register' | 'loading' | 'default';
}

export const useGlobalLoading = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isVisible: false,
    message: '',
    type: 'default'
  });

  const showLoading = (message: string = '加载中...', type: LoadingState['type'] = 'default') => {
    setLoadingState({
      isVisible: true,
      message,
      type
    });
  };

  const hideLoading = () => {
    setLoadingState(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  return {
    isVisible: loadingState.isVisible,
    message: loadingState.message,
    type: loadingState.type,
    showLoading,
    hideLoading
  };
};