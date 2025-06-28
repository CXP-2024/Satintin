import { getCurrentBranch } from 'Plugins/CommonUtils/Functions/ProjectMetaInfo'
import { serviceName } from 'Globals/GlobalVariables'

export function generateKeyPair() {
    const keyUtil = (window as any).__keyUtil
    if (keyUtil) {
        const keyPair = keyUtil.generateKeypair('RSA', 512)
        const privateKeyPem = keyUtil.getPEM(keyPair.prvKeyObj, 'PKCS8PRV')
        const publicKeyPem = keyUtil.getPEM(keyPair.prvKeyObj)
        return { clientPrivate: privateKeyPem, clientPublic: publicKeyPem }
    }
}

export const requireEncryption = () =>
    [/*'master', 'dev',*/ 'feat-demo'].includes(getCurrentBranch()) &&
    ['doctor-panel', 'cs-board'].includes(serviceName)
