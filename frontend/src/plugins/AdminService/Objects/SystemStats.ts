/**
 * SystemStats
 * desc: 系统统计信息
 * @param activeUserCount: Int (当前活跃用户数)
 * @param totalMatches: Int (总匹配场次)
 * @param totalCardDraws: Int (总抽卡次数)
 * @param totalReports: Int (总举报次数)
 * @param snapshotTime: DateTime (统计数据快照时间)
 */
import { Serializable } from '@/plugins/CommonUtils/Send/Serializable'




export class SystemStats extends Serializable {
    constructor(
        public activeUserCount: number,
        public totalMatches: number,
        public totalCardDraws: number,
        public totalReports: number,
        public snapshotTime: number
    ) {
        super()
    }
}


