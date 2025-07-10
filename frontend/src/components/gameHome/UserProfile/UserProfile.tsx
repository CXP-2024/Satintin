import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import clickSound from '../../../assets/sound/yinxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { useUserInfo, getUserToken, getUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";
import {
	FriendInfo,
	BlockedUserInfo,
	UserProfileState,
	fetchFriendsData,
	fetchBlockedData,
	refreshUserInfo
} from './UserProfileUtils';
import {
	UserProfileHandleState,
	handleCloseButtonClick,
	handleOverlayClick,
	handleTabSwitch,
	getRankColor
} from './UserProfileHandles';
import FriendsList from '../FriendsList';
import BlockedList from '../BlockedList';

interface UserProfileProps {
	isOpen: boolean;
	onClose: () => void;
	onOpenChatBox?: (friend: FriendInfo) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, onOpenChatBox }) => {
	const user = useUserInfo();
	const [activeTab, setActiveTab] = useState<'friends' | 'blocked'>('friends');
	const [isClosing, setIsClosing] = useState(false);
	const [friendsData, setFriendsData] = useState<FriendInfo[]>([]);
	const [blockedData, setBlockedData] = useState<BlockedUserInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [addFriendID, setAddFriendID] = useState('');
	const [friendsLoadingStatus, setFriendsLoadingStatus] = useState<string>('');
	const [isRefreshingFriends, setIsRefreshingFriends] = useState(false);
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

	// 创建刷新用户信息的函数
	const handleRefreshUserInfo = async (quiet = false) => {
		try {
			await refreshUserInfo(quiet);
			// 刷新后重新获取好友和黑名单数据
			const updatedUser = getUserInfo();
			if (updatedUser.userID) {
				const userProfileState: UserProfileState = {
					user: updatedUser,
					setFriendsData,
					setBlockedData,
					setLoading,
					setFriendsLoadingStatus,
					refreshUserInfo: () => handleRefreshUserInfo(quiet)
				};
				fetchFriendsData(userProfileState);
				fetchBlockedData(userProfileState);
			}
		} catch (error) {
			console.error('Failed to refresh user info in UserProfile:', error);
		}
	};

	// 刷新好友列表的函数
	const handleRefreshFriends = async () => {
		if (isRefreshingFriends) {
			console.log('🔄 Refresh already in progress, skipping...');
			return;
		}
		
		setIsRefreshingFriends(true);
		try {
			console.log('🔄 Starting friends refresh...');
			
			// 1. 首先清除验证缓存，确保重新验证
			const { clearFriendValidationCache } = await import('./UserProfileUtils');
			clearFriendValidationCache();
			
			// 2. 重新获取最新的用户信息（包括好友列表）
			await handleRefreshUserInfo();
			
			// 3. 获取更新后的用户信息
			const updatedUser = getUserInfo();
			console.log('📝 Updated user info:', updatedUser);
			console.log('📝 Updated friend list:', updatedUser.friendList);
			
			if (updatedUser.userID) {
				const userProfileState: UserProfileState = {
					user: updatedUser,
					setFriendsData,
					setBlockedData,
					setLoading,
					setFriendsLoadingStatus,
					refreshUserInfo: handleRefreshUserInfo
				};
				// 4. 重新获取好友数据（强制刷新）
				await fetchFriendsData(userProfileState, true);
			}
			
			console.log('✅ Friends refresh completed');
		} catch (error) {
			console.error('❌ Failed to refresh friends list:', error);
			//setFriendsLoadingStatus('刷新失败，请重试');
			// 清除错误状态
			setTimeout(() => setFriendsLoadingStatus(''), 3000);
		} finally {
			setIsRefreshingFriends(false);
		}
	};

	// 创建处理函数状态对象
	const handleState: UserProfileHandleState = {
		user, loading, setLoading, friendsData, setFriendsData, blockedData, setBlockedData,
		addFriendID, setAddFriendID, isClosing, setIsClosing, activeTab, setActiveTab, onClose,
		refreshUserInfo: handleRefreshUserInfo
	};

	// 初始化数据
	useEffect(() => {
		if (isOpen && user) {
			console.log('UserProfile opened - user data:', user);
			console.log('User ID:', user.userID);
			console.log('User Token:', getUserToken());
			console.log('Friend list:', user.friendList);
			console.log('Friend list type:', typeof user.friendList);
			console.log('Is friend list array:', Array.isArray(user.friendList));
			
			// Additional debugging for friend list structure
			if (user.friendList && Array.isArray(user.friendList)) {
				console.log('Friend list entries:');
				user.friendList.forEach((entry, index) => {
					console.log(`  [${index}]:`, entry);
					if (entry && typeof entry === 'object') {
						console.log(`    friendID: ${entry.friendID}`);
						console.log(`    Entry type: ${typeof entry}`);
					}
				});
			} else if (user.friendList) {
				console.log('Friend list is not an array, attempting to parse...');
				try {
					const parsed = JSON.parse(user.friendList as any);
					console.log('Parsed friend list:', parsed);
					console.log('Parsed friend list type:', typeof parsed);
					console.log('Is parsed array:', Array.isArray(parsed));
				} catch (e) {
					console.error('Failed to parse friend list as JSON:', e);
				}
			}
			
			// 创建状态对象
			const userProfileState: UserProfileState = {
				user,
				setFriendsData,
				setBlockedData,
				setLoading,
				setFriendsLoadingStatus,
				refreshUserInfo: handleRefreshUserInfo
			};
			
			fetchFriendsData(userProfileState);
			fetchBlockedData(userProfileState);
		}
	}, [isOpen, user]);

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 自动刷新定时器
	useEffect(() => {
		if (!isOpen || !autoRefreshEnabled) {
			return;
		}

		console.log('🔄 Starting auto-refresh timer (every 1 second)');
		
		const intervalId = setInterval(async () => {
			// 只在好友列表标签页且没有正在刷新时才自动刷新
			if (activeTab === 'friends' && !isRefreshingFriends && !loading) {
				console.log('⏰ Auto-refreshing friends list...');
				const currentTime = new Date().toLocaleTimeString();
				//setFriendsLoadingStatus(`🔄 自动刷新 ${currentTime}`);
				await handleRefreshFriends();
			}
		}, 1000); // 每1秒刷新一次

		// 清理定时器
		return () => {
			console.log('🛑 Clearing auto-refresh timer');
			clearInterval(intervalId);
		};
	}, [isOpen, autoRefreshEnabled, activeTab, isRefreshingFriends, loading]);

	if (!isOpen) return null;

	return (
		<div className={`user-profile-overlay ${isClosing ? 'closing' : ''}`} onClick={(e) => handleOverlayClick(e, handleState)}>
			<div className={`user-profile-modal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
				{/* 用户信息头部 */}
				<div className="profile-header">
					<div className="profile-close-btn" onClick={(e) => handleCloseButtonClick(e, handleState)}>
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
						onClick={() => handleTabSwitch('friends', handleState)}
					>
						<span className="tab-icon">👥</span>
						好友列表
					</button>
					<button
						className={`tab-btn ${activeTab === 'blocked' ? 'active' : ''}`}
						onClick={() => handleTabSwitch('blocked', handleState)}
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
							<FriendsList 
								friendsData={friendsData}
								loading={loading}
								addFriendID={addFriendID}
								setAddFriendID={setAddFriendID}
								friendsLoadingStatus={friendsLoadingStatus}
								handleState={handleState}
								onRefreshFriends={handleRefreshFriends}
								isRefreshing={isRefreshingFriends}
								onOpenChatBox={onOpenChatBox}
								autoRefreshEnabled={autoRefreshEnabled}
								setAutoRefreshEnabled={setAutoRefreshEnabled}
							/>

							{/* 黑名单页面 */}
							<BlockedList 
								blockedData={blockedData}
								loading={loading}
								handleState={handleState}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UserProfile;
