# Platform Reply System

Vue 3 + TypeScript + Vite 建置的客服回覆系統前端專案。

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

應用程式將在 `http://localhost:5173` 啟動。

### 建置生產版本

```bash
npm run build
```

建置產出將在 `dist/` 目錄中。

### 預覽建置結果

```bash
npm run preview
```

## 重要：API 配置

### `public/config.js` 運作機制

- **用途**：提供執行期 API / WebSocket 網址，部署後可直接修改，**無需重新 build**。
- **載入**：`index.html` 於頁面載入時以 `<script src=".../config.js">` 引入，寫入 `window.APP_CONFIG`。
- **讀取**：`src/utils/config.ts` 的 `getApiBaseUrl()`、`getWebSocketUrl()`、`getApiUrl(endpoint)` 優先讀取 `window.APP_CONFIG`，若未設定再 fallback 到 `import.meta.env`（Vite 建置時注入）。

```javascript
// public/config.js
window.APP_CONFIG = {
  API_URL: 'http://localhost:3000',
  WS_URL: 'ws://localhost:3000'
};
```

### 開發環境 vs 生產環境切換

| 情境 | 作法 |
|------|------|
| **開發** (`npm run dev`) | 預設使用 `public/config.js` 的 `API_URL` / `WS_URL`；若未載入則用 `import.meta.env.VITE_*` 或 `http://localhost:3000`。 |
| **生產**（部署後） | 修改伺服器上的 `config.js`（或 CDN 對應檔）即可切換 API / WS 網址，重新整理後生效。 |
| **環境變數** | 僅供**測試與檢測**使用；正式環境以 `config.js` 為準。後端接手時請以 `config.js` 為主，README 說明如何更換 API baseURL。 |

### 如何修改 API 網址

1. **開發環境**：編輯 `public/config.js` 的 `API_URL`、`WS_URL`。
2. **生產環境**：部署後直接改 `config.js`，無需重新建置。

### 使用配置

```typescript
import { getApiBaseUrl, getWebSocketUrl, getApiUrl } from '@/utils/config'

const apiUrl = getApiBaseUrl()
const wsUrl = getWebSocketUrl()
const url = getApiUrl('conversations')  // base + '/conversations'
```

## 技術堆疊

- **Vue 3.5.24** - Composition API
- **TypeScript 5.9.3** - 型別系統
- **Vite 7.2.4** - 建置工具
- **Tailwind CSS v4** - 樣式框架
- **Vue Router 4.6.4** - 路由管理
- **Pinia 3.0.4** - 狀態管理（已安裝，待使用）
- **lucide-vue-next** - 圖示庫
- **date-fns** - 日期處理

## 專案結構

```
src/
├── api/
│   ├── conversations.ts # HTTP API 用戶端（含 401/403/404/429/5xx 處理）
│   ├── dtos.ts          # DTO（依 docs CSV）
│   ├── mappers.ts       # DTO → UI Model
│   ├── mocks.ts         # Mock API
│   └── types.ts         # UI 型別
├── components/layout/
│   └── DefaultLayout.vue
├── router/index.ts      # /conversations, /conversations/:conversationId
├── utils/
│   ├── config.ts        # API/WS URL（讀 config.js）
│   ├── apiError.ts      # ApiError（429 等）
│   └── toast.ts         # showError、檔案大小上限
├── views/
│   ├── ConversationList.vue   # 對話列表（篩選、搜尋、排序）
│   ├── ConversationDetail.vue # 對話詳情（訊息、回覆、已讀）
│   └── Settings.vue
├── App.vue
└── main.ts

public/
├── config.js            # 執行期 API/WS 設定（可部署後修改）
└── 404.html             # SPA 路由
```

## 功能清單

### ✅ 已實作

- [x] 對話列表（查詢、篩選、分頁、排序、channel / q / sort）
- [x] 對話詳情（`/conversations/:conversationId`）
- [x] 訊息列表（含 hasMore / nextBefore 載入更多）
- [x] 訊息發送（純文字、clientMessageId 去重）
- [x] 檔案上傳（FormData、大小檢查）
- [x] WebSocket 即時推播（Mock）
- [x] 已讀僅在進入詳情時更新（onMounted）
- [x] 狀態更新、assignee / tags 顯示
- [x] 錯誤處理（401/403/404/429/5xx）、429 提示「請求頻繁，請稍候」
- [x] 發送失敗 UI 提示（Toast / Alert）

## 模擬功能（Mock）

目前專案使用 Mock API 進行開發，以下功能為模擬實作：

### 1. WebSocket 即時推播

- **位置**：`src/api/mocks.ts` - `MockSocketService` 類別
- **功能**：模擬每 10 秒接收一則來自用戶的新訊息
- **使用方式**：
  ```typescript
  import { mockSocketService } from '@/api/mocks'
  
  mockSocketService.connect(ticketId, (message) => {
    // 處理新訊息
  })
  ```
- **切換到真實 WebSocket**：更新 `src/views/ConversationDetail.vue` 中的 WebSocket 連線邏輯

### 2. 檔案上傳

- **位置**：`src/api/mocks.ts` - `uploadFile()` 函數
- **功能**：模擬檔案上傳，回傳模擬的檔案 URL
- **使用方式**：
  ```typescript
  import { uploadFile } from '@/api/mocks'
  
  const formData = new FormData()
  formData.append('file', file)
  const fileUrl = await uploadFile(formData)
  ```
