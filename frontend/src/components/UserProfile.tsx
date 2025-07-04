import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {useUserInfo, getUserToken, setUserInfo} from "Plugins/CommonUtils/Store/UserInfoStore";
import {GetUserInfoMessage} from "Plugins/UserService/APIs/GetUserInfoMessage";
import {AddFriendMessage} from "Plugins/UserService/APIs/AddFriendMessage";
import {RemoveFriendMessage} from "Plugins/UserService/APIs/RemoveFriendMessage";
import {BlockUserMessage} from "Plugins/UserService/APIs/BlockUserMessage";
import {FriendEntry} from "Plugins/UserService/Objects/FriendEntry";
import {BlackEntry} from "Plugins/UserService/Objects/BlackEntry";

interface FriendInfo {
	id: string;
	username: string;
	rank: string;
	status: 'online' | 'offline' | 'in-game';
	lastSeen: string;
}

interface BlockedUserInfo {
	id: string;
	username: string;
	rank: string;
	blockedDate: string;
}

interface UserProfileProps {
	isOpen: boolean;
	onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
	const user = useUserInfo();
	const [activeTab, setActiveTab] = useState<'friends' | 'blocked'>('friends');
	const [isClosing, setIsClosing] = useState(false);
	const [friendsData, setFriendsData] = useState<FriendInfo[]>([]);
	const [blockedData, setBlockedData] = useState<BlockedUserInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [addFriendID, setAddFriendID] = useState('');
	const [friendsLoadingStatus, setFriendsLoadingStatus] = useState<string>('');

	// 轻量级检查用户是否存在（优化版：使用现有API但采用智能缓存策略）
	const checkUserExistsLightweight = async (userID: string): Promise<boolean> => {
		console.log('Performing lightweight user existence check:', userID);
		
		try {
			// Use GetUserInfoMessage but with optimized error handling
			// Note: This is a step-by-step approach - future optimization could use ViewUserBasicInfoMessage
			const response = await new Promise<string>((resolve, reject) => {
				new GetUserInfoMessage(getUserToken(), userID).send(
					(info) => {
						console.log('Lightweight user check success:', userID);
						resolve(info);
					},
					(error) => {
						console.log('Lightweight user check failed:', userID, error);
						// Check if this is the "head of empty list" error which means user doesn't exist
						if (typeof error === 'string' && error.includes('head of empty list')) {
							console.warn(`User with ID ${userID} does not exist`);
							resolve(''); // Return empty string to indicate user not found
						} else {
							reject(error);
						}
					}
				);
			});

			// If we got a response, user exists
			if (response && response.trim() !== '') {
				console.log(`✅ User ${userID} exists (lightweight check)`);
				return true;
			} else {
				console.log(`❌ User ${userID} does not exist (lightweight check)`);
				return false;
			}
		} catch (error) {
			console.error('Error in lightweight user existence check:', userID, error);
			return false;
		}
	};

