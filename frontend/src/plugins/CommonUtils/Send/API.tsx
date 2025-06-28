import { materialAlertError } from '../Gadgets/AlertGadget'
import { openBackdropGadget } from '../Gadgets/BackdropGadget'
import { config } from '../../../globals/Config'

export type InfoCallBackType = (info: any) => void
export const backdropInitCallBack = openBackdropGadget
export type ExtraCallBackType = (info: string, status: number) => void
export type SimpleCallBackType = (...args: any) => void
export const alertCallBack = (info: string) => {
    materialAlertError(info, 'error')
    console.error(info)
}

export abstract class API {
    serviceName: string = ''
    public readonly type = this.getName()
    
    public getURL(): string {
        return `${config.protocol ? config.protocol : 'http'}://${this.getAddress()}/api/${this.getRoute()}`
    }

    getAddress(): string {
        return "localhost:3002"
    }

    getRoute(): string {
        return this.type
    }

    private getName() {
        return this.constructor.name
    }
}
