import React, { useState, useEffect } from 'react';
import './RewardModal.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';

interface RewardModalProps {
	isOpen: boolean;
	onClose: () => void;
	rewardType: 'daily' | 'achievement' | 'quest';
	rewardAmount: number;
	rewardTitle?: string;
	rewardDescription?: string;
}

const RewardModal: React.FC<RewardModalProps> = ({
	isOpen,
	onClose,
	rewardType,
	rewardAmount,
	rewardTitle,
	rewardDescription
}) => {
	const [isClosing, setIsClosing] = useState(false);
	const [showRewardAnimation, setShowRewardAnimation] = useState(false);

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	// 当弹窗打开时，延迟显示奖励动画
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				setShowRewardAnimation(true);
			}, 300); // 等待弹窗动画完成后再显示奖励
			return () => clearTimeout(timer);
		} else {
			setShowRewardAnimation(false);
		}
	}, [isOpen]);

	// 处理关闭
	const handleClose = () => {
		playClickSound();
		setIsClosing(true);
		setShowRewardAnimation(false);
		// 等待动画完成后再隐藏模态框
		setTimeout(() => {
			setIsClosing(false);
			onClose();
		}, 300); // 300ms 匹配 CSS 动画时长
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

	// 获取奖励信息
	const getRewardInfo = () => {
		switch (rewardType) {
			case 'daily':
				return {
					icon: '🎁',
					title: rewardTitle || '每日奖励',
					description: rewardDescription || '恭喜您获得每日登录奖励！',
					bgGradient: 'linear-gradient(135deg, #2c3e50 0%,rgb(63, 78, 93) 50%,rgb(33, 56, 78) 100%)'
				};
			case 'achievement':
				return {
					icon: '🏆',
					title: rewardTitle || '成就奖励',
					description: rewardDescription || '恭喜您完成成就！',
					bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)'
				};
			case 'quest':
				return {
					icon: '⭐',
					title: rewardTitle || '任务奖励',
					description: rewardDescription || '恭喜您完成任务！',
					bgGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #2db5e9 100%)'
				};
			default:
				return {
					icon: '🎁',
					title: '奖励',
					description: '恭喜您获得奖励！',
					bgGradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #5a67d8 100%)'
				};
		}
	};

	const rewardInfo = getRewardInfo();

	if (!isOpen) return null;

	return (
		<div className={`reward-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleOverlayClick}>
			<div
				className={`reward-modal ${isClosing ? 'closing' : ''}`}
				style={{ background: rewardInfo.bgGradient }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* 关闭按钮 */}
				<div className="reward-close-btn" onClick={handleCloseButtonClick}>
					✕
				</div>

				{/* 奖励内容 */}
				<div className="reward-content">
					{/* 奖励图标 */}
					<div className={`reward-icon ${showRewardAnimation ? 'animate' : ''}`}>
						{rewardInfo.icon}
					</div>

					{/* 奖励标题 */}
					<h2 className="reward-title">{rewardInfo.title}</h2>

					{/* 奖励描述 */}
					<p className="reward-description">{rewardInfo.description}</p>

					{/* 奖励金额显示 */}
					<div className={`reward-amount ${showRewardAnimation ? 'animate' : ''}`}>
						<div className="reward-primogem">
							<img src={primogemIcon} alt="原石" className="reward-primogem-icon" />
							<span className="reward-amount-text">+{rewardAmount}</span>
						</div>
					</div>

					{/* 确认按钮 */}
					<button className={`reward-confirm-btn ${showRewardAnimation ? 'animate' : ''}`} onClick={handleClose}>
						<span className="btn-icon">✨</span>
						领取完成
					</button>
				</div>

				{/* 装饰元素 */}
				<div className="reward-decorations">
					{[...Array(8)].map((_, index) => (
						<div
							key={index}
							className={`decoration-star ${showRewardAnimation ? 'animate' : ''}`}
							style={{
								'--delay': `${index * 0.1}s`,
								'--angle': `${index * 45}deg`
							} as React.CSSProperties}
						>
							✨
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default RewardModal;
