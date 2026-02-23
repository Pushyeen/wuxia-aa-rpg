// js/ui/sys_panel.js
import { GameState, StatEngine } from '../systems/state.js';
import { DB_ITEMS } from '../data/db_items.js';
import { DB_SKILLS } from '../data/db_skills.js';
import { AvatarUI } from './avatar.js'; 
import { DB_INTERNAL } from '../data/db_internal.js';
import { MeridianUI } from './meridian_ui.js'; 

// ==========================================
// 分頁控制器模組 (Tab Controllers)
// ==========================================

const TabStatus = {
    render(p) {
        let d = StatEngine.getDerived(p);
        let s = p.stats;
        return `<div style="line-height:1.8; font-size:14px; overflow-y:auto; height:100%;">
            <div class="color-hp" style="font-size:16px;">【氣血】 ${p.hp} / ${p.maxHp}</div>
            <hr style="border: 0; border-bottom: 1px dotted #555; margin:8px 0;">
            <div style="color:#ffff55; font-weight:bold;">＜九大基礎屬性＞</div>
            <div style="display:flex; flex-wrap:wrap; color:#aaa; margin-bottom:10px;">
                <div style="width:50%;">臂力: <span style="color:#fff">${s.brawn}</span></div>
                <div style="width:50%;">根骨: <span style="color:#fff">${s.physique}</span></div>
                <div style="width:50%;">內息: <span style="color:#fff">${s.qiCap}</span></div>
                <div style="width:50%;">真元: <span style="color:#fff">${s.qiPot}</span></div>
                <div style="width:50%;">身法: <span style="color:#fff">${s.agi}</span></div>
                <div style="width:50%;">靈巧: <span style="color:#fff">${s.dex}</span></div>
                <div style="width:50%;">洞察: <span style="color:#fff">${s.per}</span></div>
                <div style="width:50%;">悟性: <span style="color:#fff">${s.comp}</span></div>
            </div>
            <div style="color:#ffff55; font-weight:bold;">＜戰鬥延伸面板＞</div>
            <div style="display:flex; flex-wrap:wrap; color:#aaa;">
                <div style="width:50%;">外功攻擊: <span style="color:#55ffff">${d.pAtk}</span></div>
                <div style="width:50%;">內功威力: <span style="color:#55ffff">${d.qAtk}</span></div>
                <div style="width:50%;">命中/閃避: <span style="color:#55ffff">${d.hit}/${d.dodge}</span></div>
                <div style="width:50%;">爆擊率: <span style="color:#55ffff">${d.critChance}%</span></div>
                <div style="width:50%;">爆傷倍率: <span style="color:#55ffff">${(d.critMult*100).toFixed(0)}%</span></div>
                <div style="width:50%;">外門硬功: <span style="color:#55ffff">${d.fixDef}</span></div>
                <div style="width:50%;">護體真氣: <span style="color:#55ffff">${d.pctDef}%</span></div>
                <div style="width:100%;">極限連擊值: <span style="color:#55ffff">${d.comboMax}</span></div>
            </div>
        </div>`;
    },
    bindEvents(el, panel) { /* 無互動按鈕 */ }
};

