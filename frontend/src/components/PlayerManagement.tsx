import React, { useState, useEffect } from 'react';
import primogemIcon from '../assets/images/primogem-icon.png';
import { SoundUtils } from 'utils/soundUtils';
import TransactionRecords from './TransactionRecords';

// Mock data for players
const mockPlayers = [
  {
    id: 'user-001',
    username: '旅行者',
    email: 'traveler@example.com',
    stoneAmount: 12500,
    rank: '黄金',
    registerTime: '2023-05-15',
    lastLogin: '2023-10-01',
    status: '在线',
    reports: 0
  },
  {
    id: 'user-002',
    username: '派蒙',
    email: 'paimon@example.com',
    stoneAmount: 8700,
    rank: '白银',
    registerTime: '2023-06-20',
    lastLogin: '2023-09-30',
    status: '离线',
    reports: 0
  },
  {
    id: 'user-003',
    username: '钟离',
    email: 'zhongli@example.com',
    stoneAmount: 35000,
    rank: '钻石',
    registerTime: '2023-04-10',
    lastLogin: '2023-10-02',
    status: '在线',
    reports: 0
  },
  {
    id: 'user-004',
    username: '雷电将军',
    email: 'raiden@example.com',
    stoneAmount: 28000,
    rank: '铂金',
    registerTime: '2023-07-05',
    lastLogin: '2023-09-28',
    status: '离线',
    reports: 2
  },
  {
    id: 'user-005',
    username: '胡桃',
    email: 'hutao@example.com',
    stoneAmount: 19500,
    rank: '黄金',
    registerTime: '2023-08-12',
    lastLogin: '2023-10-01',
    status: '在线',
    reports: 1
  },
  {
    id: 'user-006',
    username: '温迪',
    email: 'venti@example.com',
    stoneAmount: 22800,
    rank: '铂金',
    registerTime: '2023-03-16',
    lastLogin: '2023-10-02',
    status: '在线',
    reports: 0
  },
  {
    id: 'user-007',
    username: '甘雨',
    email: 'ganyu@example.com',
    stoneAmount: 31200,
    rank: '钻石',
    registerTime: '2023-02-10',
    lastLogin: '2023-09-29',
    status: '离线',
    reports: 0
  },
  {
    id: 'user-008',
    username: '魈',
    email: 'xiao@example.com',
    stoneAmount: 18900,
    rank: '黄金',
    registerTime: '2023-05-23',
    lastLogin: '2023-10-01',
    status: '在线',
    reports: 1
  },
  {
    id: 'user-009',
    username: '刻晴',
    email: 'keqing@example.com',
    stoneAmount: 15600,
    rank: '黄金',
    registerTime: '2023-06-30',
    lastLogin: '2023-09-27',
    status: '离线',
    reports: 0
  },
  {
    id: 'user-010',
    username: '达达利亚',
    email: 'tartaglia@example.com',
    stoneAmount: 27500,
    rank: '铂金',
    registerTime: '2023-04-28',
    lastLogin: '2023-10-02',
    status: '在线',
    reports: 3
  },
  {
    id: 'user-011',
    username: '神里绫华',
    email: 'ayaka@example.com',
    stoneAmount: 29800,
    rank: '钻石',
    registerTime: '2023-07-10',
    lastLogin: '2023-09-30',
    status: '离线',
    reports: 0
  },
  {
    id: 'user-012',
    username: '宵宫',
    email: 'yoimiya@example.com',
    stoneAmount: 14200,
    rank: '白银',
    registerTime: '2023-08-02',
    lastLogin: '2023-10-01',
    status: '在线',
    reports: 0
  }
];

interface PlayerManagementProps {
  searchTerm: string;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ searchTerm }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isTransactionModalClosing, setIsTransactionModalClosing] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 每页显示10个用户

  // 播放按钮点击音效
  const playClickSound = () => {
    SoundUtils.playClickSound(0.5);
  };


  const handleViewTransactions = (player: any) => {
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


  // 过滤玩家列表
  const filteredPlayers = mockPlayers.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.id.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="players-section">
      <h2>玩家列表</h2>
      <div className="admin-data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>段位</th>
              <th>原石数量</th>
              <th>注册时间</th>
              <th>在线状态</th>
              <th>举报数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {currentPlayers.map(player => (
              <tr key={player.id}>
                <td>{player.id}</td>
                <td>{player.username}</td>
                <td>{player.rank}</td>
                <td>
                  <div className="stone-amount">
                    <img src={primogemIcon} alt="原石" className="primogem-icon-small" />
                    {player.stoneAmount}
                  </div>
                </td>
                <td>{player.registerTime}</td>
                <td>
                  <span className={`admin-status-badge ${player.status === '在线' ? 'admin-status-normal' : 'admin-status-banned'}`}>
                    {player.status}
                  </span>
                </td>
                <td>
                  {player.reports > 0 ? (
                    <span className="admin-reports-badge">{player.reports}</span>
                  ) : (
                    '0'
                  )}
                </td>
                <td>
                  <div className="admin-action-buttons">
                    <button
                      className="admin-action-btn admin-view-btn"
                      onClick={() => handleViewTransactions(player)}
                    >
                      交易记录
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {/* 如果当前页不足10条数据，添加空行保持表格高度一致 */}
            {currentPlayers.length < itemsPerPage && Array(itemsPerPage - currentPlayers.length).fill(0).map((_, index) => (
              <tr key={`empty-${index}`} style={{ height: '60px' }}>
                <td colSpan={8}></td>
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
