// js/core/map_engine.js
import { DB_MAPS } from '../data/db_maps.js';

export class MapEngine {
    constructor(canvasId) { 
        this.canvas = document.getElementById(canvasId); 
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d'); 
        this.tileSize = 30; 
        
        this.playerX = 5; 
        this.playerY = 5;
        this.currentMapId = 'map_start'; // 預設載入的地圖 ID

        this.resize(); 
        window.addEventListener('resize', () => this.resize()); 
    }

    // 允許動態切換地圖
    loadMap(mapId) {
        if (DB_MAPS[mapId]) {
            this.currentMapId = mapId;
            this.render();
        }
    }

    resize() { 
        const parent = this.canvas.parentElement; 
        this.canvas.width = parent.clientWidth; 
        this.canvas.height = parent.clientHeight; 
        this.viewCols = Math.ceil(this.canvas.width / this.tileSize); 
        this.viewRows = Math.ceil(this.canvas.height / this.tileSize); 
        this.render(); 
    }

    updatePlayerPosition(x, y) {
        this.playerX = x;
        this.playerY = y;
        this.render();
    }

    // 提供給外部（如事件系統）用來移除地圖上 NPC/敵人的方法
    removeEventAt(x, y) {
        let mapData = DB_MAPS[this.currentMapId];
        if (!mapData || !mapData.matrix[y]) return;
        
        // 將該座標的字元替換為普通的平地 '.'
        let row = mapData.matrix[y];
        mapData.matrix[y] = row.substring(0, x) + '.' + row.substring(x + 1);
        
        // 刪除事件註冊表中的紀錄
        let eventKey = `${x},${y}`;
        if (mapData.events[eventKey]) {
            delete mapData.events[eventKey];
        }
        
        this.render(); // 重新渲染地圖，NPC 就會消失
    }

    render() {
        let mapData = DB_MAPS[this.currentMapId];
        if(!mapData || !mapData.matrix || mapData.matrix.length === 0) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); 
        this.ctx.font = "20px monospace"; 
        this.ctx.textBaseline = "top";
        
        const mapWidth = mapData.width;
        const mapHeight = mapData.height;

        // 優化的攝影機跟隨邏輯（防止地圖比畫面小時發生破圖）
        let camX = this.playerX - Math.floor(this.viewCols / 2);
        let camY = this.playerY - Math.floor(this.viewRows / 2);
        
        if (camX < 0) camX = 0;
        if (camY < 0) camY = 0;
        if (mapWidth > this.viewCols && camX > mapWidth - this.viewCols) camX = mapWidth - this.viewCols;
        if (mapHeight > this.viewRows && camY > mapHeight - this.viewRows) camY = mapHeight - this.viewRows;

        for (let y = 0; y < this.viewRows; y++) {
            for (let x = 0; x < this.viewCols; x++) {
                let mX = camX + x;
                let mY = camY + y; 
                
                // 邊界檢查
                if (mX >= mapWidth || mY >= mapHeight || mX < 0 || mY < 0) continue;
                
                // 讀取新版 matrix 的字元
                let rowStr = mapData.matrix[mY];
                if (!rowStr) continue;
                
                let symbolChar = rowStr[mX];
                let tileData = mapData.symbols[symbolChar];
                
                if (!tileData) continue;

                let drawX = x * this.tileSize;
                let drawY = y * this.tileSize;
                
                // 渲染地板或 NPC
                this.ctx.fillStyle = tileData.color; 
                this.ctx.fillText(tileData.char, drawX, drawY);
                
                // 渲染玩家 (覆蓋在上面)
                if (mX === this.playerX && mY === this.playerY) { 
                    this.ctx.fillStyle = "#55aaff"; 
                    this.ctx.fillText("＠", drawX, drawY); 
                }
            }
        }
    }
}