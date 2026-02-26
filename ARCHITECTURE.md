系統架構說明 (Technical Architecture)
1. 專案概觀
本專案為基於網頁技術（ES6 Modules, Canvas, CSS Grid）開發的純文字（Ascii Art）風格武俠 RPG。核心設計哲學為「數據驅動」，將遊戲邏輯與內容數據（武學、敵人、地圖）徹底分離。

2. 目錄結構與模組權責
專案採用模組化結構，主要分為以下層級：

A. 核心引擎層 (/js/core/)
map_engine.js: 負責 Canvas 地圖渲染、攝影機跟隨邏輯及事件座標轉換。

vfx_engine.js: 粒子特效系統，支援 projectile（彈道）、rain（雨落）、explode（爆炸）等行為模式。

window_manager.js: 處理 DOM 視窗的創建、層級（Z-Index）管理與拖拽功能。

B. 數據層 (/js/data/)
db_skills.js: 定義所有武學。支援 onCast（發動前）與 onHit（命中後）鉤子函數。

db_reactions.js: 標籤反應系統。定義如「風火燎原」等屬性連鎖邏輯。

db_enemies.js: 敵人數據，包含 aiScript 鉤子以支援複雜的 Boss 行為邏輯（如翩若的階段轉換）。

db_auras.js: 氣場系統。處理被動觸發或防禦端的攔截邏輯（如「蔽月」反擊）。

C. 系統邏輯層 (/js/systems/)
state.js: 儲存全域遊戲狀態 (GameState) 並包含屬性轉換引擎 (StatEngine)。

combat.js: 戰鬥核心流程。管理 ATB、連擊判定、傷害計算與手動/自動模式切換。

events.js: 腳本化事件引擎。解析並執行 db_scripts.js 中的對話、戰鬥、給予道具等指令。

3. 核心機制工作流
戰鬥傷害流程
出招攔截: 檢查防禦者是否有氣場（Aura）觸發 onDefend（如取消傷害或反擊）。

命中判定: 依據攻擊者命中與防禦者閃避計算。

屬性反應: 檢查招式標籤（Tags）與目標印記或環境（Env）是否觸發 db_reactions 中的連鎖。

最終結算: 應用 StatEngine 輸出的防禦減免公式，更新 HP 並顯示飄浮文字與連擊評價。

事件觸發流程
玩家移動至特定座標。

main.js 偵測地圖事件 ID。

EventEngine 解析 db_scripts.js 對應節點，依序執行非同步操作（對話 -> 戰鬥 -> 移除事件）。

4. 開發規範
新增武功: 必須在 db_skills.js 中定義，並確保 comboCost 與 vfx 屬性正確。若有特殊效果，優先寫在 onHit 中。

數值調整: 所有屬性加成應透過 StatEngine 處理，避免在組件內寫死公式。

AA 演出: 使用 AvatarUI 提供的分層渲染功能，將武器與身體分開定義。