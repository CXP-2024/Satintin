import React, { useEffect, useState } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import UserProfile from '../components/UserProfile';
import RewardModal from '../components/RewardModal';
import './GameHomePage.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {
	clearUserInfo,
	useUserInfo,
	initUserToken,
	getUserInfo,
	useUserToken,
	getUserToken
} from "Plugins/CommonUtils/Store/UserInfoStore";
import {GetPlayerCardsMessage} from "Plugins/CardService/APIs/GetPlayerCardsMessage";
import { autoLogoutManager } from '../utils/autoLogout';
import { QueryIDByUserNameMessage } from "Plugins/UserService/APIs/QueryIDByUserNameMessage";
import { GetUserInfoMessage } from "Plugins/UserService/APIs/GetUserInfoMessage";

const GameHomePage: React.FC = () => {
	const user = useUserInfo();
	const userToken = useUserToken();
	const userID = user?.userID 
	const [cardCount, setCardCount] = useState<number>(0); // 卡牌总数状态
	console.log('👤 [GameHomePage] 当前用户信息:', getUserInfo());
	function logout() {
		console.log('🚪 [GameHomePage] 手动退出登录');
		playClickSound();
		
		// 获取当前token并传递给autoLogoutManager
		const currentUserToken = getUserToken();
		
		// 先清除本地状态
		clearUserInfo();
		initUserToken();
		
		// 使用保存的token执行服务器logout
		if (currentUserToken) {
			autoLogoutManager.manualLogout('普通用户手动退出登录', currentUserToken).catch(console.error);
		}
		
		// 立即导航到登录页
		navigateWithTransition('/login');
	}	const { navigateWithTransition } = usePageTransition();
	const [showUserProfile, setShowUserProfile] = useState(false);
	const [showRewardModal, setShowRewardModal] = useState(false);
	const [showSearchUser, setShowSearchUser] = useState(false);
	const [searchUsername, setSearchUsername] = useState('');
	const [searchedUser, setSearchedUser] = useState<any>(null);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState('');
	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 获取用户卡牌数量
	const fetchCardCount = async () => {
		if (!userToken) return;
		
		try {
			console.log('🃏 [GameHomePage] 开始获取用户卡牌数量');
			const response: any = await new Promise((resolve, reject) => {
				new GetPlayerCardsMessage(userID).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			
			// 解析响应数据
			const cardEntries = typeof response === 'string' ? JSON.parse(response) : response;
			const totalCards = cardEntries.length; // 计算包含重复卡牌的总数
			
			console.log('🃏 [GameHomePage] 获取到卡牌数量:', totalCards);
			setCardCount(totalCards);
			
		} catch (err) {
			console.error('🃏 [GameHomePage] 获取卡牌数量失败:', err);
			setCardCount(0);
		}
	};

	// 在组件挂载时获取卡牌数量
	useEffect(() => {
		if (userToken) {
			fetchCardCount();
		}
	}, [userToken]);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	console.log('🎮 [GameHomePage] 游戏主页组件已挂载');
	console.log('👤 [GameHomePage] 当前用户信息:', user);

	const handleLogout = () => {
		console.log('🚪 [GameHomePage] 用户点击退出登录');
		playClickSound();
		logout();
	};

	const handleNavigateToShop = () => {
		console.log('⚔️ [GameHomePage] 导航到商店充值页面');
		playClickSound();
		navigateWithTransition('/shop', '正在进入商店充值页面...');
	}

	const handleNavigateToBattle = () => {
		console.log('⚔️ [GameHomePage] 导航到战斗页面');
		playClickSound();
		navigateWithTransition('/battle', '正在进入战斗...');
	};

	const handleNavigateToCards = () => {
		console.log('🃏 [GameHomePage] 导航到卡组页面');
		playClickSound();
		navigateWithTransition('/cards', '正在加载卡组...');
	};

	const handleNavigateToWish = () => {
		console.log('🛒 [GameHomePage] 导航到祈愿页面');
		playClickSound();
		navigateWithTransition('/wish', '正在准备祈愿...');
	};

	const handleNavigateToRules = () => {
		console.log('📖 [GameHomePage] 导航到对战规则页面');
		playClickSound();
		navigateWithTransition('/battle-rules', '正在加载对战规则...');
	};

	const handleClaimReward = () => {
		console.log('🎁 [GameHomePage] 领取每日奖励');
		playClickSound();
		// 显示奖励弹窗而不是浏览器 alert
		setShowRewardModal(true);
	};

	const handleShowUserProfile = () => {
		console.log('👤 [GameHomePage] 显示用户详情页面');
		playClickSound();
		setShowUserProfile(true);
	};

	const handleCloseUserProfile = () => {
		console.log('👤 [GameHomePage] 关闭用户详情页面');
		setShowUserProfile(false);
	};
	const handleCloseRewardModal = () => {
		console.log('🎁 [GameHomePage] 关闭奖励弹窗');
		setShowRewardModal(false);
	};

	const handleSearchUser = async () => {
		if (!searchUsername.trim()) {
			setSearchError('请输入用户名');
			return;
		}

		setSearchLoading(true);
		setSearchError('');
		
		try {
			console.log('🔍 [GameHomePage] 开始搜索用户:', searchUsername);
			
			// Step 1: 根据用户名查询用户ID
			const userIdResponse: any = await new Promise((resolve, reject) => {
				new QueryIDByUserNameMessage(searchUsername).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			
			const targetUserId = typeof userIdResponse === 'string' ? userIdResponse : userIdResponse.userID;
			console.log('🔍 [GameHomePage] 查询到用户ID:', targetUserId);
			
			// Step 2: 根据用户ID获取用户详细信息
			const userInfoResponse: any = await new Promise((resolve, reject) => {
				new GetUserInfoMessage(userToken, targetUserId).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			
			const userInfo = typeof userInfoResponse === 'string' ? JSON.parse(userInfoResponse) : userInfoResponse;
			console.log('🔍 [GameHomePage] 获取到用户信息:', userInfo);
			
			setSearchedUser(userInfo);
			setSearchError('');
			
		} catch (error) {
			console.error('🔍 [GameHomePage] 搜索用户失败:', error);
			if (error instanceof Error) {
				if (error.message.includes('不存在')) {
					setSearchError('用户不存在');
				} else {
					setSearchError('搜索失败，请重试');
				}
			} else {
				setSearchError('搜索失败，请重试');
			}
			setSearchedUser(null);
		} finally {
			setSearchLoading(false);
		}
	};

	const handleShowSearchUser = () => {
		console.log('🔍 [GameHomePage] 显示搜索用户弹窗');
		playClickSound();
		setShowSearchUser(true);
		setSearchUsername('');
		setSearchedUser(null);
		setSearchError('');
	};

	const handleCloseSearchUser = () => {
		console.log('🔍 [GameHomePage] 关闭搜索用户弹窗');
		setShowSearchUser(false);
		setSearchUsername('');
		setSearchedUser(null);
		setSearchError('');
	};

	return (
		<PageTransition className="game-page">
			<div className="game-home">
				{/* 顶部状态栏 */}
				<header className="game-header">					<div className="header-left">
						<h1>Satintin</h1>
						<button className="rules-btn" onClick={handleNavigateToRules}>
							<span className="rules-icon">📖</span>
							对战规则
						</button>
						<button className="search-user-btn" onClick={handleShowSearchUser}>
							<span className="search-icon">🔍</span>
							搜索用户
						</button>
					</div>
					<div className="header-right">
						<div className="user-info clickable" onClick={handleShowUserProfile}>
							<span className="username">{user?.userName}</span>
							<span className="coins">
								<img src={primogemIcon} alt="原石" className="primogem-icon small" />
								{user?.stoneAmount}
							</span>
						</div>
						<button className="charge-btn" onClick={handleNavigateToShop}>
							充值
						</button>
						<button className="home-logout-btn" onClick={handleLogout}>
							退出登录
						</button>
					</div>
				</header>

				{/* 主内容区域 */}
				<main className="home-main">
					{/* 欢迎区域 */}
					<section className="welcome-section">
						<div className="welcome-content">
							<h2 className="welcome-title">欢迎回来，{user?.userName}！</h2>
							<p className="welcome-subtitle">准备好迎接激烈的卡牌对战了吗？</p>
						</div>
					</section>					{/* 用户状态卡片 */}
					<section className="user-stats-section">
						<div className="stats-grid">
							<div className="stat-card rank">
								<div className="stat-icon">🏆</div>
								<div className="stat-content">
									<span className="stat-label">当前段位</span>
									<span className="stat-value">{user?.rank}</span>
								</div>
							</div>
							<div className="stat-card currency">
								<div className="stat-icon">
									<img src={primogemIcon} alt="原石" className="primogem-icon" />
								</div>
								<div className="stat-content">
									<span className="stat-label">原石</span>
									<span className="stat-value">{user?.stoneAmount}</span>
								</div>
							</div><div className="stat-card cards">
								<div className="stat-icon">🃏</div>
								<div className="stat-content">
									<span className="stat-label">卡牌数量</span>
									<span className="stat-value">{cardCount}</span>
								</div>
							</div>
							<div className="stat-card wins">
								<div className="stat-icon">⚔️</div>
								<div className="stat-content">
									<span className="stat-label">胜场</span>
									<span className="stat-value">23</span>
								</div>
							</div>
						</div>
					</section>

					{/* 主要功能按钮 */}
					<section className="main-actions-section">
						<div className="main-actions">
							<button className="home-action-btn home-battle-btn" onClick={handleNavigateToBattle}>
								<div className="home-btn-background"></div>
								<div className="btn-content">
									<div className="btn-icon">⚔️</div>
									<div className="btn-text">
										<h3>开始对战</h3>
										<p>与其他玩家展开激烈的卡牌对战</p>
									</div>
								</div>
							</button>

							<button className="home-action-btn cards-btn" onClick={handleNavigateToCards}>
								<div className="home-btn-background"></div>
								<div className="btn-content">
									<div className="btn-icon">🃏</div>
									<div className="btn-text">
										<h3>管理卡组</h3>
										<p>编辑你的卡组，收集强力卡牌</p>
									</div>
								</div>
							</button>

							<button className="home-action-btn wish-btn" onClick={handleNavigateToWish}>
								<div className="home-btn-background"></div>
								<div className="btn-content">
									<div className="btn-icon">✨</div>
									<div className="btn-text">
										<h3>卡牌祈愿</h3>
										<p>获取稀有卡牌，提升战斗实力</p>
									</div>
								</div>
							</button>
						</div>
					</section>

					{/* 快速信息 */}
					<section className="quick-info-section">
						<div className="info-cards">
							<div className="info-card">
								<h4>🎯 今日任务</h4>
								<p>完成3场对战 (2/3)</p>
								<div className="progress-bar">
									<div className="progress-fill" style={{ width: '66%' }}></div>
								</div>
							</div>
							<div className="info-card">
								<h4>🎁 每日奖励</h4>
								<p>登录第3天，获得200原石</p>
								<button className="claim-btn" onClick={handleClaimReward}>领取</button>
							</div>
							<div className="info-card">
								<h4>📈 排行榜</h4>
								<p>当前排名: #127</p>
								<span className="rank-change up">↗ +5</span>
							</div>
						</div>
					</section>
				</main>

				{/* 用户详情模态框 */}
				<UserProfile
					isOpen={showUserProfile}
					onClose={handleCloseUserProfile}
				/>				{/* 奖励弹窗 */}
				<RewardModal
					isOpen={showRewardModal}
					onClose={handleCloseRewardModal}
					rewardType="daily"
					rewardAmount={200}
					rewardTitle="每日奖励"
					rewardDescription="恭喜您获得每日登录奖励！"
				/>

				{/* 搜索用户弹窗 */}
				{showSearchUser && (
					<div className="modal-overlay" onClick={handleCloseSearchUser}>
						<div className="search-user-modal" onClick={(e) => e.stopPropagation()}>
							<div className="modal-header">
								<h3>搜索用户</h3>
								<button className="close-btn" onClick={handleCloseSearchUser}>×</button>
							</div>
							<div className="modal-content">
								<div className="search-input-group">
									<input
										type="text"
										placeholder="请输入用户名"
										value={searchUsername}
										onChange={(e) => setSearchUsername(e.target.value)}
										onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
									/>
									<button 
										className="search-btn" 
										onClick={handleSearchUser}
										disabled={searchLoading}
									>
										{searchLoading ? '搜索中...' : '搜索'}
									</button>
								</div>
								
								{searchError && (
									<div className="error-message">
										{searchError}
									</div>
								)}
								
								{searchedUser && (
									<div className="user-search-result">
										<div className="user-card">
											<div className="user-avatar">
												<span className="avatar-icon">👤</span>
											</div>
											<div className="user-details">
												<h4>{searchedUser.userName}</h4>
												<div className="user-stats">
													<div className="stat-item">
														<span className="stat-label">段位:</span>
														<span className="stat-value">{searchedUser.rank || 'N/A'}</span>
													</div>
													<div className="stat-item">
														<span className="stat-label">原石:</span>
														<span className="stat-value">{searchedUser.stoneAmount || 0}</span>
													</div>
													<div className="stat-item">
														<span className="stat-label">邮箱:</span>
														<span className="stat-value">{searchedUser.email || 'N/A'}</span>
													</div>
													<div className="stat-item">
														<span className="stat-label">在线状态:</span>
														<span className={`stat-value ${searchedUser.isOnline ? 'online' : 'offline'}`}>
															{searchedUser.isOnline ? '在线' : '离线'}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</PageTransition>
	);
};

export default GameHomePage;
