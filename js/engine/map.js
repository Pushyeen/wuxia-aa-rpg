// js/engine/map.js
import { GameState } from '../system/state.js';
import { PlayerData } from '../data/db.js';
import { Log, updatePlayerStats } from '../system/ui.js';

export const MapEngine = {
    canvas: null, ctx: null, cols: 30, rows: 20,
    playerPos: { x: 12, y: 7 }, firePos: { x: 15, y: 10 },
    // 0:空, 1:樹, 2:商, 3:火, 4:敵
    levelData: [ /* 貼入原本的 2D 陣列資料 */ ],

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellW = this.canvas.width / this.cols;
        this.cellH = this.canvas.height / this.rows;
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = "16px 'MS PGothic', monospace";
        this.ctx.textBaseline = "top";
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const dist = Math.sqrt((x - this.firePos.x)**2 + (y - this.firePos.y)**2 * 1.5);
                const light = Math.max(0, 1 - dist / 12);
                let px = x * this.cellW, py = y * this.cellH;

                if (x === this.playerPos.x && y === this.playerPos.y) {
                    this.ctx.fillStyle = "#55aaff"; this.ctx.fillText("＠", px, py); continue;
                }
                const tile = this.levelData[y][x];
                let char = "", r=40+light*200, g=40+light*120, b=60+light*30;
                if (tile === 1) { char = "木"; r=30+light*80; g=50+light*100; b=30+light*50; }
                else if (tile === 2) { char = "商"; r=255; g=200; b=80; }
                else if (tile === 4) { char = "惡"; r=255; g=80; b=80; }
                else if (tile === 0) { char = (x%2===0 && y%3===0) ? "." : " "; }
                
                if (char) { this.ctx.fillStyle = `rgb(${r},${g},${b})`; this.ctx.fillText(char, px, py); }
            }
        }
    },

    movePlayer(dx, dy, onEncounter, onDialogue, playerRenderer) {
        if (GameState.current !== 'EXPLORE') return;
        let nx = this.playerPos.x + dx, ny = this.playerPos.y + dy;
        let tile = this.levelData[ny]?.[nx];
        if (tile !== 1) {
            if (tile === 2) onDialogue();
            else if (tile === 4) { this.levelData[ny][nx] = 0; this.playerPos.x = nx; this.playerPos.y = ny; onEncounter(); }
            else if (tile === 3) {
                this.playerPos.x = nx; this.playerPos.y = ny;
                PlayerData.hp -= 150; Log.add("<span style='color:red'>火燒傷！-150 HP</span>");
                playerRenderer.playHit(); updatePlayerStats(playerRenderer);
            } else { this.playerPos.x = nx; this.playerPos.y = ny; }
            this.draw();
        }
    }
};