import React, { useRef } from 'react';

interface WishVideoProps {
	videoSrc: string;
	onVideoEnded: () => void;
	onSkip: () => void;
}

const WishVideo: React.FC<WishVideoProps> = ({ videoSrc, onVideoEnded, onSkip }) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	const handleSkip = () => {
		if (videoRef.current) {
			videoRef.current.pause();
		}
		onSkip();
	};

	return (
		<div className="video-container">
			<video
				ref={videoRef}
				src={videoSrc}
				autoPlay
				onEnded={onVideoEnded}
				className="wish-video"
			/>
			<button className="skip-btn" onClick={handleSkip}>
				跳过 →
			</button>
		</div>
	);
};

export default WishVideo;
