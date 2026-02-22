// js/core/map_engine.js
import { MapDB } from '../data/db_maps.js';

export class MapEngine {
    constructor(canvasId) { 
        this.canvas = document.getElementById(canvasId); 
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d'); 
        this.tileSize = 30; 
        
        // 新增內部座標暫存，避免 resize 報錯
        this.playerX = 5; 
        this.playerY = 5;

        this.resize(); 
        window.addEventListener('resize', () => this.resize()); 
    }

    resize() { 
        const parent = this.canvas.parentElement; 
        this.canvas.width = parent.clientWidth; 
        this.canvas.height = parent.clientHeight; 
        this.viewCols = Math.ceil(this.canvas.width / this.tileSize); 
        this.viewRows = Math.ceil(this.canvas.height / this.tileSize); 
        this.render(); // 現在不需要傳參數了
    }

    // 新增：更新玩家座標的專用方法
    updatePlayerPosition(x, y) {
        this.playerX = x;
        this.playerY = y;
        this.render();
    }

    // 改為不依賴外部參數的 render
    render() {
        if(!MapDB.layout || MapDB.layout.length === 0) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); 
        this.ctx.font = "20px monospace"; 
        this.ctx.textBaseline = "top";
        
        const mapWidth = MapDB.layout[0].length;
        const mapHeight = MapDB.layout.length;

        let camX = Math.max(0, Math.min(this.playerX - Math.floor(this.viewCols / 2), mapWidth - this.viewCols));
        let camY = Math.max(0, Math.min(this.playerY - Math.floor(this.viewRows / 2), mapHeight - this.viewRows));

        for (let y = 0; y < this.viewRows; y++) {
            for (let x = 0; x < this.viewCols; x++) {
                let mX = camX + x;
                let mY = camY + y; 
                
                if (mX >= mapWidth || mY >= mapHeight) continue;
                
                let tileId = MapDB.layout[mY][mX];
                let tileData = MapDB.dict[tileId];
                
                if (!tileData) continue;

                let drawX = x * this.tileSize;
                let drawY = y * this.tileSize;
                
                this.ctx.fillStyle = tileData.color; 
                this.ctx.fillText(tileData.char, drawX, drawY);
                
                // 使用內部的 playerX 與 playerY 判斷
                if (mX === this.playerX && mY === this.playerY) { 
                    this.ctx.fillStyle = "#55aaff"; 
                    this.ctx.fillText("＠", drawX, drawY); 
                }
            }
        }
    }
}