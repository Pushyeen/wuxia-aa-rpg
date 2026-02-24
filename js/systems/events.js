// js/systems/events.js
import { WindowManager } from '../core/window_manager.js';
import { GameState, StatEngine } from './state.js';
import { DB_SCRIPTS } from '../data/db_scripts.js';
import { DB_ITEMS } from '../data/db_items.js'; 

export const EventEngine = {
    init(deps) {
        this.vfx = deps.vfx;
        this.logger = deps.logger;
        this.combat = deps.combat;
        this.ui = deps.ui;
        this.map = deps.map; 
    },

    async play(eventId) {
        const evt = DB_SCRIPTS[eventId]; 
        if (!evt) return;
        
        GameState.current = "EVENT"; 
        
        let nodes = Array.isArray(evt) ? evt : evt.nodes;
        if (nodes) {
            await this.executeNodes(nodes);
        }
        
        if (GameState.current === "EVENT") {
            GameState.current = "EXPLORE"; 
        }
    },

    async executeNodes(nodes) {
        for (let n of nodes) {
            switch (n.type) {
                case "dialogue":
                case "dialog": 
                    let speaker = n.speaker || n.name || "系統";
                    await this.showWindow(speaker, n.text, false);
                    break;
                    
                case "choice":
                    await this.showWindow("請選擇", "", n.options);
                    break;
                    
                case "give_item":
                case "item": 
                    let itemId = n.itemId || n.item_id;
                    let amount = n.amount || 1;
                    for(let i = 0; i < amount; i++) {
                        GameState.player.inventory.push(itemId);
                    }
                    let itemName = DB_ITEMS[itemId] ? DB_ITEMS[itemId].name : itemId;
                    if(this.logger) this.logger.add(`獲得道具：${itemName} x${amount}`, 'warn-msg');
                    if(this.ui) this.ui.render(); 
                    break;
                    
                case "set_flag":
                    if (!GameState.flags) GameState.flags = {};
                    GameState.flags[n.flag] = n.value;
                    break;
                    
                case "vfx":
                    if(this.vfx) this.vfx.play(n.effect, 600, 400, 200, 200); 
                    break;
                    
                case "battle":
                case "combat": 
                    let enemyId = n.enemyId || n.enemy_id;
                    if(this.combat) {
                        let isWin = await this.combat.start(enemyId);
                        if (!isWin) return; 
                    }
                    break;
                    
                case "remove_event": 
                    if (this.map && GameState.currentEventX !== undefined) {
                        this.map.removeEventAt(GameState.currentEventX, GameState.currentEventY);
                    }
                    break;

                case "give_books_if_needed":
                    if (!GameState.flags) GameState.flags = {};
                    if (!GameState.flags.got_books) {
                        GameState.flags.got_books = true;
                        GameState.player.inventory.push("book_all_skills");
                        GameState.player.inventory.push("book_all_internal");
                        if(this.logger) this.logger.add(`獲得道具：無字天書 x2`, 'warn-msg');
                        if(this.ui) this.ui.render();
                    }
                    break;

                case "blacksmith_shop":
                    await this.showBlacksmithShop();
                    break;

                // 【新增】：創角擲骰系統
                case "roll_stats":
                    await this.showRollStatsWindow();
                    break;
            }
        }
    },

    showWindow(title, text, options) {
        return new Promise(resolve => {
            let html = `<div style="margin-bottom:15px; font-size:16px; line-height:1.5;">${text}</div>`;
            if (options) {
                options.forEach((opt, idx) => html += `<button class="sys-btn" id="opt-${idx}" style="display:block; width:100%; margin-bottom:5px;">> ${opt.label}</button>`);
            } else {
                html += `<div style="text-align:right;"><button class="sys-btn" id="btn-next" style="color:#55ffff; border-color:#55ffff;">▼ 繼續</button></div>`;
            }
            
            const win = WindowManager.create(`【${title}】`, html);
            
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
    },

// js/systems/events.js 中的 showBlacksmithShop 函式替換
 // js/systems/events.js 中的 showBlacksmithShop 函式
    showBlacksmithShop() {
        return new Promise(resolve => {
            let html = `<div style="max-height: 350px; overflow-y: auto; margin-bottom: 15px; padding-right: 10px;">`;
            html += `<div style="color:#ffff55; margin-bottom:10px;">請選擇需要的物資（免費無限供應）：</div>`;
            
            for (let key in DB_ITEMS) {
                let item = DB_ITEMS[key];
                
                // 【修改】：允許顯示武器、防具，以及「非天書」的消耗品（如 potion_hp）
                if (item.type === 'weapon' || item.type === 'armor' || (item.type === 'consumable' && !key.includes('book_all'))) {
                    
                    let typeName = '道具';
                    if (item.type === 'weapon') typeName = '武器';
                    else if (item.type === 'armor') typeName = '防具';
                    else if (item.type === 'consumable') typeName = '丹藥';

                    html += `<div class="list-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:5px;">
                                <div style="flex:1;">
                                    <span style="color:#55ffff;">【${typeName}】</span> ${item.name} <br>
                                    <span style="font-size:12px;color:#888;">${item.desc}</span>
                                </div>
                                <div>
                                    <button class="sys-btn action-get-item" data-id="${key}" data-type="${item.type}" style="border-color:#55ff55; color:#55ff55; min-width:60px;">領取</button>
                                </div>
                             </div>`;
                }
            }
            html += `</div>`;
            html += `<div style="text-align:right;"><button class="sys-btn" id="btn-leave-shop" style="color:#ff5555; border-color:#ff5555;">拱手道別</button></div>`;
            
            const win = WindowManager.create(`【鐵匠的軍火庫】`, html);
            
            win.querySelectorAll('.action-get-item').forEach(btn => {
                btn.onclick = () => {
                    let itemId = btn.getAttribute('data-id');
                    let itemType = btn.getAttribute('data-type');
                    
                    GameState.player.inventory.push(itemId);
                    if (this.logger) this.logger.add(`從鐵匠處獲得了 ${DB_ITEMS[itemId].name}！`, "story-msg");
                    if (this.ui) this.ui.render();
                    
                    // 【優化】：裝備領取後變灰，消耗品（丹藥）則提示可以再次領取
                    if (itemType === 'consumable') {
                        btn.innerText = "再次領取";
                    } else {
                        btn.innerText = "已領取";
                        btn.style.color = "#888";
                        btn.style.borderColor = "#555";
                    }
                };
            });
            
            win.querySelector('#btn-leave-shop').onclick = () => {
                win.remove();
                resolve();
            };
        });
    },

// 【修改】：擲骰視窗邏輯更新
    showRollStatsWindow() {
        return new Promise(resolve => {
            // 擲骰函數：將各屬性設定為 1 ~ 100
            const roll = () => {
                let stats = GameState.player.stats;
                const attrKeys = ['brawn', 'physique', 'qiCap', 'qiPot', 'agi', 'dex', 'per', 'comp'];
                attrKeys.forEach(k => {
                    stats[k] = Math.floor(Math.random() * 100) + 1; 
                });
                return stats;
            };

            let currentStats = roll();

            // 生成 HTML 的函數，方便每次重骰後蓋寫畫面
            const renderHtml = () => {
                return `
                    <div style="text-align: center; margin-bottom: 10px; width: 350px;">
                        <div style="font-size: 18px; color: #ffff55; margin-bottom: 15px; font-weight: bold;">天命難測，骨骼清奇</div>
                        <div style="display:flex; flex-wrap:wrap; color:#aaa; font-size: 16px; justify-content: center; gap: 10px; line-height: 1.8;">
                            <div style="width:40%; text-align:right;">臂力: <span style="color:#55ffff; font-weight:bold;">${currentStats.brawn}</span></div>
                            <div style="width:40%; text-align:left;">根骨: <span style="color:#55ffff; font-weight:bold;">${currentStats.physique}</span></div>
                            <div style="width:40%; text-align:right;">內息: <span style="color:#55ffff; font-weight:bold;">${currentStats.qiCap}</span></div>
                            <div style="width:40%; text-align:left;">真元: <span style="color:#55ffff; font-weight:bold;">${currentStats.qiPot}</span></div>
                            <div style="width:40%; text-align:right;">身法: <span style="color:#55ffff; font-weight:bold;">${currentStats.agi}</span></div>
                            <div style="width:40%; text-align:left;">靈巧: <span style="color:#55ffff; font-weight:bold;">${currentStats.dex}</span></div>
                            <div style="width:40%; text-align:right;">洞察: <span style="color:#55ffff; font-weight:bold;">${currentStats.per}</span></div>
                            <div style="width:40%; text-align:left;">悟性: <span style="color:#55ffff; font-weight:bold;">${currentStats.comp}</span></div>
                        </div>
                        <div style="margin-top: 15px; color: #888; font-size: 12px;">(單項屬性區間: 1 ~ 100)</div>
                        <div style="margin-top: 20px; display: flex; justify-content: space-around;">
                            <button class="sys-btn" id="btn-reroll" style="color:#ffaaaa; border-color:#ffaaaa; padding: 8px 16px;">🔄 逆天改命</button>
                            <button class="sys-btn" id="btn-confirm" style="color:#55ff55; border-color:#55ff55; padding: 8px 16px; font-weight:bold;">✅ 踏入江湖</button>
                        </div>
                    </div>
                `;
            };

            const win = WindowManager.create("【角色創建】", renderHtml());

            // 綁定按鈕事件的函數
            const bindEvents = () => {
                let content = win.querySelector('.drag-content');
                
                win.querySelector('#btn-reroll').onclick = () => {
                    currentStats = roll();
                    content.innerHTML = renderHtml();
                    bindEvents(); // 畫面更新後重新綁定按鈕
                };
                
                win.querySelector('#btn-confirm').onclick = () => {
                    win.remove();
                    
                    if(this.ui) {
                        // 確保先更新數值計算出新的最大生命值
                        this.ui.updateStats(); 
                        
                        // 【關鍵修改】：將當前血量補滿至最大血量
                        GameState.player.hp = GameState.player.maxHp; 
                        
                        // 重新渲染畫面使血量顯示正確
                        this.ui.render(); 
                    }
                    resolve();
                };
            };

            bindEvents();
        });
    }
};