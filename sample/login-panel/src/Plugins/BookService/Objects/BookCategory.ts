export enum BookCategory {
    science = '科学',
    literature = '文学',
    history = '历史',
    children = '儿童',
    others = '其他'
}

export const bookCategoryList = Object.values(BookCategory)

export function getBookCategory(newType: string): BookCategory {
    return bookCategoryList.filter(t => t === newType)[0]
}
