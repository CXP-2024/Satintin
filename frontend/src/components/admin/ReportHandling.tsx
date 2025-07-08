import React, { useState, useEffect } from 'react';
import { SoundUtils } from 'utils/soundUtils';
import { BanUserMessage } from "Plugins/AdminService/APIs/BanUserMessage";
import { ManageReportMessage } from "Plugins/AdminService/APIs/ManageReportMessage";
import { getUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";
import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';
import { GetUserInfoMessage } from 'Plugins/UserService/APIs/GetUserInfoMessage';
import { User } from 'Plugins/UserService/Objects/User';
import ReportModal from './ReportModal';
import { playClickSound, getAdminToken } from '../reportUtils';

// 更新接口定义
interface ReportHandlingProps {
  searchTerm: string;
  reports: CheatingReport[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onReportUpdated: () => void;
}

interface UserNameCache {
  [key: string]: string;
}

const ReportHandling: React.FC<ReportHandlingProps> = ({ 
  searchTerm, 
  reports,
  loading,
  error,
  onRefresh,
  onReportUpdated
}) => {
  const [selectedReport, setSelectedReport] = useState<CheatingReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReportModalClosing, setIsReportModalClosing] = useState(false);
  const [userNameCache, setUserNameCache] = useState<UserNameCache>({});

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 每页显示10条记录

  // 获取用户名的函数
  const fetchUserName = async (userID: string) => {
    if (userNameCache[userID]) {
      return userNameCache[userID];
    }

    return new Promise<string>((resolve) => {
      new GetUserInfoMessage(userID).send(
        (response: string) => {
          try {
            let userData: any = response;
            if (typeof response === 'string') {
              userData = JSON.parse(response);
              if (typeof userData === 'string') {
                userData = JSON.parse(userData);
              }
            }

            const userObj = new User(
              userData.userID,
              userData.userName,
              userData.passwordHash,
              userData.email,
              userData.phoneNumber,
              userData.registerTime,
              userData.permissionLevel,
              userData.banDays,
              userData.isOnline,
              userData.matchStatus,
              userData.stoneAmount,
              userData.cardDrawCount,
              userData.rank,
              userData.rankPosition,
              userData.friendList,
              userData.blackList,
              userData.messageBox
            );

            setUserNameCache(prev => ({
              ...prev,
              [userID]: userObj.userName
            }));
            resolve(userObj.userName);
          } catch (error) {
            console.error(`❌ [ReportHandling] 解析用户${userID}信息失败:`, error);
            resolve(userID); // 如果获取失败，显示 userID
          }
        },
        (error: any) => {
          console.error(`❌ [ReportHandling] 获取用户${userID}信息失败:`, error);
          resolve(userID); // 如果获取失败，显示 userID
        }
      );
    });
  };

  // 加载当前页面所有用户的用户名
  useEffect(() => {
    const loadUserNames = async () => {
      const currentReports = filteredReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

      const userIDs = new Set<string>();
      currentReports.forEach(report => {
        userIDs.add(report.reportingUserID);
        userIDs.add(report.reportedUserID);
      });

      for (const userID of userIDs) {
        if (!userNameCache[userID]) {
          await fetchUserName(userID);
        }
      }
    };

    loadUserNames();
  }, [currentPage, reports, searchTerm]);

  const handleViewReport = (report: CheatingReport) => {
    playClickSound(SoundUtils);
    setSelectedReport(report);
    setIsReportModalClosing(false);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalClosing(true);
    setTimeout(() => {
      setShowReportModal(false);
      setIsReportModalClosing(false);
    }, 300); // 动画持续时间
  };

  const handleResolveReport = (reportId: string, isResolved: boolean = true) => {
    playClickSound(SoundUtils);
    console.log(`🛡️ [ReportHandling] 更新举报状态 ${reportId}, isResolved: ${isResolved}`);
    
    const adminToken = getAdminToken(getUserToken);
    
    if (!adminToken) {
      console.error('❌ [ReportHandling] 管理员token不存在');
      return;
    }

    new ManageReportMessage(adminToken, reportId, isResolved).send(
      (response: string) => {
        console.log('✅ [ReportHandling] 举报状态更新成功:', response);
        handleCloseReportModal();
        onReportUpdated(); // 通知父组件刷新数据
      },
      (error: any) => {
        console.error('❌ [ReportHandling] 举报状态更新失败:', error);
      }
    );
  };

  const handleBanPlayer = (playerId: string, days: number) => {
    playClickSound(SoundUtils);
    console.log(`🔨 [ReportHandling] 封禁玩家 ${playerId} ${days}天`);
    
    const adminToken = getAdminToken(getUserToken);

    new BanUserMessage(adminToken, playerId, days).send(
      (response: string) => {
        console.log('✅ [ReportHandling] 玩家封禁成功:', response);
        
        // 封禁成功后，自动将相关举报标记为已处理
        if (selectedReport) {
          handleResolveReport(selectedReport.reportID, true);
        } else {
          handleCloseReportModal();
        }
      },
      (error: any) => {
        console.error('❌ [ReportHandling] 玩家封禁失败:', error);
      }
    );
  };

  // 过滤举报列表 - 使用正确的属性名和用户名缓存
  const filteredReports = reports.filter(report => {
    const reportingUserName = userNameCache[report.reportingUserID] || report.reportingUserID;
    const reportedUserName = userNameCache[report.reportedUserID] || report.reportedUserID;
    
    return reportingUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           reportedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           report.reportReason.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 计算总页数
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // 确保当前页码在有效范围内
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // 获取当前页的数据
  const currentReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 处理页码变化
  const handlePageChange = (pageNumber: number) => {
    playClickSound(SoundUtils);
    setCurrentPage(pageNumber);
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="reports-section">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载举报记录...</p>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="reports-section">
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button className="retry-btn" onClick={onRefresh}>
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-section">
      <h2>举报列表</h2>
      <div className="admin-data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>举报者</th>
              <th>被举报者</th>
              <th>原因</th>
              <th>日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.map(report => (
              <tr key={report.reportID}>
                <td>{report.reportID.substring(0, 8)}...</td>
                <td>{userNameCache[report.reportingUserID] || report.reportingUserID}</td>
                <td>{userNameCache[report.reportedUserID] || report.reportedUserID}</td>
                <td>{report.reportReason}</td>
                <td>{report.getFormattedTime()}</td>
                <td>
                  <span className={`admin-status-badge ${report.isResolved ? 'admin-status-resolved' : 'admin-status-pending'}`}>
                    {report.getStatusText()}
                  </span>
                </td>
                <td>
                  <button
                    className="admin-action-btn admin-view-btn"
                    onClick={() => handleViewReport(report)}
                  >
                    处理
                  </button>
                </td>
              </tr>
            ))}
            {/* 如果当前页不足10条数据，添加空行保持表格高度一致 */}
            {currentReports.length < itemsPerPage && Array(itemsPerPage - currentReports.length).fill(0).map((_, index) => (
              <tr key={`empty-${index}`} style={{ height: '60px' }}>
                <td colSpan={7}></td>
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

      {/* 举报详情模态框 */}
      {showReportModal && selectedReport && (
        <ReportModal
          selectedReport={selectedReport}
          isReportModalClosing={isReportModalClosing}
          handleCloseReportModal={handleCloseReportModal}
          handleResolveReport={handleResolveReport}
          handleBanPlayer={handleBanPlayer}
          userNameCache={userNameCache}
        />
      )}
    </div>
  );
};

export default ReportHandling;

