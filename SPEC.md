# 🎤 SingBook 預約平台（品牌：STAGELESS沐光）- SPEC.md

> **版本：** v0.8（更新日期：2026-03-26）
> **建立日期：** 2026-03-25

---

## 1. 產品概述

**產品名稱：** SingBook 預約平台
**品牌名稱：** STAGELESS沐光
**類型：** 預約網站（含金流與課程管理）
**核心功能：** 讓學生瀏覽課程、購買課包、預約上課時間；老師管理排程與確認付款。
**目標客群：** 20-40 歲，想學習唱歌的成年學員

---

## 2. 業務邏輯

### 2.1 課程結構

| 項目 | 說明 |
|------|------|
| 教學型態 | 個別教學（一對一或一對二） |
| 課程分級 | 無分級 |
| 課包選項 | 由老師在後台新增課程（例：單堂、5堂、10堂等） |
| 上課時長 | 1 小時 或 2 小時（由老師設定，學生選擇） |

**收費公式：**
```
訂單總金額 = (課程單價 × 購買數量) + (地點單價 × 購買數量)
```

**範例：**
| 課程 | 數量 | 地點 | 計算 | 總金額 |
|------|------|------|------|--------|
| 聲音開發 NT$900 | 2 | 信義私人錄音室 (+NT$700/堂) | 900×2 + 700×2 | NT$3,200 |
| 10堂優惠 NT$8,100 | 1 | 知熹多功能教室 (+NT$400/堂) | 8,100×1 + 400×10 | NT$12,100 |

### 2.2 教室地點（首批）

| ID | 名稱 | 地點加價 | 地址 |
|----|------|----------|------|
| 1 | 小米個人工作室 | NT$0 | （待填寫） |
| 2 | 知熹多功能教室 | NT$400 | （待填寫） |
| 3 | 慕斯克多功能教室 | NT$600 | （待填寫） |
| 4 | 信義私人錄音室 | NT$700 | （待填寫） |
| 5 | 歐邦寄錄工作室 | NT$500 | （待填寫） |

> 📝 未來可從後台動態新增地點。

### 2.3 老師

- 目前：1 位（自學唱歌背景）
- 未來可擴充（多位老師各自有獨立排程）

---

## 3. 預約流程（學生視角）

### 3.1 帳號建立

- 學生**自行註冊**帳號（Email + 密碼）
- 登入後可修改個人資料

### 3.2 一般預約流程

```
選擇課程 → 選擇上課地點 → 選擇數量 → 填寫聯絡資料 →
顯示匯款資訊（老師帳號）→ 學生轉帳 →
填寫匯款帳號後五碼 + 金額 → 老師後台確認收款 →
學生選擇欲預約的時間區段 → 完成預約
```

### 3.3 課包預約流程（購買多堂）

```
選擇課程（例：10堂優惠）→ 選擇地點 → 選擇數量（1）→ 匯款 →
老師確認收款 → 學生約「第一堂」時間 →
日後回網站選擇「第二堂、第三堂...」時間（可一次約完或分次約）
```

### 3.4 堂數扣抵邏輯

- 購買 N 堂課 → 帳號內有 N 次可預約次數
- 每預約一次成功 → 扣 1 堂（remainingSessions - 1）
- 剩餘 0 堂時**無法再預約**
- 老師可隨時在後台查看每位學生的剩餘堂數

### 3.5 預約時間規則

- 老師在後台新增「可預約時段」（例：3/29 10:00-22:00）
- 學生從中選擇 1 小時或 2 小時的區間
- 若某時段已被預約，系統自動拆分可選區段

**範例：**
```
老師開放：10:00 - 22:00
學生A預約：13:00 - 15:00（2小時）
系統拆分後，可選時段變成：
  10:00-13:00（3小時，可選1h或2h）
  15:00-22:00（7小時，可選1h或2h）
```

---

## 4. 付款機制

| 項目 | 說明 |
|------|------|
| 付款方式 | 銀行轉帳（僅支援匯款） |
| 匯款資訊 | 老師於後台設定（銀行代碼 + 帳號），顯示於學生繳費頁 |
| 確認流程 | 學生填寫匯款帳號**後五碼** + 金額 → 老師後台人工比對確認 |
| 確認後動作 | 老師點選「確認收款」→ 訂單改為「已付款」→ 學生可開始預約 |

---

## 5. 取消與異動

| 規則 | 說明 |
|------|------|
| 老師取消 | 老師可隨時取消，學生可重新預約或全額退費 |
| 學生取消 | 需於**上課前 24 小時**提出，否則視為已上課（不退費） |
| 退費機制 | 課包未使用完可依比例退費（需老師同意） |

---

## 6. 通知機制

