import { closeAlert, materialAlert, materialAlertError } from '../Gadgets/AlertGadget'
import { closeBackdropGadget } from '../Gadgets/BackdropGadget'
import { getNextTestMessage } from './MockTest'
import { sendMessage } from './SendMessage_New'
import { getAutoRedirectTimerSnap, setAutoRedirectTimer } from '../Store/CommonSendStore'
import { getUserIDSnap, setUserInfo, setUserToken, UserInfo } from '../Store/UserInfoStore'
import { alertCallBack, API, InfoCallBackType, SimpleCallBackType } from './API'

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
        }, 3000) as unknown as number
        setAutoRedirectTimer(timer)
    }

    const checkIsOnRedirecting = () => getAutoRedirectTimerSnap()
    const res = mock
        ? getNextTestMessage(infoMessage.getURL())
        : await sendMessage(infoMessage, timeout, isEncrypt).catch((e: any) => {
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
    
    // 修复：处理500等HTTP错误状态码
    if (res.status >= 400) {
        console.error(`HTTP错误 ${res.status}:`, responseText);
        
        // 特殊处理用户名已存在的500错误
        if (res.status === 500) {
            // 增强乱码检测逻辑 - 检测更多乱码模式
            const garbledPatterns = [
                '锟', '矫', '斤拷', '锟斤拷', '锟矫', '伙拷', '窖达', '锟窖', '达拷',
                'ï¿½', '�', '\uFFFD', // Unicode 替换字符
                'IllegalArgumentException', // 异常类型
                'DidRollbackException' // 回滚异常
            ];
            
            // 检查用户名冲突的关键词
            const usernameConflictKeywords = [
                '用户名已存在', '用户名', 'username', 'already exists', 'duplicate',
                'USERNAME_ALREADY_EXISTS', 'user already exists'
            ];
            
            // 更强的乱码检测
            const hasGarbledText = garbledPatterns.some(pattern => 
                responseText.includes(pattern) || responseText.toLowerCase().includes(pattern.toLowerCase())
            );
            
            // 检测用户名冲突关键词
            const hasUsernameConflict = usernameConflictKeywords.some(keyword =>
                responseText.toLowerCase().includes(keyword.toLowerCase())
            );
            
            // 特殊处理：如果是500错误且包含IllegalArgumentException，很可能是用户名冲突
            const isLikelyUsernameConflict = responseText.includes('IllegalArgumentException') || 
                                           responseText.includes('DidRollbackException') ||
                                           hasGarbledText;
            
            console.log('🔍 [CommonSend] 500错误分析:', {
                hasGarbledText,
                hasUsernameConflict,
                isLikelyUsernameConflict,
                responseText: responseText.substring(0, 200) // 只打印前200个字符
            });
            
            if (hasGarbledText || hasUsernameConflict || isLikelyUsernameConflict) {
                failureCall('用户名已存在，请选择其他用户名');
            } else {
                failureCall(`服务器内部错误：${responseText || '请稍后重试'}`);
            }
        } else if (res.status === 400) {
            // 处理400错误，可能也包含用户名冲突
            if (responseText.includes('用户名') || responseText.includes('username') || responseText.includes('已存在')) {
                failureCall('用户名已存在，请选择其他用户名');
            } else {
                failureCall(`请求错误：${responseText || '请检查输入信息'}`);
            }
        } else {
            failureCall(`HTTP ${res.status}: ${responseText || res.statusText || '请求失败'}`);
        }
        return;
    }
    
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
            // 修复：确保所有未处理的状态码都调用失败回调
            console.error('未处理的状态码:', res.status, responseText);
            failureCall(`未知错误 (${res.status}): ${responseText || '请稍后重试'}`);
            break
    }
}
