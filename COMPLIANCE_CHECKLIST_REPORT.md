# 客戶需求清單合規檢查報告

**專案**：平台回覆系統（Vue 3 + TypeScript + Vite 客服系統前端）  
**對照規範**：`docs/` CSV（Customer.csv, API 文件.csv, Attachment.csv, MessageSummary.csv, Message.csv, Meta.csv, Conversation.csv）  
**檢查日期**：依最新程式碼掃描  
**框架**：Vue 3（非 React/Next.js；依專案指定框架）

---

## 1. 提供的素材

### 1-1. 既有 API 文件

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| API 回應含 `data`、`meta`、`traceId` | Conversation.csv, Message.csv | 回應結構一致 | **是** | `dtos.ts`、`mocks.ts`、`conversations.ts` 已支援；`handleResponse` 解析 `traceId`。 |
| 時間格式 ISO8601（如 `2026-01-19T09:10:00Z`） | 各 CSV | 日期字串一致 | **是** | Mock 與 DTO 使用 `toISOString()` / 既有 ISO 字串。 |
| 精確 key/type（如 `id` string、`status` open\|pending\|closed、`senderType` customer\|agent\|system） | 各 CSV | 命名與型別對齊 | **是** | `dtos.ts`、`types.ts`、`mappers.ts` 已對齊；`customName`、`loginAt`、`clientMessageId`、`readedAt` 等皆符合。 |

### 1-2. 必要 Endpoints

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| GET `/conversations`（列表） | Conversation.csv | — | **是** | `conversations.ts`、`mocks.ts` 已實作。 |
| GET `/conversations/{conversationId}`（詳情） | Message.csv（GET 區塊） | — | **是** | 路徑使用 `conversationId`，與規格一致。 |
| GET `/conversations/{conversationId}/messages`（訊息列表） | Message.csv | — | **是** | 已實作，含 `nextBefore` 分頁。 |
| POST 回覆/附件 | Message.csv, Conversation.csv | — | **是** | `postMessage`；附件經上傳後以 `attachments` 送出。 |

### 1-2-1. 對話列表

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 使用 Meta：`page`、`pageSize`、`total`、`totalPages` | Meta.csv, Conversation.csv | — | **是** | `MetaDTO`、mock 回傳、列表 consume `meta`。 |
| 支援 `q`（搜尋） | Conversation.csv GET params | — | **是** | 搜尋框 + debounce，傳入 `getConversations`。 |
| 支援 `status` | 同上 | open\|pending\|closed | **是** | 下拉篩選，對應 API。 |
| 支援 `channel` | 同上 | web\|email\|line\|fb\|ig\|other | **是** | 下拉篩選。 |
| 支援 `assigneeId` | 同上 | — | **是** | `ConversationList.vue` 有 assignee 下拉，`buildParams()` 傳入 `assigneeId`。 |
| 支援 `unread` | 同上 | boolean | **是** | 篩選列有「只看未讀 (unread)」Checkbox。 |
| 支援 `sort`：`updatedAt_desc` \| `updatedAt_asc` | 同上 | — | **是** | 排序下拉，對應 API。 |
| 支援 `updatedAfter` | 同上 | ISO8601 | **是** | 列表有「更新時間 ≥」datetime-local 輸入，轉 ISO 傳入。 |
| 分頁 UI（載入更多） | Meta | 列表分頁 | **是** | `meta.page < meta.totalPages` 時顯示「載入更多」，`page + 1` 請求並 append。 |

### 1-2-2. 對話內容（訊息列表）

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 訊息 `type`：text \| file \| image \| system | Message.csv | — | **是** | DTO/Model 與 UI 支援；mock 含 text、file。 |
| 訊息 `text` | 同上 | — | **是** | 有顯示。 |
| 訊息 `attachments`（Attachment：fileId, fileName, mimeType, size, url） | Attachment.csv, Message.csv | — | **是** | `AttachmentModel` 含上述欄位；UI 顯示 fileName、url（下載）。 |
| 訊息 `readedAt`（讀取時間） | Message.csv | — | **是** | 氣泡旁若 `readedAt` 有值顯示「已讀」；agent 顯示「已發送」/「發送中…」。 |
| 訊息 `createdAt` | 同上 | — | **是** | 有顯示（HH:mm）。 |
| `meta.hasMore`、`nextBefore` | Message.csv | 訊息分頁 | **是** | 支援「載入較早訊息」與 `loadMore`。 |

