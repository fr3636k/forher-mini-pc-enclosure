# 豐禾｜超音波錄影盒設計提案 V4

公開網址：https://forher-ultrasound-enclosure-3d.cloudybun6.chatgpt.site

執行 start-preview.ps1 或 node serve.mjs，本機預覽 http://127.0.0.1:8787。
網站原始碼位於 dist/，Three.js 本機隨附。木板幾何在 model.js，介面與視角在 app.js，板件選取在 boards.js。
模型使用毫米；GLB 匯出轉換為公尺。GLB 可由網頁下載後匯入 Blender，Blender 改動不會自動回寫網頁。

V4：精簡正式提案、六片板件爆炸圖與平面圖、右後 Ø45 穿線孔、左側 Ø45 通風孔、獨立前門。
木作尺寸及組合詳見 木作規格.md。舊模型留存在 models/ 供回溯，正式頁僅呈現 V4。

V4.1：以面對操作面板為準，木盒與讀卡機配置在超音波機左側，右側留給病床；木盒掛架改到盒體右側朝向機器，HDMI 與 USB 線從左後方繞線。六片板件尺寸與右／後穿線孔維持不變。完整模型：dist/models/forher-recorder-v4-1-left.glb。

技術架構、檔案對照、本機修改與重新部署流程：[技術與部署說明](技術與部署說明.md)。

V4.2：沿用 forher-web 的紫色品牌、樹形 Logo 與淡紫背景；下載按鈕改為「下載設計圖」。3D 改為按需重繪、畫面外與背景分頁暫停，陰影僅在模型變更後更新；GLB 改為直接下載預先匯出的檔案。板件尺寸不變。
