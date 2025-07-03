/**
 * ServiceConfig
 * 全局服务配置文件，用于管理各个服务的地址
 */

export class ServiceConfig {
	// 基础主机地址
	//private static readonly HOST = '127.0.0.1';
	private static readonly HOST = '59.66.18.59';

	// 各服务端口配置
	private static readonly PORTS = {
		ADMIN_SERVICE: 10013,
		USER_SERVICE: 10010,
		BATTLE_SERVICE: 10014,
		CARD_SERVICE: 10011,
		ASSET_SERVICE: 10012,
	};

	// 获取管理员服务地址
	static getAdminServiceAddress(): string {
		return `${this.HOST}:${this.PORTS.ADMIN_SERVICE}`;
	}

	// 获取用户服务地址
	static getUserServiceAddress(): string {
		return `${this.HOST}:${this.PORTS.USER_SERVICE}`;
	}

	// 获取战斗服务地址
	static getBattleServiceAddress(): string {
		return `${this.HOST}:${this.PORTS.BATTLE_SERVICE}`;
	}

	// 获取卡牌服务地址
	static getCardServiceAddress(): string {
		return `${this.HOST}:${this.PORTS.CARD_SERVICE}`;
	}

	// 获取资产服务地址
	static getAssetServiceAddress(): string {
		return `${this.HOST}:${this.PORTS.ASSET_SERVICE}`;
	}

	// 通用方法：根据端口获取地址
	static getServiceAddress(port: number): string {
		return `${this.HOST}:${port}`;
	}

	// 设置主机地址（用于部署时修改）
	static setHost(newHost: string): void {
		(this as any).HOST = newHost;
	}

	// 获取当前主机地址
	static getHost(): string {
		return this.HOST;
	}
}
