import { randomString } from 'Plugins/CommonUtils/Functions/StringUtils'
import { AES, enc } from 'crypto-js'
import { getPrivateKeySnap } from 'Plugins/CommonUtils/Encryption/EncryptionStore'

const serverPublic =
    '-----BEGIN PUBLIC KEY-----\n' +
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDIOsEIppBDJxyC1ezBS7nyL7a7\n' +
    'OI7rsVdZklsN3+3vgJqTZhvG5RHCXNrKXLEn1F/CxRLDZ27u0JRVUNE5LAq2TxJv\n' +
    'u1wnHq26OTneASQN7B0DXsiELSKNY03EebpKiUyRbSSRjYshFG2S8SziuQH0K0JY\n' +
    'W27QBNocbCS89RLCJQIDAQAB\n' +
    '-----END PUBLIC KEY-----'

const keyUtil = (window as any).__keyUtil

export function encrypt(text: string, publicKeyPem: string = serverPublic): string {
    const aesKey: string = randomString(16)
    //使用这个随机秘钥进行加密
    const newKey = enc.Utf8.parse(aesKey)
    const newIv = enc.Utf8.parse(aesKey)
    const encryptText: string = AES.encrypt(text, newKey, { iv: newIv }).toString()
    //把密文长度加进来，然后把秘钥使用RSA加密传输
    const publicKey = keyUtil.getKey(publicKeyPem)

    return encryptText.length + ',' + encryptText + (window as any).__hex2b64(publicKey.encrypt(aesKey))
}

export function decrypt(data: string, privateKeyPem: string = getPrivateKeySnap()): string {
    //找到逗号的位置
    const pos = data.indexOf(',')
    //把密文长度找到
    const len = Number.parseInt(data.substring(0, pos))
    //把密文找到
    const encryptText = data.substring(pos + 1, pos + 1 + len)
    //后面是加密之后的秘钥
    const encryptKey = data.substring(pos + 1 + len)

    const privateKey = keyUtil.getKey(privateKeyPem)

    const aesKey = privateKey.decrypt((window as any).__b64toHex(encryptKey))

    const newKey = enc.Utf8.parse(aesKey)
    const newIv = enc.Utf8.parse(aesKey)

    return enc.Utf8.stringify(AES.decrypt(encryptText, newKey, { iv: newIv }))
}
