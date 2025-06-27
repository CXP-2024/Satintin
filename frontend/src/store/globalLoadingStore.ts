import { create } from 'zustand';

interface GlobalLoadingState {
	isVisible: boolean;
	isExiting: boolean;
	message: string;
	showLoading: (message?: string) => void;
	startExiting: () => void;
	hideLoading: () => void;
}

export const useGlobalLoading = create<GlobalLoadingState>((set) => ({
	isVisible: false,
	isExiting: false,
	message: '正在登录',

	showLoading: (message = '正在登录') => {
		console.log('🌍 [GlobalLoading] 显示全局加载动画:', message);
		set({
			isVisible: true,
			isExiting: false,
			message
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
