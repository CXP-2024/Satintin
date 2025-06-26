/**
 * UpgradeCardMessage
 * desc: 扣减升级资源并将指定卡牌进行升级。
 * @param userToken: String (用户的身份认证令牌)
 * @param cardID: String (需要进行升级的卡牌ID)
 * @return result: String (卡牌升级完成后的提示信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class UpgradeCardMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  cardID: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10011"
    }
}

