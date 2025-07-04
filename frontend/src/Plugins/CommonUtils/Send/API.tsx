import { materialAlertError } from 'Plugins/CommonUtils/Gadgets/AlertGadget'
import { openBackdropGadget } from 'Plugins/CommonUtils/Gadgets/BackdropGadget'
import { commonSend } from 'Plugins/CommonUtils/Send/CommonSend'
import { config_old } from 'Globals/Config'

const config = config_old

export type InfoCallBackType = (info: any) => void
export const backdropInitCallBack = openBackdropGadget
export type ExtraCallBackType = (info: string, status: number) => void
export type SimpleCallBackType = (...args: any) => void
export const alertCallBack = (info: string) => {
    materialAlertError(info, 'error')
    console.error(info)
}

export abstract class API {
    serviceName: string
    public readonly type = this.getName()
    public getURL(): string {
        return `${config.protocol ? config.protocol : 'http'}://${this.getAddress()}/api/${this.getRoute()}`
    }

    getAddress(): string{
        // 根据服务名选择对应的服务URL
        switch(this.serviceName) {
            case 'User':
                return new URL(config.userServiceUrl).host;
            case 'Card':
                return new URL(config.cardServiceUrl).host;
            case 'Admin':
                return new URL(config.adminServiceUrl).host;
            case 'Asset':
                return new URL(config.assetServiceUrl).host;
            case 'Battle':
                return new URL(config.battleServiceUrl).host;
            default:
                return new URL(config.apiBaseUrl).host;
        }
    }

    getRoute(): string {
        return this.type
    }

    private getName() {
        return this.constructor.name
    }
    send(
        successCall: InfoCallBackType,
        failureCall: InfoCallBackType = alertCallBack,
        backdropCall: SimpleCallBackType | null = backdropInitCallBack,
        timeout: number = 1000 * 50,
        timeoutCall: SimpleCallBackType | null = null,
        isEncrypt: boolean = true
    ): void {
        commonSend(this, successCall, failureCall, backdropCall, timeoutCall, timeout, false, isEncrypt).catch(e =>
            console.error(e)
        )
    }
}
