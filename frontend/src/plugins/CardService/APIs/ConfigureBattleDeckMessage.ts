/**
 * ConfigureBattleDeckMessage
 * desc: 根据玩家选择的卡牌，设置最多三张卡为对战卡组。
 * @param userToken: String (用户认证的令牌，用于验证用户身份。)
 * @param cardIDs: String (卡牌ID列表，包含用户选择的卡牌。)
 * @return result: String (卡组配置的操作结果信息，例如'战斗卡组设置成功！')
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class ConfigureBattleDeckMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  cardIDs: string[]
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10011"
    }
}