	// 批量检查多个用户是否存在（用于friend list validation）
	const validateMultipleUsersExist = async (userIDs: string[]): Promise<{valid: string[], invalid: string[]}> => {
		console.log('Validating multiple users:', userIDs);
		
		const valid: string[] = [];
		const invalid: string[] = [];
		
		// Process users sequentially to avoid overwhelming the backend
		for (let i = 0; i < userIDs.length; i++) {
			const userID = userIDs[i];
			setFriendsLoadingStatus(`验证用户 ${i + 1}/${userIDs.length}: ${userID}`);
			
			try {
				const exists = await checkUserExistsLightweight(userID);
				if (exists) {
					valid.push(userID);
				} else {
					invalid.push(userID);
				}
			} catch (error) {
				console.error(`Error checking user ${userID}:`, error);
				invalid.push(userID);
			}
			
			// Add small delay to prevent overwhelming the backend
			if (i < userIDs.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 50));
			}
		}
		
		console.log('Validation results:', { valid, invalid });
		return { valid, invalid };
	};

	// 获取好友详细信息（假设用户已经通过轻量级验证存在）
	const fetchFriendInfo = async (friendID: string): Promise<FriendInfo | null> => {
		console.log('Fetching friend info for validated user ID:', friendID);
		
		if (!friendID || friendID.trim() === '') {
			console.error('Invalid friend ID: empty or null');
			return null;
		}
		
		// Since we pre-validate users, we can directly fetch their info
		try {
			const response = await new Promise<string>((resolve, reject) => {
				new GetUserInfoMessage(getUserToken(), friendID).send(
					(info) => {
						console.log('GetUserInfoMessage success for validated user:', friendID);
						resolve(info);
					},
					(error) => {
						console.error('GetUserInfoMessage error for validated user:', friendID, error);
						// Even though user was validated, they might have been deleted in the meantime
						if (typeof error === 'string' && error.includes('head of empty list')) {
							console.warn(`User with ID ${friendID} was deleted between validation and fetch`);
							resolve(''); // Return empty string to indicate user not found
						} else {
							reject(error);
						}
					}
				);
			});

			console.log('Friend info response:', response);
			
			if (!response || response.trim() === '') {
				console.warn('Empty response from GetUserInfoMessage - user may have been deleted:', friendID);
				return null;
			}
			
			const friendData = JSON.parse(response);
			console.log('Parsed friend data:', friendData);
			
			// Validate required fields
			if (!friendData.userID || !friendData.userName) {
				console.error('Invalid friend data - missing required fields:', friendData);
				return null;
			}
			
			return {
				id: friendData.userID,
				username: friendData.userName,
				rank: friendData.rank || '青铜I',
				status: friendData.isOnline ? 'online' : 'offline',
				lastSeen: friendData.isOnline ? '在线' : '离线'
			};
		} catch (error) {
			console.error('Failed to fetch friend info for validated user:', friendID, 'Error:', error);
			
			// Handle specific backend errors gracefully
			if (typeof error === 'string' && error.includes('head of empty list')) {
				console.warn(`User ${friendID} not found in database - may have been deleted recently`);
				return null;
			}
			
			return null;
		}
	};

	// 获取好友列表数据（优化版：先批量验证用户存在性，再获取详细信息）
	// 优化策略说明（第一步实现）：
	// 1. 使用现有的 GetUserInfoMessage 进行用户存在性检查，但采用批量验证避免重复查询
	// 2. 快速识别无效用户，避免在显示阶段才发现用户不存在
	// 3. 仅对验证通过的用户ID获取完整信息，减少UI错误处理复杂度
	// 4. 提供详细的加载状态反馈，让用户了解处理进度
	// 5. 下一步优化：创建专门的轻量级API（如ViewUserBasicInfoMessage）只查询user_table基础字段
	const fetchFriendsData = async () => {
		const startTime = performance.now();
		
		if (!user?.friendList) {
			console.log('No friend list found for user');
			setFriendsData([]);
			return;
		}

		console.log('User friend list:', user.friendList);
		console.log('Friend list length:', user.friendList.length);
		
		// Additional validation
		if (!Array.isArray(user.friendList)) {
			console.error('Friend list is not an array:', typeof user.friendList);
			setFriendsData([]);
			return;
		}
		
		setLoading(true);
		setFriendsLoadingStatus('正在验证好友列表...');
		
		try {
			// Filter out any invalid entries before processing
			const validEntries = user.friendList.filter(entry => {
				if (!entry) {
					console.warn('Found null/undefined friend entry');
					return false;
				}
				if (!entry.friendID) {
					console.warn('Found friend entry without friendID:', entry);
					return false;
				}
				if (typeof entry.friendID !== 'string') {
					console.warn('Found friend entry with non-string friendID:', entry);
					return false;
				}
				if (entry.friendID.trim() === '') {
					console.warn('Found friend entry with empty friendID:', entry);
					return false;
				}
				return true;
			});
			
			console.log('Valid friend entries:', validEntries);
			
			if (validEntries.length === 0) {
				console.log('No valid friend entries found');
				setFriendsData([]);
				setFriendsLoadingStatus('');
				setLoading(false);
				return;
			}
			
			// Step 1: Batch validate user existence using lightweight method
			const validationStartTime = performance.now();
			const friendIDs = validEntries.map(entry => entry.friendID);
			const { valid: validUserIDs, invalid: invalidUserIDs } = await validateMultipleUsersExist(friendIDs);
			const validationEndTime = performance.now();
			
			console.log(`🚀 Validation completed in ${(validationEndTime - validationStartTime).toFixed(2)}ms`);
			console.log('User validation results:', { validUserIDs, invalidUserIDs });
			
			if (invalidUserIDs.length > 0) {
				console.warn('Found invalid friend user IDs:', invalidUserIDs);
				setFriendsLoadingStatus(`发现 ${invalidUserIDs.length} 个无效用户ID，将跳过`);
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
			
			// Step 2: Fetch detailed info only for valid users
			const fetchStartTime = performance.now();
			setFriendsLoadingStatus('正在获取好友详细信息...');
			const validFriends: FriendInfo[] = [];
			
			for (let i = 0; i < validUserIDs.length; i++) {
				const friendID = validUserIDs[i];
				setFriendsLoadingStatus(`正在加载好友 ${i + 1}/${validUserIDs.length}...`);
				console.log(`Fetching detailed info for valid user ${i}:`, friendID);
				
				try {
					const friendInfo = await fetchFriendInfo(friendID);
					if (friendInfo) {
						validFriends.push(friendInfo);
						console.log(`Successfully fetched friend ${i}:`, friendInfo);
					} else {
						console.warn(`Failed to fetch detailed info for friend ${friendID}`);
					}
				} catch (error) {
					console.error(`Error fetching friend ${i} (${friendID}):`, error);
					// Continue with next friend instead of failing completely
				}
				
				// Add small delay to prevent overwhelming the backend
				if (i < validUserIDs.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			}
			
			const fetchEndTime = performance.now();
			const totalTime = fetchEndTime - startTime;
			
			console.log(`🚀 Detailed info fetch completed in ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);
			console.log(`🚀 Total friend loading time: ${totalTime.toFixed(2)}ms`);
			console.log('All valid friends fetched:', validFriends);
			
			if (invalidUserIDs.length > 0) {
				setFriendsLoadingStatus(`加载完成，跳过了 ${invalidUserIDs.length} 个无效用户`);
				// Optional: Clean up invalid friends
				// await cleanInvalidFriends(invalidUserIDs);
			} else {
				setFriendsLoadingStatus('加载完成');
			}
			
			setFriendsData(validFriends);
		} catch (error) {
			console.error('Failed to fetch friends data:', error);
			setFriendsData([]);
			setFriendsLoadingStatus('加载好友列表失败');
		} finally {
			setLoading(false);
			// Clear status after a delay
			setTimeout(() => setFriendsLoadingStatus(''), 3000);
		}
	};

	// 获取黑名单数据
	const fetchBlockedData = async () => {
		if (!user?.blackList) {
			setBlockedData([]);
			return;
		}

		setLoading(true);
		try {
			const blockedPromises = user.blackList.map(blackEntry => 
				fetchFriendInfo(blackEntry.blackUserID)
			);
			
			const blockedInfos = await Promise.all(blockedPromises);
			const validBlocked = blockedInfos.filter((blocked): blocked is FriendInfo => blocked !== null)
				.map(blocked => ({
					id: blocked.id,
					username: blocked.username,
					rank: blocked.rank,
					blockedDate: new Date().toISOString().split('T')[0] // 暂时使用当前日期
				}));
			
			setBlockedData(validBlocked);
		} catch (error) {
			console.error('Failed to fetch blocked data:', error);
			setBlockedData([]);
		} finally {
			setLoading(false);
		}
	};

	// 刷新用户信息
	const refreshUserInfo = async () => {
		const userToken = getUserToken();
		const userID = user?.userID;
		
		if (!userToken || !userID) return;
		
		try {
			await new Promise<string>((resolve, reject) => {
				new GetUserInfoMessage(userToken, userID).send(
					(info) => resolve(info),
					(error) => reject(error)
				);
			}).then((userInfo) => {
				const userInfoParse = JSON.parse(userInfo);
				setUserInfo(userInfoParse);
			});
		} catch (error) {
			console.error('Failed to refresh user info:', error);
		}
	};

	// 验证用户是否存在（轻量级方法）
	const validateUserExists = async (userID: string): Promise<boolean> => {
		try {
			// Use lightweight check instead of full GetUserInfoMessage
			return await checkUserExistsLightweight(userID);
		} catch (error) {
			console.error('Error validating user:', error);
			return false;
		}
	};

	// 添加好友
	const handleAddFriend = async () => {
		if (!addFriendID.trim()) return;
		
		setLoading(true);
		try {
			// First validate that the user exists
			const userExists = await validateUserExists(addFriendID.trim());
			if (!userExists) {
				alert(`用户 ${addFriendID.trim()} 不存在，请检查用户ID是否正确`);
				setLoading(false);
				return;
			}
			
			await new Promise<string>((resolve, reject) => {
				new AddFriendMessage(getUserToken(), addFriendID.trim()).send(
					(result) => resolve(result),
					(error) => reject(error)
				);
			});
			
			// 刷新用户信息以更新好友列表
			await refreshUserInfo();
			setAddFriendID('');
			alert('好友添加成功！');
		} catch (error) {
			console.error('Failed to add friend:', error);
			alert('添加好友失败');
		} finally {
			setLoading(false);
		}
	};

	// 移除好友
	const handleRemoveFriend = async (friendID: string) => {
		setLoading(true);
		try {
			await new Promise<string>((resolve, reject) => {
				new RemoveFriendMessage(getUserToken(), friendID).send(
					(result) => resolve(result),
					(error) => reject(error)
				);
			});
			
			// 从本地状态中移除好友
			setFriendsData(prev => prev.filter(friend => friend.id !== friendID));
		} catch (error) {
			console.error('Failed to remove friend:', error);
			alert('移除好友失败');
		} finally {
			setLoading(false);
		}
	};

	// 拉黑用户
	const handleBlockUser = async (userID: string) => {
		setLoading(true);
		try {
			await new Promise<string>((resolve, reject) => {
				new BlockUserMessage(getUserToken(), userID).send(
					(result) => resolve(result),
					(error) => reject(error)
				);
			});
			
			// 从好友列表中移除并添加到黑名单
			const friendToBlock = friendsData.find(friend => friend.id === userID);
			if (friendToBlock) {
				setFriendsData(prev => prev.filter(friend => friend.id !== userID));
				setBlockedData(prev => [...prev, {
					id: friendToBlock.id,
					username: friendToBlock.username,
					rank: friendToBlock.rank,
					blockedDate: new Date().toISOString().split('T')[0]
				}]);
			}
		} catch (error) {
			console.error('Failed to block user:', error);
			alert('拉黑用户失败');
		} finally {
			setLoading(false);
		}
	};

	// 解除拉黑 (暂时没有API)
	const handleUnblockUser = async (userID: string) => {
		// TODO: 实现解除拉黑API
		alert('解除拉黑功能暂未实现');
	};

	// 清理无效的好友ID（可选功能，用于清理不存在的用户）
	const cleanInvalidFriends = async (invalidFriendIDs: string[]) => {
		if (invalidFriendIDs.length === 0) return;
		
		console.log('Cleaning invalid friend IDs:', invalidFriendIDs);
		
		// Note: This would require a backend API to remove friends from the friend list
		// For now, we'll just log the invalid IDs
		console.warn('Found invalid friend IDs that should be cleaned up:', invalidFriendIDs);
		
		// You could implement this by calling RemoveFriendMessage for each invalid ID
		// But that might be too aggressive - better to have a separate cleanup API
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
			
			fetchFriendsData();
			fetchBlockedData();
		}
	}, [isOpen, user]);

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
										{friendsLoadingStatus && (
											<div className="loading-status" style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
												{friendsLoadingStatus}
											</div>
										)}
										<div className="add-friend-section">
											<input
												type="text"
												placeholder="输入用户ID添加好友"
												value={addFriendID}
												onChange={(e) => setAddFriendID(e.target.value)}
												disabled={loading}
											/>
											<button 
												className="add-friend-btn"
												onClick={handleAddFriend}
												disabled={loading || !addFriendID.trim()}
											>
												{loading ? '添加中...' : '+ 添加好友'}
											</button>
										</div>
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
															<button 
																className="friend-action-btn chat"
																disabled={loading}
																title="私聊功能暂未开放"
															>
																💬
															</button>
															<button 
																className="friend-action-btn invite"
																disabled={loading}
																title="邀请对战功能暂未开放"
															>
																⚔️
															</button>
															<button 
																className="friend-action-btn remove"
																onClick={() => handleRemoveFriend(friend.id)}
																disabled={loading}
																title="移除好友"
															>
																🗑️
															</button>
															<button 
																className="friend-action-btn block"
																onClick={() => handleBlockUser(friend.id)}
																disabled={loading}
																title="拉黑用户"
															>
																🚫
															</button>
														</div>
													</div>
												);
											})
										) : loading ? (
											<div className="empty-state">
												<div className="empty-icon">⏳</div>
												<div className="empty-text">
													<h4>加载中...</h4>
													<p>正在获取好友列表</p>
												</div>
											</div>
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
														<button 
															className="friend-action-btn unblock"
															onClick={() => handleUnblockUser(blocked.id)}
															disabled={loading}
														>
															解除拉黑
														</button>
													</div>
												</div>
											))
										) : loading ? (
											<div className="empty-state">
												<div className="empty-icon">⏳</div>
												<div className="empty-text">
													<h4>加载中...</h4>
													<p>正在获取黑名单</p>
												</div>
											</div>
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