const TabInventory = {
    currentCategory: '全部',
    render(p) {
        let html = `<div style="color:#ffff55; margin-bottom:10px; font-weight:bold;">＜身上裝備＞</div>`;
        ['weapon', 'armor'].forEach(slot => {
            let eqId = p.equips[slot];
            let item = eqId ? DB_ITEMS[eqId] : null;
            let name = item ? item.name : "空";
            let desc = item ? `<span style="font-size:12px;color:#888">(${item.desc})</span>` : "";
            html += `<div class="list-item"><span>【${slot === 'weapon' ? '武器' : '防具'}】 ${name} <br>${desc}</span>`;
            if(eqId) html += `<button class="sys-btn action-unequip" data-slot="${slot}">卸下</button>`;
            html += `</div>`;
        });

        html += `<div style="color:#aaaaaa; margin:15px 0 10px 0; font-weight:bold;">＜隨身行囊＞</div>`;

        // 將物品分類打包
        let categories = { '全部': [], '武器': [], '防具': [], '消耗品': [] };
        p.inventory.forEach((itemId, idx) => {
            let item = DB_ITEMS[itemId];
            if (!item) return;
            let data = { id: itemId, idx: idx, item: item };
            categories['全部'].push(data);
            if (item.type === 'weapon') categories['武器'].push(data);
            else if (item.type === 'armor') categories['防具'].push(data);
            else if (item.type === 'consumable') categories['消耗品'].push(data);
        });

        if (!categories[this.currentCategory] || categories[this.currentCategory].length === 0) this.currentCategory = '全部';

        // 渲染次級分頁
        html += `<div style="display:flex; gap:8px; margin-bottom:12px; border-bottom: 1px solid #444; padding-bottom: 6px; overflow-x:auto;">`;
        for (let cat in categories) {
            let isActive = (this.currentCategory === cat);
            let color = isActive ? '#55ffff' : '#888';
            let border = isActive ? 'border-bottom: 2px solid #55ffff;' : 'border-bottom: 2px solid transparent;';
            html += `<div class="inv-subtab" data-cat="${cat}" style="cursor:pointer; padding:2px 4px; color:${color}; font-weight:bold; ${border} transition:all 0.2s;">
                        ${cat} <span style="font-size:10px; color:#555;">(${categories[cat].length})</span>
                     </div>`;
        }
        html += `</div>`;

        // 渲染選中類別的物品
        let itemsToRender = categories[this.currentCategory];
        if (itemsToRender.length === 0) {
            html += "<div style='color:#888;'>此分類下沒有物品。</div>";
        } else {
            itemsToRender.forEach(data => {
                let item = data.item;
                html += `<div class="list-item"><span>${item.name} <br><span style="font-size:12px;color:#888">(${item.desc})</span></span>`;
                if (item.type === 'weapon' || item.type === 'armor') {
                    html += `<button class="sys-btn action-equip" data-idx="${data.idx}">裝備</button>`;
                } else if (item.type === 'consumable') {
                    html += `<button class="sys-btn action-use" data-idx="${data.idx}">使用</button>`;
                }
                html += `</div>`;
            });
        }
        return html;
    },
    bindEvents(el, panel) {
        el.querySelectorAll('.inv-subtab').forEach(tab => tab.onclick = () => { this.currentCategory = tab.getAttribute('data-cat'); panel.render(); });
        el.querySelectorAll('.action-equip').forEach(btn => btn.onclick = () => panel.equip(parseInt(btn.getAttribute('data-idx'))));
        el.querySelectorAll('.action-unequip').forEach(btn => btn.onclick = () => panel.unequip(btn.getAttribute('data-slot')));
        el.querySelectorAll('.action-use').forEach(btn => btn.onclick = () => panel.useItem(parseInt(btn.getAttribute('data-idx'))));
    }
};

