import React from 'react';
import primogemIcon from '../assets/images/primogem-icon.png';

// 模拟数据 - 交易记录
const mockTransactions = [
  {
    id: 'trans-001',
    userId: 'user-001',
    username: '旅行者',
    type: '充值',
    amount: 1200,
    date: '2023-09-25',
    status: '成功'
  },
  {
    id: 'trans-002',
    userId: 'user-003',
    username: '钟离',
    type: '消费',
    amount: -800,
    date: '2023-09-26',
    status: '成功'
  },
  {
    id: 'trans-003',
    userId: 'user-004',
    username: '雷电将军',
    type: '充值',
    amount: 3000,
    date: '2023-09-27',
    status: '成功'
  },
  {
    id: 'trans-004',
    userId: 'user-002',
    username: '派蒙',
    type: '消费',
    amount: -1500,
    date: '2023-09-28',
    status: '成功'
  },
  {
    id: 'trans-005',
    userId: 'user-005',
    username: '胡桃',
    type: '充值',
    amount: 2500,
    date: '2023-09-29',
    status: '成功'
  },
  {
    id: 'trans-006',
    userId: 'user-001',
    username: '旅行者',
    type: '消费',
    amount: -980,
    date: '2023-09-30',
    status: '成功'
  },
  {
    id: 'trans-007',
    userId: 'user-006',
    username: '温迪',
    type: '充值',
    amount: 1800,
    date: '2023-09-28',
    status: '成功'
  },
  {
    id: 'trans-008',
    userId: 'user-007',
    username: '甘雨',
    type: '充值',
    amount: 3600,
    date: '2023-09-26',
    status: '成功'
  },
  {
    id: 'trans-009',
    userId: 'user-008',
    username: '魈',
    type: '消费',
    amount: -1200,
    date: '2023-09-29',
    status: '成功'
  },
  {
    id: 'trans-010',
    userId: 'user-003',
    username: '钟离',
    type: '充值',
    amount: 2400,
    date: '2023-09-30',
    status: '成功'
  },
  {
    id: 'trans-011',
    userId: 'user-010',
    username: '达达利亚',
    type: '充值',
    amount: 5000,
    date: '2023-09-27',
    status: '成功'
  },
  {
    id: 'trans-012',
    userId: 'user-010',
    username: '达达利亚',
    type: '消费',
    amount: -2800,
    date: '2023-09-28',
    status: '成功'
  },
  {
    id: 'trans-013',
    userId: 'user-011',
    username: '神里绫华',
    type: '充值',
    amount: 3200,
    date: '2023-09-25',
    status: '成功'
  },
  {
    id: 'trans-014',
    userId: 'user-004',
    username: '雷电将军',
    type: '消费',
    amount: -1600,
    date: '2023-09-30',
    status: '成功'
  },
  {
    id: 'trans-015',
    userId: 'user-012',
    username: '宵宫',
    type: '充值',
    amount: 1200,
    date: '2023-09-29',
    status: '成功'
  },
  {
    id: 'trans-016',
    userId: 'user-009',
    username: '刻晴',
    type: '充值',
    amount: 2000,
    date: '2023-09-26',
    status: '成功'
  },
  {
    id: 'trans-017',
    userId: 'user-009',
    username: '刻晴',
    type: '消费',
    amount: -1200,
    date: '2023-09-28',
    status: '成功'
  },
  {
    id: 'trans-018',
    userId: 'user-005',
    username: '胡桃',
    type: '消费',
    amount: -1800,
    date: '2023-09-30',
    status: '失败'
  }
];

interface TransactionRecordsProps {
  player: any;
  onClose: () => void;
  isClosing?: boolean;
}

const TransactionRecords: React.FC<TransactionRecordsProps> = ({ player, onClose, isClosing = false }) => {
  // 过滤出当前玩家的交易记录
  const playerTransactions = mockTransactions.filter(
    transaction => transaction.userId === player.id
  );

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`}>
      <div className="admin-modal-container transaction-modal">
        <div className="admin-modal-header">
          <h3>{player.username} 的交易记录</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-content">
          {playerTransactions.length > 0 ? (
            <div className="admin-data-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>类型</th>
                    <th>金额</th>
                    <th>日期</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {playerTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{transaction.id}</td>
                      <td>{transaction.type}</td>
                      <td className={transaction.amount > 0 ? 'amount-positive' : 'amount-negative'}>
                        <div className="stone-amount">
                          <img src={primogemIcon} alt="原石" className="primogem-icon-small" />
                          {transaction.amount}
                        </div>
                      </td>
                      <td>{transaction.date}</td>
                      <td>
                        <span className={`admin-status-badge ${transaction.status === '成功' ? 'admin-status-success' : 'admin-status-failed'}`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-transactions">
              <p>该玩家暂无交易记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionRecords;
