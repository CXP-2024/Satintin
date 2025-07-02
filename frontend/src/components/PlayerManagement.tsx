import React, { useState, useEffect } from 'react';
import primogemIcon from '../assets/images/primogem-icon.png';
import { SoundUtils } from 'utils/soundUtils';
import TransactionRecords from './TransactionRecords';
import { UserAllInfo } from '../Plugins/AdminService/Objects/UserAllInfo';

// 更新接口定义以使用真实数据
interface PlayerManagementProps {
  searchTerm: string;
  userAllInfoList: UserAllInfo[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onUserUpdated: () => void;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ 
  searchTerm, 
  userAllInfoList,
  loading,
  error,
  onRefresh,
  onUserUpdated
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<UserAllInfo | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isTransactionModalClosing, setIsTransactionModalClosing] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 每页显示10个用户

  // 播放按钮点击音效
  const playClickSound = () => {
    SoundUtils.playClickSound(0.5);
  };

  const handleViewTransactions = (player: UserAllInfo) => {
    playClickSound();
    setSelectedPlayer(player);
    setIsTransactionModalClosing(false);
    setShowTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalClosing(true);
    setTimeout(() => {
      setShowTransactionModal(false);
      setIsTransactionModalClosing(false);
    }, 300); // 动画持续时间
  };

  // 过滤玩家列表 - 使用真实数据
  const filteredPlayers = userAllInfoList.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.userID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 计算总页数
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);

  // 确保当前页码在有效范围内
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // 获取当前页的数据
  const currentPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 处理页码变化
  const handlePageChange = (pageNumber: number) => {
    playClickSound();
    setCurrentPage(pageNumber);
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="players-section">
        <h2>玩家列表</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载用户数据...</p>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <div className="players-section">
        <h2>玩家列表</h2>
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">❌</span>
            <p>{error}</p>
            <button className="retry-btn" onClick={onRefresh}>
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="players-section">
      <h2>玩家列表</h2>
      <div className="admin-data-table">
        <table>
          <thead>
            <tr>
              <th>用户ID</th>
              <th>用户名</th>
              <th>封禁状态</th>
              <th>原石数量</th>
              <th>在线状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {currentPlayers.map(player => (
              <tr key={player.userID}>
                <td>{player.userID.substring(0, 8)}...</td>
                <td>{player.username}</td>
                <td>
                  {player.banDays > 0 ? (
                    <span className="admin-status-badge admin-status-banned">
                      封禁{player.banDays}天
                    </span>
                  ) : (
                    <span className="admin-status-badge admin-status-normal">
                      正常
                    </span>
                  )}
                </td>
                <td>
                  <div className="stone-amount">
                    <img src={primogemIcon} alt="原石" className="primogem-icon-small" />
                    {player.stoneAmount}
                  </div>
                </td>
                <td>
                  <span className={`admin-status-badge ${player.isOnline ? 'admin-status-normal' : 'admin-status-offline'}`}>
                    {player.isOnline ? '在线' : '离线'}
                  </span>
                </td>
                <td>
                  <div className="admin-action-buttons">
                    <button
                      className="admin-action-btn admin-view-btn"
                      onClick={() => handleViewTransactions(player)}
                    >
                      详情
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {/* 如果当前页不足10条数据，添加空行保持表格高度一致 */}
            {currentPlayers.length < itemsPerPage && Array(itemsPerPage - currentPlayers.length).fill(0).map((_, index) => (
              <tr key={`empty-${index}`} style={{ height: '60px' }}>
                <td colSpan={6}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      <div className="pagination">
        <button 
          className="pagination-btn" 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </button>

        {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        <button 
          className="pagination-btn" 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          下一页
        </button>
      </div>

      {/* 交易记录模态框 */}
      {showTransactionModal && selectedPlayer && (
        <TransactionRecords 
          player={selectedPlayer} 
          onClose={handleCloseTransactionModal}
          isClosing={isTransactionModalClosing}
        />
      )}
    </div>
  );
};

export default PlayerManagement;