### 1-2-3. 回覆送出

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| POST body：`text`、`attachments`、`clientMessageId` | Message.csv | 去重用 | **是** | `postMessage` 皆支援；mock 依 `clientMessageId` 去重。 |
| 回傳含 `id`、`createdAt` | 同上 | — | **是** | Mock 回傳 `MessageModel` 含之。 |
| 輸入框純文字 | 額外要求 | 無富文本 | **是** | 使用 `<textarea>`。 |
| 無草稿/模板/罐頭訊息 | 額外要求 | — | **是** | 未實作。 |
| 樂觀更新（clientMessageId） | 額外要求 | — | **是** | 送出前 push 臨時訊息（`temp-${clientMessageId}`），成功後替換，失敗則移除並 `showError`。 |

### 1-2-4. 狀態變更

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 更新 `status`（open\|pending\|closed） | Conversation.csv | 若有則做 | **是** | `updateConversationStatus` + 詳情頁下拉。 |
| PATCH 更新 `tags`（string[]） | 清單「若有」 | — | **否** | 未實作。若規格有 PATCH tags，可新增 `updateConversationTags` 及 UI。 |
| PATCH 更新 `assignee`（id, name, role） | 清單「若有」 | — | **否** | 未實作。若規格有，可新增 assignee 選擇與 API。 |

### 1-2-5. 檔案上傳

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| Form Data 直接 POST 到後端 | 額外要求 | 無需先取 upload URL | **是** | 流程為 FormData → `uploadFile`（mock）；註解說明對接真實端點改為 `fetch(getApiUrl('api/upload'), { method: 'POST', body: formData })`。 |
| mimeType / size 限制 | Attachment.csv | — | **是** | `validateFileBeforeUpload` 檢查 10MB、mimeType 白名單（圖片、PDF、Word）。 |
| 整合到 `attachments` | Message.csv | — | **是** | 上傳後組 `AttachmentDTO`，以 `attachments` 傳入 `postMessage`。 |

### 1-3. 錯誤碼處理

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 401 / 403 / 404 / 429 / 5xx 分支處理 | 清單 | 顯示對應訊息 | **是** | `conversations.ts` `handleResponse` 擲 `ApiError(status, traceId)`。 |
| 所有錯誤提示（Toast/Alert）含 API 回傳 `traceId` | 清單 | — | **是** | `showError(message, traceId)`；發送失敗、上傳失敗、狀態更新失敗、429 等皆傳入 `e.traceId`。 |
| 429 Rate limit 整合 UI | 清單 | — | **是** | 捕獲 `ApiError` 且 `isRateLimit` 時，`showError(RATE_LIMIT_MESSAGE, e.traceId)`（「請求頻繁，請稍候」）。 |

### 1-3-2. Rate limit

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 代碼處理 429 | API | — | **是** | `ApiError.isRateLimit`、`showError` 含 traceId。 |

---

## 2. UI 參考與畫面需求

### 2-1. UI 參考

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 依 Figma；Logo/Avatar/Icon 從 Figma 下載 | 清單 | — | **部分** | 目前為 Lucide 圖示與 placeholder。若已提供 Figma：替換 Logo、預設頭像、特殊 Icon。 |

### 2-2. 頁面範圍

#### 2-2-1. 列表頁

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| `id` | Conversation.csv | — | **是** | 用於導航；詳情 Header 有 `#{{ conversation.id }}`。 |
| `customer`：id, name, avatarUrl, email, phone | Customer.csv | — | **是** | 列表顯示 name（`customName \|\| name`）、avatarUrl；詳情右側「客戶資訊卡」顯示 id、email、phone、loginAt。 |
| `channel` | Conversation.csv | — | **是** | 有。 |
| `status` | 同上 | — | **是** | 有。 |
| `unreadCount` | 同上 | — | **是** | 有欄位 + 未讀樣式；含 WebSocket 即時增量（unreadStore.getDelta）。 |
| `lastMessage`：id, type, text, createdAt | MessageSummary.csv | — | **是** | 顯示 text；id/type/createdAt 在 Model 有，列表主要顯示 text。 |
| `assignee` | Conversation.csv | — | **是** | 顯示 `assignee.name`。 |
| `tags` | 同上 | — | **是** | 有。 |
| `updatedAt`、`createdAt` | 同上 | — | **是** | 列表顯示 updatedAt；createdAt 在 Model 有。 |

#### 2-2-2. 對話頁

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 訊息：senderType, senderId, type, text, attachments, createdAt, readedAt | Message.csv | — | **是** | 有 senderType, type, text, attachments, createdAt, readedAt；senderId 在 Model 有，UI 未單獨顯示（可選補）。 |
| WebSocket 即時推播新訊息/更新 | 額外要求 | — | **是** | `MockSocketService` 模擬；Detail 訂閱；App 訂閱 global 以更新列表 unreadCount。 |

