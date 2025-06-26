import { CSPortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/CSPortalMessage'
import { ClinicPortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/ClinicPortalMessage'
import { WechatPortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/WechatPortalMessage'
import { AppPortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/AppPortalMessage'
import { TongWenPortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/TongWenPortalMessage'
import { DashboardMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/DashboardMessage'
import { PortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export enum ToPortalType {
    toDashboard = 'toDashboard',
    toClinicPortal = 'toClinicPortal',
    toCSPortal = 'toCSPortal',
    toWechatPortal = 'toWechatPortal',
    toAppPortal = 'toAppPortal',
    toTongWenPortal = 'toTongWenPortal',
}

export function getPortalMessage(toPortal: ToPortalType): PortalMessage {
    switch (toPortal) {
        case ToPortalType.toCSPortal:
            return new CSPortalMessage()
        case ToPortalType.toClinicPortal:
            return new ClinicPortalMessage()
        case ToPortalType.toWechatPortal:
            return new WechatPortalMessage()
        case ToPortalType.toAppPortal:
            return new AppPortalMessage()
        case ToPortalType.toTongWenPortal:
            return new TongWenPortalMessage()
        default:
            return new DashboardMessage()
    }
}