| 事件 | 通知方式 |
|------|----------|
| 新訂單成立（學生匯款回填） | Email 通知老師 |
| 付款確認成功 | Email 通知學生 |
| 預約成功 | Email 通知學生 |
| 課程被老師取消 | Email 通知學生 |
| 預約前 1 天提醒 | Email 通知學生和老師 |

---

## 7. 系統角色

### 7.1 學生（前台）

**可執行操作：**
- 註冊/登入會員
- 瀏覽課程、地點與價格
- 選擇課包並完成付款（填寫匯款資訊）
- 預約上課時間（限已付款且有剩餘堂數的帳號）
- 查詢自己的預約紀錄與剩餘堂數
- 修改密碼（於 `/dashboard/profile`）
- **忘記密碼**：於 `/login` 與 `/admin/login` 頁面皆可申請，透過 Email token 連結重設

**必填資料：**
- 姓名
- Email（帳號）
- 密碼

### 7.2 老師（後台管理）

**可執行操作：**
- 新增/編輯/刪除課程（名稱、價格、堂數、說明、圖片）
- 新增/刪除/修改地點（名稱、地址、地點加價、說明、圖片）
- 新增/刪除/修改老師可預約時段
- 確認學生匯款（改變訂單狀態）
- 取消學生的已預約課程
- 檢視所有訂單與預約歷史
- 查看每位學生的剩餘堂數
- 設定匯款帳號資訊
- 新增/管理其他老師帳號（未來功能）

---

## 8. 網站頁面結構

### 前台頁面（學生用）

| 頁面 | 路由 | 說明 |
|------|------|------|
| 首頁 | `/` | 品牌形象、課程介紹、報名入口 |
| 課程總覽 | `/courses` | 所有課程列表，含價格與說明 |
| 地點總覽 | `/locations` | 所有地點列表，含地址與加價 |
| 報名頁面 | `/book` | 選擇課程 → 地點 → 數量 → 取得匯款資訊 |
| 匯款回覆 | `/payment` | 填寫匯款後五碼與金額 |
| 預約時段 | `/schedule` | 選擇上課時間（已付款才能預約） |
| 會員登入 | `/login` | 學生登入 |
| 會員註冊 | `/register` | 學生註冊 |
| 會員專區 | `/dashboard` | 預約紀錄、剩餘堂數 |
| 會員專區 | `/dashboard/profile` | 修改個人資料（姓名、Email、電話、密碼） |

### 後台頁面（老師用）

| 頁面 | 路由 | 說明 |
|------|------|------|
| 登入頁 | `/admin/login` | 老師登入 |
| 修改個人資料 | `/admin/profile` | 修改姓名、Email、密碼 |
| 儀表板 | `/admin` | 今日預約、待確認訂單摘要 |
| 訂單管理 | `/admin/orders` | 所有訂單列表，可確認收款/取消 |
| 時段管理 | `/admin/schedule` | 新增/刪除老師可預約時段 |
| 課程管理 | `/admin/courses` | 新增/編輯/刪除課程 |
| 地點管理 | `/admin/locations` | 新增/編輯/刪除地點 |
| 預約紀錄 | `/admin/bookings` | 所有已預約課程一覽 |
| 匯款設定 | `/admin/payment-settings` | 新增/編輯/刪除多個銀行帳戶 |
| 學生管理 | `/admin/students` | 檢視所有學生帳號與剩餘堂數 |

---

## 9. 技術架構

### 9.1 技術選型

| 項目 | 選擇 | 理由 |
|------|------|------|
| 前端框架 | Next.js (App Router) | 免費、部署方便（Vercel）、前後端一體 |
| 樣式 | Tailwind CSS | 現代簡約風格易實作、快速開發 |
| 後端 | Next.js API Routes / Server Actions | 無需獨立伺服器 |
| 資料庫 | SQLite（開發）/ PostgreSQL（正式） | 免費，透過 Prisma ORM 操作 |
| 認證 | NextAuth.js v5 | 免費、支援 Email 登入 |
| Email 發送 | Resend（免費額度）或 Nodemailer | Email 通知功能 |
| 部署 | Vercel | 免費額度足夠 |

### 9.2 系統架構圖

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   學生瀏覽器  │────▶│  Next.js    │────▶│  SQLite /   │
│  (前端頁面)   │◀────│  Server     │◀────│  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  老師後台    │
                    │  (同一系統)  │
                    └─────────────┘