const TabSkill = {
    currentCategory: '全部',
    render(p) {
        let html = '';
        if (p.skills.length === 0) return `<div style="color:#888; text-align:center; margin-top: 20px;">目前尚未學會任何武功。</div>`;
        
        let categories = { '全部': [], '拳掌': [], '劍法': [], '暗器': [], '其他': [] };
        p.skills.forEach(skillId => {
            let sk = DB_SKILLS[skillId];
            if (!sk) return;
            categories['全部'].push(skillId);
            if (sk.tags.includes('鈍') || sk.name.includes('拳') || sk.name.includes('掌')) categories['拳掌'].push(skillId);
            else if (sk.tags.includes('劍') || sk.tags.includes('銳') || sk.name.includes('劍')) categories['劍法'].push(skillId);
            else if (sk.tags.includes('牽引') || sk.name.includes('針')) categories['暗器'].push(skillId);
            else categories['其他'].push(skillId);
        });

        if (!categories[this.currentCategory] || categories[this.currentCategory].length === 0) this.currentCategory = '全部';

        html += `<div style="display:flex; gap:8px; margin-bottom:12px; border-bottom: 1px solid #444; padding-bottom: 6px; overflow-x:auto;">`;
        for (let cat in categories) {
            if (categories[cat].length > 0) {
                let isActive = (this.currentCategory === cat);
                let color = isActive ? '#55ffff' : '#888';
                let border = isActive ? 'border-bottom: 2px solid #55ffff;' : 'border-bottom: 2px solid transparent;';
                html += `<div class="skill-subtab" data-cat="${cat}" style="cursor:pointer; padding:2px 4px; color:${color}; font-weight:bold; ${border} transition:all 0.2s;">
                            ${cat} <span style="font-size:10px; color:#555;">(${categories[cat].length})</span>
                         </div>`;
            }
        }
        html += `</div>`;

        categories[this.currentCategory].forEach(skillId => {
            let skill = DB_SKILLS[skillId];
            let isActive = p.activeSkills.includes(skillId);
            let bgStyle = isActive ? 'background:#000044;' : 'transparent';
            let tagsHtml = skill.tags.map(t => {
                let cls = ''; if(t==='寒')cls='ice'; else if(t==='炎')cls='fire'; else if(t==='鈍')cls='blunt'; else if(t==='風')cls='wind'; else if(t==='牽引')cls='pull'; else if(t==='佈置')cls='trap'; else if(t==='絲線')cls='silk'; else if(t==='柔')cls='soft'; else if(t==='Aura')cls='aura';
                return `<span class="tag ${cls}">${t}</span>`;
            }).join('');

            html += `<div class="list-item" style="flex-wrap:wrap; ${bgStyle}">
                        <div style="width: 50%; color:${isActive ? '#55ffff' : '#888888'}; font-weight:bold;">
                            ${isActive ? '[參戰]' : '[待命]'} ${skill.name}
                        </div>
                        <div style="width: 50%; text-align: right;">
                            <button class="sys-btn action-toggle-skill" style="${isActive ? 'color:#ff5555; border-color:#ff5555;' : ''}" data-id="${skillId}">${isActive ? '取消' : '配置'}</button>
                            <button class="sys-btn action-preview-vfx" style="border-color:#ffff55; color:#ffff55;" data-vfx="${skill.vfx}">展演</button>
                        </div>
                        <div style="width:100%; margin-top:4px;">${tagsHtml}</div>
                        <div style="width:100%; font-size:12px; color:#888; margin-top:2px;">連擊消耗:${skill.comboCost} | 威力:${skill.power} | ${skill.msg}</div>
                     </div>`;
        });
        return html;
    },
    bindEvents(el, panel) {
        el.querySelectorAll('.skill-subtab').forEach(tab => tab.onclick = () => { this.currentCategory = tab.getAttribute('data-cat'); panel.render(); });
        el.querySelectorAll('.action-toggle-skill').forEach(btn => btn.onclick = () => panel.toggleSkill(btn.getAttribute('data-id')));
        el.querySelectorAll('.action-preview-vfx').forEach(btn => btn.onclick = () => panel.previewSkill(btn.getAttribute('data-vfx')));
    }
};

