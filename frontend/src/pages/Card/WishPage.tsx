import React, { useState, useEffect } from 'react';
import { usePageTransition } from '../../components/usePageTransition';
import PageTransition from '../../components/PageTransition';
import BannerSelector from '../../components/wish/BannerSelector';
import CharacterShowcase from '../../components/wish/CharacterShowcase';
import WishInfoPanel from '../../components/wish/WishInfoPanel';
import HistoryModal from '../../components/wish/HistoryModal';
import RulesModal from '../../components/wish/RulesModal';
import { useWishLogic } from '../../components/wish/useWishLogic';
import { bannerConfig } from '../../components/wish/bannerConfig';
import './WishPage.css';
import primogemIcon from '../../assets/images/primogem-icon.png';
import clickSound from '../../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";


const WishPage: React.FC = () => {
	const user = useUserInfo();
	const userID = user?.userID;
	const { navigateQuick } = usePageTransition();
	const [selectedBanner, setSelectedBanner] = useState<'standard' | 'featured'>('featured');
	const [showHistory, setShowHistory] = useState(false);
	const [showRules, setShowRules] = useState(false);
	const [isHistoryClosing, setIsHistoryClosing] = useState(false);
	const [isRulesClosing, setIsRulesClosing] = useState(false);
	const [animationClass, setAnimationClass] = useState<string>('');
	const [isAnimating, setIsAnimating] = useState<boolean>(false);

	// 使用 useWishLogic hook 获取所有祈愿相关逻辑
	const {
		wishHistory,
		isLoadingHistory,
		cardDrawCounts,
		refreshUserAssets,
		fetchCardDrawCount,
		fetchAllCardDrawCounts,
		handleSingleWish,
		handleTenWish,
		loadDrawHistory
	} = useWishLogic(userID);

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	const handleNavigateToShop = () => {
		playClickSound();		
		navigateQuick('/shop');
	}	// 卡池切换处理函数
	const handleBannerSwitch = (newBanner: 'standard' | 'featured') => {
		if (newBanner === selectedBanner || isAnimating) return;

		setIsAnimating(true);

		// 确定滑动方向
		const isSlideLeft = (selectedBanner === 'featured' && newBanner === 'standard');
		const slideOutClass = isSlideLeft ? 'slide-left-out' : 'slide-right-out';
		const slideInClass = isSlideLeft ? 'slide-left-in' : 'slide-right-in';

		// 开始退出动画
		setAnimationClass(slideOutClass);

		// 在退出动画完成后切换内容并开始进入动画
		setTimeout(() => {
			setSelectedBanner(newBanner);
			setAnimationClass(slideInClass);

			// 切换卡池时刷新对应卡池的抽卡次数（如果还没有加载过）
			if (userID && cardDrawCounts[newBanner] === 0) {
				fetchCardDrawCount(newBanner);
			}

			// 进入动画完成后清除动画类
			setTimeout(() => {
				setAnimationClass('');
				setIsAnimating(false);
			}, 600); // 匹配CSS动画时长
		}, 300); // 退出动画一半时间后切换内容
	};
	const handleShowHistory = async () => {
		playClickSound();
		setShowHistory(true);
		setIsHistoryClosing(false);
		// 显示历史记录时刷新数据
		await loadDrawHistory();
	};

	const handleCloseHistory = () => {
		playClickSound();
		setIsHistoryClosing(true);
		// 等待动画完成后再隐藏模态框
		setTimeout(() => {
			setShowHistory(false);
			setIsHistoryClosing(false);
		}, 300); // 300ms 匹配 CSS 动画时长
	};

	const handleShowRules = () => {
		playClickSound();
		setShowRules(true);
		setIsRulesClosing(false);
	};

	const handleCloseRules = () => {
		playClickSound();
		setIsRulesClosing(true);
		// 等待动画完成后再隐藏模态框
		setTimeout(() => {
			setShowRules(false);
			setIsRulesClosing(false);
		}, 300); // 300ms 匹配 CSS 动画时长
	};
	const handleBackToHome = () => {
		playClickSound();
		navigateQuick('/game');
	};
	// 获取当前卡池配置
	const currentBanner = bannerConfig[selectedBanner];

	// 创建包装后的抽卡处理函数
	const wrappedHandleSingleWish = () => {
		playClickSound();
		handleSingleWish(selectedBanner, currentBanner, navigateQuick);
	};

	const wrappedHandleTenWish = () => {
		playClickSound();
		handleTenWish(selectedBanner, currentBanner, navigateQuick);
	};	// 组件加载时获取抽卡历史和抽卡次数
	useEffect(() => {
		if (userID) {
			loadDrawHistory();
			fetchAllCardDrawCounts();
		}
	}, [userID, loadDrawHistory, fetchAllCardDrawCounts]); // 现在这些都是 useCallback，依赖是稳定的
	// 监听页面重新可见时刷新抽卡次数（从抽卡结果页返回时）
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && userID) {
				// 页面重新可见时刷新抽卡次数
				fetchAllCardDrawCounts();
			}
		};

		const handleFocus = () => {
			if (userID) {
				fetchAllCardDrawCounts();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('focus', handleFocus);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('focus', handleFocus);
		};
	}, [userID, fetchAllCardDrawCounts]); // 保留 fetchAllCardDrawCounts 依赖，因为它现在是 useCallback
	return (
		<PageTransition className="card-page">
			<div className="wish-page">
				<header className="page-header">
					<button className="back-btn" onClick={handleBackToHome}>
						← 返回主页
					</button>
					<h1>卡牌祈愿</h1>
					<div className="header-right">
						<div className="user-currency-header">
							<img src={primogemIcon} alt="原石" className="currency-icon" />
							<span className="currency-amount">{user?.stoneAmount}</span>
						</div>
						<button className="history-btn" onClick={handleShowHistory}>
							📜 历史记录
						</button>
						<button className="wishpage-charge-btn" onClick={handleNavigateToShop}>
							📜 我想氪金
						</button>
						<button className="rules-btn" onClick={handleShowRules}>
							📋 祈愿规则
						</button>
					</div>
				</header>

				<main className="wish-main">
					<BannerSelector
						selectedBanner={selectedBanner}
						onBannerSwitch={handleBannerSwitch}
						isAnimating={isAnimating}
					/>
					<div className="wish-content-container">
						<div className={`wish-content-wrapper ${animationClass}`}>
							<div className="wish-content">
								<CharacterShowcase
									banner={currentBanner}
									selectedBanner={selectedBanner}
								/>
								<WishInfoPanel
									banner={currentBanner}
									selectedBanner={selectedBanner}
									cardDrawCount={cardDrawCounts[selectedBanner]}
									onSingleWish={wrappedHandleSingleWish}
									onTenWish={wrappedHandleTenWish}
								/>
							</div>
						</div>
					</div>
				</main>
			</div>
			<HistoryModal
				isVisible={showHistory}
				isClosing={isHistoryClosing}
				wishHistory={wishHistory}
				onClose={handleCloseHistory}
			/>
			<RulesModal
				isVisible={showRules}
				isClosing={isRulesClosing}
				onClose={handleCloseRules}
			/>
		</PageTransition>
	);
};

export default WishPage;
