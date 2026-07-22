# AY2526-FYP-B05 Team Responsibility Report

**Project:** AY2526-FYP-B05 (Leospace / Plant E-Commerce Platform)  
**Repository:** https://github.com/Leospace001/AY2526-FYP-B05  
**Document type:** Team Responsibility / Work Allocation Report  

---

## 1. Purpose

This report describes the work allocation among the three members of the AY2526-FYP-B05 project. It maps each member to the main technical modules and feature areas of the system so that reviewers, progress tracking, and future maintenance can clearly identify ownership.

---

## 2. Project Overview

This system is a plant / product–focused web application. The main technology stack includes:

| Layer | Technology |
|------|------------|
| Frontend | React + Vite |
| Backend | Java Spring Boot |
| Database | PostgreSQL |
| Message Queue | RabbitMQ |
| Reverse Proxy | NGINX |
| Deployment | Docker / Docker Compose |
| AI Services | Google Gemini, Kindwise (Plant.id) |

Key features include user registration and login, product / inventory management, shopping cart and orders, email notifications, group chat, and **AI plant identification and analysis**.

---

## 3. Responsibility Summary

| Member | Main Responsibilities |
|--------|------------------------|
| **WONG Shi Yin Andy** | AI (Google Gemini, Kindwise AI), Checkbox with AI Analysis |
| **FAN Ming Chun** | PostgreSQL database |
| **YUEN Chiu Chun** | Java Spring Boot, NGINX, RabbitMQ, Docker, React, Vite |

---

## 4. Detailed Responsibilities

### 4.1 WONG Shi Yin Andy — AI Module

**Scope:** Google Gemini, Kindwise AI, and Checkbox with AI Analysis.

#### 4.1.1 Kindwise AI (Plant.id)

- Owns the plant image identification flow: after a user uploads a plant photo, the system calls the Kindwise / Plant.id API (`api.plant.id`) for species recognition.
- Corresponding frontend page: **Plant Identifier** (AI Plant Identifier).
- Main tasks include:
  - Image upload and format validation (JPG / PNG)
  - Calling the Kindwise identification API
  - Displaying identification results (plant name)
  - Suggesting related products based on the identification result

#### 4.1.2 Google Gemini AI

- Owns Gemini chat and in-depth plant analysis:
  - Gemini Chat (`/api/chat/gemini`)
  - Post-identification detailed analysis (medicinal properties, feng shui placement, festive meaning)
- Integrates with the backend Gemini proxy / service, including API key, model, and proxy configuration.
- Main analysis outputs include:
  - **Medicinal properties** (usable parts, nature/flavor, effects, and safety notes)
  - **Feng shui placement** (recommended orientation, wealth / protective roles, etc.)
  - **Festive meaning** (gift symbolism and festival associations)

#### 4.1.3 Checkbox with AI Analysis

- Owns the **Checkbox with AI Analysis** interaction: users select the AI analysis options they need via checkboxes, then trigger the corresponding Gemini / Kindwise analysis results.
- Combines the AI Plant Identifier with Gemini analysis results to provide a selectable and extensible AI analysis experience.

**Related files / modules (reference):**

- `ui/src/pages/PlantIdentifer.tsx`
- `ui/src/pages/plantIdentifierCache.ts`
- `ui/src/pages/OllamaChat.tsx` (Gemini Chat UI)
- `src/main/java/com/example/demo/service/GeminiService.java`
- `src/main/java/com/example/demo/controller/GeminiChatController.java`

---

### 4.2 FAN Ming Chun — PostgreSQL

**Scope:** PostgreSQL database design, maintenance, and system data persistence.

#### Main Tasks

- Design and maintain the PostgreSQL schema in alignment with Spring Data JPA entity models.
- Ensure core business data is stored correctly and relationships remain consistent, including:
  - Users and roles (`users`, `role`, `user_role_assignments`, `user_identities`)
  - Products / inventory (`stocks`)
  - Shopping cart and orders (`carts`, `cart_items`, `orders`, `order_item`)
  - Delivery addresses and payment methods (`delivery_addresses`, `payment_methods`)
  - Email records and templates (`email_records`, email templates)
  - Group chat (`chat_groups`, `chat_group_members`, `chat_messages`)
  - Employee and activity / logging tables and other business entities
- Support deployment and connection settings for the `db` service (PostgreSQL 15) in Docker Compose.
- Support database inspection and debugging via Adminer (`http://localhost:7070/`) during development and testing.
- Assist with schema migration, data integrity, and relationship correctness.

**Related configuration / modules (reference):**

