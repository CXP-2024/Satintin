import { enc, AES } from 'crypto-js'

const ivKey = '5iW0gAMZBcG5mBSgUjBwXusoPwrr1R870cM9GuD2'
const key = 'aWLhbPTLQxkxTLGhnPbLxSY7jnwOgY5Rznl6VfkK'

export function aesEncrypt(value: string) {
    const newKey = enc.Utf8.parse(key)
    const newIv = enc.Utf8.parse(ivKey)
    return AES.encrypt(value, newKey, { iv: newIv }).toString()
}

export function aesDecrypt(value: string) {
    const newKey = enc.Utf8.parse(key)
    const newIv = enc.Utf8.parse(ivKey)
    const decryptedData = AES.decrypt(value, newKey, { iv: newIv })
    return decryptedData.toString(enc.Utf8)
}
