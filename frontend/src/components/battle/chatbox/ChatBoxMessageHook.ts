/**
 * ChatBox消息处理的自定义Hook
 */

import { useState, useRef, useEffect } from 'react';
import { Message } from './ChatBoxTypes';
import { GetChatHistoryMessage } from '../../../Plugins/UserService/APIs/GetChatHistoryMessage';
import { SendMessageMessage } from '../../../Plugins/UserService/APIs/SendMessageMessage';
import { getUserIDSnap, getUserInfo } from '../../../Plugins/CommonUtils/Store/UserInfoStore';

export const useChatBoxMessages = (friendId: string, friendName: string, isVisible: boolean) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
	const [lastMessageCount, setLastMessageCount] = useState(0);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// 加载真实的聊天数据
	useEffect(() => {
		if (isVisible && friendId && friendName) {
			loadChatHistory();
		}
	}, [isVisible, friendId, friendName]);

	// 自动刷新定时器
	useEffect(() => {
		if (isVisible && autoRefreshEnabled && friendId && friendName) {
			// 启动定时器
			autoRefreshIntervalRef.current = setInterval(() => {
				loadChatHistoryQuietly();
			}, 1000); // 每1秒刷新一次

			return () => {
				// 清理定时器
				if (autoRefreshIntervalRef.current) {
					clearInterval(autoRefreshIntervalRef.current);
					autoRefreshIntervalRef.current = null;
				}
			};
		} else {
			// 停止定时器
			if (autoRefreshIntervalRef.current) {
				clearInterval(autoRefreshIntervalRef.current);
				autoRefreshIntervalRef.current = null;
			}
		}
	}, [isVisible, autoRefreshEnabled, friendId, friendName]);

	// 组件卸载时清理定时器
	useEffect(() => {
		return () => {
			if (autoRefreshIntervalRef.current) {
				clearInterval(autoRefreshIntervalRef.current);
			}
		};
	}, []);

	// 加载聊天历史记录
	const loadChatHistory = async () => {
		if (isRefreshing) return;

		setIsRefreshing(true);
		try {
			const userID = getUserInfo().userID;
			if (!userID) {
				console.error('用户未登录');
				return;
			}

			await loadChatHistoryFromAPI(userID);
		} catch (error) {
			console.error('加载聊天记录出错:', error);
			setMessages([]);
		} finally {
			setIsRefreshing(false);
		}
	};

	// 静默加载聊天历史记录（不显示加载状态）
	const loadChatHistoryQuietly = async () => {
		if (isRefreshing) return; // 如果正在手动刷新，跳过自动刷新

		try {
			const userID = getUserInfo().userID;
			if (!userID) {
				return;
			}

			await loadChatHistoryFromAPI(userID, true);
		} catch (error) {
			console.error('自动刷新聊天记录出错:', error);
		}
	};

	// 从API加载聊天历史记录
	const loadChatHistoryFromAPI = async (userID: string, isQuiet: boolean = false) => {
		return new Promise<void>((resolve, reject) => {
			new GetChatHistoryMessage(userID, friendId).send(
				(responseText: string) => {
					try {
						const response = JSON.parse(responseText);

						if (!Array.isArray(response)) {
							if (!isQuiet) {
								console.error('响应数据不是数组格式:', response);
							}
							setMessages([]);
							resolve();
							return;
						}

						const currentUserID = getUserIDSnap();
						const convertedMessages: Message[] = response.map((msg: any, index: number) => ({
							id: `${index + 1}`,
							senderId: msg.messageSource,
							senderName: msg.messageSource === currentUserID ? '我' : friendName,
							content: msg.messageContent,
							timestamp: new Date(msg.messageTime),
							isCurrentUser: msg.messageSource === currentUserID
						}));

						// 检查是否有新消息
						if (isQuiet && convertedMessages.length > lastMessageCount) {
							// 只在有新消息时才滚动到底部
							setTimeout(() => {
								messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
							}, 100);
						}

						setMessages(convertedMessages);
						setLastMessageCount(convertedMessages.length);
						resolve();
					} catch (parseError) {
						if (!isQuiet) {
							console.error('解析聊天记录失败:', parseError, '原始响应:', responseText);
						}
						setMessages([]);
						reject(parseError);
					}
				},
				(error: string) => {
					if (!isQuiet) {
						console.error('加载聊天记录失败:', error);
					}
					setMessages([]);
					reject(error);
				}
			);
		});
	};

	// 刷新聊天记录
	const handleRefreshChat = async () => {
		console.log('🔄 Refreshing chat history...');
		await loadChatHistory();
	};

	// 滚动到底部
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	// 发送消息
	const handleSendMessage = async () => {
		if (!newMessage.trim()) return;

		const userID = getUserInfo().userID;
		const currentUserID = getUserIDSnap();

		if (!userID || !currentUserID) {
			console.error('用户未登录');
			return;
		}

		// 创建本地消息并立即显示
		const localMessage: Message = {
			id: Date.now().toString(),
			senderId: currentUserID,
			senderName: '我',
			content: newMessage.trim(),
			timestamp: new Date(),
			isCurrentUser: true
		};

		setMessages(prev => [...prev, localMessage]);
		const messageContent = newMessage.trim();
		setNewMessage('');

		// 发送到服务器
		try {
			await sendMessageToAPI(userID, messageContent);
		} catch (error) {
			console.error('发送消息出错:', error);
		}
	};

	// 发送消息到API
	const sendMessageToAPI = async (userID: string, messageContent: string) => {
		return new Promise<void>((resolve, reject) => {
			new SendMessageMessage(userID, friendId, messageContent).send(
				(response: string) => {
					console.log('消息发送成功:', response);
					resolve();
				},
				(error: string) => {
					console.error('消息发送失败:', error);
					reject(error);
				}
			);
		});
	};

	// 键盘事件处理
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// 切换自动刷新状态
	const toggleAutoRefresh = () => {
		setAutoRefreshEnabled(prev => !prev);
	};

	// 启用自动刷新
	const enableAutoRefresh = () => {
		setAutoRefreshEnabled(true);
	};

	// 禁用自动刷新
	const disableAutoRefresh = () => {
		setAutoRefreshEnabled(false);
	};

	return {
		messages,
		newMessage,
		setNewMessage,
		isRefreshing,
		autoRefreshEnabled,
		messagesEndRef,
		handleRefreshChat,
		scrollToBottom,
		handleSendMessage,
		handleKeyPress,
		toggleAutoRefresh,
		enableAutoRefresh,
		disableAutoRefresh
	};
};
