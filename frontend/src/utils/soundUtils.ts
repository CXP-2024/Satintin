/**
 * 音效工具类
 * 提供统一的音效播放功能
 */
export class SoundUtils {
	private static clickAudio: HTMLAudioElement | null = null;

	/**
	 * 设置点击音效的音频源
	 * @param audioSrc 音频文件路径
	 */
	static setClickSoundSource(audioSrc: string): void {
		this.clickAudio = new Audio(audioSrc);
		this.clickAudio.preload = 'auto';
	}

	/**
	 * 播放按钮点击音效
	 * @param volume 音量 (0-1)，默认0.5
	 */
	static playClickSound(volume: number = 0.5): void {
		try {
			if (!this.clickAudio) {
				console.warn('Click sound not initialized. Call setClickSoundSource first.');
				return;
			}

			// 重置播放位置，确保能连续播放
			this.clickAudio.currentTime = 0;
			this.clickAudio.volume = Math.max(0, Math.min(1, volume)); // 确保音量在有效范围内

			this.clickAudio.play().catch(error => {
				console.log('Audio playback failed:', error);
			});
		} catch (error) {
			console.log('Audio not supported');
		}
	}

	/**
	 * 播放按钮点击音效 - 静音版本（用于需要静音的场景）
	 */
	static playClickSoundSilent(): void {
		this.playClickSound(0);
	}

	/**
	 * 预加载音效（可选，用于优化首次播放延迟）
	 */
	static preloadSounds(): void {
		// 这个方法现在由setClickSoundSource处理
	}

	/**
	 * 播放闪光音效 - 根据稀有度播放不同的音效
	 * @param rarity 稀有度 (3-5星)
	 * @param volume 音量 (0-1)，默认0.7
	 */
	static playSparkleSound(rarity: number, volume: number = 0.7): void {
		try {
			const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

			// 根据稀有度创建不同的音效
			if (rarity === 5) {
				// 5星 - 华丽的金色闪光音效
				this.createLegendarySparkle(audioContext, volume);
			} else if (rarity === 4) {
				// 4星 - 紫色闪光音效
				this.createEpicSparkle(audioContext, volume);
			} else {
				// 3星 - 简单的蓝色闪光音效
				this.createRareSparkle(audioContext, volume);
			}
		} catch (error) {
			console.log('Sparkle audio not supported');
		}
	}

	/**
	 * 创建5星传说级闪光音效
	 */
	private static createLegendarySparkle(audioContext: AudioContext, volume: number): void {
		// 主闪光音 - 高频晶莹声
		const mainOsc = audioContext.createOscillator();
		const mainGain = audioContext.createGain();

		// 和声音 - 中频支撑
		const harmonyOsc = audioContext.createOscillator();
		const harmonyGain = audioContext.createGain();

		// 低频回响 - 厚重感
		const bassOsc = audioContext.createOscillator();
		const bassGain = audioContext.createGain();

		// 连接音频节点
		mainOsc.connect(mainGain);
		harmonyOsc.connect(harmonyGain);
		bassOsc.connect(bassGain);

		mainGain.connect(audioContext.destination);
		harmonyGain.connect(audioContext.destination);
		bassGain.connect(audioContext.destination);

		// 主音设置 - 闪亮的高频
		mainOsc.type = 'sine';
		mainOsc.frequency.setValueAtTime(1400, audioContext.currentTime);
		mainOsc.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.1);
		mainOsc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.4);

		mainGain.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
		mainGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

		// 和声设置
		harmonyOsc.type = 'triangle';
		harmonyOsc.frequency.setValueAtTime(700, audioContext.currentTime);
		harmonyOsc.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.15);
		harmonyOsc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);

		harmonyGain.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
		harmonyGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);

		// 低频设置
		bassOsc.type = 'sine';
		bassOsc.frequency.setValueAtTime(150, audioContext.currentTime + 0.05);
		bassOsc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.8);

		bassGain.gain.setValueAtTime(0, audioContext.currentTime);
		bassGain.gain.linearRampToValueAtTime(volume * 0.2, audioContext.currentTime + 0.05);
		bassGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

		// 播放
		mainOsc.start(audioContext.currentTime);
		harmonyOsc.start(audioContext.currentTime);
		bassOsc.start(audioContext.currentTime + 0.05);

		mainOsc.stop(audioContext.currentTime + 0.6);
		harmonyOsc.stop(audioContext.currentTime + 0.7);
		bassOsc.stop(audioContext.currentTime + 0.8);
	}

	/**
	 * 创建4星史诗级闪光音效
	 */
	private static createEpicSparkle(audioContext: AudioContext, volume: number): void {
		const mainOsc = audioContext.createOscillator();
		const mainGain = audioContext.createGain();
		const subOsc = audioContext.createOscillator();
		const subGain = audioContext.createGain();

		mainOsc.connect(mainGain);
		subOsc.connect(subGain);
		mainGain.connect(audioContext.destination);
		subGain.connect(audioContext.destination);

		// 主音 - 紫色般的中高频
		mainOsc.type = 'triangle';
		mainOsc.frequency.setValueAtTime(1000, audioContext.currentTime);
		mainOsc.frequency.exponentialRampToValueAtTime(1400, audioContext.currentTime + 0.08);
		mainOsc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);

		mainGain.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);
		mainGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

		// 副音 - 支撑音
		subOsc.type = 'sine';
		subOsc.frequency.setValueAtTime(300, audioContext.currentTime + 0.02);
		subOsc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.35);

		subGain.gain.setValueAtTime(0, audioContext.currentTime);
		subGain.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.02);
		subGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45);

		mainOsc.start(audioContext.currentTime);
		subOsc.start(audioContext.currentTime + 0.02);
		mainOsc.stop(audioContext.currentTime + 0.4);
		subOsc.stop(audioContext.currentTime + 0.45);
	}

	/**
	 * 创建3星稀有级闪光音效
	 */
	private static createRareSparkle(audioContext: AudioContext, volume: number): void {
		const osc = audioContext.createOscillator();
		const gain = audioContext.createGain();

		osc.connect(gain);
		gain.connect(audioContext.destination);

		// 简单的蓝色闪光音效
		osc.type = 'sine';
		osc.frequency.setValueAtTime(800, audioContext.currentTime);
		osc.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.05);
		osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);

		gain.gain.setValueAtTime(volume * 0.4, audioContext.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

		osc.start(audioContext.currentTime);
		osc.stop(audioContext.currentTime + 0.25);
	}
}

/**
 * 便捷的音效播放函数
 */
export const playClickSound = (volume?: number) => SoundUtils.playClickSound(volume);
export const playSparkleSound = (rarity: number, volume?: number) => SoundUtils.playSparkleSound(rarity, volume);
export const preloadSounds = () => SoundUtils.preloadSounds();
