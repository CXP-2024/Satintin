// 导入卡牌图片
import nailongImg from '../assets/images/nailong.png';
import gaiyaImg from '../assets/images/gaiya.png';
import mygoImg from '../assets/images/mygo.png';
import jiegeImg from '../assets/images/jiege.png';
import paimengImg from '../assets/images/paimeng.png';
import kunImg from '../assets/images/kun.png';
import manImg from '../assets/images/man.png';
import bingbingImg from '../assets/images/bingbing.png';
import wlmImg from '../assets/images/wlm.png';

// 卡牌图片映射表（基于后端模板ID）
export const CARD_IMAGE_MAP: { [key: string]: string } = {
    'template-ice': bingbingImg,        // 冰 -> bingbing
    'template-wlm': wlmImg,             // wlm -> wlm
    'template-man': manImg,             // man -> man
    'template-kun': kunImg,             // 坤 -> kun
    'template-paimon': paimengImg,      // Paimon -> paimeng
    'template-dragon-nai': nailongImg,  // Dragon Nai -> nailong
    'template-gaia': gaiyaImg,          // 盖亚 -> gaiya
    'template-go': mygoImg,             // Go -> mygo
    'template-jie': jiegeImg,           // 杰哥 -> jiege
};

// 根据卡牌ID获取图片的工具函数
export const getCardImage = (cardId: string): string | null => {
    return CARD_IMAGE_MAP[cardId] || null;
};