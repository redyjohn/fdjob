# 平台回覆系統（Platform Reply System）

## 專案簡介

本專案為基於 **Vue 3 + TypeScript + Vite** 建置的**客服系統前端原型**，採用規格驅動開發（Specification-Driven Development）：所有 API 介面、資料結構與錯誤處理均**完全遵循**專案根目錄下 `/docs` 資料夾內的 **CSV API 規範** 開發。

- **規範來源**：`docs/` 內之 `Conversation.csv`、`Message.csv`、`Customer.csv`、`Attachment.csv`、`Meta.csv`、`MessageSummary.csv`、`API 文件.csv`。
- **目標**：在無後端環境下，透過 Mock 資料完成完整功能開發；後端就緒後，僅需切換 API 來源與 WebSocket 連線即可對接，無需改動 UI 與業務邏輯層。

**快速開始**：`git clone https://github.com/redyjohn/fdjob.git` → `cd fdjob` → `npm install` → `npm run dev` → 開啟 **http://localhost:5173/fdjob/**。

---

## 技術棧（Tech Stack）

| 類別 | 技術 | 說明 |
|------|------|------|
| 框架 | **Vue 3** | Composition API、`<script setup>` |
| 語言 | **TypeScript** | 嚴格型別、DTO/Model 分層 |
| 建置 | **Vite** | 開發伺服器與生產建置 |
| 狀態 | **Pinia** | 全域狀態管理（已安裝，可擴充） |
| 路由 | **Vue Router** | SPA 路由（`/conversations`、`/conversations/:id`） |
| 樣式 | **Tailwind CSS v4** | 原子化 CSS、響應式版面 |
| 圖示 | **lucide-vue-next** | 圖示元件 |
| 工具 | **date-fns** | 日期格式化（ISO8601 ↔ 顯示） |
| 工具 | **@vueuse/core** | 組合式工具（如 `useDebounceFn`） |
| HTTP | **Fetch API** | 原生 `fetch`，無額外依賴；Base URL 由 `config.js` 提供 |

---

## 核心設計模式

### 1. Adapter Pattern（Mappers）

為確保**後端 CSV 規格的 DTO** 與**前端 UI 所需的 Model** 解耦，專案透過**轉接層（Mappers）** 統一轉換：

- **DTO 層**（`src/api/dtos.ts`）：與 CSV 規範一致，採用 **snake_case** 或 Excel 表頭命名（如 `customName`、`unreadCount`、`readedAt`、`clientMessageId`、`hasMore`、`nextBefore`）。
- **Model 層**（`src/api/types.ts`）：供 View 使用的型別，維持 **camelCase** 與前端語意。
- **轉換**（`src/api/mappers.ts`）：`mapConversationDTOToListItem`、`mapMessageDTOToModel` 等，將 DTO 轉為 Model，避免 View 直接依賴後端欄位名。

此設計保證：

- 後端欄位更名或格式調整時，僅需修改 DTO 與 Mapper，**資料流穩定**且**與 UI 解耦**。

### 2. Mocking Strategy

- **目的**：在無後端環境下進行**完整功能開發與驗收**，並預留後端對接介面。
- **實作**：`src/api/mocks.ts` 提供與 `conversations.ts` **相同簽名**的 Mock 函式（如 `getConversations`、`getConversation`、`getConversationMessages`、`sendMessage`、`uploadFile`），含分頁、篩選、排序、`clientMessageId` 去重、`meta.hasMore` / `nextBefore` 等。
- **切換方式**：View 層僅依賴 `@/api/mocks` 或 `@/api/conversations`；對接後端時改為從 `conversations.ts` 取得資料，並將 WebSocket 從 `MockSocketService` 改為真實 `getWebSocketUrl()` 連線即可。

---

## 環境配置（Runtime Configuration）

### `public/config.js` 的用途

- **執行期設定**：提供 **API Base URL** 與 **WebSocket 地址**，在**不重新打包**的前提下，部署後仍可修改。
- **載入方式**：`index.html` 設 `<base href="/fdjob/">`，以 `<script src="config.js">` 相對路徑於頁面載入時引入，寫入 `window.APP_CONFIG`。
- **讀取方式**：`src/utils/config.ts` 的 `getApiBaseUrl()`、`getWebSocketUrl()`、`getApiUrl(endpoint)` **優先**讀取 `window.APP_CONFIG`；若未設定，則 fallback 至 `import.meta.env.VITE_*` 或預設 `localhost`。

