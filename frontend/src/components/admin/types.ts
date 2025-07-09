import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';

export interface ReportHandlingProps {
  searchTerm: string;
  reports: CheatingReport[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onReportUpdated: () => void;
}

export interface UserNameCache {
  [key: string]: string;
} 