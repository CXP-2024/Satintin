import React, { useState, useEffect, useRef } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import { useLocation } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import './WishResultPage.css';
import danziVideo from '../assets/videos/danzi.mp4';
import gaiyaImage from '../assets/images/gaiya.png';
import nailongImage from '../assets/images/nailong.webp';

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
	const [wishResult, setWishResult] = useState<WishResult | null>(null);

	// 从路由参数获取抽卡类型
	const searchParams = new URLSearchParams(location.search);
	const wishType = searchParams.get('type') || 'single';
	const bannerType = searchParams.get('banner') || 'featured';

	useEffect(() => {
		// 生成随机抽卡结果
		generateWishResult();
	}, []);

	const generateWishResult = () => {
		// 模拟抽卡概率
		const random = Math.random() * 100;
		let rarity: number;

		if (random < 90) {
			rarity = 5; // 5星
		} else if (random < 5.7) {
			rarity = 4; // 4星
		} else {
			rarity = 3; // 3星
		}

		// 根据稀有度生成不同的卡牌
		const mockCards = {
			5: [
				{ id: '5001', name: '盖亚——！！', image: gaiyaImage, type: 'character' as const },
				{ id: '5002', name: 'Dragon Nai', image: nailongImage, type: 'character' as const },
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

		const cardsOfRarity = mockCards[rarity as keyof typeof mockCards];
		const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];

		setWishResult({
			...randomCard,
			rarity,
		});
	};

	const handleVideoEnded = () => {
		setShowVideo(false);
		setShowResult(true);
	};

	const handleSkipVideo = () => {
		if (videoRef.current) {
			videoRef.current.pause();
		}
		setShowVideo(false);
		setShowResult(true);
	};

	const handleContinue = () => {
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
		<PageTransition className="wish-result-page">
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

				{showResult && wishResult && (
					<div className="result-container">
						<div className="result-background">
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

							<div className={`card-result ${getRarityClass(wishResult.rarity)}`}>
								<div className="card-glow" style={{ backgroundColor: getRarityColor(wishResult.rarity) }} />

								<div className="card-container">
									<div className="card-image">
										{typeof wishResult.image === 'string' && (wishResult.image.startsWith('/') || wishResult.image.includes('.')) ? (
											<img src={wishResult.image} alt={wishResult.name} className="card-img" />
										) : (
											<span className="card-emoji">{wishResult.image}</span>
										)}
									</div>

									<div className="card-info">
										<div className="card-stars">
											{[...Array(wishResult.rarity)].map((_, i) => (
												<span key={i} className="star">⭐</span>
											))}
										</div>
										<h2 className="card-name">{wishResult.name}</h2>
										<p className="card-type">
											{wishResult.rarity}星 {wishResult.type === 'character' ? '卡牌' : '武器'}
										</p>
									</div>
								</div>

								<div className="result-actions">
									<button className="continue-btn" onClick={handleContinue}>
										谢谢你
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</PageTransition>
	);
};

export default WishResultPage;