- `docker-compose.yml` → `db` service (`postgres:15.3-alpine`)
- Spring datasource: `jdbc:postgresql://db:5432/postgres`
- JPA models: `src/main/java/com/example/demo/model/*`
- UML / schema docs: `uml/classDiagram.*`, `docs/sample-schema.md` (where applicable)

---

### 4.3 YUEN Chiu Chun — Core Full-Stack Architecture & Infrastructure

**Scope:** Java Spring Boot, NGINX, RabbitMQ, Docker, React, and Vite.

#### 4.3.1 Java Spring Boot (Backend)

- Owns backend APIs, business logic, security, and system integration.
- Coverage includes, but is not limited to:
  - Authentication / OAuth2 / JWT
  - User, Product / Stock, Cart, Order
  - Email (sending, scheduling, templates)
  - Chat / WebSocket
  - Admin features
  - Gemini backend proxy and other REST endpoints
- Maintains the Maven project structure (`pom.xml`) and Spring Boot configuration (`application.yml`).

#### 4.3.2 NGINX

- Owns reverse proxy and external HTTP / HTTPS traffic routing.
- Configures SSL (Let's Encrypt / Certbot) and reverse-proxy rules for frontend and backend.
- Related configuration: `nginx/default.conf`, `nginx/dev.conf`.

#### 4.3.3 RabbitMQ

- Owns message-queue integration for asynchronous processing (for example, email dispatch).
- Configures Spring AMQP / RabbitMQ producers and consumers.
- Docker service: `rabbitmq:3-management` (including Management UI).

#### 4.3.4 Docker

- Owns containerization and orchestration for the whole system.
- Maintains `Dockerfile`, `docker-compose.yml`, and `docker-compose.dev.yml`.
- Coordinates multi-service startup: `nginx`, `app` (Spring), `ui`, `db`, `rabbitmq`, `adminer`, and related services.

#### 4.3.5 React + Vite (Frontend)

- Owns the frontend application architecture and major business pages (React + Vite + TypeScript).
- Coverage includes login / registration, products, cart, orders, email, admin panel, group chat, and related UI.
- Maintains frontend build and containerization (`ui/` project, `vite.config.ts`).

**Related files / modules (reference):**

- Backend: `src/main/java/com/example/demo/**`
- Frontend: `ui/src/**`
- Infrastructure: `docker-compose.yml`, `Dockerfile`, `nginx/**`

---

## 5. Responsibility-to-Module Mapping

```text
┌─────────────────────────────────────────────────────────────────┐
│                        AY2526-FYP-B05                           │
├──────────────────────┬──────────────────────┬───────────────────┤
│  WONG Shi Yin Andy   │   FAN Ming Chun      │  YUEN Chiu Chun   │
├──────────────────────┼──────────────────────┼───────────────────┤
│  Kindwise / Plant.id │  PostgreSQL schema   │  Spring Boot API  │
│  Google Gemini       │  Tables / Relations  │  React + Vite UI  │
│  Checkbox + AI       │  Data persistence    │  NGINX proxy      │
│  Plant AI Identifier │  Adminer support     │  RabbitMQ         │
│                      │                      │  Docker Compose   │
└──────────────────────┴──────────────────────┴───────────────────┘
```

---

## 6. Collaboration Notes

1. After **Andy** completes AI identification and analysis, the frontend can call the Spring Boot API / Gemini proxy maintained by **Yuen**, and display related product data.
2. The PostgreSQL database owned by **Fan** is the data foundation for the whole site; **Yuen**’s Spring Boot JPA / repository layer interacts with that database.
3. **Yuen**’s Docker / NGINX / RabbitMQ work connects the frontend, backend, database, and message queue into a deployable system.
4. Ownership is clear across three areas — AI features, database, and core full-stack architecture / infrastructure — enabling the team to deliver the FYP system together.

---

## 7. Summary

| Member | One-line Summary |
|--------|------------------|
| **WONG Shi Yin Andy** | Owns the project’s AI capabilities: Kindwise plant identification, Gemini in-depth analysis, and Checkbox with AI Analysis. |
| **FAN Ming Chun** | Owns PostgreSQL database design, storage, and maintenance that support all business data. |
| **YUEN Chiu Chun** | Owns the system backbone: Spring Boot backend, React/Vite frontend, NGINX, RabbitMQ, and Docker deployment. |

This allocation ensures clear ownership of the three critical areas — AI, database, and system architecture — and supports development, testing, demonstration, and final report writing.

---

*Document prepared for AY2526-FYP-B05 team responsibility reporting.*
