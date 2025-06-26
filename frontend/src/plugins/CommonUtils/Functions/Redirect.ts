import { useNavigate } from 'react-router-dom'

export const redirect = (url: string, navigate: ReturnType<typeof useNavigate>) => {
    navigate(url)
}

/**
 * Redirect with path param, 好处是可以在url中看到参数, 刷新页面不会丢失参数
 * @param url
 * @param navigate
 * @param param
 */
export const redirectWithPathParam = <T extends object>(
    url: string,
    navigate: ReturnType<typeof useNavigate>,
    param: T
) => {
    let str = ''
    Object.entries(param).forEach(([key, value]) => {
        str += `${key}=${value}&`
    })
    str = str.slice(0, -1)
    navigate(`${url}?${str}`)
}

export const redirectWithPara = <T,>(url: string, navigate: ReturnType<typeof useNavigate>, para: T) => {
    navigate(url, {
        state: para,
    })
}