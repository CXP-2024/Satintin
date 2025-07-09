import React from 'react';

// 警告弹窗的配置接口
export interface AlertConfig {
	message: string;
	title?: string;
	type?: 'warning' | 'error' | 'info' | 'success';
	confirmText?: string;
	autoClose?: number;
	onConfirm?: () => void;
}

// 警告弹窗管理器的类型
export interface AlertManager {
	show: (config: AlertConfig | string) => void;
	showWarning: (message: string, title?: string) => void;
	showError: (message: string, title?: string) => void;
	showSuccess: (message: string, title?: string) => void;
	showInfo: (message: string, title?: string) => void;
}

// 全局警告弹窗管理器实例
let alertManagerInstance: AlertManager | null = null;

// 设置警告弹窗管理器实例
export const setAlertManager = (manager: AlertManager) => {
	alertManagerInstance = manager;
};

// 获取警告弹窗管理器实例
export const getAlertManager = (): AlertManager => {
	if (!alertManagerInstance) {
		throw new Error('AlertManager has not been initialized. Please ensure AlertProvider is rendered in your app.');
	}
	return alertManagerInstance;
};

// 便捷的全局调用方法
export const showAlert = (config: AlertConfig | string) => {
	getAlertManager().show(config);
};

export const showWarning = (message: string, title?: string) => {
	getAlertManager().showWarning(message, title);
};

export const showError = (message: string, title?: string) => {
	getAlertManager().showError(message, title);
};

export const showSuccess = (message: string, title?: string) => {
	getAlertManager().showSuccess(message, title);
};

export const showInfo = (message: string, title?: string) => {
	getAlertManager().showInfo(message, title);
};

// 用于替换所有 window.alert 的方法
export const replaceWindowAlert = () => {
	if (typeof window !== 'undefined') {
		const originalAlert = window.alert;

		window.alert = (message: string) => {
			try {
				showWarning(message);
			} catch (error) {
				// 如果 AlertManager 未初始化，回退到原生 alert
				console.warn('AlertManager not available, falling back to native alert:', error);
				originalAlert.call(window, message);
			}
		};
	}
};

// 恢复原生 alert 的方法
export const restoreWindowAlert = () => {
	if (typeof window !== 'undefined' && (window as any).originalAlert) {
		window.alert = (window as any).originalAlert;
		delete (window as any).originalAlert;
	}
};
