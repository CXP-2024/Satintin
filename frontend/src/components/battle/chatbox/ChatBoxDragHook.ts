/**
 * ChatBox拖拽和缩放功能的自定义Hook
 */

import { useState, useRef, useEffect } from 'react';
import { Position, Size, DragOffset, ResizeDirection } from './ChatBoxTypes';

export const useChatBoxDrag = (isMinimized: boolean) => {
	const [isDragging, setIsDragging] = useState(false);
	const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
	const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
	const [size, setSize] = useState<Size>({ width: 400, height: 600 });
	const [isResizing, setIsResizing] = useState(false);
	const [resizeDirection, setResizeDirection] = useState<ResizeDirection>('');
	const chatBoxRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);

	// 初始化聊天框位置
	useEffect(() => {
		// 设置初始位置为右下角
		setPosition({ x: window.innerWidth - 420, y: window.innerHeight - 620 });
	}, []);

	// 当从最小化状态恢复时，调整位置确保完全可见
	useEffect(() => {
		if (!isMinimized) {
			const maxX = window.innerWidth - size.width;
			const maxY = window.innerHeight - size.height;

			setPosition(prev => ({
				x: Math.max(0, Math.min(prev.x, maxX)),
				y: Math.max(0, Math.min(prev.y, maxY))
			}));
		}
	}, [isMinimized, size]);

	// 拖拽处理函数
	const handleMouseDown = (e: React.MouseEvent) => {
		// 检查是否点击的是按钮或缩放手柄
		if ((e.target as HTMLElement).closest('.chatbox-battle-action-btn') ||
			(e.target as HTMLElement).closest('.chatbox-resize-handle')) {
			return;
		}

		if (e.target === headerRef.current || headerRef.current?.contains(e.target as Node)) {
			setIsDragging(true);
			const rect = chatBoxRef.current?.getBoundingClientRect();
			if (rect) {
				setDragOffset({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top
				});
			}
		}
	};

	// 缩放处理函数
	const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
		e.preventDefault();
		e.stopPropagation();
		console.log('开始缩放:', direction);
		setIsResizing(true);
		setResizeDirection(direction as ResizeDirection);

		const rect = chatBoxRef.current?.getBoundingClientRect();
		if (rect) {
			// 根据不同的缩放方向设置不同的偏移
			if (direction.includes('right') && direction.includes('bottom')) {
				// 右下角：记录相对于右下角的偏移
				setDragOffset({
					x: e.clientX - rect.right,
					y: e.clientY - rect.bottom
				});
			} else if (direction.includes('right')) {
				// 右边：记录相对于右边的偏移
				setDragOffset({
					x: e.clientX - rect.right,
					y: 0
				});
			} else if (direction.includes('bottom')) {
				// 底边：记录相对于底边的偏移
				setDragOffset({
					x: 0,
					y: e.clientY - rect.bottom
				});
			}
		}
	};

	// 鼠标移动处理函数
	const handleMouseMove = (e: MouseEvent) => {
		if (isDragging && chatBoxRef.current) {
			handleDragMove(e);
		} else if (isResizing && chatBoxRef.current) {
			handleResizeMove(e);
		}
	};

	// 拖拽移动逻辑
	const handleDragMove = (e: MouseEvent) => {
		const newX = e.clientX - dragOffset.x;
		const newY = e.clientY - dragOffset.y;

		// 根据是否最小化设置不同的拖拽范围
		if (isMinimized) {
			// 最小化时可以移动到任意位置（只要标题栏可见）
			const maxX = window.innerWidth - 200; // 保证至少200px标题栏可见
			const maxY = window.innerHeight - 60;  // 保证标题栏可见

			setPosition({
				x: Math.max(-200, Math.min(newX, maxX)), // 允许部分移出屏幕
				y: Math.max(0, Math.min(newY, maxY))
			});
		} else {
			// 展开时限制在视窗内
			const maxX = window.innerWidth - size.width;
			const maxY = window.innerHeight - size.height;

			setPosition({
				x: Math.max(0, Math.min(newX, maxX)),
				y: Math.max(0, Math.min(newY, maxY))
			});
		}
	};

	// 缩放移动逻辑
	const handleResizeMove = (e: MouseEvent) => {
		const rect = chatBoxRef.current?.getBoundingClientRect();
		if (!rect) return;

		let newWidth = size.width;
		let newHeight = size.height;

		if (resizeDirection.includes('right')) {
			// 右边缩放：当前鼠标X位置 - 左边界 = 新宽度
			newWidth = Math.max(300, Math.min(800, e.clientX - rect.left));
		}
		if (resizeDirection.includes('bottom')) {
			// 底边缩放：当前鼠标Y位置 - 上边界 = 新高度
			newHeight = Math.max(200, Math.min(800, e.clientY - rect.top));
			console.log('底边缩放:', {
				mouseY: e.clientY,
				rectTop: rect.top,
				calculated: e.clientY - rect.top,
				newHeight
			});
		}

		// 确保缩放后的窗口不会超出视窗边界
		const maxWidth = window.innerWidth - position.x;
		const maxHeight = window.innerHeight - position.y;

		newWidth = Math.min(newWidth, maxWidth);
		newHeight = Math.min(newHeight, maxHeight);

		setSize({ width: newWidth, height: newHeight });
	};

	// 鼠标释放处理函数
	const handleMouseUp = () => {
		setIsDragging(false);
		setIsResizing(false);
		setResizeDirection('');
	};

	// 事件监听器管理
	useEffect(() => {
		if (isDragging || isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, isResizing, dragOffset, size, isMinimized, resizeDirection]);

	return {
		isDragging,
		isResizing,
		position,
		size,
		chatBoxRef,
		headerRef,
		handleMouseDown,
		handleResizeMouseDown
	};
};
