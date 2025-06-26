import { BaseApiService } from './BaseApiService';
import { BanUserMessage } from '../plugins/AdminService/APIs/BanUserMessage';
import { UnbanUserMessage } from '../plugins/AdminService/APIs/UnbanUserMessage';
import { ViewSystemStatsMessage } from '../plugins/AdminService/APIs/ViewSystemStatsMessage';
import { ManageReportMessage } from '../plugins/AdminService/APIs/ManageReportMessage';

/**
 * 管理员服务
 * 处理所有管理员相关的API调用
 */
export class AdminService extends BaseApiService {
	constructor() {
		super('http://127.0.0.1:10013'); // AdminService地址
	}

	/**
	 * 封禁用户
	 * @param adminToken 管理员token
	 * @param userID 用户ID
	 * @param banDays 封禁天数
	 * @returns Promise<string>
	 */
	async banUser(adminToken: string, userID: string, banDays: number): Promise<string> {
		const message = new BanUserMessage(adminToken, userID, banDays);
		return this.sendRequest<string>(message);
	}

	/**
	 * 解封用户
	 * @param adminToken 管理员token
	 * @param userID 用户ID
	 * @returns Promise<string>
	 */
	async unbanUser(adminToken: string, userID: string): Promise<string> {
		const message = new UnbanUserMessage(adminToken, userID);
		return this.sendRequest<string>(message);
	}

	/**
	 * 查看系统统计
	 * @param adminToken 管理员token
	 * @returns Promise<SystemStats>
	 */
	async getSystemStats(adminToken: string): Promise<any> {
		const message = new ViewSystemStatsMessage(adminToken);
		return this.sendRequest<any>(message);
	}

	/**
	 * 处理举报
	 * @param adminToken 管理员token
	 * @param reportID 举报ID
	 * @param action 处理动作
	 * @returns Promise<string>
	 */
	async manageReport(adminToken: string, reportID: string, action: string): Promise<string> {
		const message = new ManageReportMessage(adminToken, reportID, action);
		return this.sendRequest<string>(message);
	}
}
