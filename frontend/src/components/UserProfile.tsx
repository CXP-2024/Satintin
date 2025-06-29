import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import './UserProfile.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';

interface UserProfileProps {
	isOpen: boolean;
	onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
	const { user } = useAuthStore();
	const [activeTab, setActiveTab] = useState<'friends' | 'blocked'>('friends');
	const [isClosing, setIsClosing] = useState(false);

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	// 处理关闭
	const handleClose = () => {
		playClickSound();
		setIsClosing(true);
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

	// 处理选项卡切换
	const handleTabSwitch = (tab: 'friends' | 'blocked') => {
		if (tab === activeTab) return;
		playClickSound();
		setActiveTab(tab);
	};

	// 模拟好友数据
	const friendsData = [
		{ id: 1, username: '玩家001', rank: '黄金III', status: 'online', lastSeen: '在线' },
		{ id: 2, username: '卡牌大师', rank: '铂金I', status: 'offline', lastSeen: '2小时前' },
		{ id: 3, username: '对战之王', rank: '钻石II', status: 'in-game', lastSeen: '对战中' },
		{ id: 4, username: '新手玩家', rank: '青铜II', status: 'offline', lastSeen: '1天前' },
		{ id: 5, username: '卡组收集者', rank: '白金III', status: 'online', lastSeen: '在线' },
	];

	// 模拟黑名单数据
	const blockedData = [
		{ id: 1, username: '恶意玩家1', rank: '白银I', blockedDate: '2024-12-20' },
		{ id: 2, username: '作弊者', rank: '黄金II', blockedDate: '2024-12-18' },
	];

	// 获取状态显示信息
	const getStatusInfo = (status: string) => {
		switch (status) {
			case 'online':
				return { text: '在线', color: '#27ae60', icon: '🟢' };
			case 'offline':
				return { text: '离线', color: '#95a5a6', icon: '⚫' };
			case 'in-game':
				return { text: '对战中', color: '#e74c3c', icon: '🔴' };
			default:
				return { text: '未知', color: '#95a5a6', icon: '⚫' };
		}
	};

	// 获取段位颜色
	const getRankColor = (rank: string) => {
		if (rank.includes('青铜')) return '#CD7F32';
		if (rank.includes('白银')) return '#C0C0C0';
		if (rank.includes('黄金')) return '#FFD700';
		if (rank.includes('白金')) return '#E5E4E2';
		if (rank.includes('钻石')) return '#B9F2FF';
		return '#95a5a6';
	};

	if (!isOpen) return null;

	return (
		<div className={`user-profile-overlay ${isClosing ? 'closing' : ''}`} onClick={handleOverlayClick}>
			<div className={`user-profile-modal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
				{/* 用户信息头部 */}
				<div className="profile-header">
					<div className="profile-close-btn" onClick={handleCloseButtonClick}>
						✕
					</div>
					<div className="profile-avatar">
						<div className="avatar-circle">
							{user?.userName.charAt(0).toUpperCase()}
						</div>
					</div>
					<div className="profile-info">
						<h2 className="profile-username">{user?.userName}</h2>
						<p className="profile-email">{user?.email || 'test@satintin.com'}</p>
					</div>
				</div>

				{/* 详细信息区域 */}
				<div className="profile-details">
					<div className="details-grid">
						<div className="detail-item">
							<span className="detail-label">用户ID</span>
							<span className="detail-value">{user?.userID || '12345'}</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">段位</span>
							<span className="detail-value" style={{ color: getRankColor(user?.rank || '青铜I') }}>
								{user?.rank || '青铜I'}
							</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">原石</span>
							<span className="detail-value" style={{ color: '#ffd700' }}>
								{user?.stoneAmount || '1,000'}
							</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">注册时间</span>
							<span className="detail-value">2024-12-01</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">游戏时长</span>
							<span className="detail-value">45小时</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">总对战场次</span>
							<span className="detail-value">127场</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">胜率</span>
							<span className="detail-value">68%</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">收集卡牌</span>
							<span className="detail-value">45/120</span>
						</div>
					</div>
				</div>

				{/* 选项卡导航 */}
				<div className="profile-tabs">
					<button
						className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
						onClick={() => handleTabSwitch('friends')}
					>
						<span className="tab-icon">👥</span>
						好友列表
					</button>
					<button
						className={`tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
						onClick={() => handleTabSwitch('blocked')}
					>
						<span className="tab-icon">🚫</span>
						黑名单
					</button>
				</div>

				{/* 列表内容 */}
				<div className="profile-content">
					<div className="content-slider">
						<div className={`content-wrapper ${activeTab === 'friends' ? 'show-friends' : 'show-blocked'}`}>
							{/* 好友列表页面 */}
							<div className="content-panel friends-panel">
								<div className="friends-list">
									<div className="list-header">
										<h3>好友列表 ({friendsData.length})</h3>
										<button className="add-friend-btn">
											+ 添加好友
										</button>
									</div>
									<div className="list-container">
										{friendsData.length > 0 ? (
											friendsData.map((friend) => {
												const statusInfo = getStatusInfo(friend.status);
												return (
													<div key={friend.id} className="friend-item">
														<div className="friend-avatar">
															{friend.username.charAt(0).toUpperCase()}
														</div>
														<div className="friend-info">
															<div className="friend-name">{friend.username}</div>
															<div className="friend-rank" style={{ color: getRankColor(friend.rank) }}>
																{friend.rank}
															</div>
														</div>
														<div className="friend-status">
															<div className="status-indicator" style={{ color: statusInfo.color }}>
																{statusInfo.icon} {statusInfo.text}
															</div>
															<div className="last-seen">{friend.lastSeen}</div>
														</div>
														<div className="friend-actions">
															<button className="friend-action-btn chat">💬</button>
															<button className="friend-action-btn invite">⚔️</button>
															<button className="friend-action-btn remove">🗑️</button>
														</div>
													</div>
												);
											})
										) : (
											<div className="empty-state">
												<div className="empty-icon">👥</div>
												<div className="empty-text">
													<h4>还没有好友</h4>
													<p>快去添加一些好友一起游戏吧！</p>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* 黑名单页面 */}
							<div className="content-panel blocked-panel">
								<div className="blocked-list">
									<div className="list-header">
										<h3>黑名单 ({blockedData.length})</h3>
									</div>
									<div className="list-container">
										{blockedData.length > 0 ? (
											blockedData.map((blocked) => (
												<div key={blocked.id} className="blocked-item">
													<div className="blocked-avatar">
														{blocked.username.charAt(0).toUpperCase()}
													</div>
													<div className="blocked-info">
														<div className="blocked-name">{blocked.username}</div>
														<div className="blocked-rank" style={{ color: getRankColor(blocked.rank) }}>
															{blocked.rank}
														</div>
													</div>
													<div className="blocked-date">
														<div className="date-label">拉黑时间</div>
														<div className="date-value">{blocked.blockedDate}</div>
													</div>
													<div className="blocked-actions">
														<button className="friend-action-btn unblock">解除拉黑</button>
													</div>
												</div>
											))
										) : (
											<div className="empty-state">
												<div className="empty-icon">🚫</div>
												<div className="empty-text">
													<h4>黑名单为空</h4>
													<p>你还没有拉黑任何用户</p>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UserProfile;
