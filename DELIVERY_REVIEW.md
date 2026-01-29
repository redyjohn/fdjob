# 交付前 Code Review 報告

**審查日期**：依本次修正完成時  
**專案**：平台回覆系統（Vue 3 + TypeScript + Vite）

---

## 1. 全域清理與檢查

| 項目 | 結果 | 說明 |
|------|------|------|
| `console.log` / `debugger` | **無殘留** | 掃描 `src/` 未發現。 |
| 測試用註解（TODO/FIXME/HACK 等） | **無殘留** | 未發現。 |
| 未使用的變數或導入 | **無** | `npm run build` 通過，`noUnusedLocals` 已開啟，無未使用導入/變數。 |

**結論**：無需清理。

---

## 2. 已修改項目

### 2-1. UI 與品牌

| 檔案 | 修改內容 |
|------|----------|
| `index.html` | **`<title>`** 改為「平台回覆系統」。**`<html lang>`** 改為 `zh-TW`。 |
| `index.html` | **Favicon** 仍為 `href="/FDjob/vite.svg"`；`public/vite.svg` 存在，build 後於 `dist/vite.svg`，部署於 `/FDjob/` 時路徑正確，無 404。 |

### 2-2. API 配置

| 檔案 | 修改內容 |
|------|----------|
| `src/utils/config.ts` | 補充頂部註解：API/WS 優先讀 `window.APP_CONFIG`（`public/config.js`），僅在未載入或未設定時使用 Fallback；環境變數僅供測試與檢測。邏輯不變，仍為 `APP_CONFIG` → `import.meta.env.VITE_*` → `localhost`。 |

**確認**：`src/api/conversations.ts` 僅透過 `getApiUrl` 取得 Base URL，無 hardcode。Mock 內 `https://example.com`、`https://cdn.example.com` 為假資料 URL，非 API Base。

### 2-3. 空狀態與 Loading

| 檔案 | 修改內容 |
|------|----------|
| `ConversationList.vue` | **Loading**：「Loading conversations...」→「載入中…」。 |
| `ConversationList.vue` | **空狀態**：無資料時改為「尚無對話記錄」；若已套用篩選（status/channel/unread/q），額外顯示「若已套用篩選，請調整條件後再試。」（新增 `hasActiveFilters()`）。 |
| `ConversationDetail.vue` | **Loading**：「Loading conversation...」→「載入中…」。 |
| `ConversationDetail.vue` | **找不到對話**：「Conversation Not Found」→「找不到該對話」；說明改為「此對話不存在或已遭刪除，請返回列表。」；按鈕「Back to List」→「返回列表」。 |
| `ConversationDetail.vue` | **尚無訊息**：「No messages yet. Start the conversation!」→「尚無訊息」+「開始回覆以開啟對話。」 |
| `ConversationDetail.vue` | **載入較早訊息**：「Load older messages」/「Loading…」→「載入較早訊息」/「載入中…」。 |

---

## 3. CSV 欄位一致性（Conversation.csv）

對照 `docs/Conversation.csv` 與 `src/api/types.ts`、`mappers`、列表/詳情 UI：

| CSV key | 型別 | 使用處 | 一致 |
|--------|------|--------|------|
| `id` | string | 列表、詳情、導航 | ✓ |
| `customer`（含 `id`, `name`, `customName`, `avatarUrl`, `email`, `phone`, `tags`） | Customer | 列表、詳情、mapper | ✓ |
| `channel` | web \| email \| line \| fb \| ig \| other | 列表、詳情、篩選 | ✓ |
| `status` | open \| pending \| closed | 列表、詳情、篩選、狀態更新 | ✓ |
| `unreadCount` | number | 列表、未讀樣式、篩選 | ✓ |
| `lastMessage`（`id`, `type`, `text`, `createdAt`） | MessageSummary \| null | 列表 `lastMessage?.text`、mapper | ✓ |
| `assignee` | Agent \| null | 列表 `assignee?.name`、mapper | ✓ |
| `tags` | string[] | 列表、mapper | ✓ |
| `updatedAt` | string (ISO8601) | 列表、詳情、排序 | ✓ |
| `createdAt` | string (ISO8601) | mapper、mock | ✓ |

**結論**：UI 與 DTO/mapper 使用的欄位與 Conversation.csv 的 key 命名一致。

---

## 4. 建置與檢查結果

- `npm run build`：**通過**
- Lint（本次修改檔案）：**無錯誤**

---

## 5. 建議手動確認項目

| 項目 | 說明 |
|------|------|
| **Favicon** | 目前使用 `public/vite.svg`。若有正式品牌圖示，請替換 `public/vite.svg` 或調整 `index.html` 的 `href`。 |
| **config.js 載入** | 使用 `base: '/FDjob/'` 且 `config.js` 來自 `public/`。部署至 GitHub Pages 時，請確認 `config.js` 實際可從 `/FDjob/config.js` 取得。 |
| **環境變數** | `VITE_API_BASE_URL`、`VITE_WS_URL` 僅作 Fallback；正式環境以 `config.js` 為準。README 已說明。 |

---

## 6. 修正檔案一覽

- `index.html`
- `src/utils/config.ts`
- `src/views/ConversationList.vue`
- `src/views/ConversationDetail.vue`
- `DELIVERY_REVIEW.md`（本報告）

以上為本次交付前 Code Review 與修正摘要。
