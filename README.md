武俠 AA RPG：江湖夜雨 (Wuxia AA RPG)
1. 專案簡介
《江湖夜雨》是一款基於網頁技術開發的純文字風格（Ascii Art, AA）武俠角色扮演遊戲。本作致敬早期 DOS 時代的經典遊戲美學，結合現代化的數據驅動（Data-Driven）設計理念，打造出一個具備高擴展性的武俠世界。

玩家將扮演初入江湖的少俠，透過移動探索地圖、觸發事件腳本、修練內外功，並在半即時制（ATB）的戰鬥系統中，利用招式標籤與環境元素的連鎖反應（Reaction System）擊敗強敵。

2. 技術棧 (Tech Stack)
專案堅持使用輕量化、無依賴的現代網頁技術，確保高度的可移植性與執行效能：

核心語言: ECMAScript 6+ (JavaScript ES6 模組化)。

渲染引擎:

Map/VFX: HTML5 Canvas (處理動態地圖與文字粒子特效)。

UI/Avatar: CSS Grid & Flexbox (處理復古面板佈局與分層 AA 立繪)。

視覺樣式:

字型: 強制使用 PMingLiU (細明體) 與 MS PGothic 以確保 Ascii Art 字符不跑版。

動畫: 原生 CSS Keyframes 處理物理位移與受擊特效。

3. 目錄結構說明 (Directory Structure)
專案結構劃分清晰，遵循邏輯與數據分離的原則：

📁 根目錄
index.html: 遊戲進入點，定義主容器、Canvas 圖層與 UI 佈局。

ARCHITECTURE.md: 系統架構說明文件（定義核心機制與開發規範）。

📁 css/
style.css: 定義 DOS 16 色復古配色、視窗樣式及 AA 立繪動畫。

📁 js/
main.js: 遊戲初始化中心，負責事件監聽與各模組依賴注入 (Dependency Injection)。

📁 js/core/ (底層引擎)
map_engine.js: 處理地圖矩陣渲染、攝影機視角跟隨。

vfx_engine.js: 負責招式粒子的物理行為與文字演變。

window_manager.js: 負責浮動視窗的動態創建與 Z-Index 堆疊管理。

math_utils.js: 特效曲線計算與線性插值輔助函數。

📁 js/systems/ (遊戲邏輯)
state.js: 全域狀態機 (GameState) 與屬性二階運算引擎 (StatEngine)。

combat.js: 戰鬥流程控制（ATB 計時、傷害計算、AI 決策）。

events.js: 腳本解析引擎（處理對話、戰鬥切換、道具發放）。

📁 js/ui/ (介面顯示)
sys_panel.js: 右側主面板（狀態、行囊、武學管理）。

combat_ui.js: 戰鬥視窗介面、血條更新與傷害數字噴發。

meridian_ui.js: 經脈圖與周天運行粒子演出。

avatar.js: 負責身體、武器、護甲色調的分層 AA 渲染。

logger.js: 左下角江湖紀事文字滾動更新。

📁 js/data/ (數據數據庫)
db_skills.js: 武學數據庫（含招式鉤子 logic）。

db_enemies.js: 敵人與 Boss 數據庫（含自定義 AI 腳本）。

db_items.js: 裝備、消耗品與測試天書數據。

db_internal.js: 內功心法與修練路徑定義。

db_reactions.js: 標籤連鎖反應定義（如「陰陽相激」、「冰封碎裂」）。

db_scripts.js: 劇情與遭遇戰的串流腳本。

db_maps.js: 地圖矩陣、圖元符號與事件觸發座標定義。

db_vfx.js: 特效粒子屬性字典。

db_auras.js: 氣場/Buff 系統的攔截邏輯定義。

4. 如何啟動專案
由於專案採用 ES 模組化設計，需在 Web Server 環境下開啟（防止 CORS 限制）：

使用 VS Code 的 Live Server 擴充功能開啟 index.html。

或使用 python 命令：python -m http.server。