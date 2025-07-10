/**
 * ChatBox组件相关的类型定义
 */

export interface Message {
	id: string;
	senderId: string;
	senderName: string;
	content: string;
	timestamp: Date;
	isCurrentUser: boolean;
}

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface DragOffset {
	x: number;
	y: number;
}

export type ResizeDirection = 'right' | 'bottom' | 'right bottom' | '';
