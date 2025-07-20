import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import clickSound from '../../../assets/sound/yinxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { useUserInfo, getUserToken, getUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";
import {FriendInfo,BlockedUserInfo,UserProfileState,fetchFriendsData,fetchBlockedData,refreshUserInfo} from './UserProfileUtils';
import {UserProfileHandleState,handleCloseButtonClick,handleOverlayClick,handleTabSwitch,getRankColor} from './UserProfileHandles';
import FriendsList from '../FriendsList';
import BlockedList from '../BlockedList';
import { GetPlayerCardsMessage } from 'Plugins/CardService/APIs/GetPlayerCardsMessage';
import { GetAllCardTemplatesMessage } from 'Plugins/CardService/APIs/GetAllCardTemplatesMessage';
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
	const [cardCollection, setCardCollection] = useState({ owned: 0, total: 0 });
	const [isLoadingCards, setIsLoadingCards] = useState(false);
	const handleRefreshUserInfo = async (quiet = false) => {
		try {
			await refreshUserInfo(quiet);
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
	const fetchCardCollectionData = async (userID: string) => {
		try {
			setIsLoadingCards(true);
			const userCardsResponse: any = await new Promise((resolve, reject) => {
				new GetPlayerCardsMessage(userID).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			const allTemplatesResponse: any = await new Promise((resolve, reject) => {
				new GetAllCardTemplatesMessage().send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			const userCards = typeof userCardsResponse === 'string' ? JSON.parse(userCardsResponse) : userCardsResponse;
			const allTemplates = typeof allTemplatesResponse === 'string' ? JSON.parse(allTemplatesResponse) : allTemplatesResponse;
			const uniqueUserCardIDs = new Set(userCards.map(card => card.cardID));
			setCardCollection({
				owned: uniqueUserCardIDs.size,
				total: allTemplates.length
			});
			console.log(`[UserProfile] 卡牌收集情况: ${uniqueUserCardIDs.size}/${allTemplates.length}`);
		} catch (error) {
			console.error('[UserProfile] 获取卡牌收集数据失败:', error);
			setCardCollection({ owned: 0, total: 0 });
		} finally {
			setIsLoadingCards(false);
		}
	};
	const handleRefreshFriends = async () => {
		if (isRefreshingFriends) {
			console.log('🔄 Refresh already in progress, skipping...');
			return;
		}
		setIsRefreshingFriends(true);
		try {
			const { clearFriendValidationCache } = await import('./UserProfileUtils');
			clearFriendValidationCache();
			await handleRefreshUserInfo();
			const updatedUser = getUserInfo();
			console.log('📝 Updated user info:', updatedUser);
			if (updatedUser.userID) {
				const userProfileState: UserProfileState = {
					user: updatedUser,
					setFriendsData,
					setBlockedData,
					setLoading,
					setFriendsLoadingStatus,
					refreshUserInfo: handleRefreshUserInfo
				};
				await fetchFriendsData(userProfileState, true);
			}
			console.log('✅ Friends refresh completed');
		} catch (error) {
			console.error('❌ Failed to refresh friends list:', error);
			setTimeout(() => setFriendsLoadingStatus(''), 3000);
		} finally {
			setIsRefreshingFriends(false);
		}
	};
	const handleState: UserProfileHandleState = {
		user, loading, setLoading, friendsData, setFriendsData, blockedData, setBlockedData,
		addFriendID, setAddFriendID, isClosing, setIsClosing, activeTab, setActiveTab, onClose,
		refreshUserInfo: handleRefreshUserInfo
	};
	useEffect(() => {
		if (isOpen && user) {
			console.log('UserProfile opened - user data:', user);
			console.log('User ID:', user.userID);
			console.log('User Token:', getUserToken());
			if (user.userID) {
				fetchCardCollectionData(user.userID);
			}
			console.log('Friend list:', user.friendList);
			console.log('Friend list type:', typeof user.friendList);
			console.log('Is friend list array:', Array.isArray(user.friendList));
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
					console.log('Is parsed array:', Array.isArray(parsed));
				} catch (e) {
					console.error('Failed to parse friend list as JSON:', e);
				}
			}
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
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);
	useEffect(() => {
		if (!isOpen || !autoRefreshEnabled) {
			return;
		}
		const intervalId = setInterval(async () => {
			if (activeTab === 'friends' && !isRefreshingFriends && !loading) {
				console.log('⏰ Auto-refreshing friends list...');
				const currentTime = new Date().toLocaleTimeString();
				await handleRefreshFriends();
			}
		}, 1000); // 每1秒刷新一次
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
						<h2 className="profile-username">
							{user?.userName}
							<span style={{ color: '#888', fontSize: '0.7em', marginLeft: '8px' }}>
								{user?.userID}
							</span>
						</h2>
						<p className="profile-email">{user?.email || 'test@satintin.com'}</p>
					</div>
				</div>
				{/* 详细信息区域 */}
				<div className="profile-details">
					<div className="details-grid">
						<div className="detail-item">
							<span className="detail-label">积分</span>
							<span className="detail-value">{user?.credits || '0'}</span>
						</div>
						<div className="detail-item">
							<span className="detail-label">段位</span>
							<span className="detail-value" style={{ color: getRankColor(user?.rank || '黑铁') }}>
								{user?.rank || '黑铁'}
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
							<span className="detail-value">
								{user?.registerTime ? new Date(user.registerTime).toLocaleDateString('zh-CN', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								}) : '未知'}
							</span>
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
							<span className="detail-value">
								{`${cardCollection.owned}/${cardCollection.total}`}
							</span>
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