import React from 'react';
import { useGlobalLoading } from '../store/globalLoadingStore';
import loginVideo from '../assets/videos/yslogin.mp4';
import './GlobalLoadingOverlay.css';

const GlobalLoadingOverlay: React.FC = () => {
	const { isVisible, isExiting } = useGlobalLoading();

	if (!isVisible) return null;

	return (
		<div className={`global-loading-overlay ${isExiting ? 'exiting' : ''}`}>
			{/* 背景视频 */}
			<video
				className="loading-video"
				autoPlay
				loop
				muted
				playsInline
			>
				<source src={loginVideo} type="video/mp4" />
				您的浏览器不支持视频播放。
			</video>
		</div>
	);
};

export default GlobalLoadingOverlay;
