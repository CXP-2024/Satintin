import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import { getCardImage } from '../utils/cardImageMap';
import './WishResultPage.css';
import danziVideo from '../assets/videos/danzi.mp4';
import danlanVideo from '../assets/videos/danlan.mp4';
import danjinVideo from '../assets/videos/danjin.mp4';
import shiziVideo from '../assets/videos/shizi.mp4';
import shijinVideo from '../assets/videos/shijin.mp4';

import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';

interface WishResult {
	id: string;
	name: string;
	rarity: number;
	image: string;
	type: 'character' | 'weapon';
}

const WishResultPage: React.FC = () => {
	const { navigateQuick } = usePageTransition();
	const videoRef = useRef<HTMLVideoElement>(null);

	const [showVideo, setShowVideo] = useState(true);
	const [showResult, setShowResult] = useState(false);
	const [wishResults, setWishResults] = useState<WishResult[]>([]);
	const [currentCardIndex, setCurrentCardIndex] = useState(0);
	const [showAllCards, setShowAllCards] = useState(false);
	const [selectedVideo, setSelectedVideo] = useState<string>(danziVideo);
  
	// Backend data settings
	const [wishType, setWishType] = useState<'single' | 'ten'>('single');
	const [bannerType, setBannerType] = useState<'featured' | 'standard'>('featured');
	const isTenWish = wishType === 'ten';
	// 当前显示的卡牌
	const currentWishResult = wishResults[currentCardIndex];

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	// 选择合适的抽卡动画视频
	const selectWishVideo = useCallback((results: WishResult[], isTeWish: boolean) => {
		if (isTeWish) {
			// 十连抽：检查是否有5星
			const hasFiveStar = results.some(card => card.rarity === 5);
			if (hasFiveStar) {
				return shijinVideo; // 十连出金色
			} else {
				return shiziVideo; // 十连出紫色（保底）
			}
		} else {
			// 单抽：根据唯一卡牌的稀有度选择
			const rarity = results[0]?.rarity || 3;
			switch (rarity) {
				case 5:
					return danjinVideo; // 单抽出金色
				case 4:
					return danziVideo; // 单抽出紫色
				case 3:
				default:
					return danlanVideo; // 单抽出蓝色
			}
		}
	}, []);
	// Read draw results from backend storage
	useEffect(() => {
		const stored = localStorage.getItem('drawResult');
		console.log('Stored drawResult:', stored); // 调试日志

		if (stored) {
			const { cardList, isNewCard, type, banner } = JSON.parse(stored);
			console.log('Parsed result:', { cardList, isNewCard, type, banner }); // 调试日志

			setWishType(type || 'single');
			setBannerType(banner || 'featured');			// Map backend CardEntry to WishResult
			const rarityMap: Record<string, number> = { '传说': 5, '稀有': 4, '普通': 3 };			
			const mapped = (cardList || []).map((card: any, index: number) => ({
				id: `${card.cardID}-${index}`, // 使用 cardID + index 确保唯一性
				name: card.cardName,
				rarity: rarityMap[card.rarityLevel] || 3, // 使用 rarityLevel 而不是 rarity
				image: card.cardID, // 直接使用 cardID 作为图片标识
				type: 'character' as const
			}));

			console.log('Mapped results:', mapped); // 调试日志
			setWishResults(mapped);

			const video = selectWishVideo(mapped, type === 'ten');
			setSelectedVideo(video);
		} 
	}, [selectWishVideo]);

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
							src={selectedVideo}
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
								<div className="card-glow" style={{ backgroundColor: getRarityColor(currentWishResult.rarity) }} />								<div className="card-container">
									<div className="card-image">
										{getCardImage(currentWishResult.image) ? (
											<img src={getCardImage(currentWishResult.image)!} alt={currentWishResult.name} className="card-img" />
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
										<div className="mini-card-glow" style={{ backgroundColor: getRarityColor(card.rarity) }} />										<div className="mini-card-image">
											{getCardImage(card.image) ? (
												<img src={getCardImage(card.image)!} alt={card.name} className="mini-card-img" />
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
