import { useState } from 'react';
import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';
import { ViewAllReportsMessage } from 'Plugins/AdminService/APIs/ViewAllReportsMessage';
import { getUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";

export const useAdminReports = () => {
  const [reports, setReports] = useState<CheatingReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const loadReports = () => {
    setReportsLoading(true);
    setReportsError(null);

    const adminToken = getUserToken();
    
    if (!adminToken) {
      setReportsError('管理员token不存在，请重新登录');
      setReportsLoading(false);
      return;
    }

    console.log('📋 [AdminDashboard] 开始加载举报记录，使用token:', adminToken);
    
    new ViewAllReportsMessage(adminToken).send(
      (response: string) => {
        try {
          console.log('📋 [AdminDashboard] 原始响应:', response);
          
          let firstParse = JSON.parse(response);
          console.log('📋 [AdminDashboard] 第一次解析结果:', firstParse);
          console.log('📋 [AdminDashboard] 第一次解析类型:', typeof firstParse);
          
          let reportData = firstParse;
          if (typeof firstParse === 'string') {
            reportData = JSON.parse(firstParse);
            console.log('📋 [AdminDashboard] 第二次解析结果:', reportData);
          }
          
          console.log('📋 [AdminDashboard] 最终数据类型:', typeof reportData);
          console.log('📋 [AdminDashboard] 是否为数组:', Array.isArray(reportData));
          
          if (!Array.isArray(reportData)) {
            throw new Error(`期望数组，但得到: ${typeof reportData}`);
          }
          
          const reportObjects = reportData.map((data: any) => 
            new CheatingReport(
              data.reportID,
              data.reportingUserID,
              data.reportedUserID,
              data.reportReason,
              data.isResolved,
              data.reportTime
            )
          );
          
          console.log('📋 [AdminDashboard] 成功创建举报对象:', reportObjects);
          setReports(reportObjects);
          setReportsLoading(false);
        } catch (error) {
          console.error('❌ [AdminDashboard] 解析举报数据失败:', error);
          setReportsError('解析举报数据失败');
          setReportsLoading(false);
        }
      },
      (error: any) => {
        console.error('❌ [AdminDashboard] 获取举报记录失败:', error);
        setReportsError('获取举报记录失败');
        setReportsLoading(false);
      }
    );
  };

  return {
    reports,
    reportsLoading,
    reportsError,
    loadReports
  };
}; 