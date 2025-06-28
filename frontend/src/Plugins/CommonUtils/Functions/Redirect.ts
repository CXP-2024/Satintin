import { useHistory } from 'react-router'

export const redirect = (url: string, history: ReturnType<typeof useHistory>) => {
    history.push(url)
}

/**
 * Redirect with path param, 好处是可以在url中看到参数, 刷新页面不会丢失参数
 * @param url
 * @param history
 * @param param
 */
export const redirectWithPathParam = <T extends object>(
    url: string,
    history: ReturnType<typeof useHistory>,
    param: T
) => {
    let str = ''
    Object.entries(param).forEach(([key, value]) => {
        str += `${key}=${value}&`
    })
    str = str.slice(0, -1)
    history.push(`${url}?${str}`)
}

export const redirectWithPara = <T,>(url: string, history: ReturnType<typeof useHistory>, para: T) => {
    history.push({
        pathname: url,
        state: para,
    })
}