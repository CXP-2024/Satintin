import { CSPortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/CSPortalMessage'
import { ClinicPortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/ClinicPortalMessage'
import { WechatPortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/WechatPortalMessage'
import { AppPortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/AppPortalMessage'
import { TongWenPortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/TongWenPortalMessage'
import { DashboardMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/DashboardMessage'
import { PortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

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
