import { BaseApiService } from './BaseApiService';

/**
 * 管理员服务 - 简化版本
 * 处理所有管理员相关的API调用
 * 暂时使用模拟数据，避开复杂的Plugins依赖问题
 */
export class AdminService extends BaseApiService {
	constructor() {
		super('http://127.0.0.1:10013'); // AdminService地址
	}

	/**
	 * 封禁用户 - 临时实现
	 * @param adminToken 管理员token
	 * @param userID 用户ID
	 * @param banDays 封禁天数
	 * @returns Promise<string>
	 */
	async banUser(adminToken: string, userID: string, banDays: number): Promise<string> {
		// 临时模拟实现
		console.log('封禁用户:', { adminToken, userID, banDays });
		return Promise.resolve('用户封禁成功！');
	}

	/**
	 * 解封用户 - 临时实现
	 * @param adminToken 管理员token
	 * @param userID 用户ID
	 * @returns Promise<string>
	 */
	async unbanUser(adminToken: string, userID: string): Promise<string> {
		// 临时模拟实现
		console.log('解封用户:', { adminToken, userID });
		return Promise.resolve('用户解封成功！');
	}

	/**
	 * 查看系统统计 - 临时实现
	 * @param adminToken 管理员token
	 * @returns Promise<any>
	 */
	async getSystemStats(adminToken: string): Promise<any> {
		// 临时模拟数据
		console.log('获取系统统计:', { adminToken });
		return Promise.resolve({
			activeUsers: 150,
			totalBattles: 2350,
			totalDraws: 5680
		});
	}

	/**
	 * 处理举报 - 临时实现
	 * @param adminToken 管理员token
	 * @param reportID 举报ID
	 * @param action 处理动作
	 * @returns Promise<string>
	 */
	async manageReport(adminToken: string, reportID: string, action: string): Promise<string> {
		// 临时模拟实现
		console.log('处理举报:', { adminToken, reportID, action });
		return Promise.resolve('举报处理成功！');
	}
}
