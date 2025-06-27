import React, { useState, useEffect, useRef } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import { useLocation } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import './WishResultPage.css';
import danziVideo from '../assets/videos/danzi.mp4';
import gaiyaImage from '../assets/images/gaiya.png';
import nailongImage from '../assets/images/nailong.webp';
import jiegeImage from '../assets/images/jiege.jpg';
import mygoImage from '../assets/images/mygo.png'
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';

interface WishResult {
	id: string;
	name: string;
	rarity: number;
	image: string;
	type: 'character' | 'weapon';
}

const WishResultPage: React.FC = () => {
	const { navigateQuick } = usePageTransition();
	const location = useLocation();
	const videoRef = useRef<HTMLVideoElement>(null);

	const [showVideo, setShowVideo] = useState(true);
	const [showResult, setShowResult] = useState(false);
	const [wishResults, setWishResults] = useState<WishResult[]>([]);
	const [currentCardIndex, setCurrentCardIndex] = useState(0);
	const [showAllCards, setShowAllCards] = useState(false);

	// 从路由参数获取抽卡类型
	const searchParams = new URLSearchParams(location.search);
	const wishType = searchParams.get('type') || 'single';
	const bannerType = searchParams.get('banner') || 'featured';

	// 当前显示的卡牌
	const currentWishResult = wishResults[currentCardIndex];
	// 是否为十连抽
	const isTenWish = wishType === 'ten';

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	useEffect(() => {
		// 生成随机抽卡结果
		generateWishResult();
	}, []);

	// 当结果显示时播放闪光音效
	useEffect(() => {
		if (showResult && currentWishResult) {
			// 延迟播放音效，配合动画时机
			const timer = setTimeout(() => {
				SoundUtils.playSparkleSound(currentWishResult.rarity, 0.8);
			}, 500); // 0.5秒后播放，让卡牌动画先开始

			return () => clearTimeout(timer);
		}
	}, [showResult, currentWishResult]);

	const generateWishResult = () => {
		const count = isTenWish ? 10 : 1;
		const results: WishResult[] = [];

		for (let i = 0; i < count; i++) {
			// 模拟抽卡概率
			const random = Math.random() * 100;
			let rarity: number;

			if (random < 50) { // 0.6% 概率出5星
				rarity = 5;
			} else if (random < 70) { // 5.5% 概率出4星
				rarity = 4;
			} else {
				rarity = 3; // 93.9% 概率出3星
			}

			// 根据卡池类型和稀有度生成不同的卡牌
			let mockCards;

			if (bannerType === 'featured') {
				// 限定卡池
				mockCards = {
					5: [
						{ id: '5001', name: '盖亚——！！', image: gaiyaImage, type: 'character' as const },
						{ id: '5002', name: 'Dragon Nai', image: nailongImage, type: 'character' as const },
						{ id: '5003', name: 'Go', image: mygoImage, type: 'character' as const },
					],
					4: [
						{ id: '4001', name: '火焰战士', image: '🔥', type: 'character' as const },
						{ id: '4002', name: '冰霜法师', image: '❄️', type: 'character' as const },
						{ id: '4003', name: '雷电忍者', image: '⚡', type: 'character' as const },
					],
					3: [
						{ id: '3001', name: '见习战士', image: '⚔️', type: 'character' as const },
						{ id: '3002', name: '普通法师', image: '🔮', type: 'character' as const },
						{ id: '3003', name: '弓箭手', image: '🏹', type: 'character' as const },
					],
				};
			} else {
				// 常驻卡池
				mockCards = {
					5: [
						{ id: '5101', name: '杰哥', image: jiegeImage, type: 'character' as const },
						{ id: '5102', name: '神秘法师', image: '🧙‍♂️', type: 'character' as const },
					],
					4: [
						{ id: '4101', name: '风行者', image: '🌪️', type: 'character' as const },
						{ id: '4102', name: '土元素使', image: '🗿', type: 'character' as const },
						{ id: '4103', name: '治疗师', image: '💚', type: 'character' as const },
						{ id: '4104', name: '暗影刺客', image: '🗡️', type: 'character' as const },
					],
					3: [
						{ id: '3101', name: '村民战士', image: '🛡️', type: 'character' as const },
						{ id: '3102', name: '学徒法师', image: '📖', type: 'character' as const },
						{ id: '3103', name: '猎手', image: '🏹', type: 'character' as const },
						{ id: '3104', name: '药剂师', image: '⚗️', type: 'character' as const },
						{ id: '3105', name: '铁匠', image: '🔨', type: 'character' as const },
					],
				};
			}

			const cardsOfRarity = mockCards[rarity as keyof typeof mockCards];
			const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];

			results.push({
				...randomCard,
				id: `${randomCard.id}_${i}`, // 确保每张卡的ID唯一
				rarity,
			});
		}

		setWishResults(results);
	};

	const handleVideoEnded = () => {
		setShowVideo(false);
		setShowResult(true);
	};

	const handleSkipVideo = () => {
		playClickSound();
		if (videoRef.current) {
			videoRef.current.pause();
		}
		setShowVideo(false);
		setShowResult(true);
	};

	const handleContinue = () => {
		playClickSound();

		if (isTenWish) {
			if (currentCardIndex < wishResults.length - 1) {
				// 还有更多卡牌，显示下一张
				setCurrentCardIndex(currentCardIndex + 1);
				setShowResult(false);
				// 短暂延迟后显示下一张卡牌
				setTimeout(() => {
					setShowResult(true);
				}, 200);
			} else {
				// 所有单张卡牌都显示完了，显示十连总览
				setShowAllCards(true);
			}
		} else {
			// 单抽直接返回
			navigateQuick('/wish');
		}
	};

	const handleSkipToAll = () => {
		playClickSound();
		// 直接跳转到十连总览页面
		setShowAllCards(true);
	};

	const handleBackToWish = () => {
		playClickSound();
		navigateQuick('/wish');
	};

	const getRarityClass = (rarity: number) => {
		switch (rarity) {
			case 5: return 'legendary';
			case 4: return 'epic';
			case 3: return 'rare';
			default: return 'common';
		}
	};

	const getRarityColor = (rarity: number) => {
		switch (rarity) {
			case 5: return '#FFD700'; // 金色
			case 4: return '#9932CC'; // 紫色
			case 3: return '#4169E1'; // 蓝色
			default: return '#808080'; // 灰色
		}
	};

	return (
		<PageTransition className="card-page">
			<div className="wish-result-page">
				{showVideo && (
					<div className="video-container">
						<video
							ref={videoRef}
							src={danziVideo}
							autoPlay
							onEnded={handleVideoEnded}
							className="wish-video"
						/>
						<button className="skip-btn" onClick={handleSkipVideo}>
							跳过 →
						</button>
					</div>
				)}

				{showResult && currentWishResult && !showAllCards && (
					<div className="result-container">
						<div className="result-background">
							{/* 进度指示器 - 仅十连抽显示 */}
							{isTenWish && (
								<div className="progress-indicator">
									<span className="progress-text">
										{currentCardIndex + 1} / {wishResults.length}
									</span>
									<div className="progress-bar">
										<div
											className="progress-fill"
											style={{ width: `${((currentCardIndex + 1) / wishResults.length) * 100}%` }}
										/>
									</div>
								</div>
							)}

							<div className="sparkle-effects">
								{[...Array(12)].map((_, i) => (
									<div
										key={i}
										className="sparkle"
										style={{
											'--delay': `${i * 0.2}s`,
											'--angle': `${i * 30}deg`,
										} as React.CSSProperties}
									/>
								))}
							</div>

							<div className={`card-result ${getRarityClass(currentWishResult.rarity)}`}>
								<div className="card-glow" style={{ backgroundColor: getRarityColor(currentWishResult.rarity) }} />

								<div className="card-container">
									<div className="card-image">
										{typeof currentWishResult.image === 'string' && (currentWishResult.image.startsWith('/') || currentWishResult.image.includes('.')) ? (
											<img src={currentWishResult.image} alt={currentWishResult.name} className="card-img" />
										) : (
											<span className="card-emoji">{currentWishResult.image}</span>
										)}
									</div>

									<div className="card-info">
										<div className="card-stars">
											{[...Array(currentWishResult.rarity)].map((_, i) => (
												<span key={i} className="star">⭐</span>
											))}
										</div>
										<h2 className="card-name">{currentWishResult.name}</h2>
										<p className="card-type">
											{currentWishResult.rarity}星 {currentWishResult.type === 'character' ? '卡牌' : '武器'}
										</p>
									</div>
								</div>

								<div className="result-actions">
									<button className="continue-btn" onClick={handleContinue}>
										{isTenWish
											? (currentCardIndex < wishResults.length - 1 ? '下一张' : '查看全部')
											: '谢谢你'
										}
									</button>
									{/* 十连抽时显示跳过按钮 */}
									{isTenWish && currentCardIndex < wishResults.length - 1 && (
										<button className="skip-to-all-btn" onClick={handleSkipToAll}>
											跳过
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 十连抽总览页面 */}
				{showAllCards && (
					<div className="all-cards-container">
						<div className="all-cards-background">
							<div className="all-cards-header">
								<h2>十连祈愿结果</h2>
								<div className="summary-stats">
									<span className="stat">
										5星: {wishResults.filter(card => card.rarity === 5).length}
									</span>
									<span className="stat">
										4星: {wishResults.filter(card => card.rarity === 4).length}
									</span>
									<span className="stat">
										3星: {wishResults.filter(card => card.rarity === 3).length}
									</span>
								</div>
							</div>

							<div className="all-cards-grid">
								{wishResults.map((card, index) => (
									<div
										key={card.id}
										className={`mini-card ${getRarityClass(card.rarity)}`}
										style={{
											animationDelay: `${index * 0.1}s`
										}}
									>
										<div className="mini-card-glow" style={{ backgroundColor: getRarityColor(card.rarity) }} />
										<div className="mini-card-image">
											{typeof card.image === 'string' && (card.image.startsWith('/') || card.image.includes('.')) ? (
												<img src={card.image} alt={card.name} className="mini-card-img" />
											) : (
												<span className="mini-card-emoji">{card.image}</span>
											)}
										</div>
										<div className="mini-card-info">
											<div className="mini-card-stars">
												{[...Array(card.rarity)].map((_, i) => (
													<span key={i} className="mini-star">⭐</span>
												))}
											</div>
											<h4 className="mini-card-name">{card.name}</h4>
										</div>
									</div>
								))}
							</div>

							<div className="all-cards-actions">
								<button className="back-to-wish-btn" onClick={handleBackToWish}>
									返回祈愿
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</PageTransition>
	);
};

export default WishResultPage;
