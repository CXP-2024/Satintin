import { replacer } from 'Plugins/CommonUtils/Functions/DeepCopy'

import { MD5 } from 'crypto-js'
import { requireEncryption } from 'Plugins/CommonUtils/Encryption/EncryptionUtils'
import { encrypt } from 'Plugins/CommonUtils/Encryption/Encryption'
import { API } from 'Plugins/CommonUtils/Send/API'

export async function sendMessage(
    msg: API,
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

        try {
            fetch(msg.getURL(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Hash': MD5(body).toString(),
                },
                body: body,
                // mode: 'cors', // This tells the browser to treat this request as a CORS request
                // credentials: 'include', // If the server allows credentials (cookies, HTTP auth) for cross-origin requests
            }) //TODO: decrypt part need to be done
                .then(response => {
                    resolve(response)
                    // if (response.ok) {
                    //     return resolve(response)
                    // } else reject('Local service not started！')
                })
                .catch(error => reject(error))
        } catch (e) {
            reject(e)
        }
    })
}

export async function getMessage(url: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
        let status = 0
        const timer = setTimeout(() => {
            if (status === 0) {
                status = 2
                reject('连接已超时！' + url)
            }
        }, timeout)

        fetch(url, {
            method: 'GET',
            headers: {},
        })
            .then(response => {
                if (response.ok) {
                    return response.json()
                } else {
                    return reject('Local service not started！')
                }
            })
            .then(res => {
                if (status !== 2) {
                    clearTimeout(timer)
                    resolve(res)
                    status = 1
                }
            })
            .catch(error => reject(error))
    })
}
