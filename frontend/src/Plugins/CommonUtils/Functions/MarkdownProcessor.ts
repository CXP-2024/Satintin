/**
 * 从 Markdown 字符串中移除所有代码块标记
 * @param markdown - 要处理的 Markdown 字符串
 * @returns 移除代码块标记后的 Markdown 字符串
 */
export function removeCodeBlockMarkers(markdown: string): string {
    if (!markdown) {
        return markdown
    }

    return markdown.replace(/```[\w-]*\n|```/g, '')
}
