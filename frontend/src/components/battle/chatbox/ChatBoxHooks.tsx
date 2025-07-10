/**
 * ChatBox Hooks 索引文件
 * 重新导出所有模块化的hooks和工具函数
 */

// 类型定义
export type { Message, Position, Size, DragOffset, ResizeDirection } from './ChatBoxTypes';

// Hooks
export { useChatBoxDrag } from './ChatBoxDragHook';
export { useChatBoxMessages } from './ChatBoxMessageHook';
export { useChatBoxUI } from './ChatBoxUIHook';

// 工具函数
export {
	formatTime,
	formatDate,
	shouldShowDate,
	validateMessage,
	truncateMessage,
	getMessagePreview
} from './ChatBoxUtils';
