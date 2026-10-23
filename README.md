# 豐禾｜超音波錄影盒 3D 設計提案

目前版本：**V4.3**

公開展示：[https://forher-ultrasound-enclosure-3d.cloudybun6.chatgpt.site](https://forher-ultrasound-enclosure-3d.cloudybun6.chatgpt.site)

這是一個在瀏覽器中展示超音波錄影盒設計的靜態網站。使用者可以旋轉及縮放 3D 模型、切換展示視角、開關前門、查看六片板件爆炸圖，並下載設計圖與 GLB 模型。

網站只負責設計展示，不會操作診間設備、錄影、讀取健保卡或處理病患資料。

## 技術架構

專案採用純前端靜態架構，不需要後端伺服器、資料庫或建置工具。

```text
瀏覽器
  └─ dist/index.html                   網站入口與頁面結構
      ├─ dist/style.css                品牌樣式與響應式版面
      ├─ dist/app.js                   場景、相機、渲染與互動控制
      │   ├─ Three.js                  WebGL 3D 渲染
      │   ├─ OrbitControls             旋轉、縮放與鏡頭控制
      │   └─ dist/model.js             程序化建立木盒與設備模型
      ├─ dist/boards.js                板件卡片與 3D 模型連動
      ├─ dist/boards.svg               可下載的板件平面圖
      └─ dist/models/*.glb             可下載／回溯的 3D 模型
```

本機開發時，`serve.mjs` 使用 Node.js 內建的 HTTP 模組提供 `dist/` 內容；正式環境則直接把 `dist/` 部署到靜態網站服務。

### 執行流程

1. 瀏覽器載入 `index.html`、CSS 與 JavaScript ES Modules。
2. `index.html` 的 import map 將套件名稱 `three` 對應到本機的 `vendor/three.module.js`。
3. `model.js` 以毫米為單位，程序化建立木盒、板件、支架、讀卡機、超音波機與線材。
4. `app.js` 建立 Three.js 場景、相機、燈光與渲染器，並連接視角切換、前門、爆炸圖和標籤等操作。
5. `boards.js` 使用 `window.recorderDesign` 公開介面，把板件卡片的選擇同步到 3D 模型。
6. 下載按鈕直接提供預先匯出的 GLB，避免在訪客裝置上重新產生大型模型。

## 技術選型

| 項目 | 技術 | 用途 |
| --- | --- | --- |
| 網頁結構 | HTML5 | 頁面內容、控制元件與無障礙標記 |
| 介面樣式 | CSS3 | 品牌色、桌面／手機版面與互動狀態 |
| 應用邏輯 | 原生 JavaScript ES Modules | 模組拆分、事件處理與狀態控制 |
| 3D 渲染 | Three.js／WebGL | 模型、材質、燈光、陰影及相機控制 |
| 3D 交換格式 | GLB／glTF | Blender 匯入與設計模型下載 |
| 平面圖格式 | SVG | 可縮放的板件尺寸示意圖 |
| 本機伺服器 | Node.js | 提供靜態檔案與正確的 MIME Type |
| 正式部署 | 靜態網站託管 | 直接發布 `dist/`，不需後端執行環境 |

## 專案目錄

```text
超音波木盒/
├─ .openai/
│  └─ hosting.json             Sites 專案識別與發布目錄
├─ dist/                       可直接部署的網站與主要原始碼
│  ├─ assets/                  Logo 與品牌圖片
│  ├─ models/                  GLB 模型檔案
│  ├─ utils/                   Three.js 輔助程式
│  ├─ vendor/                  隨專案提供的第三方函式庫
│  ├─ app.js                   3D 場景與互動主程式
│  ├─ boards.js                板件選取邏輯
│  ├─ boards.svg               板件平面圖
│  ├─ index.html               網站入口
│  ├─ model.js                 3D 幾何與模型狀態
│  └─ style.css                網站樣式
├─ Blender修改說明.md          Blender 工作流程
├─ 木作規格.md                 尺寸、孔位與組裝規格
├─ 技術與部署說明.md           維護及部署細節
├─ netlify.toml                Netlify 靜態發布設定
├─ package.json                專案版本與開發指令
├─ serve.mjs                   本機預覽伺服器
└─ start-preview.ps1           Windows 預覽啟動腳本
```

`dist/vendor/` 是第三方程式碼，除非要升級函式庫，否則不應直接修改。

## 本機執行

### 需求

- Windows 10／11
- Node.js（建議使用目前仍受支援的 LTS 版本）
- 支援 WebGL 與 ES Modules 的現代瀏覽器

此專案已隨附 Three.js，不需要先執行 `npm install`。

### 啟動方式

在檔案總管執行：

```powershell
.\start-preview.ps1
```

或在專案目錄執行：

```powershell
npm run dev
```

接著開啟：<http://127.0.0.1:8787>

不要直接雙擊 `dist/index.html` 預覽。瀏覽器對 `file://` 的 ES Module 與資源載入有限制，應透過本機 HTTP 伺服器開啟。

### 語法檢查

```powershell
npm run check
```

此指令會檢查 `dist/app.js` 與 `dist/model.js` 的 JavaScript 語法。

## 核心模組

### `dist/model.js`

- 所有幾何尺寸以 **毫米** 表示。
- `buildProducts()` 建立木盒、六片板件、讀卡機與相關零件。
- `buildCart()` 建立超音波機與推車情境模型。
- 模型物件提供開門、爆炸、板件選取與配置切換等狀態方法。
- GLB 匯出時將根節點縮放為 `0.001`，把毫米轉換成公尺。

### `dist/app.js`

- 初始化 Renderer、Scene、Camera、燈光、陰影與 OrbitControls。
- 管理 `overview`、`box`、`inside`、`wiring` 四種視角。
- 處理前門角度、爆炸比例、標籤投影與下載操作。
- 使用 `ResizeObserver` 配合容器尺寸調整畫面。
- 使用 `IntersectionObserver` 與 Page Visibility API，在畫面不可見或分頁進入背景時暫停不必要的重繪。
- 只在鏡頭或模型狀態改變時要求下一幀，降低閒置時的 GPU 使用量。

### `dist/boards.js`

- 處理六片板件卡片的選取狀態。
- 選取板件後切換至爆炸視角，並讓對應的 3D 板件醒目顯示。
- 依賴 `app.js` 提供的 `window.recorderDesign` 介面，因此載入順序與公開方法名稱不可任意更改。

## 修改對照

| 想修改的內容 | 主要檔案 |
| --- | --- |
| 標題、說明文字、頁面結構 | `dist/index.html` |
| 顏色、字體、間距、手機版面 | `dist/style.css` |
| 木盒尺寸、孔位、支架、設備與線材 | `dist/model.js` |
| 視角、相機位置、前門、爆炸圖與下載功能 | `dist/app.js` |
| 板件卡片點擊後的行為 | `dist/boards.js` |
| 可下載的板件平面圖 | `dist/boards.svg` |
| 可下載的正式 3D 模型 | `dist/models/forher-recorder-v4-1-left.glb` |
| 本機伺服器行為 | `serve.mjs` |
| 正式發布目錄 | `.openai/hosting.json`、`netlify.toml` |

## 尺寸與模型同步

目前尺寸資料不是由單一資料源自動產生。修改板件尺寸、孔位或組裝方式時，必須同步檢查：

1. `dist/model.js` 的 3D 幾何。
2. `dist/index.html` 的板件卡片與文字。
3. `dist/boards.svg` 的平面圖。
4. `木作規格.md` 的製作規格。
5. `dist/models/` 中提供下載的 GLB。
6. 預覽圖片、說明文件與網站壓縮檔。

Blender 中的修改不會自動回寫 `model.js`。目前網頁是以 JavaScript 即時建立模型，不是直接載入 GLB 作為畫面模型；詳細流程請參考 [Blender修改說明.md](Blender修改說明.md)。

## 部署

正式發布內容是整個 `dist/` 資料夾：

```text
發布來源：dist/
入口檔案：dist/index.html
```

修改本機檔案不會自動更新公開網站。建議流程如下：

1. 修改程式與相關文件。
2. 執行 `npm run check`。
3. 啟動本機預覽，測試桌面版與手機版。
4. 確認模型、平面圖、尺寸文字及下載 GLB 一致。
5. 更新既有的 Sites 專案，不要建立新的公開網址。
6. 發布後開啟公開網址再次驗收。

`.openai/hosting.json` 記錄既有專案 ID 與 `dist` 發布目錄；`netlify.toml` 也將 `dist` 設為靜態發布來源。

## 版本摘要

- **V4**：建立六片板件、爆炸圖、平面圖、穿線孔與獨立前門。
- **V4.1**：木盒與讀卡機移至超音波機左側，右側保留病床空間。
- **V4.2**：套用豐禾紫色品牌視覺，並加入按需重繪與陰影更新最佳化。
- **V4.3**：簡化板件說明，新增四視角滑動選取列與鍵盤操作。

## 相關文件

- [技術與部署說明.md](技術與部署說明.md)：部署、維護與網站託管說明。
- [木作規格.md](木作規格.md)：板件尺寸、孔位與木作組裝方式。
- [Blender修改說明.md](Blender修改說明.md)：GLB 匯入 Blender 及修改限制。
- [LIVE-URL.txt](LIVE-URL.txt)：正式展示網址。