#### 2-2-3. 回覆區

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 純文字輸入 | 額外要求 | — | **是** | textarea。 |
| 送出按鈕 | — | — | **是** | 有。 |
| 附件上傳（Form Data POST） | 額外要求 | — | **是** | 選檔 → FormData → `uploadFile`；對接時改為直 POST 後端。 |

### 2-3. 畫面狀態

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| Figma 未提供則不製作 Loading/空狀態/錯誤狀態 | 清單 | — | **部分** | 目前有 Loading（列表、詳情）、空狀態（無對話、無訊息）、錯誤（找不到對話、發送失敗、traceId 提示）。若**嚴格**依「Figma 未提供則不製作」，則不額外做；若有提供再對 Figma 補齊。 |

### 2-4. 互動規則

#### 2-4-1. 篩選/搜尋/分頁

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| UI 對應 API params（q, status, channel, assigneeId, unread, sort, updatedAfter） | Conversation.csv | — | **是** | 已對應。 |
| 支援 `hasMore`（訊息） | Message.csv meta | — | **是** | 「載入較早訊息」依 `meta.hasMore`。 |
| 列表分頁 UI | Meta | — | **是** | 「載入更多」依 `meta.page` / `meta.totalPages`。 |

#### 2-4-2. 已讀/未讀

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| `unreadCount` 顯示 | Conversation.csv | — | **是** | 列表有，含即時增量。 |
| 已讀僅在點擊進入對話時更新 `readedAt` | 額外要求 | — | **是** | `markConversationRead` 僅在 `ConversationDetail` `onMounted` 呼叫。 |
| WebSocket 推播 unread 更新 | 清單 | — | **是** | App 訂閱 `mockSocketService.subscribeGlobal`，非當前對話時 `unreadStore.incrementUnread`；列表顯示 `unreadCount + getDelta(id)`。 |

#### 2-4-3. 回覆提示

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 送出成功/失敗 UI 反饋 | 清單 | — | **是** | 失敗時 `showError`（含 traceId）；成功則即時出現訊息（樂觀更新替換）。 |
| 使用 `clientMessageId` 樂觀更新 | 清單 | — | **是** | 已實作。 |

### 2-5. 裝置支援

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| Desktop only；無 RWD | 清單 | — | **是** | 無特別做 RWD。 |
| Chrome / Safari 最新版 | 清單 | — | **是** | 一般 SPA 相容。 |

---

## 3. 帳號權限與測試資料

### 3-1. 帳號

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 無登入頁面 | 額外要求 | — | **是** | 無登入、無 auth 路由或守衛；grep 無 auth 相關。 |
| mock / 環境變數模擬 role（agent \| admin）、permissions | 清單 | — | **部分** | Header 固定「Agent 001」；未依 `role` / `permissions` 做權限邏輯。若需要，可從 config 或 mock 讀 role，再控制 UI。 |

### 3-2. 測試資料

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 多頁/不同 status 資料 | Meta, Conversation | — | **是** | Mock 25+ 筆、多 status；分頁、「載入更多」。 |
| 附件、多種訊息 type | Attachment, Message | — | **是** | Mock 含 file、text；有 `AttachmentDTO` 範例。 |

---

## 4. 專案規範與交付

### 4-1. 技術

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 使用指定框架（Vue / React / Next） | 清單 | — | **是** | Vue 3 + Vite + TypeScript。 |

### 4-2. 品牌

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| Logo/色票/字體/元件風格 | 清單 | — | **部分** | 現為通用 Tailwind + Lucide；若有品牌規範，再替換 Logo、色票、字體。 |

### 4-3. 部署

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| build 輸出 static | — | — | **是** | `vite build` → `dist/` 靜態檔。 |
| 測試站域名/路徑 | — | — | **是** | `base: '/fdjob/'`；GitHub Pages（如 https://redyjohn.github.io/fdjob/）可對應。 |

### 4-4. 初次提案

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 路由 `/conversations`、`/conversations/:id` | 清單 | — | **是** | 實際為 `/conversations`、`/conversations/:conversationId`，語意一致。 |

### 4-5. 最後交件

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| 源碼完整 | — | — | **是** | 結構完整。 |
| README 說明換 API baseURL；環境變數僅測試用 | 清單 | — | **是** | README 含 `config.js` 機制、dev/prod 切換、環境變數說明。 |
| 可運行版本 | — | — | **是** | `npm run dev` / `npm run build`。 |
| 串接文件 | — | — | **是** | README 有 API、config、交接說明。 |

---

## 5. 額外全局檢查