```

### 9.3 資料模型（v0.2）

**Student（學生）**
```
id          Int      @id @default(autoincrement())
name        String
email       String   @unique
password    String   (hashed)
phone       String?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
orders      Order[]
bookings    Booking[]
```

**Course（課程）**
```
id          Int      @id @default(autoincrement())
name        String                  // 課程名稱（例：「聲音開發」）
price       Int                    // 課程單價（例：900）
sessions    Int                    // 包含堂數（例：1）
description String?                 // 詳細說明
image       String?                 // 課程圖片 URL
isActive    Boolean  @default(true)
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
orders      Order[]
```

**Location（地點）**
```
id          Int      @id @default(autoincrement())
name        String                  // 地點名稱（例：「信義私人錄音室」）
address     String                  // 地址
price       Int      @default(0)    // 地點加價/每堂（例：700）
description String?                 // 詳細說明
image       String?                 // 地點圖片 URL
isActive    Boolean  @default(true)
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
bookings    Booking[]
```

**Teacher（老師）**
```
id          Int      @id @default(autoincrement())
name        String
email       String   @unique
password    String   (hashed)
bio         String?
image       String?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
bookings    Booking[]
timeSlots   TimeSlot[]
```

**Order（訂單）**
```
id              Int      @id @default(autoincrement())
studentId       Int
student         Student  @relation(...)
courseId        Int
course          Course   @relation(...)
locationId      Int
quantity        Int                      // 購買數量（例：2）
totalAmount     Int                      // 訂單總金額
status          String   @default("pending")  // pending / paid / cancelled
paidAt          DateTime?
bankAccountLast5 String?                // 學生填寫的匯款帳號後五碼
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
bookings        Booking[]
```

**Booking（預約）**
```
id              Int      @id @default(autoincrement())
studentId       Int
student         Student  @relation(...)
orderId         Int
order           Order    @relation(...)
teacherId       Int
teacher         Teacher  @relation(...)
locationId      Int
location        Location @relation(...)
startTime       DateTime                 // 預約開始時間
endTime         DateTime                 // 預約結束時間
duration        Int                      // 預約時長（小時，1或2）
status          String   @default("scheduled")  // scheduled / completed / cancelled
note            String?
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
```

**TimeSlot（老師可預約時段）**
```
id              Int      @id @default(autoincrement())
teacherId       Int
teacher         Teacher  @relation(...)
date            DateTime                 // 可預約日期
startTime       String                   // 開始時間（字串，例："10:00"）
endTime         String                   // 結束時間（字串，例："22:00"）
isBooked        Boolean  @default(false)
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
```

**BankAccount（銀行帳戶 - 可多筆）**
```
id              Int      @id @default(autoincrement())
bankName        String                   // 銀行名稱（例：玉山銀行）
bankCode        String                   // 銀行代碼（例：012）
bankAccount     String                   // 帳號
accountName     String                   // 戶名
displayOrder    Int      @default(0)    // 顯示順序
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
```

---

## 10. 網站風格與設計方向

### 10.1 視覺風格
- **風格關鍵字：** 現代簡約、乾淨舒適、專業感
- **品牌名稱：** STAGELESS沐光
- **配色建議：** 
  - 主色：暖色調（陽光橘/米白）呼應「沐光」
  - 或單色系深灰+白
  - 避免過多裝飾
- **字體：** 無襯線字體（例：Noto Sans TC / Inter）

### 10.2 UI 參考方向
- 以清晰的資訊層次為主
- 卡片式佈局呈現課程方案
- 表單操作簡潔，一步驟一頁面
- RWD 支援（手機/平板/電腦皆可瀏覽）

---

## 11. 待確認事項

- [x] 網站正式名稱：SingBook 預約平台
- [x] 品牌名稱：STAGELESS沐光
- [x] 學生帳號：自行註冊
- [x] 取消時限：24 小時前
- [x] 通知功能：需要 Email 通知
- [x] 地點與定價：已確認（5個地點，含加價資訊）
- [x] 老師的匯款帳號（銀行代碼、帳號、帳戶名稱）
- [ ] 老師的個人介紹文字/照片
- [ ] 各教室的正式地址
- [ ] 課程詳細說明與圖片

---

## 12. 初步時程規劃（含驗收標準）

| 階段 | 工作項目 | 預估時間 | 驗收方式 |
|------|----------|----------|----------|
| Phase 1 | 需求確認 + SPEC.md 定稿 | ✅ 完成 | 老闆確認規格文件 |
| Phase 2 | 專案初始化（Next.js + Prisma + SQLite） | 2-4 小時 | 見下方驗收標準 |
| Phase 3 | 資料庫 Migration + 基礎資料寫入 | 1-2 小時 | 見下方驗收標準 |
| Phase 4 | 前台頁面開發（首頁、課程頁、報名流程） | 3-5 小時 | 老闆逐頁檢視 |
| Phase 5 | 後台管理頁面開發 | 4-6 小時 | 老師帳號登入檢視 |
| Phase 6 | Email 通知功能串接 | ✅ 完成（2026-03-26）| 全部 5 種通知已測試通過 |
| Phase 7 | 測試 + 修正 + 上線 | 3-4 小時 | 正式環境驗收 |

---

### Phase 2 驗收標準：專案初始化

**目標：** 建立一個可以跑的 Next.js 網站框架

**具體產出：**
1. Next.js 專案建立（`npx create-next-app` 完成）
2. Tailwind CSS 設定完成
3. Prisma 安裝完成，Schema 定義好所有資料表
4. SQLite 資料庫檔案建立

**老闆驗收方式：**
```bash
# 進入專案資料夾，啟動開發伺服器
cd singbook
npm run dev

