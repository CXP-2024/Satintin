import { create } from 'zustand';

type LoadingType = 'login' | 'transition' | 'general';

interface GlobalLoadingState {
	isVisible: boolean;
	isExiting: boolean;
	message: string;
	type: LoadingType;
	showLoading: (message?: string, type?: LoadingType) => void;
	startExiting: () => void;
	hideLoading: () => void;
}

export const useGlobalLoading = create<GlobalLoadingState>((set) => ({
	isVisible: false,
	isExiting: false,
	message: '正在登录',
	type: 'login',

	showLoading: (message = '正在登录', type: LoadingType = 'login') => {
		console.log('🌍 [GlobalLoading] 显示全局加载动画:', message, '类型:', type);
		set({
			isVisible: true,
			isExiting: false,
			message,
			type
		});
	},

	startExiting: () => {
		console.log('🌍 [GlobalLoading] 开始退出动画');
		set({ isExiting: true });
	},

	hideLoading: () => {
		console.log('🌍 [GlobalLoading] 隐藏全局加载动画');
		set({
			isVisible: false,
			isExiting: false
		});
	},
}));
