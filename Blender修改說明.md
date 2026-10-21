# 用 Blender 修改模型

1. 在展示網頁點「下載完整場景」，或使用 `dist/models/forher-recorder-v3-compact.glb`。
2. 開啟 Blender，選 `File → Import → glTF 2.0 (.glb/.gltf)`，選擇檔案。
3. 匯入後用右上角 Outliner 選物件，物件名稱可辨識木板、上蓋、前蓋、主機、讀卡機及超音波機。
4. 按 G 移動、R 旋轉、S 縮放；按 X / Y / Z 可限制方向。移動數值以 Blender 場景單位為準。
5. 木板如要改成精確尺寸，先在 Scene Properties 設定 Metric，並在 N 面板 Item / Dimensions 檢查尺度。匯入的 GLB 使用公尺；220 mm 應為 0.22 m。
6. 木盒、讀卡機和超音波機是分組物件；先展開父層級確認選到的物件。Mesh 三角面可在 Edit Mode 編輯，但它不是參數式 CAD 模型。
7. 用 `File → Save As` 另存 `.blend` 保存 Blender 編輯內容。
8. 要分享模型，可 `File → Export → glTF 2.0`，格式選 GLB。必要時只匯出選取物件。

Blender 修改 GLB 不會自動改寫網站的 `model.js`。若要網站採用你改好的模型，需要把新的 GLB 整合到網頁載入流程；可以把修改檔交給我協助替換。

精確製作請勿直接靠整體縮放：整體縮放會同時改變板厚、孔徑、螺絲和設備尺寸。這是外觀與配置模型，施工需另出標註尺寸圖。

官方文件：https://docs.blender.org/manual/en/5.3/addons/scene_gltf2.html
