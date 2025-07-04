import React from 'react';
import { useGlobalLoading } from '../store/globalLoadingStore';
import loginVideo from '../assets/videos/SaTTlogin.mp4';
import './GlobalLoadingOverlay.css';

const GlobalLoadingOverlay: React.FC = () => {
	const { isVisible, isExiting, type } = useGlobalLoading();

	if (!isVisible) return null;

	// 只有登录类型才显示内容，其他类型显示空白覆盖层
	const showVideo = type === 'login';

	return (
		<div className={`global-loading-overlay ${isExiting ? 'exiting' : ''} ${type}`}>
			{showVideo && (
				// 只在登录时显示视频
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
			)}
		</div>
	);
};

export default GlobalLoadingOverlay;
