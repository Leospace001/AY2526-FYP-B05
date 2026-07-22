# AY2526-FYP-B05 團隊職責分工報告

**Project:** AY2526-FYP-B05（Leospace / Plant E-Commerce Platform）  
**Repository:** https://github.com/Leospace001/AY2526-FYP-B05  
**Document type:** Team Responsibility / Work Allocation Report  

---

## 1. 報告目的

本報告說明 AY2526-FYP-B05 專案三位組員的職責分工，對應系統中的主要技術模組與功能範圍，方便評審、進度檢視與後續維護時清楚知道各部分負責人。

---

## 2. 專案概覽

本系統為一個以植物／商品為核心的 Web 應用，主要技術架構包括：

| 層級 | 技術 |
|------|------|
| Frontend | React + Vite |
| Backend | Java Spring Boot |
| Database | PostgreSQL |
| Message Queue | RabbitMQ |
| Reverse Proxy | NGINX |
| Deployment | Docker / Docker Compose |
| AI Services | Google Gemini、Kindwise (Plant.id) |

系統支援使用者註冊登入、商品／庫存管理、購物車與訂單、電郵通知、群組聊天，以及 **AI 植物識別與分析** 等功能。

---

## 3. 組員職責總表

| 組員 | 主要職責 |
|------|----------|
| **WONG Shi Yin Andy** | AI（Google Gemini、Kindwise AI）、Checkbox with AI 分析 |
| **FAN Ming Chun** | PostgreSQL 資料庫 |
| **YUEN Chiu Chun** | Java Spring Boot、NGINX、RabbitMQ、Docker、React、Vite |

---

## 4. 組員職責詳述

### 4.1 WONG Shi Yin Andy — AI 模組

**負責範圍：** Google Gemini、Kindwise AI，以及 Checkbox with AI 分析相關功能。

#### 4.1.1 Kindwise AI（Plant.id）

- 負責植物影像識別流程：使用者上傳植物相片後，呼叫 Kindwise / Plant.id API（`api.plant.id`）進行物種辨識。
- 對應前端頁面：`Plant Identifier`（AI Plant Identifier）。
- 主要工作包括：
  - 圖片上傳與格式驗證（JPG / PNG）
  - 呼叫 Kindwise identification API
  - 顯示辨識結果（植物名稱）
  - 根據辨識結果聯動相關商品建議

#### 4.1.2 Google Gemini AI

- 負責 Gemini 對話與植物深度分析：
  - Gemini Chat（`/api/chat/gemini`）
  - 植物辨識後的詳細分析（中醫藥性、風水佈局、節慶寓意）
- 與後端 Gemini proxy／service 整合，確保 API Key、model、proxy 設定可用。
- 主要分析輸出包括：
  - **中醫藥性**（藥用部位、性味、功效、安全性提示）
  - **風水佈局**（擺放方位、招財／擋煞等建議）
  - **節慶寓意**（送禮與節日象徵意義）

#### 4.1.3 Checkbox with AI 分析

- 負責「Checkbox with AI 分析」互動功能：以勾選方式讓使用者選擇需要的 AI 分析項目，再觸發對應的 Gemini／Kindwise 分析結果顯示。
- 結合 AI Plant Identifier 與 Gemini 分析結果，提供可選擇、可擴展的 AI 分析體驗。

**相關檔案／模組（參考）：**

- `ui/src/pages/PlantIdentifer.tsx`
- `ui/src/pages/plantIdentifierCache.ts`
- `ui/src/pages/OllamaChat.tsx`（Gemini Chat UI）
- `src/main/java/com/example/demo/service/GeminiService.java`
- `src/main/java/com/example/demo/controller/GeminiChatController.java`

---

### 4.2 FAN Ming Chun — PostgreSQL

**負責範圍：** PostgreSQL 資料庫設計、維護與系統資料持久化。

#### 主要工作

- 設計並維護 PostgreSQL schema，配合 Spring Data JPA entity 模型。
- 確保核心業務資料正確儲存與關聯，例如：
  - 使用者與角色（`users`、`role`、`user_role_assignments`、`user_identities`）
  - 商品／庫存（`stocks`）
  - 購物車與訂單（`carts`、`cart_items`、`orders`、`order_item`）
  - 運送地址與付款方式（`delivery_addresses`、`payment_methods`）
  - 電郵紀錄與範本（`email_records`、email templates）
  - 群組聊天（`chat_groups`、`chat_group_members`、`chat_messages`）
  - 員工與活動紀錄等其他業務表
- 配合 Docker Compose 中的 `db`（PostgreSQL 15）服務部署與連線設定。
- 透過 Adminer（`http://localhost:7070/`）支援開發／測試時的資料庫檢視與除錯。
- 協助處理 schema migration、資料完整性與關聯正確性。

