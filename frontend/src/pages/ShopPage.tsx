import React, { useEffect } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './ShopPage.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

const ShopPage: React.FC = () => {
	const user = useUserInfo();
	const { navigateWithTransition } = usePageTransition();

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	const handleBackToHome = () => {
		console.log('🏠 [ShopPage] 返回游戏大厅');
		playClickSound();
		navigateWithTransition('/', '正在返回游戏大厅...');
	};

	const handleRecharge = (amount: number, crystals: number) => {
		console.log(`💰 [ShopPage] 用户充值: ${amount}元, ${crystals}原石`);
		playClickSound();
		// 这里可以添加实际的充值逻辑，比如调用支付API等
		alert(`充值请求已提交: ${amount}元 → ${crystals}原石`);
	};

	// 充值选项数据
	const rechargeOptions = [
		{ amount: 6, crystals: 60 },
		{ amount: 32, crystals: 320 },
		{ amount: 64, crystals: 640 },
		{ amount: 128, crystals: 1280 },
		{ amount: 324, crystals: 3240 },
		{ amount: 648, crystals: 6480 },
	];

	return (
		<PageTransition className="shop-page">
			{/* 顶部状态栏 */}
			<header className="page-header">
				<button className="back-btn" onClick={handleBackToHome}>
					← 返回大厅
				</button>
				<h1>原石商店</h1>
				<div className="user-currency-header">
					<img src={primogemIcon} alt="原石" className="currency-icon" />
					<span className="currency-amount">{user?.stoneAmount || 0}</span>
				</div>
			</header>

			<main className="shop-main">
				<div className="shop-banner">
					<div className="banner-content">
						<h2 className="banner-title">原石充值</h2>
						<p className="banner-subtitle">购买原石以强化您的卡牌阵容</p>
					</div>
				</div>

				<section className="recharge-options">
					<div className="options-grid">
						{rechargeOptions.map((option, index) => (
							<div className="recharge-card" key={index}>
								<div className="crystal-image">
									<img src={primogemIcon} alt="原石" />
								</div>
								<div className="crystal-amount">
									<span className="amount">{option.crystals}</span>
									<span className="label">原石</span>
								</div>
								<div className="price">
									<span className="price-label">¥</span>
									<span className="price-amount">{option.amount}</span>
								</div>
								<button
									className="recharge-btn"
									onClick={() => handleRecharge(option.amount, option.crystals)}
								>
									立即充值
								</button>
							</div>
						))}
					</div>
				</section>

				<section className="shop-info">
					<div className="info-card">
						<h3>充值须知</h3>
						<ul>
							<li>充值后原石将立即添加到您的账户</li>
							<li>原石可用于购买卡牌、祈愿和其他游戏内容</li>
							<li>所有交易均为最终交易，不支持退款</li>
							<li>如遇充值问题，请联系客服支持</li>
						</ul>
					</div>
				</section>
			</main>
		</PageTransition>
	);
};

export default ShopPage;
