// js/systems/events.js
import { WindowManager } from '../core/window_manager.js';
import { GameState } from './state.js';
// 預留資料庫接口
import { DB_SCRIPTS } from '../data/db_scripts.js';

export const EventEngine = {
    // 依賴注入：讓 main.js 傳入需要的工具
    init(deps) {
        this.vfx = deps.vfx;
        this.logger = deps.logger;
        this.combat = deps.combat;
        this.ui = deps.ui;
    },

    async play(eventId) {
        const evt = DB_SCRIPTS[eventId]; 
        if (!evt) return;
        
        GameState.current = "EVENT"; // 鎖定玩家地圖移動
        if(this.logger) this.logger.add(`觸發事件：${eventId}`, 'story-msg');
        
        await this.executeNodes(evt.nodes);
        
        if (GameState.current === "EVENT") {
            GameState.current = "EXPLORE"; // 解除鎖定
        }
    },

    async executeNodes(nodes) {
        for (let n of nodes) {
            switch (n.type) {
                case "dialogue":
                    await this.showWindow(n.name, n.text, false);
                    break;
                case "choice":
                    await this.showWindow("請選擇", "", n.options);
                    break;
                case "give_item":
                    GameState.player.inventory.push(n.item_id);
                    if(this.logger) this.logger.add(`獲得道具：${n.item_id}`, 'warn-msg');
                    if(this.ui) this.ui.render(); // 更新右側背包
                    break;
                case "set_flag":
                    GameState.flags[n.flag] = n.value;
                    break;
                case "vfx":
                    // 從畫面中央播放特效
                    if(this.vfx) this.vfx.play(n.effect, 600, 400, 200, 200); 
                    break;
                case "battle":
                    // 暫停劇本，進入戰鬥，並等待戰鬥結束
                    if(this.combat) await this.combat.start(n.enemy_id);
                    break;
            }
        }
    },

    showWindow(title, text, options) {
        return new Promise(resolve => {
            let html = `<div style="margin-bottom:15px;">${text}</div>`;
            if (options) {
                options.forEach((opt, idx) => html += `<button class="opt-btn" id="opt-${idx}">> ${opt.label}</button>`);
            } else {
                html += `<button class="opt-btn" id="btn-next">▼ 繼續</button>`;
            }
            
            const win = WindowManager.create(title, html);
            
            if (options) {
                options.forEach((opt, idx) => {
                    win.querySelector(`#opt-${idx}`).onclick = async () => { 
                        win.remove(); 
                        if (opt.nodes) await this.executeNodes(opt.nodes); 
                        resolve(); 
                    };
                });
            } else {
                win.querySelector('#btn-next').onclick = () => { 
                    win.remove(); 
                    resolve(); 
                };
            }
        });
    }
};