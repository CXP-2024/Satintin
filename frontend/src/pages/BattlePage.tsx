import React from 'react';
import { useParams } from 'react-router-dom';

const BattlePage: React.FC = () => {
	const { roomId } = useParams<{ roomId: string }>();

	return (
		<div style={{ padding: '20px' }}>
			<h1>对战房间 {roomId}</h1>
			<p>对战界面开发中...</p>
			{/* TODO: 实现对战界面 */}
		</div>
	);
};

export default BattlePage;
