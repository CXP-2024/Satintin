import { requireEncryption } from 'Plugins/CommonUtils/Encryption/EncryptionUtils'
import { encrypt } from 'Plugins/CommonUtils/Encryption/Encryption'
import { replacer } from 'Plugins/CommonUtils/Functions/DeepCopy'
import { MD5 } from 'crypto-js'
import { Message } from 'Plugins/CommonUtils/Send/Serializable'

/** 以普通的方式发送消息 **/
export async function plainSendMessage(
    url: string,
    msg: Message,
    timeout: number,
    isEncrypt: boolean = true // 是否加密，可以从message力度控制
): Promise<Response> {
    const encryption = requireEncryption()
    if (!encryption) {
        // eslint-disable-next-line no-console
        // console.groupCollapsed(`Sending To ${url.split('api/').slice(-1)}`)
        // eslint-disable-next-line no-console
        // console.log(JSON.stringify(msg, replacePassword))
        // eslint-disable-next-line no-console
        // console.groupEnd()
    }

    return new Promise((resolve, reject) => {
        let status = 0
        const timer = setTimeout(() => {
            if (status === 0) {
                status = 2
                reject('连接已超时！')
            }
        }, timeout)

        const body = encryption && isEncrypt ? encrypt(JSON.stringify(msg, replacer)) : JSON.stringify(msg, replacer)

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Hash': MD5(body).toString(),
            },
            body: body,
        })
            .then(response => {
                if (response.ok) {
                    return resolve(response)
                } else reject('Local service not started！')
            })
            .catch(error => reject(error))
    })
}
