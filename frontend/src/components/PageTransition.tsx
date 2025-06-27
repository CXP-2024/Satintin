import React, { useEffect, useState } from 'react';
import './PageTransition.css';

interface PageTransitionProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * 页面过渡包装组件
 * 为页面提供统一的进入动画效果
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// 页面挂载后延迟，然后触发进入动画
		// 延迟时间与全局覆盖层的导航延迟保持一致
		const timer = setTimeout(() => {
			setIsVisible(true);
		}, 50); // 减少到50ms，让页面更快开始进入动画

		return () => clearTimeout(timer);
	}, []);

	return (
		<div className={`page-transition ${isVisible ? 'visible' : ''} ${className}`}>
			{children}
		</div>
	);
};

export default PageTransition;