const TabInternal = {
    acuNames: {
        "dan": "丹田", "hai": "氣海", "que": "神闕", "shan": "膻中", "tu": "天突", "yin": "印堂", "baihui": "百會",
        "huan": "環跳", "li": "三里", "quan": "湧泉", "jian": "肩井", "qu": "曲池", "lao": "勞宮"
    },
    getTrainSuccessRate(artId, progress, p) {
        let s = p.stats;
        let rate = 40; 
        if (artId === 'art_yang') rate += (s.brawn + s.physique) / 2;
        else if (artId === 'art_yin') rate += (s.qiCap + s.agi) / 2;
        else if (artId === 'art_taiji') rate += (s.comp + s.qiPot) / 2;
        rate -= progress * 10; 
        return Math.max(5, Math.min(100, Math.floor(rate)));
    },
    render(p) {
        let html = `<div style="text-align:center; margin-bottom:15px;">
                        <button class="sys-btn" id="btn-meridian" style="width:100%; padding:8px; font-weight:bold; color:#55ffff;">【周天運轉】開啟經脈圖</button>
                    </div>`;
                    
        let internalKeys = Object.keys(p.internal.progress);
        if (internalKeys.length === 0) {
            html += `<div style="color:#888; text-align:center; margin-top: 20px;">目前尚未學會任何內功心法。</div>`;
        } else {
            internalKeys.forEach(artId => {
                let art = DB_INTERNAL[artId];
                if(!art) return;
                let progress = p.internal.progress[artId] || 0;
                let max = art.path.length;
                let isActive = p.internal.active === artId;
                let bgStyle = isActive ? 'background:#000044;' : 'transparent';
                
                let nextAcu = progress < max ? this.acuNames[art.path[progress]] : "大圓滿";
                let successRate = progress < max ? this.getTrainSuccessRate(artId, progress, p) : 0;
                
                let buffStr = [];
                if(art.buff.hp) buffStr.push(`氣血+${art.buff.hp}`);
                if(art.buff.atk) buffStr.push(`外攻+${art.buff.atk}`);
                if(art.buff.def) buffStr.push(`硬功+${art.buff.def}`);
                if(art.buff.agi) buffStr.push(`閃避+${art.buff.agi}`);
                let buffText = buffStr.join(" ");
                
                html += `<div class="list-item" style="flex-wrap:wrap; ${bgStyle}">
                            <div style="width: 100%; color:${art.color}; font-weight:bold; margin-bottom:4px;">
                                ${isActive ? '[運轉中]' : ''} ${art.name}
                            </div>
                            <div style="width: 100%; font-size:12px; color:#aaa; margin-bottom:4px; line-height: 1.4;">
                                ${art.desc}
                            </div>
                            <div style="width: 65%; font-size:12px; color:#888;">
                                境界: ${progress} / ${max} <br>
                                ${progress < max ? `衝擊穴位: <span style="color:#fff">[${nextAcu}]</span> | 成功率: <span style="color:#55ffff">${successRate}%</span>` : `<span style="color:#ffff55">已達大圓滿境界</span>`}
                            </div>
                            <div style="width: 35%; text-align: right;">
                                <button class="sys-btn action-train-art" data-art="${artId}" ${progress >= max ? 'disabled' : ''}>衝穴</button>
                                <button class="sys-btn action-equip-art" data-art="${artId}" style="${isActive ? 'color:#ff5555; border-color:#ff5555;' : ''}">${isActive ? '卸下' : '運轉'}</button>
                            </div>
                            <div style="width: 100%; font-size:12px; color:#55ff55; margin-top:4px;">
                                每重加成: ${buffText}
                            </div>
                         </div>`;
            });
        }
        return html;
    },
    bindEvents(el, panel) {
        let btnMeridian = el.querySelector('#btn-meridian');
        if (btnMeridian) btnMeridian.onclick = () => MeridianUI.toggle();
        
        el.querySelectorAll('.action-train-art').forEach(btn => {
            btn.onclick = () => {
                let artId = btn.getAttribute('data-art');
                let p = GameState.player;
                let progress = p.internal.progress[artId] || 0;
                
                if (p.exp < 100) { if(panel.logger) panel.logger.add("衝穴需消耗 100 修為，修為不足！", "warn-msg"); return; }
                
                p.exp -= 100;
                let rate = this.getTrainSuccessRate(artId, progress, p);
                let roll = Math.floor(Math.random() * 100) + 1;
                let targetAcu = this.acuNames[DB_INTERNAL[artId].path[progress]];

                if (roll <= rate) {
                    p.internal.progress[artId] = progress + 1;
                    let statGains = "";
                    if (artId === 'art_yang') { p.stats.physique += 1; p.stats.brawn += 1; statGains = "根骨+1、臂力+1"; }
                    else if (artId === 'art_yin') { p.stats.qiCap += 1; p.stats.agi += 1; statGains = "內息+1、身法+1"; }
                    else if (artId === 'art_taiji') { p.stats.qiPot += 1; p.stats.comp += 1; statGains = "真元+1、悟性+1"; }
                    if(panel.logger) panel.logger.add(`✅ 成功貫通【${targetAcu}】！永久獲得 ${statGains}！`, "story-msg");
                    if(MeridianUI.win) MeridianUI.updateNodesStatic();
                } else {
                    if(panel.logger) panel.logger.add(`❌ 衝擊【${targetAcu}】失敗！真氣潰散。(機率: ${rate}%)`, "warn-msg");
                }
                panel.render();
            };
        });

        el.querySelectorAll('.action-equip-art').forEach(btn => {
            btn.onclick = () => {
                let artId = btn.getAttribute('data-art');
                GameState.player.internal.active = (GameState.player.internal.active === artId) ? null : artId;
                panel.render();
            };
        });
    }
};

