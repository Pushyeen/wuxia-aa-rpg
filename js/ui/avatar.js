// js/ui/avatar.js
import { GameState } from '../systems/state.js';
import { DB_ITEMS } from '../data/db_items.js';

// 已處理好跳脫字元的完整素體 AA
const BASE_AA = `　　　　　　 　 　 　 　 　 　 　 　 ／｢l＼
　　　　　　　　　＿　　　　　 　_/xzzｚｘ､V__
　 　 　 　 　 　 {　 ＼　　　.／=| {　 　 } |ニ＼
　　　 　 　 　 　 ＼　 ＼　∥ﾆ人ゝ- イ人.ﾆﾆ∨
　　　　　　 　 　 　 ＼ 　　､=ﾆ|　≧＜ 　 :}ﾆニ{
.　　　 　 　 　 　 　 　 ＼　 ＼.!＿,,}::{,_＿/　　 {
　　 　 　 　 　 　 　 　 　 ＼　 ＼::ｫ::r‐／　 　 ′
　　　　　　　　 　 　 　 　 八＼　 ＼,ﾍﾞ::＼,／
　　　　　 　 　 　 　 　 　 　 ヽ::＼／ ﾉ::.／＼
　　　　　　 　 　 　 　 　 　 ／＾'∠x彡グ≦''~∨
　　　　　　　　　　　 　 　 /}　　　　｢:｢＼》　　 ,}V
　　　　　　 　 　 　 　 　 /-}　　 　 }::{　　 　 ／-ヽ
　 　 　 　 　 　 　 　 　 /ｰ_ ＼ ＿_}::{＿__／-_-_-_∨
　　　　　　　　　　　　　}-_-_-_ ／￣￣￣\`''＜-_-_-V
　　　　　　　　　　　　　}-_-_-./　　　　　 　 　 V-_-_ V
　　　　　　　　　　　　　}-_-_ / 　 　 　 　 　 　 《,==彡》
　　　　　　　　　　　　 《==ミ,》　 　 　 　 　 　 　 {\`¨´::＼
　　　　　　　　　 　 　 ﾉ::::: /´　　　 　 　 　 　 　 ＼::::::::::)
　　　 　 　 　 　 　 ／ ::::::/　　　　　　　　　　　　　　 ￣
　　　　　　　　　　 ゝｰ=彡`;

export const AvatarUI = {
    el: null,
    bodyEl: null,
    weaponEl: null,
    lastWeaponId: null, // 記憶前一次的武器，用來觸發拔劍動畫
    
    armorColors: {
        "布": "#aaddff", "皮": "#ddaa77", "鐵": "#cccccc", "蠶": "#ffffff", "金": "#ffd700"
    },

    init() {
        this.el = document.querySelector('.avatar-aa-box');
        if(!this.el) return;
        
        // 建立可縮放的圖層容器
        this.el.innerHTML = `
            <div class="avatar-container" id="ui-avatar-container">
                <div class="aa-layer-body">${BASE_AA}</div>
                <div class="aa-layer-weapon"></div>
            </div>
        `;
        
        this.bodyEl = this.el.querySelector('.aa-layer-body');
        this.weaponEl = this.el.querySelector('.aa-layer-weapon');
        this.renderToDOM();
    },

    renderToDOM() {
        if (!this.bodyEl || !this.weaponEl) return;
        
        let p = GameState.player;
        let wId = p.equips.weapon;
        let wObj = wId ? DB_ITEMS[wId] : null;
        let aObj = p.equips.armor ? DB_ITEMS[p.equips.armor] : null;
        
        // --- 1. 武器渲染與演出 ---
        let wStr = (wObj && wObj.aaWeapon) ? wObj.aaWeapon : "";
        let wColor = (wObj && wObj.weaponColor) ? wObj.weaponColor : "#ffffff";
        let wPos = (wObj && wObj.weaponPos) ? wObj.weaponPos : "bottom: 20px; left: 50px;";

        this.weaponEl.innerText = wStr;
        this.weaponEl.style.color = wColor;
        this.weaponEl.style.textShadow = `0 0 10px ${wColor}`;
        this.weaponEl.style.cssText += wPos;

        // 【武裝切換特效】：如果武器更換了，觸發拔劍光芒動畫
        if (this.lastWeaponId !== wId) {
            this.lastWeaponId = wId;
            this.weaponEl.classList.remove('anim-equip');
            void this.weaponEl.offsetWidth; // 強制重繪
            if (wId) this.weaponEl.classList.add('anim-equip');
        }
        
        // --- 2. 裝甲材質與本體光暈 ---
        let aSkin = (aObj && aObj.aaSkin) ? aObj.aaSkin : "布";
        this.bodyEl.style.color = this.armorColors[aSkin] || "#d0d0d0";
        if(aSkin === "金" || aSkin === "蠶") {
            this.bodyEl.style.textShadow = `0 0 15px ${this.armorColors[aSkin]}`;
        } else {
            this.bodyEl.style.textShadow = "none";
        }
    },

    // 戰鬥視窗用的立繪 HTML (稍微放大一點 0.75倍)
    getCombatHTML() {
        let p = GameState.player;
        let wObj = p.equips.weapon ? DB_ITEMS[p.equips.weapon] : null;
        let aObj = p.equips.armor ? DB_ITEMS[p.equips.armor] : null;
        
        let wStr = (wObj && wObj.aaWeapon) ? wObj.aaWeapon : "";
        let wColor = (wObj && wObj.weaponColor) ? wObj.weaponColor : "#ffffff";
        let wPos = (wObj && wObj.weaponPos) ? wObj.weaponPos : "bottom: 20px; left: 50px;";

        let aSkin = (aObj && aObj.aaSkin) ? aObj.aaSkin : "布";
        let bodyColor = this.armorColors[aSkin] || "#d0d0d0";
        let bodyShadow = (aSkin === "金" || aSkin === "蠶") ? `text-shadow: 0 0 15px ${bodyColor};` : "";
        
        return `
            <div class="avatar-container" style="transform: scale(0.75);" id="combat-avatar-container">
                <div class="aa-layer-body" style="color:${bodyColor}; ${bodyShadow}">${BASE_AA}</div>
                <div class="aa-layer-weapon" style="color:${wColor}; text-shadow:0 0 10px ${wColor}; ${wPos}">${wStr}</div>
            </div>
        `;
    },

    // 觸發動作 (現在會帶動整個容器，武器與身體一起位移！)
    playAction(type, isCombat = false) {
        let targetEl = isCombat ? document.getElementById('combat-avatar-container') : document.getElementById('ui-avatar-container');
        if (targetEl) this._triggerAnimation(targetEl, type);
    },

    _triggerAnimation(element, type) {
        if (!element) return;
        element.classList.remove('anim-attack-thrust', 'anim-attack-slash', 'anim-hurt');
        void element.offsetWidth; 
        
        if (type === 'thrust') element.classList.add('anim-attack-thrust');
        else if (type === 'slash') element.classList.add('anim-attack-slash');
        else if (type === 'hurt') element.classList.add('anim-hurt');
    }
};