# 瀏覽器打開 http://localhost:3000
# → 應該能看到 Next.js 預設頁面（不是錯誤頁）

# 檢查 Prisma Schema
cat prisma/schema.prisma
# → 應該能看到所有資料表：
#    Student, Course, Location, Order, Booking, TimeSlot, Teacher, BankAccount
```

**失敗指標：** `npm run dev` 執行錯誤、Prisma Schema 缺少資料表

---

### Phase 3 驗收標準：資料庫 Migration + 基礎資料

**目標：** 把資料表結構實際寫進資料庫，並寫入初始資料

**具體產出：**
1. Migration 執行成功，資料表建立
2. 5 個地點資料寫入資料庫
3. 老師帳號建立（可用 email 登入後台）
4. 2-3 筆範例課程資料建立

**老闆驗收方式：**
```bash
# 執行 Migration
npx prisma migrate dev --name init

# 啟動 Prisma Studio 查看資料
npx prisma studio
```

→ 預期結果：
- `Location` 資料表有 5 筆資料（小米個人工作室 NT$0、知熹 NT$400、慕斯克 NT$600、信義 NT$700、歐邦 NT$500）
- `Teacher` 有 1 筆老師帳號
- `Course` 有範例課程（例：聲音開發 NT$900 / 1堂、10堂優惠 NT$8,100 / 10堂）

→ 用老師帳號嘗試登入 `/admin/login`，應能進入後台儀表板

**失敗指標：** Migration 報錯、Prisma Studio 看不到資料、老師帳號無法登入

---

### Phase 4 驗收標準：前台頁面開發

**具體產出：**
- `/` 首頁（品牌形象、課程介紹）
- `/courses` 課程列表
- `/locations` 地點列表
- `/book` 報名流程（選課程→選地點→選數量→顯示匯款資訊）
- `/payment` 匯款回覆（填後五碼）
- `/schedule` 預約時段（已付款才能選時間）
- `/login` / `/register` 登入註冊
- `/dashboard` 會員專區（預約紀錄、剩餘堂數）

**老闆驗收方式：**
→ 一個一個頁面點過去，確認每個功能有做出來且運作正常

**失敗指標：** 頁面 404、點了沒反應、資料跑不出來、流程中斷

---

### Phase 5 驗收標準：後台管理頁面開發

**具體產出：**
- `/admin` 儀表板（今日預約、待確認訂單數量）
- `/admin/orders` 訂單管理（可確認收款、取消訂單）
- `/admin/schedule` 時段管理（新增/刪除老師可預約時段）
- `/admin/courses` 課程管理（新增/編輯/刪除課程）
- `/admin/locations` 地點管理（新增/編輯/刪除地點）
- `/admin/payment-settings` 匯款帳號設定
- `/admin/students` 學生管理（檢視學生資料與剩餘堂數）
- `/admin/bookings` 預約紀錄

**老闆驗收方式：**
→ 用老師帳號登入，一個一個後台頁面點過去，確認功能正常

**失敗指標：** 頁面 404、功能按了沒反應、資料更新不正確

---

### Phase 6 驗收標準：Email 通知功能

**具體產出：**
- 學生匯款回填後 → 老師收到 Email 通知
- 老師確認收款後 → 學生收到 Email 通知
- 學生預約成功後 → 學生收到 Email 通知
- 老師取消預約後 → 學生收到 Email 通知
- 預約前 1 天 → 學生和老師收到提醒 Email

**老闆驗收方式：**
→ 用真實帳號走完整流程，檢查 Email 是否有收到

**失敗指標：** 收不到 Email、Email 內容錯誤

---

### Phase 7 驗收標準：測試 + 上線

**具體產出：**
1. 程式碼無明顯錯誤
2. 正式部署到 Vercel
3. 網址可公開存取

**老闆驗收方式：**
→ 用另一個瀏覽器或別台電腦開啟正式網址，完整走一次報名→匯款→預約流程

**失敗指標：** 部署失敗、網址打不开、流程中有錯誤

---

> ⚠️ **備註：** 每個 Phase 完成後，會截圖給老闆確認，沒問題再繼續下一個 Phase。

---

*本文件持續更新中。*
