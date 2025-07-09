import React, { useEffect, useState } from 'react';
import './AlertModal.css';

interface AlertModalProps {
	isOpen: boolean;
	title?: string;
	message: string;
	type?: 'warning' | 'error' | 'info' | 'success';
	confirmText?: string;
	onConfirm?: () => void;
	onClose: () => void;
	autoClose?: number; // 自动关闭时间，单位毫秒
}

const AlertModal: React.FC<AlertModalProps> = ({
	isOpen,
	title,
	message,
	type = 'warning',
	confirmText = '确定',
	onConfirm,
	onClose,
	autoClose
}) => {
	const [isAnimating, setIsAnimating] = useState(false);
	const [isClosing, setIsClosing] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true);
			setIsClosing(false);

			// 自动关闭功能
			if (autoClose && autoClose > 0) {
				const timer = setTimeout(() => {
					handleClose();
				}, autoClose);
				return () => clearTimeout(timer);
			}
		}
	}, [isOpen, autoClose]);

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			onClose();
			setIsAnimating(false);
			setIsClosing(false);
		}, 300);
	};

	const handleConfirm = () => {
		if (onConfirm) {
			onConfirm();
		}
		handleClose();
	};

	const getIcon = () => {
		switch (type) {
			case 'warning':
				return '⚠️';
			case 'error':
				return '❌';
			case 'success':
				return '✅';
			case 'info':
				return 'ℹ️';
			default:
				return '⚠️';
		}
	};

	const getTitle = () => {
		if (title) return title;
		switch (type) {
			case 'warning':
				return '警告';
			case 'error':
				return '错误';
			case 'success':
				return '成功';
			case 'info':
				return '提示';
			default:
				return '提示';
		}
	};

	if (!isOpen && !isAnimating) return null;

	return (
		<div className={`alert-modal-overlay ${isClosing ? 'closing' : ''}`}>
			<div className={`alert-modal alert-modal-${type} ${isClosing ? 'closing' : ''}`}>
				{/* 关闭按钮 */}
				<button className="alert-close-btn" onClick={handleClose}>
					×
				</button>

				{/* 装饰性背景效果 */}
				<div className="alert-decorations">
					<div className="decoration-circle decoration-1"></div>
					<div className="decoration-circle decoration-2"></div>
					<div className="decoration-circle decoration-3"></div>
				</div>

				{/* 主要内容 */}
				<div className="alert-content">
					{/* 图标 */}
					<div className={`alert-icon alert-icon-${type} ${isAnimating ? 'animate' : ''}`}>
						{getIcon()}
					</div>

					{/* 标题 */}
					<h3 className="alert-title">{getTitle()}</h3>

					{/* 消息内容 */}
					<p className="alert-message">{message}</p>

					{/* 确认按钮 */}
					<button
						className={`alert-confirm-btn alert-confirm-btn-${type} ${isAnimating ? 'animate' : ''}`}
						onClick={handleConfirm}
					>
						<span className="btn-text">{confirmText}</span>
						<span className="btn-icon">✨</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default AlertModal;
