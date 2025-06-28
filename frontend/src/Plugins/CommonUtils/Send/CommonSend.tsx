import { closeAlert, materialAlert, materialAlertError } from 'Plugins/CommonUtils/Gadgets/AlertGadget'
import { closeBackdropGadget } from 'Plugins/CommonUtils/Gadgets/BackdropGadget'
import { getNextTestMessage } from 'Plugins/CommonUtils/Send/MockTest'
import { sendMessage } from 'Plugins/CommonUtils/Send/SendMessage'
import { getAutoRedirectTimerSnap, setAutoRedirectTimer } from 'Plugins/CommonUtils/Store/CommonSendStore'
import { getUserIDSnap, setUserInfo, setUserToken, UserInfo } from 'Plugins/CommonUtils/Store/UserInfoStore'
import { alertCallBack, API, InfoCallBackType, SimpleCallBackType } from 'Plugins/CommonUtils/Send/API'

/**
 * -1 白名单： 处理 patientToken失效，不要退掉当前的医生的账号，
 *
 * CheckConsiliaIDMessage  这个是校验   patientToken 是否有效
 * GetRealNameMessage 避免退出登录，是为了让在mm里面，如果输入了错误的医案令牌，就不用再，重新登录的了，其实
 * GetInterventionPlanByConsiliaIDMessage: 获取用户的治疗方案， 这个里面的token应该也是用户的！
 * */
const whitelist = ['CheckConsiliaIDMessage', 'GetRealNameMessage', 'GetInterventionPlanByConsiliaIDMessage']

const retrySubstrings = [
    'akka.stream.StreamTcpException:The connection closed with error: Connection reset by peer',
    'akka.stream.StreamTcpException',
    'The http server closed the connection unexpectedly',
]

export async function commonSend(
    infoMessage: API,
    successCall: InfoCallBackType,
    failureCall: InfoCallBackType = alertCallBack,
    backdropCall: null | SimpleCallBackType = null,
    timeoutCall: null | SimpleCallBackType = null,
    timeout: number = 10000,
    mock: boolean = false,
    isEncrypt: boolean = true, // 是否加密，可以从message力度控制
    tryTimes: number = 1
): Promise<void> {
    if (backdropCall) {
        backdropCall()
    }
    const url = infoMessage.getURL()
    console.log('请求的url ------> ' + url)

    const clearTokenTimeOut = () => {
        const timer = setTimeout(() => {
            closeAlert()
            setUserToken('')
            setUserInfo(new UserInfo())
            setAutoRedirectTimer(null)
        }, 3000)
        setAutoRedirectTimer(timer)
    }

    const checkIsOnRedirecting = () => getAutoRedirectTimerSnap()
    const res = mock
        ? getNextTestMessage(infoMessage.getURL())
        : await sendMessage(infoMessage, timeout, isEncrypt).catch(e => {
              materialAlertError(e)
              // return stringToResponse('')
          })

    if (backdropCall) closeBackdropGadget()

    if (!res) {
        if (timeoutCall) timeoutCall()
        else if (failureCall !== alertCallBack) failureCall('发送信息超时，请检查服务器!')
        else materialAlert('发送信息超时，请检查服务器!')

        console.error(
            '接口超时：' + url.split('/')[url.split('/').length - 1] + '\n',
            '请求参数是:' + JSON.stringify(infoMessage) + '\n'
        )
        return
    }
    const responseText = await res.text()
    console.log('http got: ' + responseText)
    console.log('status= ' + res.status)
    if (res.status === -1 || res.status === -2) {
        for (const substring of retrySubstrings) {
            if (responseText.includes(substring) && tryTimes === 1) {
                await commonSend(
                    infoMessage,
                    successCall,
                    failureCall,
                    backdropCall,
                    timeoutCall,
                    timeout,
                    mock,
                    isEncrypt,
                    2
                )
                return
            }
        }
    }

    switch (res.status) {
        case -3:
            /****************** 已在别的地方登录 *****************/
            if (!checkIsOnRedirecting()) {
                /** 防止多端登录，主repo应该监听token变化，token为空时返回到登录界面 */
                materialAlert(`${responseText}将在3秒后自动跳转到登录页`, 'warning')
                clearTokenTimeOut()
            }
            break
        case -2:
            console.error(
                '接口错误:' + url.split('/')[url.split('/').length - 1] + '\n',
                '错误码是:' + res.status + '\n',
                '请求参数是:' + JSON.stringify(infoMessage) + '\n',
                '错误信息:' + responseText + '\n',
                '用户ID是:' + getUserIDSnap()
            )
            // console.error('接口错误' + url.split('/')[url.split('/').length - 1]+ '\n', res.info)
            /****************** 连接错误 *****************/
            failureCall('连接错误，请稍后重试！')
            break
        case -1:
            /****************** token失效 *****************/
            if (
                responseText === '错误：用户令牌失效/不存在，请重新登录！' ||
                responseText === '错误: 参数错误 userToken 不能为空'
            ) {
                const splitURL = url.split('/')
                const apiName = splitURL[splitURL.length - 1]
                /* 有的请求token失效不重新登录, 因为失效的可能不是医生的token, 而是患者的token */
                if (whitelist.includes(apiName)) {
                    failureCall(responseText)
                    return
                }
                if (!checkIsOnRedirecting()) {
                    failureCall('您的登录凭证已失效，请重新登录。即将为您跳转到登录页。')
                    clearTokenTimeOut()
                    return
                }
            } else if (responseText === '错误：该诊所的注册码错误，请重启设置诊所的服务器！') {
                // setClinicToken('')
            } else failureCall(responseText)
            break
        case 200:
            successCall(responseText)
            break
        case 400:
            console.log('entering failure call')
            failureCall(responseText)
            break
        default:
            materialAlert('返回状态码错误！', 'error')
            break
    }
}
