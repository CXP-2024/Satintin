import React, { useEffect, useState } from 'react';
import '../pages/loginAnimation.css';

interface LoginLoadingAnimationProps {
	isVisible: boolean;
	onAnimationComplete?: () => void;
	duration?: number; // 动画持续时间（毫秒）
}

const LoginLoadingAnimation: React.FC<LoginLoadingAnimationProps> = ({
	isVisible,
	onAnimationComplete,
	duration = 3500
}) => {
	const [shouldRender, setShouldRender] = useState(isVisible);
	const [fadeOut, setFadeOut] = useState(false);

	useEffect(() => {
		if (isVisible) {
			setShouldRender(true);
			setFadeOut(false);

			// 动画完成后开始淡出
			const timer = setTimeout(() => {
				setFadeOut(true);

				// 淡出完成后隐藏组件
				setTimeout(() => {
					setShouldRender(false);
					onAnimationComplete?.();
				}, 500); // 淡出动画时间
			}, duration);

			return () => clearTimeout(timer);
		} else {
			setFadeOut(true);
			setTimeout(() => {
				setShouldRender(false);
			}, 500);
		}
	}, [isVisible, duration, onAnimationComplete]);

	if (!shouldRender) {
		return null;
	}

	return (
		<div className={`login-loading-overlay ${fadeOut ? 'fade-out' : ''}`}>
			<div className="loading-bar">
				<div className="loading-text">正在进入游戏...</div>
			</div>
		</div>
	);
};

export default LoginLoadingAnimation;
