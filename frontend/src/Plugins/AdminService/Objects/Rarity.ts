export enum Rarity {
    common = '普通稀有度',
    rare = '稀有稀有度',
    legendary = '传奇稀有度'
}

export const rarityList = Object.values(Rarity)

export function getRarity(newType: string): Rarity {
    return rarityList.filter(t => t === newType)[0]
}
