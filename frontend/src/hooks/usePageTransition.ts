import { useNavigate } from 'react-router-dom';
import { useGlobalLoading } from '../store/globalLoadingStore';

/**
 * 页面过渡钩子
 * 提供丝滑的页面切换动画
 */
export const usePageTransition = () => {
	const navigate = useNavigate();
	const { showLoading, startExiting, hideLoading } = useGlobalLoading();

	/**
	 * 带过渡动画的页面导航
	 * @param path 目标路径
	 * @param message 加载时显示的消息
	 */
	const navigateWithTransition = async (path: string, message?: string) => {
		console.log('🎬 [页面过渡] 开始页面切换动画，目标:', path);

		// 立即显示覆盖层
		if (message) {
			showLoading(message, 'transition');
		}

		// 很短的延迟后立即导航，让覆盖层有时间显示
		setTimeout(() => {
			console.log('🧭 [页面过渡] 执行页面导航到:', path);
			navigate(path);

			// 立即开始退出动画
			startExiting();
		}, 100); // 只需要很短的时间让覆盖层显示

		// 设置总的过渡时间
		setTimeout(() => {
			console.log('🎬 [页面过渡] 完成页面切换，隐藏加载层');
			hideLoading();
		}, 900); // 总过渡时间900ms
	};

	/**
	 * 快速页面导航（不显示加载消息，只有过渡动画）
	 * @param path 目标路径
	 */
	const navigateQuick = async (path: string) => {
		console.log('⚡ [快速过渡] 开始快速页面切换，目标:', path);

		// 不显示加载覆盖层，直接导航
		navigate(path);
	};

	return {
		navigateWithTransition,
		navigateQuick
	};
};
