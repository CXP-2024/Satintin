import React, { useState, useEffect, useCallback } from 'react';
import { usePageTransition } from '../../components/usePageTransition';
import PageTransition from '../../components/PageTransition';
import WishVideo from '../../components/wishResult/WishVideo';
import SingleCardResult from '../../components/wishResult/SingleCardResult';
import AllCardsOverview from '../../components/wishResult/AllCardsOverview';
import { useWishResultLogic } from '../../components/wishResult/useWishResultLogic';
import './WishResultPage.css';
import clickSound from '../../assets/sound/yinxiao.mp3';
import nailongSound from '../../assets/sound/nailong.mp3';
import gaiyaSound from '../../assets/sound/gaiya.mp3';
import sakichanSound from '../../assets/sound/sakichan.mp3';
import jiegeSound from '../../assets/sound/jiege.mp3';
import { SoundUtils } from 'utils/soundUtils';

const WishResultPage: React.FC = () => {
	const { navigateQuick } = usePageTransition();
	const { wishResults, wishType, selectedVideo, isTenWish } = useWishResultLogic();

	// UI 状态控制
	const [showVideo, setShowVideo] = useState(true);
	const [showResult, setShowResult] = useState(false);
	const [currentCardIndex, setCurrentCardIndex] = useState(0);
	const [showAllCards, setShowAllCards] = useState(false);

	// 当前显示的卡牌
	const currentWishResult = wishResults[currentCardIndex];

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = useCallback(() => {
		SoundUtils.playClickSound(0.5);
	}, []);

	// 当结果显示时播放闪光音效和角色语音
	useEffect(() => {
		if (showResult && currentWishResult) {
			// 延迟播放音效，配合动画时机
			const timer = setTimeout(() => {
				// 如果是金卡，根据卡牌ID播放对应角色语音
				if (currentWishResult.rarity === 5) {
					let characterSound;
					switch (currentWishResult.image) {
						case 'template-dragon-nai':
							characterSound = new Audio(nailongSound);
							break;
						case 'template-gaia':
							characterSound = new Audio(gaiyaSound);
							break;
						case 'template-go':
							characterSound = new Audio(sakichanSound);
							break;
						case 'template-jie':
							characterSound = new Audio(jiegeSound);
							break;
						default:
							return;
					} 
					// 设置音量并播放
					characterSound.volume = 0.8;
					characterSound.play().catch(console.error);
				} else {
					SoundUtils.playSparkleSound(currentWishResult.rarity, 0.8);
				}
			}, 500); // 0.5秒后播放，让卡牌动画先开始

			return () => clearTimeout(timer);
		}
	}, [showResult, currentWishResult]);

	// 视频播放完成
	const handleVideoEnded = useCallback(() => {
		setShowVideo(false);
		setShowResult(true);
	}, []);

	// 跳过视频
	const handleSkipVideo = useCallback(() => {
		playClickSound();
		setShowVideo(false);
		setShowResult(true);
	}, [playClickSound]);

	// 继续按钮
	const handleContinue = useCallback(() => {
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
	}, [playClickSound, isTenWish, currentCardIndex, wishResults.length, navigateQuick]);

	// 跳过到总览
	const handleSkipToAll = useCallback(() => {
		playClickSound();
		// 直接跳转到十连总览页面
		setShowAllCards(true);
	}, [playClickSound]);

	// 返回祈愿页面
	const handleBackToWish = useCallback(() => {
		playClickSound();
		navigateQuick('/wish');
	}, [playClickSound, navigateQuick]);
	return (
		<PageTransition className="card-page">
			<div className="wish-result-page">
				{/* 视频播放阶段 */}
				{showVideo && (
					<WishVideo
						videoSrc={selectedVideo}
						onVideoEnded={handleVideoEnded}
						onSkip={handleSkipVideo}
					/>
				)}

				{/* 单张卡牌展示阶段 */}
				{showResult && currentWishResult && !showAllCards && (
					<SingleCardResult
						card={currentWishResult}
						currentIndex={currentCardIndex}
						totalCount={wishResults.length}
						isTenWish={isTenWish}
						onContinue={handleContinue}
						onSkipToAll={currentCardIndex < wishResults.length - 1 ? handleSkipToAll : undefined}
					/>
				)}

				{/* 十连总览阶段 */}
				{showAllCards && (
					<AllCardsOverview
						cards={wishResults}
						onBackToWish={handleBackToWish}
					/>
				)}
			</div>
		</PageTransition>
	);
};

export default WishResultPage;
