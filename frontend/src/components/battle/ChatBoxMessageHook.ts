/**
 * ChatBox消息处理的自定义Hook
 */

import { useState, useRef, useEffect } from 'react';
import { Message } from './ChatBoxTypes';
import { GetChatHistoryMessage } from '../../Plugins/UserService/APIs/GetChatHistoryMessage';
import { SendMessageMessage } from '../../Plugins/UserService/APIs/SendMessageMessage';
import { getUserIDSnap, getUserInfo } from '../../Plugins/CommonUtils/Store/UserInfoStore';

export const useChatBoxMessages = (friendId: string, friendName: string, isVisible: boolean) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [isRefreshing, setIsRefreshing] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// 加载真实的聊天数据
	useEffect(() => {
		if (isVisible && friendId && friendName) {
			loadChatHistory();
		}
	}, [isVisible, friendId, friendName]);

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

	// 从API加载聊天历史记录
	const loadChatHistoryFromAPI = async (userID: string) => {
		return new Promise<void>((resolve, reject) => {
			new GetChatHistoryMessage(userID, friendId).send(
				(responseText: string) => {
					try {
						const response = JSON.parse(responseText);

						if (!Array.isArray(response)) {
							console.error('响应数据不是数组格式:', response);
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
						setMessages(convertedMessages);
						resolve();
					} catch (parseError) {
						console.error('解析聊天记录失败:', parseError, '原始响应:', responseText);
						setMessages([]);
						reject(parseError);
					}
				},
				(error: string) => {
					console.error('加载聊天记录失败:', error);
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

	return {
		messages,
		newMessage,
		setNewMessage,
		isRefreshing,
		messagesEndRef,
		handleRefreshChat,
		scrollToBottom,
		handleSendMessage,
		handleKeyPress
	};
};
