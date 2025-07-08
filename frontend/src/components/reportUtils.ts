import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';

export interface ReportModalProps {
  selectedReport: CheatingReport | null;
  isReportModalClosing: boolean;
  handleCloseReportModal: () => void;
  handleResolveReport: (reportId: string, isResolved: boolean) => void;
  handleBanPlayer: (playerId: string, days: number) => void;
}

export const playClickSound = (SoundUtils: any) => {
  SoundUtils.playClickSound(0.5);
};

export const getAdminToken = (getUserToken: any) => {
  return getUserToken() || localStorage.getItem('adminToken') || '';
};
