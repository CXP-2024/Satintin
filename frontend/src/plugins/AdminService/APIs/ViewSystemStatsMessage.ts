/**
 * ViewSystemStatsMessage
 * desc: 返回当前系统的运营数据统计，包含活跃用户数、对战次数等信息。
 * @param adminToken: String (管理员的身份令牌，用于鉴权操作。)
 * @return systemStats: SystemStats:1039 (系统统计数据，包括活跃用户数、对战次数、抽卡次数、举报总数等。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class ViewSystemStatsMessage extends TongWenMessage {
    constructor(
        public  adminToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}

