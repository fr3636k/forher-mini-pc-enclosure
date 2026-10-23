# GitHub 使用說明

目標公開儲存庫：`fr3636k/forher-ultrasound-enclosure-3d`。

## 原始碼與展示網址

- GitHub：提供原始碼、版本紀錄與下載。設定為 Public 後，任何人都能查看及複製原始碼。
- 展示網站：https://forher-ultrasound-enclosure-3d.cloudybun6.chatgpt.site
- 推送到 GitHub 不代表展示網站會自動更新；目前未設定 GitHub Actions 或 GitHub Pages 自動發布。
- `package.json` 的 `private: true` 是避免誤發布到 npm，與 GitHub 儲存庫的 Public／Private 無關。

## 目前電腦的更新流程

在 `C:\Users\fr336\Documents\豐禾\超音波木盒` 開啟終端機。

```powershell
npm run check
git status
# 只加入這次確定要提交的檔案，例如：
git add dist/index.html dist/app.js dist/style.css
git commit -m "feat(ui): 調整模型展示介面"
git push github main
```

目前公開 GitHub 遠端命名為 `github`，可用 `git remote -v` 查看。若之後重新 clone 儲存庫，新副本通常會將遠端命名為 `origin`，此時使用 `git push origin main`。

提交格式與範例見 README.md。若要更新展示網站，完成檢查後再請 Codex 將目前版本發布到既有 Sites 網址。

## 查看與分享

公開後可以把儲存庫網址分享給需要看程式碼的人；老師只要看模型，分享展示網站網址即可。

Public 不會讓陌生人直接修改你的 main 分支。他們可以查看、複製或提出 Pull Request；寫入權限仍由 GitHub 的儲存庫權限管理。

## 本次提交訊息修正

原先兩筆 `Update Site source` 已改成：

```text
feat(ui): 新增主機尺寸與容納空間對照
refactor(ui): 移除出線位置選項
```

程式檔案樹不變，後續提交的內容與作者資訊保留。修正前的本機歷史已保存於 Git 備份 ref，細節記錄在 `.git/commit-message-backup.json`；此備份不會隨一般 `git push github main` 上傳。