### 如何在不重新打包下更換 API / WebSocket

1. **開發**：編輯 `public/config.js` 的 `API_URL`、`WS_URL`，存檔後重新整理即可。
2. **生產**：部署後直接修改伺服器或 CDN 上的 `config.js`，重新整理後即生效，**無需再次執行 `npm run build`**。

```javascript
// public/config.js
window.APP_CONFIG = {
  API_URL: 'https://api.example.com',
  WS_URL: 'wss://api.example.com'
};
```

```typescript
// 使用方式
import { getApiBaseUrl, getWebSocketUrl, getApiUrl } from '@/utils/config'

const base = getApiBaseUrl()
const ws = getWebSocketUrl()
const url = getApiUrl('conversations')  // base + '/conversations'
```

---

## API 符合度說明

專案已依 `docs/` CSV 規範實作下列資源與行為，並處理 `traceId` 與 429 Rate Limit 等細節。

### 資源對照表

| 規範檔案 | 對接狀態 | 說明 |
|----------|----------|------|
| **Conversation.csv** | ✅ 已對接 | 列表/詳情：`id`、`customer`、`channel`、`status`、`unreadCount`、`lastMessage`、`assignee`、`tags`、`updatedAt`、`createdAt`；篩選 `q`、`status`、`channel`、`assigneeId`、`unread`、`sort`、`updatedAfter`；分頁 `page`、`pageSize`；狀態更新。 |
| **Message.csv** | ✅ 已對接 | 訊息列表：`nextBefore`、`meta.hasMore`、`meta.nextBefore`；訊息欄位 `senderType`、`type`、`text`、`attachments`、`createdAt`、`readedAt`；POST 發送 `text`、`attachments`、`clientMessageId`。 |
| **Customer.csv** | ✅ 已對接 | `id`、`name`、`customName`、`avatarUrl`、`email`、`phone`、`loginAt`、`tags`；列表顯示 `customName \|\| name`、頭像；詳情頁右側**客戶資訊卡**顯示 id、email、phone、loginAt。 |
| **Attachment.csv** | ✅ 已對接 | `fileId`、`fileName`、`mimeType`、`size`、`url`；上傳後以 `attachments` 傳入 `postMessage`；前端驗證 10MB 與 mimeType 白名單。 |
| **Meta.csv** / 分頁 | ✅ 已對接 | 列表 `page`、`pageSize`、`total`、`totalPages`；訊息 `hasMore`、`nextBefore`。 |

### 細節處理

- **traceId 解析**：`conversations.ts` 的 `handleResponse` 自回應 body 解析 `traceId`，並帶入 `ApiError`；**所有錯誤提示（Toast/Alert）** 皆透過 `showError(message, traceId)` 一併顯示 traceId，供除錯與日誌追蹤。
- **429 Rate Limit**：收到 429 時拋出 `ApiError`（`isRateLimit`），UI 透過 `showError` 顯示「請求頻繁，請稍候」。

---

## 開發與部署指令

| 指令 | 說明 |
|------|------|
| `npm install` | 安裝依賴 |
| `npm run dev` | 啟動開發伺服器；應用位於 `http://localhost:5173/fdjob/` |
| `npm run build` | 型別檢查（`vue-tsc -b`）並建置生產版本至 `dist/` |
| `npm run preview` | 預覽 `dist/` 建置結果 |

**避免 404**（`base` 為 `/fdjob/`）：

