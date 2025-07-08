import create from 'zustand';
import { useBattleGameStore } from './battleGameStore';
import { CreateReportMessage } from 'Plugins/AdminService/APIs/CreateReportMessage';

export interface ReportState {
  // 举报功能相关状态
  showReportModal: boolean;
  reportModalExiting: boolean;
  
  // 举报功能相关方法
  openReportModal: () => void;
  closeReportModal: () => void;
  submitReport: (reason: string, description: string) => void;
  resetReportUI: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  // 举报功能相关初始状态
  showReportModal: false,
  reportModalExiting: false,
  
  // 举报功能相关方法
  openReportModal: () => {
    console.log('📝 [ReportStore] 打开举报模态框');
    set({
      showReportModal: true,
      reportModalExiting: false
    });
  },
  
  closeReportModal: () => {
    console.log('📝 [ReportStore] 关闭举报模态框');
    set({ reportModalExiting: true });
    setTimeout(() => {
      set({
        showReportModal: false,
        reportModalExiting: false
      });
    }, 300); // 300ms 退出动画时间
  },
  
  submitReport: (reason: string, description: string) => {
    // 获取对手信息
    const gameStore = useBattleGameStore.getState();
    const opponent = gameStore.opponent;
    const currentPlayer = gameStore.currentPlayer
    
    console.log('📝 [ReportStore] 提交举报:', {
      targetUserId: opponent?.playerId,
      targetUsername: opponent?.username,
      reason,
      description
    });

    const reportreason = reason + ":" + description;

    new CreateReportMessage(currentPlayer?.playerId, opponent?.playerId, reportreason).send(
        (response) => {
          const Info = JSON.parse(response);
          console.log('response:',Info)
        },
        (error) =>{
          console.log(error);
        }
    );
    
    // 这里可以调用API将举报信息发送到服务器
    // TODO: 实际实现API调用
    
    // 关闭模态框
    set({ reportModalExiting: true });
    setTimeout(() => {
      set({
        showReportModal: false,
        reportModalExiting: false
      });
    }, 300);
  },
  
  resetReportUI: () => {
    console.log('📝 [ReportStore] 重置举报UI状态');
    set({
      showReportModal: false,
      reportModalExiting: false
    });
  }
}));

// 创建一个组合 hook，用于处理举报相关的交互
export const useReportActions = () => {
  const reportStore = useReportStore();
  const gameStore = useBattleGameStore();
  
  // 举报玩家函数
  const reportPlayer = (reason: string, description: string) => {
    reportStore.submitReport(reason, description);
  };
  
  return {
    ...reportStore,
    reportPlayer,
    opponent: gameStore.opponent
  };
}; 