const TabTrain = {
    render(p) {
        let statsDict = { brawn:'臂力', physique:'根骨', qiCap:'內息', qiPot:'真元', agi:'身法', dex:'靈巧', per:'洞察', comp:'悟性' };
        let html = `<div style="margin-bottom:10px; color:#aaaaaa;">消耗 100 修為提升基礎屬性 (+1)。<br>目前修為: <span class="color-exp">${p.exp}</span></div>
                <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:15px;">`;
        for(let k in statsDict) {
            html += `<button class="sys-btn action-train-base" data-stat="${k}" style="width:48%;">鍛體 ${statsDict[k]}</button>`;
        }
        html += `</div>`;
        return html;
    },
    bindEvents(el, panel) {
        el.querySelectorAll('.action-train-base').forEach(btn => {
            btn.onclick = () => {
                let stat = btn.getAttribute('data-stat');
                if (GameState.player.exp < 100) { if(panel.logger) panel.logger.add("修為不足！", "warn-msg"); return; }
                GameState.player.exp -= 100;
                GameState.player.stats[stat] += 1;
                if(panel.logger) panel.logger.add(`鍛體成功！基礎屬性提升。`);
                panel.render();
            };
        });
    }
};

// ==========================================
// 總控面板 (SysPanel Router)
// ==========================================

export const SysPanel = {
    currentTab: 'status',
    el: null, vfx: null, logger: null,
    
    // 註冊分頁路由
    routes: {
        'status': TabStatus,
        'inventory': TabInventory,
        'skill': TabSkill,
        'internal': TabInternal,
        'train': TabTrain
    },

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
        StatEngine.updateMaxHp(GameState.player);
        const hpEl = document.getElementById('ui-hp');
        const lvEl = document.getElementById('ui-lv');
        const expEl = document.getElementById('ui-exp');
        if(hpEl) hpEl.innerText = `${GameState.player.hp}/${GameState.player.maxHp}`;
        if(lvEl) lvEl.innerText = GameState.player.lv;
        if(expEl) expEl.innerText = GameState.player.exp;
    },

    render() {
        this.updateStats();
        let controller = this.routes[this.currentTab];
        if (controller) {
            this.el.innerHTML = controller.render(GameState.player);
            // 每個分頁模組只會綁定自己 HTML 內的事件，效能大提升
            controller.bindEvents(this.el, this); 
        }
    },

    // --- 共用互動功能 ---

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
        let item = DB_ITEMS[GameState.player.inventory[invIdx]];
        if (item && item.action) item.action(GameState.player, this.logger); 
        GameState.player.inventory.splice(invIdx, 1);
        this.render();
    },

    toggleSkill(skillId) {
        let p = GameState.player;
        let idx = p.activeSkills.indexOf(skillId);
        if (idx > -1) { 
            if (p.activeSkills.length > 1) p.activeSkills.splice(idx, 1); 
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
    }
};