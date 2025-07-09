import { useState, useEffect } from 'react';
import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';
import { UserNameCache } from '../types';

interface UsePaginationProps {
  reports: CheatingReport[];
  searchTerm: string;
  userNameCache: UserNameCache;
  itemsPerPage?: number;
}

export const usePagination = ({ 
  reports, 
  searchTerm, 
  userNameCache,
  itemsPerPage = 10 
}: UsePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤举报列表
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

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    currentReports,
    filteredReports
  };
}; 