- **切換到真實 API**：更新 `uploadFile` 函數，使用 `getApiUrl('api/upload')` 呼叫真實端點

## API 串接說明

### Endpoint 對照（docs CSV）

| 功能 | 方法 | 路徑 | 參數 / Body |
|------|------|------|-------------|
| 對話列表 | GET | `/conversations` | Query: `page`, `pageSize`, `q`, `status`, `channel`, `assigneeId`, `unread`, `sort`（updatedAt_desc \| updatedAt_asc）, `updatedAfter` |
| 單一對話詳情 | GET | `/conversations/{conversationId}` | — |
| 訊息列表 | GET | `/conversations/{conversationId}/messages` | Query: `nextBefore`（cursor）；回傳 `meta: { hasMore, nextBefore }` |
| 發送訊息 | POST | `/conversations/{conversationId}/messages` | Body: `text`, `attachments?`, `clientMessageId?` |

實作位置：`src/api/conversations.ts`。BaseURL 來自 `public/config.js`（`getApiUrl()`）。

### 發送訊息與 clientMessageId

Excel 規定發送時可帶 **clientMessageId**（前端去重用）。流程如下：

1. 發送前呼叫 `createClientMessageId()` 取得唯一 id。
2. 呼叫 `postMessage(conversationId, { text, clientMessageId })` 或 mock 的 `sendMessage(..., { clientMessageId })`。
3. 重試時帶**相同** `clientMessageId`，後端／mock 可依此去重，避免重複訊息。

`ConversationDetail.vue` 的發送邏輯（文字、附件）每次都帶 `clientMessageId`。

### 目前狀態

專案目前使用 Mock API (`src/api/mocks.ts`)，所有 API 呼叫都模擬延遲並回傳假資料。真實 HTTP 呼叫可改用 `src/api/conversations.ts` 的 `getConversations`、`getConversation`、`getConversationMessages`、`postMessage`。

### 切換到真實 API

1. **對話列表／詳情／訊息**：改為使用 `conversations` API：

```typescript
import { getConversations, getConversation, getConversationMessages, postMessage, createClientMessageId } from '@/api/conversations'

const { data, meta } = await getConversations({ status: 'open', channel: 'web', q: '...', page: 1 })
const conv = await getConversation(id)
const { data, meta } = await getConversationMessages(conversationId)
await postMessage(conversationId, { text: '...', clientMessageId: createClientMessageId() })
```

2. **WebSocket 連線**：在 `ConversationDetail.vue` 將 `mockSocketService` 改為真實 WebSocket（`getWebSocketUrl()`）。

3. **檔案上傳**：維持 FormData POST 至後端上傳端點，取得 URL 後再以 `attachments` 呼叫 `postMessage`。

### 重要提醒

- `src/api/dtos.ts`、`src/api/types.ts` 已對齊 `docs/` CSV（如 `customName`, `clientMessageId`, `readedAt`, `hasMore`, `nextBefore` 等）。若後端規格變更，請同步更新 DTO 與 mappers。

## 部署

### GitHub Pages

專案已設定 GitHub Pages 自動部署：

- **Repository**: https://github.com/redyjohn/FDjob
- **部署網址**: https://redyjohn.github.io/FDjob/
- **Workflow**: `.github/workflows/deploy.yml`

每次 push 到 `main` 分支會自動觸發部署。

### 部署後修改 API 網址

1. 在 GitHub 上編輯 `public/config.js` 檔案
2. 或直接修改部署伺服器上的 `config.js` 檔案
3. 重新載入頁面即可生效，**無需重新建置**

## 瀏覽器支援

- Chrome (最新版)
- Safari (最新版)
- Firefox (最新版)
- Edge (最新版)

## 專案規範

### 命名規範

- 元件：PascalCase (例：`ConversationList.vue`)
- 檔案：kebab-case (例：`ticket-list.vue`)
- 變數/函式：camelCase (例：`fetchConversations`)

### 程式碼風格

- 使用 TypeScript 嚴格模式
- 使用 Composition API (`<script setup>`)
- Tailwind CSS 進行樣式設計

## 後端工程師交接事項

### 1. API Base URL 設定

- 修改 `public/config.js` 中的 `API_URL` 和 `WS_URL`
- 部署後可直接修改此檔案，無需重新建置

### 2. WebSocket 連線

- 設定 `WS_URL` 環境變數或修改 `public/config.js`
- 更新 `src/views/ConversationDetail.vue` 中的 WebSocket 連線邏輯

### 3. 介面屬性對應

- `src/api/dtos.ts`、`src/api/types.ts` 已對齊 docs CSV（如 `customName`, `clientMessageId`, `readedAt` 等）。
- 若後端欄位有異動，請同步更新 DTO 與 mappers。

### 4. 錯誤處理

- `conversations.ts` 的 `handleResponse` 已針對 401/403/404/429/5xx 拋出 `ApiError`。
- 429 時 UI 顯示「請求頻繁，請稍候」。

### 5. 檔案上傳

- 確認後端檔案上傳端點
- 更新 `uploadFile` 函式中的 API 路徑

## 聯絡資訊

如有問題，請參考：
- GitHub Issues: https://github.com/redyjohn/FDjob/issues
- 專案文件：本 README