- **開發**：`npm run dev` 後開啟 **http://localhost:5173/fdjob/**
- **預覽**：`npm run preview` 後開啟 **http://localhost:4173/fdjob/**（勿開根路徑）
- **正式**：GitHub Pages 通常為 **https://redyjohn.github.io/fdjob/**
- **Repository**：[redyjohn/fdjob](https://github.com/redyjohn/fdjob)（clone：`https://github.com/redyjohn/fdjob.git`）

若用 `npx serve dist` 等靜態伺服器開根路徑，`config.js` 與 assets 會 404；請改用 `npm run preview` 或確保伺服器對應至 `/fdjob/`。

---

## 交接細節

### 路由語意對照

| 路由 | 對應規範 | 說明 |
|------|----------|------|
| `/` | — | 重導向至 `/conversations` |
| `/conversations` | **Conversation.csv** | 對話列表（篩選：status、channel、assigneeId、unread、updatedAfter、搜尋 q、排序 sort；分頁、載入更多；WebSocket 推播時未讀數即時增加） |
| `/conversations/:conversationId` | **Conversation.csv** + **Message.csv** | 對話詳情與訊息列表；參數名 `conversationId` 與 API 路徑一致 |
| `/settings` | — | 設定頁 |

### 檔案上傳協議（FormData 直傳）

- 前端以 **FormData** 將檔案 **直接 POST** 至後端上傳端點（目前 Mock 在 `mocks.uploadFile`），取得回傳之檔案 URL 後，再將 `attachments`（含 `fileId`、`fileName`、`mimeType`、`size`、`url`）帶入 `postMessage`。
- 後端對接時：將 `uploadFile` 改為呼叫真實上傳 API（如 `getApiUrl('api/upload')`），維持 **FormData 直傳**，無需先請求 upload URL 再上傳的額外流程。

---

## 專案結構（精簡）

```
src/
├── api/
│   ├── conversations.ts   # HTTP API 用戶端（fetch、handleResponse、traceId、429）
│   ├── dtos.ts             # DTO，對齊 docs CSV
│   ├── mappers.ts         # DTO → UI Model（Adapter）
│   ├── mocks.ts            # Mock API + MockSocketService + getAssigneeOptions
│   └── types.ts            # UI 型別
├── components/layout/
│   └── DefaultLayout.vue
├── router/index.ts
├── stores/
│   └── unread.ts           # 列表未讀即時增量（WebSocket 推播時 incrementUnread）
├── utils/
│   ├── config.ts           # API/WS URL（config.js）
│   ├── apiError.ts         # ApiError、isRateLimit
│   ├── toast.ts            # showError(message, traceId)、檔案大小提示
│   └── upload.ts           # validateFileBeforeUpload、mimeType/size 限制
├── views/
│   ├── ConversationList.vue   # 篩選 assigneeId、updatedAfter；displayUnreadCount = unreadCount + store.getDelta
│   ├── ConversationDetail.vue # 訊息、回覆、客戶資訊卡（id/email/phone/loginAt）、狀態更新
│   └── Settings.vue
├── App.vue                  # 訂閱 mockSocketService.subscribeGlobal → 列表 unread 即時更新
└── main.ts

public/
├── config.js               # 執行期 API/WS（可部署後修改）
└── 404.html
docs/                       # CSV API 規範
├── Conversation.csv
├── Message.csv
├── Customer.csv
├── Attachment.csv
├── Meta.csv
├── MessageSummary.csv
└── API 文件.csv
```

---

## 部署與後端對接

- **GitHub Pages**：Repository [redyjohn/fdjob](https://github.com/redyjohn/fdjob)（clone：`https://github.com/redyjohn/fdjob.git`），Workflow `.github/workflows/deploy.yml`，push `main` 後自動部署；上線後可透過修改 `config.js` 更換 API/WS 網址。預覽：**https://redyjohn.github.io/fdjob/**（依 Pages 設定）。
- **切換真實 API**：View 改為使用 `@/api/conversations` 的 `getConversations`、`getConversation`、`getConversationMessages`、`postMessage`；WebSocket 改為 `getWebSocketUrl()`；上傳改為 FormData POST 至後端上傳端點。

### 相關文件

| 文件 | 說明 |
|------|------|
| **CLIENT_COMPLIANCE_REPORT.md** | 客戶需求清單合規報告（依 CSV 逐項對照） |
| **COMPLIANCE_CHECKLIST_REPORT.md** | 完整檢查清單（分類表格、符合度總結、建議修改） |
| **DELIVERY_REVIEW.md** | 交付前程式碼審查與優化紀錄 |

更多實作細節（功能清單、錯誤處理、`clientMessageId`、命名規範等）見上述文件與 README 各章節。
