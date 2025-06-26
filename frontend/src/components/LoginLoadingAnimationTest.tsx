import React, { useState } from 'react';
import LoginLoadingAnimation from './LoginLoadingAnimation';

const LoginLoadingAnimationTest: React.FC = () => {
	const [showAnimation, setShowAnimation] = useState(false);

	const handleStartAnimation = () => {
		console.log('🎬 开始测试动画...');
		setShowAnimation(true);
	};

	const handleAnimationComplete = () => {
		console.log('✨ 动画测试完成！');
		setShowAnimation(false);
	};

	return (
		<div style={{ padding: '20px' }}>
			<h2>登录动画测试</h2>
			<button
				onClick={handleStartAnimation}
				style={{
					padding: '10px 20px',
					backgroundColor: '#667eea',
					color: 'white',
					border: 'none',
					borderRadius: '5px',
					cursor: 'pointer'
				}}
			>
				测试登录动画
			</button>

			<LoginLoadingAnimation
				isVisible={showAnimation}
				onAnimationComplete={handleAnimationComplete}
				duration={3500}
			/>
		</div>
	);
};

export default LoginLoadingAnimationTest;