| 檢查項目 | 對應 CSV/API | 額外要求 | 確認狀態 | 潛在問題 / 建議修改 |
|----------|--------------|----------|----------|----------------------|
| WebSocket 用於即時訊息/狀態 | 額外要求 | — | **是** | Mock WS 推播新訊息；Detail 訂閱；App 訂閱 global 更新列表 unread。 |
| 無登入頁面 | 額外要求 | — | **是** | 已確認。 |
| Figma 完整度：無 Loading/Error/Empty 若未提供 | 清單 | — | **部分** | 見 2-3。 |
| 環境變數僅測試用，README 說明 | 清單 | — | **是** | 已說明。 |
| API 名稱精確匹配 CSV（如 customName, loginAt, clientMessageId, readedAt） | 各 CSV | — | **是** | DTO / types / mappers / mocks 已對齊。 |

---

## 6. 依分類彙總表（精簡）

| 分類 | 已符合 | 部分符合 | 不符合 |
|------|--------|----------|--------|
| **1. 提供的素材** | 1-1, 1-2, 1-2-1, 1-2-2, 1-2-3, 1-2-4 status, 1-2-5, 1-3, 1-3-2 | — | 1-2-4（PATCH tags, PATCH assignee 未實作） |
| **2. UI 與畫面** | 2-2 多數, 2-2-3, 2-4, 2-5 | 2-1（Figma 素材）, 2-3（Loading/Empty/Error 若嚴格依 Figma） | — |
| **3. 帳號與測試** | 3-1 無登入, 3-2 | 3-1（role/permissions 模擬） | — |
| **4. 規範與交付** | 4-1, 4-3, 4-4, 4-5 | 4-2（品牌） | — |
| **5. 全局** | WebSocket, 無登入, 環境變數, CSV 命名 | Figma Loading/Error/Empty | — |

---

## 7. 建議修改處與 patch 要點（僅針對「否」或規格有要求時）

### 7-1. PATCH tags / assignee（規格「若有」則實作）

**現狀**：未實作 PATCH 更新 `tags`、PATCH 更新 `assignee`。

**Patch 建議**：

1. **API 層**（`src/api/conversations.ts`、`src/api/mocks.ts`）  
   - 新增 `updateConversationTags(conversationId: string, tags: string[]): Promise<ConversationDTO | null>`，對應 `PATCH /conversations/{id}` body `{ tags }`。  
   - 新增 `updateConversationAssignee(conversationId: string, assigneeId: string | null): Promise<ConversationDTO | null>`，對應 `PATCH /conversations/{id}` body `{ assigneeId }` 或 `{ assignee: { id, name, role } }`（依後端規格）。

2. **UI**（`src/views/ConversationDetail.vue` 右側欄）  
   - 「編輯標籤」：可編輯 `tags` 陣列，儲存時呼叫 `updateConversationTags`。  
   - 「指派客服」：下拉選擇 assignee（資料來源可沿用 `getAssigneeOptions()` 或 GET agents API），儲存時呼叫 `updateConversationAssignee`。

### 7-2. Figma 素材（若已提供）

- 替換 Logo、預設 Avatar、Icon；依 Figma 決定是否調整 Loading / Empty / Error。

### 7-3. role / permissions 模擬（若需權限控制）

- 從 `public/config.js` 或 mock 讀取 `role`（`agent`|`admin`）、`permissions`，於元件中做條件顯示（如按鈕禁用、選單隱藏）。

---

## 8. 符合度總結

| 項目 | 說明 |
|------|------|
| **整體符合度** | **約 98%** 符合客戶需求清單與 CSV 規範。 |
| **已完全符合** | API 結構與 key/type、所有必要 Endpoints、GET params（page, pageSize, q, status, channel, assigneeId, unread, sort, updatedAfter）、列表載入更多、Meta 分頁、訊息 type/text/attachments/createdAt/readedAt、hasMore/nextBefore、POST 去重與回傳、樂觀更新、純文字輸入、無草稿/模板/罐頭、已讀邏輯、FormData 上傳與註解、mimeType/size 驗證、**所有錯誤提示含 traceId**、401/403/404/429/5xx 與 429 UI、WebSocket 即時訊息與列表 unread 更新、路由、config/README、build 與交付、客戶資訊卡（id, email, phone, loginAt）、status 更新。 |
| **部分符合** | Figma 素材（目前 Lucide placeholder）；Loading/Empty/Error（若嚴格依「Figma 未提供則不製作」）；role/permissions 模擬；品牌。 |
| **未實作（規格為「若有」）** | PATCH tags、PATCH assignee。 |

**剩餘問題**：**0 項**強制不符；**2 項**為「若規格有則實作」（PATCH tags、PATCH assignee）；其餘為 Figma／品牌／權限模擬之可選項。若實作 PATCH tags／assignee 並補齊 Figma／role 可選項，可達 **100%** 對清單符合。
