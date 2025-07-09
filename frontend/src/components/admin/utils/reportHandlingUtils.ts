import { SoundUtils } from 'utils/soundUtils';
import { BanUserMessage } from "Plugins/AdminService/APIs/BanUserMessage";
import { ManageReportMessage } from "Plugins/AdminService/APIs/ManageReportMessage";
import { getUserToken } from "Plugins/CommonUtils/Store/UserInfoStore";
import { playClickSound, getAdminToken } from '../reportUtils';

export const handleResolveReport = (
  reportId: string, 
  isResolved: boolean = true,
  onSuccess: () => void,
  onError?: (error: any) => void
) => {
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
      onSuccess();
    },
    (error: any) => {
      console.error('❌ [ReportHandling] 举报状态更新失败:', error);
      onError?.(error);
    }
  );
};

export const handleBanPlayer = (
  playerId: string, 
  days: number,
  onSuccess: () => void,
  onError?: (error: any) => void
) => {
  playClickSound(SoundUtils);
  console.log(`🔨 [ReportHandling] 封禁玩家 ${playerId} ${days}天`);
  
  const adminToken = getAdminToken(getUserToken);

  new BanUserMessage(adminToken, playerId, days).send(
    (response: string) => {
      console.log('✅ [ReportHandling] 玩家封禁成功:', response);
      onSuccess();
    },
    (error: any) => {
      console.error('❌ [ReportHandling] 玩家封禁失败:', error);
      onError?.(error);
    }
  );
}; 