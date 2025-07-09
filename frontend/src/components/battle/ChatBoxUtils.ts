/**
 * ChatBox工具函数
 */

/**
 * 格式化时间
 */
export const formatTime = (timestamp: Date): string => {
	return timestamp.toLocaleTimeString('zh-CN', {
		hour: '2-digit',
		minute: '2-digit'
	});
};

/**
 * 格式化日期
 */
export const formatDate = (timestamp: Date): string => {
	const today = new Date();
	const messageDate = new Date(timestamp);

	if (messageDate.toDateString() === today.toDateString()) {
		return '今天';
	} else {
		return messageDate.toLocaleDateString('zh-CN', {
			month: 'short',
			day: 'numeric'
		});
	}
};

/**
 * 检查日期是否需要显示
 */
export const shouldShowDate = (currentMessage: Date, previousMessage?: Date): boolean => {
	if (!previousMessage) return true;

	const currentDate = new Date(currentMessage);
	const prevDate = new Date(previousMessage);

	return currentDate.toDateString() !== prevDate.toDateString();
};

/**
 * 验证消息内容
 */
export const validateMessage = (content: string): boolean => {
	return content.trim().length > 0 && content.trim().length <= 1000;
};

/**
 * 截断长消息
 */
export const truncateMessage = (content: string, maxLength: number = 100): string => {
	if (content.length <= maxLength) return content;
	return content.substring(0, maxLength) + '...';
};

/**
 * 获取消息预览文本
 */
export const getMessagePreview = (content: string): string => {
	return truncateMessage(content.replace(/\n/g, ' '), 50);
};
