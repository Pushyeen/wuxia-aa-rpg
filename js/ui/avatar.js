// js/ui/avatar.js
import { GameState } from '../systems/state.js';
import { DB_ITEMS } from '../data/db_items.js';

export const AvatarUI = {
    el: null,
    frame: 0, // 用來切換動畫影格 (0 或 1)

    init() {
        this.el = document.querySelector('.avatar-aa-box');
        // 每 600 毫秒切換一次影格 (呼吸/眨眼效果)
        setInterval(() => {
            this.frame = 1 - this.frame; 
            this.renderToDOM();
        }, 600);
    },

    // 獲取當前玩家的 AA 字串 (包含裝備)
    getAA() {
        let p = GameState.player;
        let wObj = p.equips.weapon ? DB_ITEMS[p.equips.weapon] : null;
        let aObj = p.equips.armor ? DB_ITEMS[p.equips.armor] : null;
        
        // 讀取裝備的特殊外觀，沒有則顯示空白或預設布衣
        let wIcon = (wObj && wObj.aaIcon) ? wObj.aaIcon : "　";
        let aSkin = (aObj && aObj.aaSkin) ? aObj.aaSkin : "布";
        
        // 動態影格演算
        let eyes = this.frame === 0 ? "・　・" : "－　－"; // 眨眼
        let hands = this.frame === 0 ? `/${wIcon}　ヽ` : `|${wIcon}　 |`; // 手部擺動
        
        return `　/${eyes}ヽ\n　${hands}\n　| ≡[${aSkin}]≡ |`;
    },

    renderToDOM() {
        const aaString = this.getAA();
        // 1. 更新左下角的主 UI
        if (this.el) {
            this.el.innerHTML = `<pre style="margin:0; font-family:'MS PGothic', monospace; line-height:1.2; font-size:18px;">${aaString}</pre>`;
        }
        // 2. 如果正在戰鬥中，同步更新戰鬥視窗內的玩家 AA
        const batAA = document.getElementById('bat-aa-p');
        if (batAA) {
            batAA.innerHTML = aaString;
        }
    }
};