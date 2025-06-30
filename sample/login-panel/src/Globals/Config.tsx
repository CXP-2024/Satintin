export const slash = navigator.platform.indexOf('Win') > -1 ? '\\' : '/'

// gitlab 配置参数：
// export const gitlaburl = ''
// export const gitlabAccessToken = ''

const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:'
const isElectron =
    typeof window !== 'undefined' &&
    window.process?.type === 'renderer' &&
    window.require

export function getAppPath(argv: string[]): string {
    let p = argv
        .map(arg => {
            if (arg.includes('--app-path')) return arg.substring(11)
            return ''
        })
        .join('')
    if (p.endsWith('resources\\app')) {
        p = p.substring(0, p.length - 14)
        p = p.substring(0, p.lastIndexOf('\\'))
    }
    return p
}

export function readConfig() {
    const outcome: Record<string, any> = {}

    if (isElectron) {
        try {
            const fs = window.require('fs')
            const process = window.require('process')
            const p = getAppPath(process.argv)
            const info: string = fs.readFileSync(p + '/config.json', 'utf8')
            const data = JSON.parse(info)
            outcome.hubURL = data.hubURL
            outcome.protocol = isHttps ? 'https' : 'http'
        } catch (error) {
            alert('Electron 配置读取失败: ' + error)
        }
    } else {
        // Web 默认配置（你可以改成从环境变量或 fetch 读取）
        outcome.hubURL = 'http://localhost:8000'
        outcome.protocol = isHttps ? 'https' : 'http'
    }

    return outcome
}

export const config = readConfig()
