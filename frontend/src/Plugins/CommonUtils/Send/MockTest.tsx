import { stringToResponse } from 'Plugins/CommonUtils/Send/Response'

export let testPointer = {} as any
export let testMessage: (url: string, pointer: number) => string = () => ''
testPointer = {}
testMessage = () => ''
export function getNextTestMessage(url: string): Response {
    if (!(url in testPointer)) testPointer[url] = 0
    const answer = testMessage(url, testPointer[url])
    testPointer[url] = testPointer[url] + 1
    // Return a Response object
    return stringToResponse(answer)
}
