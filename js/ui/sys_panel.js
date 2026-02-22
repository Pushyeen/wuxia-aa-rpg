// js/ui/sys_panel.js
import { GameState } from '../systems/state.js';
import { DB_ITEMS } from '../data/db_items.js';
import { DB_SKILLS } from '../data/db_skills.js';

export const SysPanel = {
    currentTab: 'status',
    el: null,
    vfx: null,
    logger: null,

    init(deps) {
        this.el = document.getElementById('sys-content');
        this.vfx = deps.vfx;
        this.logger = deps.logger;

        // 綁定上方標籤切換
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.getAttribute('data-tab');
                this.render();
            });
        });
    },

    updateStats() {
        let p = GameState.player;
        p.maxHp = p.baseMaxHp; 
        p.atk = p.baseAtk; 
        p.def = p.baseDef; 
        p.agi = p.baseAgi;
        
        Object.values(p.equips).forEach(eqId => {
            if (!eqId) return;
            let item = DB_ITEMS[eqId];
            if (item) {
                if(item.atk) p.atk += item.atk; 
                if(item.def) p.def += item.def; 
                if(item.agi) p.agi += item.agi; // 裝備可以改變敏捷
                if(item.maxHp) p.maxHp += item.maxHp;
            }
        });

        if (p.hp > p.maxHp) p.hp = p.maxHp;

        const hpEl = document.getElementById('ui-hp');
        const lvEl = document.getElementById('ui-lv');
        const expEl = document.getElementById('ui-exp');
        if(hpEl) hpEl.innerText = `${p.hp}/${p.maxHp}`;
        if(lvEl) lvEl.innerText = p.lv;
        if(expEl) expEl.innerText = p.exp;
    },

    render() {
        this.updateStats();
        let html = ''; 
        let p = GameState.player;
        
        if (this.currentTab === 'status') {
            html = `<div style="line-height:2;">
                <div>❤️ 氣血：<span style="color:#ff5555">${p.hp} / ${p.maxHp}</span></div>
                <div>⚔️ 攻擊：<span style="color:#fff">${p.atk}</span></div>
                <div>🛡️ 防禦：<span style="color:#fff">${p.def}</span></div>
                <div>💨 輕功：<span style="color:#fff">${p.agi}</span></div>
                <hr style="border-color:#334; margin:10px 0;">
                <div style="color:#888;">敏捷(輕功)決定戰鬥時的出招頻率。<br>目前修為：<span style="color:#55aaff">${p.exp}</span> 點。</div>
            </div>`;
        } 
        else if (this.currentTab === 'equip') {
            html += `<div style="color:#ffdd55; margin-bottom:10px;">[目前裝備] (會改變外觀)</div>`;
            ['weapon', 'armor'].forEach(slot => {
                let eqId = p.equips[slot];
                let name = (eqId && DB_ITEMS[eqId]) ? DB_ITEMS[eqId].name : "空";
                html += `<div class="list-item"><span>${slot === 'weapon' ? '武器' : '防具'}: ${name}</span>`;
                if(eqId) html += `<button class="sys-btn action-unequip" data-slot="${slot}">卸下</button>`;
                html += `</div>`;
            });

            html += `<hr style="border-color:#334; margin:10px 0;"><div style="color:#aaa;">[背包裝備]</div>`;
            p.inventory.forEach((itemId, idx) => {
                let item = DB_ITEMS[itemId];
                if (item && (item.type === 'weapon' || item.type === 'armor')) {
                    html += `<div class="list-item"><span>${item.name} <span style="font-size:10px;color:#888">(${item.desc})</span></span>
                             <button class="sys-btn action-equip" data-idx="${idx}">裝備</button></div>`;
                }
            });
        }
        else if (this.currentTab === 'item') {
            p.inventory.forEach((itemId, idx) => {
                let item = DB_ITEMS[itemId];
                if (item && item.type === 'consumable') {
                    html += `<div class="list-item"><span>${item.name} <span style="font-size:10px;color:#888">(${item.desc})</span></span>
                             <button class="sys-btn action-use" data-idx="${idx}">使用</button></div>`;
                }
            });
            if (html === '') html = "背包裡沒有可用道具。";
        }
        else if (this.currentTab === 'skill') {
            html += `<div style="color:#ffdd55; margin-bottom:5px;">[已學武功] (打勾代表參戰)</div>`;
            html += `<div style="color:#888; font-size:11px; margin-bottom:10px;">戰鬥時，將從打勾的武功中隨機施展。</div>`;
            
            p.skills.forEach(skillId => {
                let skill = DB_SKILLS[skillId];
                if (!skill) return;
                
                // 判斷這招是否在 activeSkills 中
                let isActive = p.activeSkills.includes(skillId);
                let hitText = skill.hits ? `${skill.hits}連擊` : `1~3隨機連擊`;
                
                html += `<div class="list-item" style="flex-wrap:wrap; background:${isActive ? 'rgba(85,170,255,0.1)' : 'transparent'};">
                            <div style="width: 50%;">${isActive ? '✅' : '⬛'} <span style="color:#55aaff; font-weight:bold;">${skill.name}</span></div>
                            <div style="width: 50%; text-align: right;">
                                <button class="sys-btn action-toggle-skill" style="${isActive ? 'background:#551111; color:#ffdddd;' : ''}" data-id="${skillId}">${isActive ? '取消' : '配置'}</button>
                                <button class="sys-btn action-preview-vfx" style="border-color:#ffaa55;" data-vfx="${skill.vfx}">展演</button>
                            </div>
                            <div style="width:100%; font-size:11px; color:#888; margin-top:4px;">[${hitText}] 威力:${skill.power} | ${skill.msg}</div>
                         </div>`;
            });
        }
        else if (this.currentTab === 'train') {
            html = `<div style="margin-bottom:10px; color:#aaa;">消耗修為提升基礎屬性。</div>
                    <div class="list-item"><span>基礎攻擊 (+5)</span> <button class="sys-btn action-train" data-stat="atk">花費 50 經驗</button></div>
                    <div class="list-item"><span>基礎氣血 (+50)</span> <button class="sys-btn action-train" data-stat="hp">花費 50 經驗</button></div>
                    <div class="list-item"><span>基礎輕功 (+5)</span> <button class="sys-btn action-train" data-stat="agi">花費 80 經驗</button></div>`;
        }

        this.el.innerHTML = html;
        this.bindEvents(); 
    },

    bindEvents() {
        this.el.querySelectorAll('.action-equip').forEach(btn => {
            btn.onclick = () => this.equip(parseInt(btn.getAttribute('data-idx')));
        });
        this.el.querySelectorAll('.action-unequip').forEach(btn => {
            btn.onclick = () => this.unequip(btn.getAttribute('data-slot'));
        });
        this.el.querySelectorAll('.action-use').forEach(btn => {
            btn.onclick = () => this.useItem(parseInt(btn.getAttribute('data-idx')));
        });
        this.el.querySelectorAll('.action-toggle-skill').forEach(btn => {
            btn.onclick = () => this.toggleSkill(btn.getAttribute('data-id'));
        });
        this.el.querySelectorAll('.action-preview-vfx').forEach(btn => {
            btn.onclick = () => this.previewSkill(btn.getAttribute('data-vfx'));
        });
        this.el.querySelectorAll('.action-train').forEach(btn => {
            btn.onclick = () => this.train(btn.getAttribute('data-stat'));
        });
    },

    equip(invIdx) {
        let itemId = GameState.player.inventory[invIdx];
        let item = DB_ITEMS[itemId];
        let slot = item.type; 
        
        if (GameState.player.equips[slot]) {
            GameState.player.inventory.push(GameState.player.equips[slot]);
        }
        
        GameState.player.equips[slot] = itemId;
        GameState.player.inventory.splice(invIdx, 1);
        if(this.logger) this.logger.add(`裝備了 ${item.name}。`);
        this.render();
    },

    unequip(slot) {
        if (!GameState.player.equips[slot]) return;
        GameState.player.inventory.push(GameState.player.equips[slot]);
        if(this.logger) this.logger.add(`卸下了 ${DB_ITEMS[GameState.player.equips[slot]].name}。`);
        GameState.player.equips[slot] = null;
        this.render();
    },

    useItem(invIdx) {
        let itemId = GameState.player.inventory[invIdx];
        let item = DB_ITEMS[itemId];
        if (item && item.action) item.action(GameState.player, this.logger); 
        GameState.player.inventory.splice(invIdx, 1);
        this.render();
    },

    // ==========================================
    // 【核心修正】武功配置切換邏輯
    // ==========================================
    toggleSkill(skillId) {
        let p = GameState.player;
        let idx = p.activeSkills.indexOf(skillId);
        
        if (idx > -1) { 
            // 如果已經在陣列裡，代表要「取消」
            if (p.activeSkills.length > 1) {
                p.activeSkills.splice(idx, 1); // 移除
            } else {
                if(this.logger) this.logger.add("行走江湖，至少需要配置一項武功才能防身！", "warn-msg");
            }
        } else {
            // 如果不在陣列裡，代表要「配置」
            p.activeSkills.push(skillId);
        }
        // 重新繪製 UI，更新打勾狀態
        this.render();
    },

    previewSkill(vfxId) {
        if (!this.vfx) return;
        let startX = window.innerWidth / 2;
        let startY = window.innerHeight / 2 + 100;
        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2 - 100;
        this.vfx.play(vfxId, startX, startY, targetX, targetY);
    },

    train(stat) {
        let cost = stat === 'agi' ? 80 : 50;
        if (GameState.player.exp < cost) { 
            if(this.logger) this.logger.add("修為不足以打通經脈。", "warn-msg"); 
            return; 
        }
        GameState.player.exp -= cost;
        if (stat === 'atk') { GameState.player.baseAtk += 5; if(this.logger) this.logger.add("修練成功！基礎攻擊提升！"); }
        if (stat === 'hp') { GameState.player.baseMaxHp += 50; GameState.player.hp += 50; if(this.logger) this.logger.add("修練成功！基礎氣血提升！"); }
        if (stat === 'agi') { GameState.player.baseAgi += 5; if(this.logger) this.logger.add("修練成功！基礎輕功提升！出招變快了！"); }
        this.render();
    }
};