import { materialAlertError } from 'Plugins/CommonUtils/Gadgets/AlertGadget'
import { openBackdropGadget } from 'Plugins/CommonUtils/Gadgets/BackdropGadget'
import { commonSend } from 'Plugins/CommonUtils/Send/CommonSend'
import { config } from 'Globals/Config'

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
        return "0.0.0.0"
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
