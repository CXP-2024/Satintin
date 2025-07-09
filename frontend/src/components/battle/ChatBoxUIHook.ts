/**
 * ChatBox UI状态管理的自定义Hook
 */

import { useState } from 'react';

export const useChatBoxUI = () => {
	const [isMinimized, setIsMinimized] = useState(false);

	const handleMinimize = () => {
		setIsMinimized(!isMinimized);
	};

	const handleMaximize = () => {
		setIsMinimized(false);
	};

	const handleToggleMinimize = () => {
		setIsMinimized(prev => !prev);
	};

	return {
		isMinimized,
		handleMinimize,
		handleMaximize,
		handleToggleMinimize
	};
};
