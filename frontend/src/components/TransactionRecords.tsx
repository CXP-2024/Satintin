import React, { useState, useEffect } from 'react';
import primogemIcon from '../assets/images/primogem-icon.png';
import { GetAssetTransactionMessage } from '../Plugins/AssetService/APIs/GetAssetTransactionMessage';
import { AssetTransaction } from '../Plugins/AssetService/Objects/AssetTransaction';
import { useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

interface TransactionRecordsProps {
  player: any;
  onClose: () => void;
  isClosing?: boolean;
}

const TransactionRecords: React.FC<TransactionRecordsProps> = ({ player, onClose, isClosing = false }) => {
  const user = useUserInfo();
  const [transactions, setTransactions] = useState<AssetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null); 
        console.log(`[TransactionRecords] 获取用户 ${player.userID} 的交易记录`);
        
        const response: any = await new Promise((resolve, reject) => {
          new GetAssetTransactionMessage(player.userID).send(
            (res: any) => resolve(res),
            (err: any) => reject(err)
          );
        });       
        
        // 解析响应数据
        let transactionData: AssetTransaction[] = [];        try {
          // 如果响应是字符串，直接解析
          if (typeof response === 'string') {
            let parsed = JSON.parse(response);
            parsed = JSON.parse(parsed);
            console.log('解析成功，数组长度:', parsed.length);
            transactionData = parsed.map((item: any) => new AssetTransaction(
              item.transactionID,
              item.userID,
              item.transactionType,
              item.changeAmount,
              item.changeReason,
              item.timestamp
            ));
          }
        } catch (parseError) {
          console.error('解析交易记录响应失败:', parseError);
          setError('解析交易记录数据失败');
          return;
        }
        // 设置交易记录（不需要额外过滤，因为API已经返回了指定用户的记录）
        setTransactions(transactionData);
      } catch (err) {
        console.error('获取交易记录失败:', err);
        setError('获取交易记录失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [player.userID, user?.userID]);

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // 获取交易类型的显示文本
  const getTransactionTypeText = (type: string) => {
    switch (type.toUpperCase()) {
      case 'REWARD':
        return '奖励';
      case 'PURCHASE':
        return '消费';
      case 'CHARGE':
        return '充值';
      case 'INCOME':
        return '收入';
      case 'EXPENSE':
        return '支出';
      case 'RECHARGE':
        return '充值';
      case 'CONSUME':
        return '消费';
      default:
        return type;
    }
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`}>
      <div className="admin-modal-container transaction-modal">
        <div className="admin-modal-header">
          <h3>{player.userName} 的交易记录</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="admin-modal-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>正在加载交易记录...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-message">
                <span className="error-icon">❌</span>
                <p>{error}</p>
              </div>
            </div>
          ) : transactions.length > 0 ? (            <div className="admin-transaction-table">
              <table>
                <thead>
                  <tr>
                    <th>交易ID</th>
                    <th>类型</th>
                    <th>金额</th>
                    <th>原因</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>                  {transactions.map(transaction => (
                    <tr key={transaction.transactionID}>
                      <td title={transaction.transactionID}>{transaction.transactionID.substring(0, 8)}...</td>
                      <td>
                        <span className={`transaction-type ${transaction.transactionType.toLowerCase()}`}>
                          {getTransactionTypeText(transaction.transactionType)}
                        </span>
                      </td>
                      <td className={transaction.changeAmount > 0 ? 'amount-positive' : 'amount-negative'}>
                        <div className="stone-amount">
                          <img src={primogemIcon} alt="原石" className="primogem-icon-small" />
                          {transaction.changeAmount > 0 ? '+' : ''}{transaction.changeAmount}
                        </div>
                      </td>
                      <td>{transaction.changeReason}</td>
                      <td>{formatDate(transaction.timestamp)}</td>
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