**相關設定／模組（參考）：**

- `docker-compose.yml` → `db` service（`postgres:15.3-alpine`）
- Spring datasource：`jdbc:postgresql://db:5432/postgres`
- JPA models：`src/main/java/com/example/demo/model/*`
- UML / schema 文件：`uml/classDiagram.*`、`docs/sample-schema.md`（如適用）

---

### 4.3 YUEN Chiu Chun — 全端核心架構與基礎設施

**負責範圍：** Java Spring Boot、NGINX、RabbitMQ、Docker、React、Vite。

#### 4.3.1 Java Spring Boot（Backend）

- 負責後端 API、業務邏輯、安全性與系統整合。
- 涵蓋模組包括但不限於：
  - Authentication / OAuth2 / JWT
  - User、Product／Stock、Cart、Order
  - Email（寄送、排程、範本）
  - Chat / WebSocket
  - Admin 功能
  - Gemini backend proxy 與其他 REST endpoints
- 維護 Maven 專案結構（`pom.xml`）與 Spring Boot 設定（`application.yml`）。

#### 4.3.2 NGINX

- 負責反向代理與對外 HTTP／HTTPS 流量路由。
- 設定 SSL（Let's Encrypt / Certbot）與前端／後端反向代理規則。
- 對應設定：`nginx/default.conf`、`nginx/dev.conf`。

#### 4.3.3 RabbitMQ

- 負責訊息佇列整合，支援非同步處理（例如電郵寄送）。
- 配置 Spring AMQP／RabbitMQ producer／consumer。
- Docker 服務：`rabbitmq:3-management`（含 Management UI）。

#### 4.3.4 Docker

- 負責整個系統的容器化部署與編排。
- 維護 `Dockerfile`、`docker-compose.yml`、`docker-compose.dev.yml`。
- 協調多服務啟動：`nginx`、`app`（Spring）、`ui`、`db`、`rabbitmq`、`adminer` 等。

#### 4.3.5 React + Vite（Frontend）

- 負責前端應用架構與主要業務頁面（React + Vite + TypeScript）。
- 涵蓋登入註冊、商品、購物車、訂單、電郵、管理後台、群組聊天等 UI。
- 維護前端建置與容器化（`ui/` 專案、`vite.config.ts`）。

**相關檔案／模組（參考）：**

- Backend：`src/main/java/com/example/demo/**`
- Frontend：`ui/src/**`
- Infra：`docker-compose.yml`、`Dockerfile`、`nginx/**`

---

## 5. 職責與系統模組對應圖

```text
┌─────────────────────────────────────────────────────────────────┐
│                        AY2526-FYP-B05                           │
├──────────────────────┬──────────────────────┬───────────────────┤
│  WONG Shi Yin Andy   │   FAN Ming Chun      │  YUEN Chiu Chun   │
├──────────────────────┼──────────────────────┼───────────────────┤
│  Kindwise / Plant.id │  PostgreSQL schema   │  Spring Boot API  │
│  Google Gemini       │  Tables / Relations  │  React + Vite UI  │
│  Checkbox + AI 分析  │  Data persistence    │  NGINX proxy      │
│  Plant AI Identifier │  Adminer support     │  RabbitMQ         │
│                      │                      │  Docker Compose   │
└──────────────────────┴──────────────────────┴───────────────────┘
```

---

## 6. 協作關係說明

1. **Andy** 完成 AI 辨識與分析後，前端可呼叫 **Yuen** 維護的 Spring Boot API／Gemini proxy，以及顯示相關商品資料。
2. **Fan** 負責的 PostgreSQL 為整站資料基礎；**Yuen** 的 Spring Boot JPA／Repository 層與資料庫互動。
3. **Yuen** 負責的 Docker／NGINX／RabbitMQ 把前端、後端、資料庫與訊息佇列組成可部署的完整系統。
4. 三人分工清楚：AI 功能、資料庫、以及核心全端架構／基礎設施各自負責，共同完成 FYP 系統交付。

---

## 7. 總結

| 組員 | 一句總結 |
|------|----------|
| **WONG Shi Yin Andy** | 負責專案 AI 能力：Kindwise 植物識別、Gemini 深度分析，以及 Checkbox with AI 分析功能。 |
| **FAN Ming Chun** | 負責 PostgreSQL 資料庫設計、儲存與維護，支撐全站業務資料。 |
| **YUEN Chiu Chun** | 負責系統主幹：Spring Boot 後端、React/Vite 前端、NGINX、RabbitMQ 與 Docker 部署。 |

本分工確保 AI、資料庫與系統架構三個關鍵面向皆有明確負責人，有利於開發、測試、演示與最終報告撰寫。

---

*Document generated for AY2526-FYP-B05 team responsibility reporting.*
