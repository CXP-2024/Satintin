import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AlertModal from './AlertModal';
import { AlertConfig, AlertManager, setAlertManager, replaceWindowAlert } from '../../utils/alertUtils';

interface AlertContextType {
	showAlert: (config: AlertConfig | string) => void;
	showWarning: (message: string, title?: string) => void;
	showError: (message: string, title?: string) => void;
	showSuccess: (message: string, title?: string) => void;
	showInfo: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const useAlert = () => {
	const context = useContext(AlertContext);
	if (!context) {
		throw new Error('useAlert must be used within AlertProvider');
	}
	return context;
};

interface AlertProviderProps {
	children: React.ReactNode;
	enableWindowAlertOverride?: boolean; // 是否替换原生 window.alert
}

export const AlertProvider: React.FC<AlertProviderProps> = ({
	children,
	enableWindowAlertOverride = true
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [currentAlert, setCurrentAlert] = useState<AlertConfig | null>(null);

	const showAlert = useCallback((config: AlertConfig | string) => {
		const alertConfig: AlertConfig = typeof config === 'string'
			? { message: config, type: 'warning' }
			: config;

		setCurrentAlert(alertConfig);
		setIsOpen(true);
	}, []);

	const showWarning = useCallback((message: string, title?: string) => {
		showAlert({ message, title, type: 'warning' });
	}, [showAlert]);

	const showError = useCallback((message: string, title?: string) => {
		showAlert({ message, title, type: 'error' });
	}, [showAlert]);

	const showSuccess = useCallback((message: string, title?: string) => {
		showAlert({ message, title, type: 'success' });
	}, [showAlert]);

	const showInfo = useCallback((message: string, title?: string) => {
		showAlert({ message, title, type: 'info' });
	}, [showAlert]);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		setTimeout(() => {
			setCurrentAlert(null);
		}, 300); // 等待动画完成
	}, []);

	const handleConfirm = useCallback(() => {
		if (currentAlert?.onConfirm) {
			currentAlert.onConfirm();
		}
		handleClose();
	}, [currentAlert, handleClose]);

	// 初始化全局 AlertManager
	useEffect(() => {
		const manager: AlertManager = {
			show: showAlert,
			showWarning,
			showError,
			showSuccess,
			showInfo
		};

		setAlertManager(manager);

		// 替换原生 window.alert
		if (enableWindowAlertOverride) {
			replaceWindowAlert();
		}
	}, [showAlert, showWarning, showError, showSuccess, showInfo, enableWindowAlertOverride]);

	const contextValue: AlertContextType = {
		showAlert,
		showWarning,
		showError,
		showSuccess,
		showInfo
	};

	return (
		<AlertContext.Provider value={contextValue}>
			{children}
			{currentAlert && (
				<AlertModal
					isOpen={isOpen}
					title={currentAlert.title}
					message={currentAlert.message}
					type={currentAlert.type}
					confirmText={currentAlert.confirmText}
					autoClose={currentAlert.autoClose}
					onConfirm={currentAlert.onConfirm ? handleConfirm : undefined}
					onClose={handleClose}
				/>
			)}
		</AlertContext.Provider>
	);
};
