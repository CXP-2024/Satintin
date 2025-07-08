import { User } from 'Plugins/UserService/Objects/User';
import { CheatingReport } from 'Plugins/AdminService/Objects/CheatingReport';

export type AdminTab = 'players' | 'reports';

export interface PlayerManagementProps {
  searchTerm: string;
  userList: User[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onUserUpdated: () => void;
}

export interface ReportHandlingProps {
  searchTerm: string;
  reports: CheatingReport[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onReportUpdated: () => void;
} 