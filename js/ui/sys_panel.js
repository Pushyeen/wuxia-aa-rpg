// js/ui/sys_panel.js
import { GameState } from '../systems/state.js';
import { DB_ITEMS } from '../data/db_items.js';
import { DB_SKILLS } from '../data/db_skills.js';
import { AvatarUI } from './avatar.js'; 
import { DB_INTERNAL } from '../data/db_internal.js';
import { MeridianUI } from './meridian_ui.js'; // 引入經脈 UI

export const SysPanel = {
    currentTab: 'status',
    el: null,
    vfx: null,
    logger: null,

    init(deps) {
        this.el = document.getElementById('sys-content');
        this.vfx = deps.vfx;
        this.logger = deps.logger;

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
        
        // 裝備加成
        Object.values(p.equips).forEach(eqId => {
            if (!eqId) return;
            let item = DB_ITEMS[eqId];
            if (item) {
                if(item.atk) p.atk += item.atk; 
                if(item.def) p.def += item.def; 
                if(item.agi) p.agi += item.agi; 
                if(item.maxHp) p.maxHp += item.maxHp;
            }
        });

        // 內功經脈加成
        if (p.internal && p.internal.active) {
            let activeArtId = p.internal.active;
            let art = DB_INTERNAL[activeArtId];
            let nodesUnlocked = p.internal.progress[activeArtId] || 0;
            if (art && art.buff) {
                if(art.buff.hp) p.maxHp += art.buff.hp * nodesUnlocked;
                if(art.buff.atk) p.atk += art.buff.atk * nodesUnlocked;
                if(art.buff.def) p.def += art.buff.def * nodesUnlocked;
                if(art.buff.agi) p.agi += art.buff.agi * nodesUnlocked;
            }
            
            // 異常狀態懲罰
            if (p.internal.status.poisoned) {
                p.atk = Math.floor(p.atk * 0.7);
                p.def = Math.floor(p.def * 0.7);
            }
            if (p.internal.status.injured) {
                p.maxHp = Math.floor(p.maxHp * 0.5);
                p.agi = Math.floor(p.agi * 0.5);
            }
        }

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
            html = `<div style="line-height:2.2; font-size:16px;">
                <div>【氣血】 <span style="color:#ff5555">${p.hp} / ${p.maxHp}</span></div>
                <div>【攻擊】 <span style="color:#ffffff">${p.atk}</span></div>
                <div>【防禦】 <span style="color:#ffffff">${p.def}</span></div>
                <div>【輕功】 <span style="color:#ffffff">${p.agi}</span></div>
                <hr style="border: 0; border-bottom: 1px dotted #555; margin:15px 0;">
                <div style="color:#aaaaaa; font-size:14px;">※敏捷(輕功)決定戰鬥時的出招頻率。</div>
                <div style="color:#aaaaaa; font-size:14px;">※目前修為：<span style="color:#55ffff">${p.exp}</span> 點。</div>
            </div>`;
        } 
        else if (this.currentTab === 'equip') {
            html += `<div style="color:#ffff55; margin-bottom:10px; font-weight:bold;">＜目前裝備＞</div>`;
            ['weapon', 'armor'].forEach(slot => {
                let eqId = p.equips[slot];
                let name = (eqId && DB_ITEMS[eqId]) ? DB_ITEMS[eqId].name : "空";
                html += `<div class="list-item"><span>【${slot === 'weapon' ? '武器' : '防具'}】 ${name}</span>`;
                if(eqId) html += `<button class="sys-btn action-unequip" data-slot="${slot}">卸下</button>`;
                html += `</div>`;
            });

            html += `<div style="color:#aaaaaa; margin:15px 0 10px 0; font-weight:bold;">＜背包裝備＞</div>`;
            p.inventory.forEach((itemId, idx) => {
                let item = DB_ITEMS[itemId];
                if (item && (item.type === 'weapon' || item.type === 'armor')) {
                    html += `<div class="list-item"><span>${item.name} <span style="font-size:12px;color:#888">(${item.desc})</span></span>
                             <button class="sys-btn action-equip" data-idx="${idx}">裝備</button></div>`;
                }
            });
        }
        else if (this.currentTab === 'item') {
            p.inventory.forEach((itemId, idx) => {
                let item = DB_ITEMS[itemId];
                if (item && item.type === 'consumable') {
                    html += `<div class="list-item"><span>${item.name} <span style="font-size:12px;color:#888">(${item.desc})</span></span>
                             <button class="sys-btn action-use" data-idx="${idx}">使用</button></div>`;
                }
            });
            if (html === '') html = "<div style='color:#888;'>背包裡沒有可用道具。</div>";
        }
        else if (this.currentTab === 'skill') {
            html += `<div style="color:#ffff55; margin-bottom:5px; font-weight:bold;">＜已學武功＞ (標記 [參戰] 生效)</div>`;
            html += `<div style="color:#888; font-size:12px; margin-bottom:15px;">※戰鬥時，將從參戰的武功中隨機施展。</div>`;
            
            p.skills.forEach(skillId => {
                let skill = DB_SKILLS[skillId];
                if (!skill) return;
                
                let isActive = p.activeSkills.includes(skillId);
                let hitText = skill.hits ? `${skill.hits}連擊` : `隨機連擊`;
                let bgStyle = isActive ? 'background:#000044;' : 'transparent';
                
                html += `<div class="list-item" style="flex-wrap:wrap; ${bgStyle}">
                            <div style="width: 50%; color:${isActive ? '#55ffff' : '#888888'}; font-weight:bold;">
                                ${isActive ? '[參戰]' : '[待命]'} ${skill.name}
                            </div>
                            <div style="width: 50%; text-align: right;">
                                <button class="sys-btn action-toggle-skill" style="${isActive ? 'color:#ff5555; border-color:#ff5555;' : ''}" data-id="${skillId}">${isActive ? '取消' : '配置'}</button>
                                <button class="sys-btn action-preview-vfx" style="border-color:#ffff55; color:#ffff55;" data-vfx="${skill.vfx}">展演</button>
                            </div>
                            <div style="width:100%; font-size:12px; color:#888; margin-top:6px;">[${hitText}] 威力:${skill.power} | ${skill.msg}</div>
                         </div>`;
            });
        }
        else if (this.currentTab === 'train') {
            html = `<div style="margin-bottom:15px; color:#aaaaaa;">消耗修為提升基礎屬性。</div>
                    <div class="list-item"><span>基礎攻擊 (+5)</span> <button class="sys-btn action-train" data-stat="atk">花費 50 經驗</button></div>
                    <div class="list-item"><span>基礎氣血 (+50)</span> <button class="sys-btn action-train" data-stat="hp">花費 50 經驗</button></div>
                    <div class="list-item"><span>基礎輕功 (+5)</span> <button class="sys-btn action-train" data-stat="agi">花費 80 經驗</button></div>
                    
                    <hr style="border: 0; border-bottom: 1px dotted #555; margin:15px 0;">
                    <div style="color:#ffff55; margin-bottom:10px; font-weight:bold;">＜內功心法修練＞</div>
                    <div style="text-align:center; margin-bottom:10px;">
                        <button class="sys-btn" id="btn-meridian" style="width:100%; padding:8px; font-weight:bold; color:#55ffff;">【周天運轉】開啟經脈圖</button>
                    </div>`;
                    
            ['art_yang', 'art_yin', 'art_taiji'].forEach(artId => {
                let art = DB_INTERNAL[artId];
                if(!art) return;
                let progress = p.internal.progress[artId] || 0;
                let max = art.path.length;
                let isActive = p.internal.active === artId;
                let bgStyle = isActive ? 'background:#000044;' : 'transparent';
                
                html += `<div class="list-item" style="${bgStyle}">
                            <div style="width: 50%;">
                                <div style="color:${art.color}; font-weight:bold;">${isActive ? '[運轉中]' : ''} ${art.name}</div>
                                <div style="font-size:12px; color:#888;">境界: ${progress} / ${max}</div>
                            </div>
                            <div style="width: 50%; text-align: right;">
                                <button class="sys-btn action-train-art" data-art="${artId}" ${progress >= max ? 'disabled' : ''}>衝穴</button>
                                <button class="sys-btn action-equip-art" data-art="${artId}" style="${isActive ? 'color:#ff5555; border-color:#ff5555;' : ''}">${isActive ? '卸下' : '運轉'}</button>
                            </div>
                         </div>`;
            });

            html += `<div style="margin-top:15px; text-align:right; font-size:12px; color:#888;">
                        [劇本測試] 
                        <button class="sys-btn action-toggle-status" data-status="poisoned" style="${p.internal.status.poisoned ? 'color:#55ff55' : ''}">中毒</button>
                        <button class="sys-btn action-toggle-status" data-status="injured" style="${p.internal.status.injured ? 'color:#ff5555' : ''}">內傷</button>
                     </div>`;
        }

        this.el.innerHTML = html;
        this.bindEvents(); 
    },

    bindEvents() {
        this.el.querySelectorAll('.action-equip').forEach(btn => btn.onclick = () => this.equip(parseInt(btn.getAttribute('data-idx'))));
        this.el.querySelectorAll('.action-unequip').forEach(btn => btn.onclick = () => this.unequip(btn.getAttribute('data-slot')));
        this.el.querySelectorAll('.action-use').forEach(btn => btn.onclick = () => this.useItem(parseInt(btn.getAttribute('data-idx'))));
        this.el.querySelectorAll('.action-toggle-skill').forEach(btn => btn.onclick = () => this.toggleSkill(btn.getAttribute('data-id')));
        this.el.querySelectorAll('.action-preview-vfx').forEach(btn => btn.onclick = () => this.previewSkill(btn.getAttribute('data-vfx')));
        this.el.querySelectorAll('.action-train').forEach(btn => btn.onclick = () => this.train(btn.getAttribute('data-stat')));

        // 經脈系統專屬按鈕
        let btnMeridian = this.el.querySelector('#btn-meridian');
        if (btnMeridian) btnMeridian.onclick = () => MeridianUI.toggle();

        this.el.querySelectorAll('.action-train-art').forEach(btn => {
            btn.onclick = () => {
                let artId = btn.getAttribute('data-art');
                if (GameState.player.exp < 100) {
                    if(this.logger) this.logger.add("修為不足以打通穴位！需要 100 點。", "warn-msg");
                    return;
                }
                GameState.player.exp -= 100;
                GameState.player.internal.progress[artId] = (GameState.player.internal.progress[artId] || 0) + 1;
                if(this.logger) this.logger.add(`【${DB_INTERNAL[artId].name}】突破！真氣貫通新穴位！`, "story-msg");
                this.render();
                MeridianUI.updateNodesStatic(); 
            };
        });

        this.el.querySelectorAll('.action-equip-art').forEach(btn => {
            btn.onclick = () => {
                let artId = btn.getAttribute('data-art');
                if (GameState.player.internal.active === artId) {
                    GameState.player.internal.active = null;
                    if(this.logger) this.logger.add(`停止運轉【${DB_INTERNAL[artId].name}】。`, "sys-msg");
                } else {
                    GameState.player.internal.active = artId;
                    if(this.logger) this.logger.add(`開始運轉【${DB_INTERNAL[artId].name}】！真氣流轉全身！`, "story-msg");
                }
                this.render();
                MeridianUI.updateNodesStatic();
                MeridianUI.flowIdx = 0; 
            };
        });

        this.el.querySelectorAll('.action-toggle-status').forEach(btn => {
            btn.onclick = () => {
                let status = btn.getAttribute('data-status');
                GameState.player.internal.status[status] = !GameState.player.internal.status[status];
                if(this.logger) this.logger.add(`觸發狀態異常：${status} = ${GameState.player.internal.status[status]}`, "warn-msg");
                this.render();
                MeridianUI.updateNodesStatic();
            };
        });
    },

    equip(invIdx) {
        let itemId = GameState.player.inventory[invIdx];
        let item = DB_ITEMS[itemId];
        let slot = item.type; 
        if (GameState.player.equips[slot]) GameState.player.inventory.push(GameState.player.equips[slot]);
        GameState.player.equips[slot] = itemId;
        GameState.player.inventory.splice(invIdx, 1);
        if(this.logger) this.logger.add(`裝備了 ${item.name}。`);
        this.render();
        if (AvatarUI) AvatarUI.renderToDOM(); 
    },

    unequip(slot) {
        if (!GameState.player.equips[slot]) return;
        GameState.player.inventory.push(GameState.player.equips[slot]);
        if(this.logger) this.logger.add(`卸下了 ${DB_ITEMS[GameState.player.equips[slot]].name}。`);
        GameState.player.equips[slot] = null;
        this.render();
        if (AvatarUI) AvatarUI.renderToDOM();
    },

    useItem(invIdx) {
        let itemId = GameState.player.inventory[invIdx];
        let item = DB_ITEMS[itemId];
        if (item && item.action) item.action(GameState.player, this.logger); 
        GameState.player.inventory.splice(invIdx, 1);
        this.render();
    },

    toggleSkill(skillId) {
        let p = GameState.player;
        let idx = p.activeSkills.indexOf(skillId);
        if (idx > -1) { 
            if (p.activeSkills.length > 1) p.activeSkills.splice(idx, 1); 
            else if(this.logger) this.logger.add("至少需要配置一項武功才能防身！", "warn-msg");
        } else {
            p.activeSkills.push(skillId);
        }
        this.render();
    },

    previewSkill(vfxId) {
        if (!this.vfx) return;
        let startX = window.innerWidth / 2, startY = window.innerHeight / 2 + 100;
        let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2 - 100;
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
        if (stat === 'agi') { GameState.player.baseAgi += 5; if(this.logger) this.logger.add("修練成功！基礎輕功提升！"); }
        this.render();
    }
};