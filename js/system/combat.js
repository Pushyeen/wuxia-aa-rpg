// js/system/combat.js
import { DB, PlayerData, AAAssets } from '../data/db.js';
import { Log, updatePlayerStats, sleep } from './ui.js';
import { GameState } from './state.js';
import { AASpriteRenderer } from '../engine/render.js';

export class Battler {
    constructor(isPlayer, name, stats, skillIds, renderer = null) {
        this.isPlayer = isPlayer; this.name = name; this.stats = stats;
        this.hp = stats.hp; this.maxHp = stats.maxHp; this.atk = stats.atk; this.def = stats.def;
        this.agi = stats.agi; this.dodge = stats.dodge; this.crit = stats.crit;
        this.skills = skillIds.map(id => DB.skills[id]);
        this.maxWait = Math.floor(10000 / this.agi); this.currentWait = this.maxWait;
        this.renderer = renderer;
    }
    rollSkill() {
        const total = this.skills.reduce((sum, s) => sum + s.weight, 0);
        let rand = Math.random() * total;
        for (let s of this.skills) { if (rand < s.weight) return s; rand -= s.weight; }
        return this.skills[0];
    }
}

export class AsyncBattleEngine {
    constructor(player, enemy, onEnd) {
        this.player = player; this.enemy = enemy;
        this.onEnd = onEnd; // 結束時的回調函數
        this.isActive = true; this.isAnimating = false;
    }

    async executeRound() {
        if (!this.isActive || this.isAnimating) return;
        this.isAnimating = true;
        let timePassed = 0; const roundLimit = 200;

        while (timePassed < roundLimit && this.isActive) {
            this.player.currentWait -= 10; this.enemy.currentWait -= 10;
            timePassed += 10;
            if (this.player.currentWait <= 0) { await this.executeAction(this.player, this.enemy); this.player.currentWait += this.player.maxWait; }
            if (this.enemy.currentWait <= 0 && this.enemy.hp > 0 && this.isActive) { await this.executeAction(this.enemy, this.player); this.enemy.currentWait += this.enemy.maxWait; }
        }
        this.isAnimating = false;
    }

    async executeAction(attacker, defender) {
        const skill = attacker.rollSkill();
        const cAttacker = attacker.isPlayer ? "color-player" : "color-enemy";
        Log.add(`[行動] <span class="${cAttacker}">${attacker.name}</span> 使出 <span class="color-skill">【${skill.name}】</span>！`);
        attacker.renderer.playAttack(); await sleep(300);

        if (Math.random() < defender.dodge) {
            defender.renderer.playDodge(); Log.add(`　➥ <span class="color-dodge">閃避了攻擊！</span>`);
        } else {
            let damage = (attacker.atk + skill.power) - defender.def;
            damage = Math.floor(damage * (0.9 + Math.random() * 0.2)); if (damage < 1) damage = 1;
            if (Math.random() < attacker.crit + (skill.critBonus || 0)) {
                damage = Math.floor(damage * 1.8); Log.add(`　➥ <span class="color-crit">會心一擊！！</span>`);
            }
            defender.hp -= damage; Log.add(`　➥ 造成了 <span class="color-dmg">-${damage}</span> 點傷害。`);
            defender.renderer.playHit();
        }
        await sleep(500);

        if (defender.hp <= 0) {
            defender.hp = 0; this.isActive = false;
            if (defender.isPlayer) {
                Log.add(`\n<span class="color-sys">>> 敗北...</span>`);
            } else {
                PlayerData.gold += this.enemy.stats.drop;
                Log.add(`\n<span class="color-sys">>> 勝利！獲得 ${this.enemy.stats.drop} 兩。</span>`);
                setTimeout(() => this.onEnd(), 1500);
            }
        }
        updatePlayerStats(this.player.renderer);
        const eHpEl = document.getElementById('enemy-hp');
        if (eHpEl) eHpEl.innerText = `[氣血: ${this.enemy.hp}/${this.enemy.maxHp}]`;
    }
}