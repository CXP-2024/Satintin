import React, { useState, useEffect } from 'react';
import './AlreadyClaimedModal.css';
import clickSound from '../../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';

interface AlreadyClaimedModalProps {
	isOpen: boolean;
	onClose: () => void;
	rewardType: 'daily' | 'achievement' | 'quest';
	rewardTitle?: string;
	rewardDescription?: string;
}

const AlreadyClaimedModal: React.FC<AlreadyClaimedModalProps> = ({
	isOpen,
	onClose,
	rewardType,
	rewardTitle,
	rewardDescription
}) => {
	const [isClosing, setIsClosing] = useState(false);
	const [showAnimation, setShowAnimation] = useState(false);

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	// 当弹窗打开时，延迟显示动画
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				setShowAnimation(true);
			}, 300);
			return () => clearTimeout(timer);
		} else {
			setShowAnimation(false);
		}
	}, [isOpen]);

	// 处理关闭
	const handleClose = () => {
		playClickSound();
		setIsClosing(true);
		setShowAnimation(false);
		setTimeout(() => {
			setIsClosing(false);
			onClose();
		}, 300);
	};

	// 处理关闭按钮点击
	const handleCloseButtonClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		handleClose();
	};

	// 处理遮罩点击
	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	};

	// 获取已领取信息
	const getClaimedInfo = () => {
		switch (rewardType) {
			case 'daily':
				return {
					icon: '✅',
					title: rewardTitle || '今日已领取',
					description: rewardDescription || '您已领取过今日奖励，明天再来哦~',
					bgGradient: 'linear-gradient(135deg, #6c757d 0%, #495057 50%, #343a40 100%)'
				};
			case 'achievement':
				return {
					icon: '✅',
					title: rewardTitle || '已领取',
					description: rewardDescription || '您已领取过此奖励！',
					bgGradient: 'linear-gradient(135deg, #6c757d 0%, #495057 50%, #343a40 100%)'
				};
			case 'quest':
				return {
					icon: '✅',
					title: rewardTitle || '已领取',
					description: rewardDescription || '您已领取过此奖励！',
					bgGradient: 'linear-gradient(135deg, #6c757d 0%, #495057 50%, #343a40 100%)'
				};
			default:
				return {
					icon: '✅',
					title: '已领取',
					description: '您已领取过此奖励！',
					bgGradient: 'linear-gradient(135deg, #6c757d 0%, #495057 50%, #343a40 100%)'
				};
		}
	};

	const claimedInfo = getClaimedInfo();

	if (!isOpen) return null;

	return (
		<div className={`claimed-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleOverlayClick}>
			<div
				className={`claimed-modal ${isClosing ? 'closing' : ''}`}
				style={{ background: claimedInfo.bgGradient }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* 关闭按钮 */}
				<div className="claimed-close-btn" onClick={handleCloseButtonClick}>
					✕
				</div>

				{/* 内容 */}
				<div className="claimed-content">
					{/* 图标 */}
					<div className={`claimed-icon ${showAnimation ? 'animate' : ''}`}>
						{claimedInfo.icon}
					</div>

					{/* 标题 */}
					<h2 className="claimed-title">{claimedInfo.title}</h2>

					{/* 描述 */}
					<p className="claimed-description">{claimedInfo.description}</p>

					{/* 确认按钮 */}
					<button className={`claimed-confirm-btn ${showAnimation ? 'animate' : ''}`} onClick={handleClose}>
						好的
					</button>
				</div>
			</div>
		</div>
	);
};

export default AlreadyClaimedModal;
