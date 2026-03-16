# Terms of Reference (ToR)
# Telegram Mini-App Game — Backend Rebuild

**Document Version:** 1.0
**Date:** 2026-03-16
**Project:** Telegram Mini-App Idle Mining Game (Backend)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Objectives & Scope](#2-objectives--scope)
3. [Tech Stack Requirements](#3-tech-stack-requirements)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Specification](#7-api-specification)
8. [Game Mechanics & Business Logic](#8-game-mechanics--business-logic)
9. [External Integrations](#9-external-integrations)
10. [Background Jobs & Scheduling](#10-background-jobs--scheduling)
11. [Admin Panel API](#11-admin-panel-api)
12. [Security Requirements](#12-security-requirements)
13. [Configuration & Environment](#13-configuration--environment)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Deliverables](#15-deliverables)
16. [Glossary](#16-glossary)

---

## 1. Project Overview

### 1.1 Description

The system is a **backend server** for a Telegram Mini-App idle mining game. Players mine virtual coins in real time, manage energy and health resources, upgrade their character, participate in mini-games (Box loot game, Car racing game), spin a prize wheel, complete channel-subscription tasks, and withdraw earned coins to the TON blockchain as cryptocurrency.

The backend also includes a **Telegram Bot** that serves as the entry point to the Mini App, handles Telegram Stars payments, and verifies channel subscriptions.

### 1.2 Current State Summary

The existing system is a monolithic Node.js/Express/TypeScript backend with:
- **15 route groups** (~40+ API endpoints)
- **11 database models** managed via Prisma ORM on SQLite
- **A grammY-based Telegram Bot** with payment handling
- **TON blockchain integration** for withdrawals
- **4 game subsystems**: Mining, Box Game, Car Game, Spin Wheel
- **52 database migrations** accumulated over development
- **No automated tests**, no rate limiting, no API documentation

---

## 2. Objectives & Scope

### 2.1 Objectives

1. **Rebuild** the backend from scratch with improved architecture, maintainability, and scalability.
2. **Preserve all existing functionality** — every feature described in this document must be fully replicated.
3. **Improve security** — add rate limiting, input validation, and anti-abuse measures.
4. **Improve scalability** — migrate from SQLite to a production-grade database.
5. **Add test coverage** — unit and integration tests for all critical game logic.
6. **Produce API documentation** — auto-generated OpenAPI/Swagger specification.

### 2.2 In Scope

- All REST API endpoints (authentication, game, upgrades, withdrawals, tasks, mini-games, leaderboards, admin)
- Telegram Bot (commands, payments, subscription checks)
- Database schema and migrations
- TON blockchain withdrawal service
- Background cron jobs
- Admin panel API
- Configuration management (static + dynamic from DB)

### 2.3 Out of Scope

- Frontend / Telegram Mini-App client
- Infrastructure provisioning (hosting, CI/CD pipelines)
- Mobile app development
- Game design changes (balancing, new features)

---

## 3. Tech Stack Requirements

### 3.1 Required Stack

| Component         | Technology                      | Notes                                |
|-------------------|---------------------------------|--------------------------------------|
| Runtime           | Node.js (LTS)                   | v20+ recommended                     |
| Language          | TypeScript 5.x                  | Strict mode enabled                  |
| HTTP Framework    | Express.js 5.x or Fastify       | Must support async middleware        |
| ORM               | Prisma 6.x                      | Type-safe database access            |
| Database          | PostgreSQL 15+                  | Replace SQLite for production        |
| Bot Framework     | grammY 1.x                      | Telegram Bot API                     |
| Authentication    | jsonwebtoken (JWT)              | Separate user & admin tokens         |
| Password Hashing  | bcrypt                          | Admin password hashing               |
| Blockchain        | @ton/ton, @ton/core, @ton/crypto| TON network integration              |
| Scheduling        | node-cron                       | Background job scheduling            |
| Queue             | p-queue or BullMQ               | Async task management                |
| Validation        | zod or joi                      | Request body/param validation        |
| Documentation     | swagger-jsdoc + swagger-ui      | Auto-generated API docs              |
| Testing           | vitest or jest                  | Unit + integration tests             |

### 3.2 Development Tooling

- **tsx** — TypeScript execution for development
- **ESLint + Prettier** — Code style and linting
- **dotenv** — Environment variable management
- **Prisma Studio** — Database GUI for development

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Telegram Platform                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Mini-App     │  │  Bot API     │  │  Stars Payment │  │
│  │  (Frontend)   │  │              │  │  System        │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
└─────────┼─────────────────┼──────────────────┼────────────┘
          │ REST API         │ Webhooks/Polling  │ Callbacks
          ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                   Backend Server                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Express     │  │  grammY Bot  │  │  Cron Jobs     │  │
│  │  REST API    │  │  Handler     │  │  Scheduler     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                  │                   │          │
│  ┌──────┴──────────────────┴───────────────────┴──────┐  │
│  │              Service / Business Logic Layer         │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────────┐ │  │
│  │  │Mining  │ │Box Game│ │Car Game│ │Withdrawals  │ │  │
│  │  │Service │ │Service │ │Service │ │Service      │ │  │
│  │  └────────┘ └────────┘ └────────┘ └─────────────┘ │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────┴───────────────────────────┐  │
│  │              Prisma ORM / Data Layer                │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼───────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌───────────┐ ┌───────────┐ ┌───────────┐
       │PostgreSQL │ │TON Network│ │Telegram   │
       │Database   │ │(Blockchain│ │Channels   │
       │           │ │ Testnet)  │ │(23+)      │
       └───────────┘ └───────────┘ └───────────┘
```

### 4.2 Directory Structure (Recommended)

```
src/
├── index.ts                 # Application entry point
├── server.ts                # Express/HTTP server setup
├── prisma.ts                # Prisma client singleton
├── bot/
│   ├── index.ts             # Bot setup, command handlers
│   └── helpers.ts           # Subscription checks, broadcasts
├── config/
│   ├── env.ts               # Environment variable validation & export
│   ├── game.ts              # Static game balance constants
│   └── settings.ts          # Dynamic settings loader (from DB)
├── middleware/
│   ├── authenticate.ts      # User JWT middleware
│   ├── adminAuth.ts         # Admin JWT middleware
│   └── validate.ts          # Request validation middleware (NEW)
├── routes/
│   ├── auth.ts
│   ├── game.ts
│   ├── user.ts
│   ├── upgrades.ts
│   ├── withdrawals.ts
│   ├── reward.ts
│   ├── task.ts
│   ├── box.ts
│   ├── carGame.ts
│   ├── stars.ts
│   ├── leaderboard.ts
│   ├── blockList.ts
│   └── admin/
│       ├── auth.ts
│       └── user.ts
├── services/                # Business logic layer (NEW — extract from routes)
│   ├── miningService.ts
│   ├── boxGameService.ts
│   ├── carGameService.ts
│   ├── upgradeService.ts
│   ├── withdrawalService.ts
│   ├── referralService.ts
│   └── tonService.ts
├── lib/
│   ├── verifyTelegramAuth.ts
│   ├── randomBoxRewards.ts
│   ├── boxRewardEffect.ts
│   ├── referralReward.ts
│   ├── levelUtils.ts
│   ├── selectPrize.ts
│   └── ip.ts
├── jobs/
│   ├── dailyRefill.ts
│   └── index.ts             # Cron scheduler
├── types/
│   └── express.d.ts
└── __tests__/               # Test files (NEW)
    ├── services/
    └── routes/
```

---

## 5. Database Schema

### 5.1 Entity-Relationship Overview

The database consists of **11 models** with the following relationships:

```
User (1) ─── (N) Withdrawal
User (1) ─── (N) Stars
User (1) ─── (N) Gifts
User (1) ─── (N) Action
User (1) ─── (N) BoxSession
User (1) ─── (N) CarGameSession
User (1) ─── (N) User [self-referral: referredBy]
Settings (singleton, id=1)
Season (independent)
JobState (independent)
Admin (independent)
```

### 5.2 Model Definitions

#### 5.2.1 User

| Field              | Type      | Default   | Description                                      |
|--------------------|-----------|-----------|--------------------------------------------------|
| id                 | Int       | Auto-inc  | Primary key                                      |
| telegramId         | String    | —         | Unique. Telegram user ID                         |
| username           | String?   | ""        | Telegram username                                |
| firstName          | String?   | ""        | First name                                       |
| lastName           | String?   | ""        | Last name                                        |
| languageCode       | String?   | ""        | Language code (e.g., "en")                       |
| isBot              | Boolean   | false     | Whether the account is a bot                     |
| isBlocked          | Boolean   | false     | Whether the user is blocked                      |
| totalCoins         | Float     | 0         | Lifetime accumulated coins                       |
| coins              | Float     | 0         | Current spendable coin balance                   |
| level              | Int       | 1         | Character level (1–13)                           |
| miningRate         | Float     | 0.025     | Coins earned per second while mining             |
| referredById       | Int?      | null      | FK → User.id (who referred this user)            |
| rewardedLevels     | String    | "[]"      | JSON array of levels for which referrer was paid |
| referralEarnings   | Float     | 0         | Total coins earned from referrals                |
| lastMiningTick     | DateTime? | null      | Timestamp of last mining sync                    |
| isMining           | Boolean   | false     | Whether user is currently mining                 |
| tempCoins          | Float     | 0         | Coins in mining buffer (not yet collected)       |
| vaultCapacity      | Float     | 5         | Maximum coins that can be buffered               |
| currentHealth      | Float     | 600       | Current health points                            |
| maxHealth          | Float     | 600       | Maximum health points                            |
| currentEnergy      | Float     | 300       | Current energy points                            |
| maxEnergy          | Float     | 300       | Maximum energy points                            |
| healthPerSecond    | Float     | 0.2       | Health drain rate per second during mining        |
| energyPerSecond    | Float     | 0.1       | Energy drain rate per second during mining        |
| healthRefillLimit  | Int       | 20        | Remaining daily health refills                   |
| energyRefillLimit  | Int       | 20        | Remaining daily energy refills                   |
| vaultLevel         | Int       | 1         | Vault capacity upgrade level                     |
| miningRateLevel    | Int       | 1         | Mining rate upgrade level                        |
| energyLevel        | Int       | 1         | Energy capacity upgrade level                    |
| healthLevel        | Int       | 1         | Health capacity upgrade level                    |
| lastWheelSpin      | DateTime? | null      | Last spin wheel usage                            |
| subscriptions      | String    | "[]"      | JSON array of subscribed channel usernames        |
| canPlayBox         | Boolean   | false     | Whether user has a box game ticket               |
| canPlayCar         | Boolean   | false     | Whether user has a car game ticket               |
| createdAt          | DateTime  | now()     | Account creation timestamp                       |
| updatedAt          | DateTime  | auto      | Last update timestamp                            |

**Relations:** referredBy → User, referrals → User[], withdrawals, stars, gifts, actions, boxSessions, carGameSessions

#### 5.2.2 Withdrawal

| Field         | Type     | Default | Description                                  |
|---------------|----------|---------|----------------------------------------------|
| id            | Int      | Auto    | Primary key                                  |
| userId        | Int      | —       | FK → User.id                                 |
| amountCoins   | Float    | —       | Coins withdrawn                              |
| amountTon     | Float    | —       | TON equivalent                               |
| ip            | String   | —       | Client IP address (fraud detection)          |
| targetAddress | String   | —       | TON wallet address                           |
| status        | String   | —       | PENDING / COMPLETED / FAILED                 |
| txHash        | String?  | null    | Blockchain transaction hash                  |
| errorMessage  | String?  | null    | Error details if failed                      |
| createdAt     | DateTime | now()   | Creation timestamp                           |
| updatedAt     | DateTime | auto    | Last update timestamp                        |

#### 5.2.3 Stars

| Field     | Type     | Default | Description              |
|-----------|----------|---------|--------------------------|
| id        | Int      | Auto    | Primary key              |
| userId    | Int      | —       | FK → User.id             |
| amount    | Int      | —       | Number of stars          |
| comment   | String   | —       | Description/source       |
| createdAt | DateTime | now()   |                          |
| updatedAt | DateTime | auto    |                          |

#### 5.2.4 Gifts

| Field     | Type     | Default | Description              |
|-----------|----------|---------|--------------------------|
| id        | Int      | Auto    | Primary key              |
| userId    | Int      | —       | FK → User.id             |
| name      | String   | —       | Gift name/type           |
| createdAt | DateTime | now()   |                          |
| updatedAt | DateTime | auto    |                          |

#### 5.2.5 Action (Audit Log)

| Field  | Type     | Default | Description                     |
|--------|----------|---------|---------------------------------|
| id     | Int      | Auto    | Primary key                     |
| userId | Int      | —       | FK → User.id                    |
| type   | String   | —       | Action type identifier          |
| ip     | String   | —       | Client IP address               |
| time   | DateTime | now()   | When the action occurred        |
| data   | String   | —       | JSON payload with action details|

#### 5.2.6 BoxSession

| Field     | Type     | Default | Description                         |
|-----------|----------|---------|-------------------------------------|
| id        | String   | UUID    | Primary key (UUID)                  |
| userId    | Int      | —       | FK → User.id                        |
| rewards   | Json     | —       | Array of 12 reward objects          |
| opened    | Int      | 0       | Number of boxes opened (max 3)      |
| claimed   | Boolean  | false   | Whether rewards have been claimed   |
| createdAt | DateTime | now()   |                                     |

#### 5.2.7 CarGameSession

| Field     | Type      | Default | Description                                        |
|-----------|-----------|---------|----------------------------------------------------|
| id        | String    | UUID    | Primary key (UUID)                                 |
| userId    | Int       | —       | FK → User.id                                       |
| startTime | DateTime  | now()   | Session start                                      |
| endTime   | DateTime? | null    | Session end                                        |
| score     | Int       | 0       | Game score                                         |
| coins     | Int       | 0       | Coins earned                                       |
| status    | String    | ACTIVE  | ACTIVE / COMPLETED / FAILED / FLAGGED_CHEAT        |

#### 5.2.8 Admin

| Field     | Type     | Default | Description              |
|-----------|----------|---------|--------------------------|
| id        | Int      | Auto    | Primary key              |
| username  | String   | —       | Unique login name        |
| password  | String   | —       | bcrypt-hashed password   |
| createdAt | DateTime | now()   |                          |

#### 5.2.9 Settings (Singleton)

| Field                   | Type  | Default          | Description                          |
|-------------------------|-------|------------------|--------------------------------------|
| id                      | Int   | 1                | Always 1 (singleton)                 |
| referralRewards         | Json  | (see §8.4)       | Level → coin reward mapping          |
| spinWheelCooldownHours  | Float | 24               | Hours between spins                  |
| spinWheelProbabilities  | Json  | (see §8.5)       | Weighted prize distribution          |
| energyPrice             | Int   | 25               | Coin cost per energy refill          |
| healthPrice             | Int   | 25               | Coin cost per health refill          |
| upgradables             | Json  | (see §8.3)       | Upgrade values per level             |
| upgradeCosts            | Json  | (see §8.3)       | Upgrade costs per level              |
| upgradablesMaxLevel     | Int   | 13               | Maximum upgrade level                |
| coinToTonRate           | Int   | 100000           | Coins per 1 TON                      |
| minimumCoinWithdrawal   | Int   | 1000             | Minimum withdrawal in coins          |
| maximumCoinWithdrawal   | Int   | 100000           | Maximum withdrawal in coins          |
| channels                | Json  | (23 channels)    | Channel subscription task list       |
| rewardForSubscription   | Int   | 20               | Coins per subscription completed     |

#### 5.2.10 Season

| Field | Type     | Default | Description         |
|-------|----------|---------|---------------------|
| id    | Int      | Auto    | Primary key         |
| name  | String   | —       | Unique season name  |
| start | DateTime | —       | Season start date   |
| end   | DateTime | —       | Season end date     |

#### 5.2.11 JobState

| Field     | Type     | Default | Description                  |
|-----------|----------|---------|------------------------------|
| name      | String   | —       | Primary key (job identifier) |
| lastRunAt | DateTime | —       | Last execution time          |
| nextRunAt | DateTime | —       | Next scheduled execution     |

---

## 6. Authentication & Authorization

### 6.1 User Authentication Flow

1. Frontend obtains `initData` string from Telegram Mini App SDK.
2. Client sends `POST /api/auth` with `{ initData, ref? }`.
3. Server validates the `initData` signature using the Bot Token via HMAC-SHA256 (library: `@tma.js/init-data-node`).
4. Validation window: **24 hours** from init data generation.
5. Server extracts user fields (telegramId, username, firstName, lastName, languageCode, isBot).
6. Server creates a new user (if not exists) or updates existing user fields.
7. If `ref` parameter provided and user is new, link referral relationship.
8. Server returns a **JWT token** (signed with `JWT_SECRET`, expires in **7 days**).
9. All subsequent requests include `Authorization: Bearer <token>`.

### 6.2 User JWT Middleware

- Extracts token from `Authorization` header.
- Verifies and decodes JWT using `JWT_SECRET`.
- Loads full User record from database by decoded `id`.
- Checks `isBlocked` flag — rejects blocked users with 403.
- Attaches user object to `req.user`.

### 6.3 Admin Authentication

- **Registration**: `POST /api/admin/auth/register` — requires an existing admin's JWT in the header (bootstrap first admin via seed script).
- **Login**: `POST /api/admin/auth/login` — username + password (bcrypt-verified), returns JWT signed with `ADMIN_JWT_SECRET` (7-day expiry).
- Admin JWT middleware validates using `ADMIN_JWT_SECRET`, attaches `adminId` to request.

---

## 7. API Specification

### 7.1 Authentication

| Method | Endpoint       | Auth | Request Body              | Response                        |
|--------|----------------|------|---------------------------|---------------------------------|
| POST   | /api/auth      | None | `{ initData, ref? }`     | `{ token, user }` or `{ token, user, isNew }` |

### 7.2 Game (Mining)

| Method | Endpoint                  | Auth | Request Body | Response / Notes                                     |
|--------|---------------------------|------|--------------|------------------------------------------------------|
| POST   | /api/game/start-mining    | JWT  | —            | Start mining session. Fail if health=0, energy=0, vault full, or already mining. |
| POST   | /api/game/sync            | JWT  | —            | Sync mining state. Calculate coins, drain energy/health. Burns tempCoins if health reaches 0. Returns updated user. |
| POST   | /api/game/collect-coins   | JWT  | —            | Transfer tempCoins → coins. Requires ≥10% vault capacity and health > 0. |
| POST   | /api/game/stop-mining     | JWT  | —            | Stop active mining session.                          |
| POST   | /api/game/recover-energy  | JWT  | —            | Refill energy to max. Costs `energyPrice` coins. Decrements `energyRefillLimit`. |
| POST   | /api/game/recover-health  | JWT  | —            | Refill health to max. Costs `healthPrice` coins. Decrements `healthRefillLimit`. |
| POST   | /api/game/spin-wheel      | JWT  | —            | Spin prize wheel. 24-hour cooldown. Returns prize (coins, stars, or gift). |
| GET    | /api/game/spin-wheel/status | JWT | —           | Returns `{ canSpin, nextSpinAt }`.                   |

### 7.3 User

| Method | Endpoint             | Auth | Response                                    |
|--------|----------------------|------|---------------------------------------------|
| GET    | /api/user/me         | JWT  | Full user profile object                    |
| GET    | /api/user/invite-link| JWT  | `{ inviteLink }` — Telegram bot deep link   |
| GET    | /api/user/referrals  | JWT  | `{ referrals[], referralEarnings }`         |

### 7.4 Upgrades

| Method | Endpoint                | Auth | Response / Notes                                       |
|--------|-------------------------|------|--------------------------------------------------------|
| GET    | /api/upgrades/status    | JWT  | Current upgrade levels, costs for next level, max levels |
| POST   | /api/upgrades/:name     | JWT  | Purchase upgrade. `:name` = wealth, work, food, immune. Validates level requirement and coin balance. |

### 7.5 Withdrawals

| Method | Endpoint                | Auth | Request Body                     | Response / Notes                    |
|--------|-------------------------|------|----------------------------------|-------------------------------------|
| GET    | /api/withdrawals/data   | JWT  | —                                | Rates, limits, balance              |
| GET    | /api/withdrawals/history| JWT  | —                                | User's withdrawal records           |
| POST   | /api/withdrawals        | JWT  | `{ targetAddress, amountCoins }` | Create PENDING withdrawal. Validates min/max, balance, blocked status. Logs IP. |

### 7.6 Rewards (Secret Endpoints)

| Method | Endpoint                              | Auth | Query Params       | Notes                            |
|--------|---------------------------------------|------|--------------------|----------------------------------|
| GET    | /api/reward/{HEALTH_REWARD_SECRET}    | None | `userId=<telegramId>` | Grant health refill to user    |
| GET    | /api/reward/{ENERGY_REWARD_SECRET}    | None | `userId=<telegramId>` | Grant energy refill to user    |
| GET    | /api/reward/{TASK_REWARD_SECRET}      | None | `userId=<telegramId>` | Grant task reward coins        |

These endpoints are secured by secret URL segments (configured via environment variables).

### 7.7 Tasks (Channel Subscriptions)

| Method | Endpoint                       | Auth | Request Body            | Response / Notes                         |
|--------|--------------------------------|------|-------------------------|------------------------------------------|
| GET    | /api/task                      | JWT  | —                       | List available (uncompleted) tasks       |
| GET    | /api/task/all                  | JWT  | —                       | List all completed subscription tasks    |
| POST   | /api/task/check-subscription   | JWT  | `{ channelUsername }`   | Verify subscription via Bot API, grant reward if verified |

### 7.8 Box Game

| Method | Endpoint                  | Auth | Request Body            | Response / Notes                              |
|--------|---------------------------|------|-------------------------|-----------------------------------------------|
| POST   | /api/box/pay-with-coins   | JWT  | —                       | Buy box ticket for 10,000 coins               |
| POST   | /api/box/start            | JWT  | —                       | Start session: returns sessionId + 12 boxes   |
| POST   | /api/box/open             | JWT  | `{ sessionId, index }`  | Open box at index (max 3 per session)         |
| POST   | /api/box/claim            | JWT  | —                       | Claim all opened rewards (transactional)       |
| GET    | /api/box/status           | JWT  | —                       | Current box game status                        |

### 7.9 Car Game

| Method | Endpoint                  | Auth | Request Body                     | Response / Notes                                     |
|--------|---------------------------|------|----------------------------------|------------------------------------------------------|
| POST   | /api/car-game/start       | JWT  | —                                | Start car game (requires canPlayCar ticket)          |
| POST   | /api/car-game/claim       | JWT  | `{ sessionId, coins, score }`   | Claim rewards. Anti-cheat: max 8 coins/sec. Flags cheaters. |
| GET    | /api/car-game/status      | JWT  | —                                | Current car game status                              |

### 7.10 Stars (Payments)

| Method | Endpoint                          | Auth | Response / Notes                              |
|--------|-----------------------------------|------|-----------------------------------------------|
| POST   | /api/stars/create-invoice         | JWT  | Create Telegram Stars invoice for box game (10 stars) |
| POST   | /api/stars/create-car-game-invoice| JWT  | Create Telegram Stars invoice for car game (1 star)   |

### 7.11 Leaderboard

| Method | Endpoint                      | Auth | Response / Notes                           |
|--------|-------------------------------|------|--------------------------------------------|
| GET    | /api/leaderboard/level/:level | JWT  | Top 100 users at the given level by coins  |
| GET    | /api/leaderboard/season/:id   | JWT  | Season details and time remaining          |

### 7.12 Block List

| Method | Endpoint          | Auth | Response                              |
|--------|-------------------|------|---------------------------------------|
| GET    | /api/block-list   | JWT  | Array of blocked user telegramIds     |

### 7.13 Utility

| Method | Endpoint              | Auth | Response                                |
|--------|-----------------------|------|-----------------------------------------|
| GET    | /next-refill-update   | None | `{ nextRefillAt, timeRemaining }`       |

---

## 8. Game Mechanics & Business Logic

### 8.1 Mining System

**Core Loop:**
1. Player starts mining (`start-mining`).
2. System records `lastMiningTick = now()`.
3. On each `sync` call, the server calculates elapsed seconds and:
   - Adds `elapsed × miningRate` to `tempCoins` (capped by `vaultCapacity`).
   - Subtracts `elapsed × energyPerSecond` from `currentEnergy`.
   - Subtracts `elapsed × healthPerSecond` from `currentHealth`.
4. If `currentEnergy` reaches 0 → mining stops (energy depleted).
5. If `currentHealth` reaches 0 → **all tempCoins are burned** (lost), mining stops.
6. If `tempCoins` reaches `vaultCapacity` → mining stops (vault full).
7. Player calls `collect-coins` to move tempCoins → coins (permanent balance).
   - Requires tempCoins ≥ 10% of vaultCapacity.
   - Requires health > 0.

**Key Insight:** Health reaching zero is a punishment mechanic — player loses all unmined coins. This creates urgency to collect or recover health.

### 8.2 Resource Recovery

| Resource | Cost per Refill | Daily Limit | Refill Effect        |
|----------|-----------------|-------------|----------------------|
| Energy   | 25 coins        | 20/day      | Restores to maxEnergy|
| Health   | 25 coins        | 20/day      | Restores to maxHealth|

- Daily limits reset at **00:00 UTC** via cron job.
- Refill limits stored per-user (`energyRefillLimit`, `healthRefillLimit`).

### 8.3 Upgrade System

**4 Upgrade Types:**

| Upgrade Name | DB Field         | Effect                           | Default Value |
|--------------|------------------|----------------------------------|---------------|
| wealth       | vaultLevel       | Increases vault capacity          | 5 coins       |
| work         | miningRateLevel  | Increases mining rate             | 0.025/sec     |
| food         | energyLevel      | Increases max energy              | 300           |
| immune       | healthLevel      | Increases max health              | 600           |

**Upgrade Values by Level (1–13):**

| Level | Vault Capacity | Mining Rate | Max Energy | Max Health |
|-------|----------------|-------------|------------|------------|
| 1     | 5              | 0.025       | 300        | 600        |
| 2     | 10             | 0.030       | 350        | 700        |
| 3     | 15             | 0.035       | 400        | 800        |
| 4     | 20             | 0.040       | 500        | 900        |
| 5     | 30             | 0.045       | 600        | 1000       |
| 6     | 40             | 0.050       | 700        | 1200       |
| 7     | 60             | 0.055       | 800        | 1400       |
| 8     | 80             | 0.060       | 900        | 1600       |
| 9     | 100            | 0.065       | 1000       | 1800       |
| 10    | 130            | 0.070       | 1100       | 2000       |
| 11    | 160            | 0.080       | 1200       | 2200       |
| 12    | 200            | 0.090       | 1350       | 2600       |
| 13    | 300            | 0.100       | 1500       | 3000       |

**Upgrade Costs by Level (coins):**

| Level | Cost      |
|-------|-----------|
| 1     | 0 (free)  |
| 2     | 200       |
| 3     | 500       |
| 4     | 2,000     |
| 5     | 5,000     |
| 6     | 10,000    |
| 7     | 20,000    |
| 8     | 50,000    |
| 9     | 100,000   |
| 10    | 250,000   |
| 11    | 500,000   |
| 12    | 1,000,000 |
| 13    | 4,000,000 |

**Level Constraint:** A user can only upgrade to level N if their character level is ≥ N.

### 8.4 Level Calculation

Character level = `min(vaultLevel, miningRateLevel, energyLevel, healthLevel)`

This means a player must upgrade **all four** categories to advance their character level.

### 8.5 Referral System

**Flow:**
1. New user registers with `ref=ref_<userId>` or `ref=<telegramId>`.
2. `referredById` is set on the new user.
3. Each time the referred user **levels up**, the referrer earns a one-time reward.
4. `rewardedLevels` (JSON array) tracks which levels have already been rewarded.

**Referral Rewards by Level:**

| Level Reached | Referrer Reward (coins) |
|---------------|-------------------------|
| 2             | 200                     |
| 3             | 500                     |
| 4             | 2,000                   |
| 5             | 5,000                   |
| 6             | 10,000                  |
| 7             | 20,000                  |
| 8             | 50,000                  |
| 9             | 100,000                 |
| 10            | 250,000                 |
| 11            | 500,000                 |
| 12            | 1,000,000               |
| 13            | 1,050,000               |

### 8.6 Spin Wheel

- **Cooldown:** 24 hours between spins.
- **Prize Pool (weighted probabilities):**

| Prize       | Weight | Probability |
|-------------|--------|-------------|
| 1 coin      | 0.15   | 15%         |
| 13 coins    | 0.15   | 15%         |
| 50 coins    | 0.15   | 15%         |
| 100 coins   | 0.12   | 12%         |
| 150 coins   | 0.11   | 11%         |
| 250 coins   | 0.10   | 10%         |
| 300 coins   | 0.08   | 8%          |
| 400 coins   | 0.05   | 5%          |
| 13 stars    | 0.03   | 3%          |
| 50 stars    | 0.02   | 2%          |
| 100 stars   | 0.01   | 1%          |
| Gift        | 0.03   | 3%          |

- Stars prizes create a `Stars` record for the user.
- Gift prizes create a `Gifts` record for the user.
- Coin prizes are added directly to user balance.

### 8.7 Box Game

1. **Ticket Purchase:** 10,000 coins OR 10 Telegram Stars.
2. **Session Start:** Generates 12 boxes with weighted random rewards.
3. **Box Rewards Pool:**
   - Coins: 500 (30%), 1000 (25%), 3000 (15%), 5000 (10%)
   - Stars: 13 (8%), 50 (5%), 100 (2%)
   - Gift (5%)
4. **Opening:** Player opens up to **3 boxes** per session.
5. **Claiming:** All opened rewards are applied atomically (database transaction).
6. **Session Cleanup:** canPlayBox flag is set to false after claim.

### 8.8 Car Game

1. **Ticket Purchase:** 1 Telegram Star (via Stars invoice).
2. **Session Start:** Creates active session with `startTime`.
3. **Claiming:** Player submits `{ sessionId, coins, score }`.
4. **Anti-Cheat Validation:**
   - Calculate play duration: `endTime - startTime` (seconds).
   - Maximum allowed coins: `duration × 8` (8 coins/second cap).
   - If claimed coins > allowed → status = `FLAGGED_CHEAT`, user is **blocked**.
5. **Valid Claim:** Coins added to user balance, session marked COMPLETED.

### 8.9 Channel Subscription Tasks

1. Settings contain a list of channels with `{ name, username, reward }`.
2. User calls `POST /api/task/check-subscription` with `{ channelUsername }`.
3. Bot verifies membership via Telegram `getChatMember` API.
4. If subscribed → coins granted, channel added to user's `subscriptions` JSON array.
5. Each channel can only be rewarded once per user.
6. Default reward: 20 coins per subscription.

### 8.10 Withdrawal System

1. User requests withdrawal with `{ targetAddress, amountCoins }`.
2. **Validations:**
   - User is not blocked.
   - `amountCoins` ≥ `minimumCoinWithdrawal` (1,000).
   - `amountCoins` ≤ `maximumCoinWithdrawal` (100,000).
   - User has sufficient `coins` balance.
3. **Conversion:** `amountTon = amountCoins / coinToTonRate`.
4. **Record:** Create Withdrawal with status `PENDING`, log IP.
5. **Deduction:** Subtract `amountCoins` from user's `coins`.
6. **Processing:** TON transaction sent via hot wallet (separate service).

---

## 9. External Integrations

### 9.1 Telegram Bot (grammY)

**Commands:**
| Command       | Description                              |
|---------------|------------------------------------------|
| `/start`      | Welcome message with Mini App button     |
| `/help`       | Help text for the bot                    |
| `/stars_tx`   | View star transaction ledger (admin use) |

**Payment Handling:**
- Handles `pre_checkout_query` events → always approves.
- Handles `successful_payment` events:
  - Identifies product by invoice payload ("box" or "car_game").
  - Sets `canPlayBox = true` or `canPlayCar = true` on user.
  - Records Stars transaction.

**Subscription Verification:**
- `checkIfUserIsSubscribed(channelUsername, telegramId)` — calls Telegram `getChatMember`.
- `checkIfBotIsAdmin()` — verifies bot has admin privileges in all configured channels.

**Broadcast:**
- `sendMessageToAllBotUsers()` — iterates all users and sends a message via bot.

### 9.2 Telegram Stars Payment

- Invoice creation via `bot.api.createInvoiceLink()`.
- Currency: `XTR` (Telegram Stars).
- Products:
  - Box game ticket: 10 Stars, payload: `box_<telegramId>`
  - Car game ticket: 1 Star, payload: `car_game_<telegramId>`

### 9.3 TON Blockchain

- **Network:** Testnet (configurable to mainnet via endpoint).
- **API Endpoint:** `https://testnet.toncenter.com/api/v2/jsonRPC`
- **Wallet Contract:** WalletContractV5R1
- **Key Derivation:** From mnemonic (24-word seed phrase) via `@ton/crypto`.
- **Transaction Flow:**
  1. Derive keypair from mnemonic.
  2. Open wallet contract on TON client.
  3. Create internal transfer message with TON amount.
  4. Send transaction and retrieve hash.
- **Queue:** Uses `p-queue` with concurrency of 1 for sequential processing.

---

## 10. Background Jobs & Scheduling

### 10.1 Daily Energy/Health Refill Reset

- **Schedule:** Every day at `00:00 UTC`.
- **Action:**
  - Update **all users**: set `energyRefillLimit = 20`, `healthRefillLimit = 20`.
  - Update `JobState` record (`name = "daily-refill"`) with `lastRunAt` and `nextRunAt`.
- **Implementation:** `node-cron` expression: `'0 0 * * *'`

### 10.2 JobState Tracking

- The `JobState` model stores when each job last ran and when it will next run.
- The `GET /next-refill-update` endpoint reads this to tell users when their limits reset.

---

## 11. Admin Panel API

### 11.1 Admin Authentication

| Method | Endpoint                  | Auth  | Request Body              | Response                 |
|--------|---------------------------|-------|---------------------------|--------------------------|
| POST   | /api/admin/auth/register  | Admin | `{ username, password }`  | `{ admin }`              |
| POST   | /api/admin/auth/login     | None  | `{ username, password }`  | `{ token }`              |
| GET    | /api/admin/auth/me        | Admin | —                         | `{ admin }`              |

### 11.2 Admin User Management

| Method | Endpoint                  | Auth  | Response                      |
|--------|---------------------------|-------|-------------------------------|
| GET    | /api/admin/user/total     | Admin | `{ total: number }`           |
| GET    | /api/admin/user/all       | Admin | `{ users: User[] }`           |
| GET    | /api/admin/user/:id       | Admin | `{ user: User }`              |

---

## 12. Security Requirements

### 12.1 Existing Security (Must Retain)

1. **Telegram Init Data Validation** — HMAC-SHA256 signature verification.
2. **JWT Authentication** — Separate secrets for user and admin tokens.
3. **Password Hashing** — bcrypt with default salt rounds for admin passwords.
4. **Anti-Cheat (Car Game)** — Server-side validation of coin earnings vs play time.
5. **User Blocking** — Flagged cheaters are automatically blocked.
6. **IP Logging** — All withdrawals and actions log client IP.
7. **Transactional Operations** — Box claim uses database transactions.
8. **Secret URL Segments** — Reward endpoints protected by secret strings.

### 12.2 Security Improvements (Required for Rebuild)

1. **Rate Limiting** — Apply per-IP and per-user rate limits on all endpoints. Critical endpoints (auth, withdrawals, spin wheel) should have stricter limits.
2. **Input Validation** — Use zod/joi schemas for all request bodies and query parameters. Reject malformed input early.
3. **CORS Configuration** — Restrict allowed origins to the Mini App domain only (not wildcard).
4. **Helmet.js** — Add standard HTTP security headers.
5. **Environment Validation** — Validate all required environment variables at startup (fail fast).
6. **SQL Injection Prevention** — Already handled by Prisma, but ensure no raw queries without parameterization.
7. **Withdrawal Queue** — Process withdrawals through a proper job queue to prevent double-spending race conditions.
8. **Session Expiry** — Box and Car game sessions should have maximum duration (e.g., 1 hour) after which they auto-expire.

---

## 13. Configuration & Environment

### 13.1 Environment Variables

| Variable               | Type   | Required | Description                                |
|------------------------|--------|----------|--------------------------------------------|
| DATABASE_URL           | String | Yes      | PostgreSQL connection string               |
| PORT                   | Number | No       | Server port (default: 8080)                |
| BOT_TOKEN              | String | Yes      | Telegram Bot API token                     |
| JWT_SECRET             | String | Yes      | Secret for user JWT signing                |
| ADMIN_JWT_SECRET       | String | Yes      | Secret for admin JWT signing               |
| WEB_APP_URL            | String | Yes      | Frontend Mini App URL                      |
| BOT_USERNAME           | String | Yes      | Bot username (without @)                   |
| HEALTH_REWARD_SECRET   | String | Yes      | URL segment for health reward endpoint     |
| ENERGY_REWARD_SECRET   | String | Yes      | URL segment for energy reward endpoint     |
| TASK_REWARD_SECRET     | String | Yes      | URL segment for task reward endpoint       |
| HOT_WALLET_MNEMONIC    | String | Yes      | 24-word TON wallet mnemonic                |
| TON_API_ENDPOINT       | String | Yes      | TON API JSON-RPC endpoint                  |
| TON_API_TOKEN          | String | Yes      | TON API authentication token               |

### 13.2 Dynamic Configuration (Settings Table)

All game-balance values are stored in the `Settings` singleton row (id=1) and loaded at runtime. This allows tuning game parameters without redeployment. See §5.2.9 for the full schema.

### 13.3 Database Seeding

A seed script must populate:
1. The `Settings` singleton with default game configuration values.
2. At least one `Admin` account for initial access.
3. Optionally, an initial `Season` record.

---

## 14. Non-Functional Requirements

### 14.1 Performance

- API response time: < 200ms for standard endpoints.
- Mining sync calculation must be efficient (pure math, no loops).
- Leaderboard queries should use database indexes on `(level, coins)`.
- Bot webhook/polling must not block the HTTP server.

### 14.2 Scalability

- Migrate from SQLite to **PostgreSQL** for concurrent write support.
- Withdrawal processing via a proper job queue (not in-request).
- Stateless server design (no in-memory state) to allow horizontal scaling.

### 14.3 Reliability

- Database transactions for all multi-step mutations (box claim, withdrawal, upgrade purchase).
- Graceful shutdown handling for bot and cron jobs.
- Error logging with structured format (consider winston or pino).

### 14.4 Maintainability

- Service layer extracted from route handlers (thin controllers).
- Request/response type definitions for all endpoints.
- Comprehensive error codes (not just HTTP status codes).
- Clean separation of game config from business logic.

### 14.5 Testing

- **Unit tests** for: level calculation, mining math, prize selection, box reward generation, anti-cheat validation.
- **Integration tests** for: authentication flow, upgrade purchasing, withdrawal flow, box game full lifecycle.
- Target: ≥ 80% coverage on service layer.

### 14.6 Documentation

- Auto-generated **OpenAPI 3.0 / Swagger** specification.
- Swagger UI served at `/api/docs` in development.
- README with setup instructions, environment variable reference, and architecture overview.

---

## 15. Deliverables

| #  | Deliverable                          | Description                                               |
|----|--------------------------------------|-----------------------------------------------------------|
| 1  | Source code                          | Complete TypeScript backend with all features implemented  |
| 2  | Prisma schema + migrations           | PostgreSQL-compatible schema with clean migration history  |
| 3  | Seed script                          | Database seeding for Settings, Admin, and initial data     |
| 4  | Test suite                           | Unit and integration tests with ≥80% service coverage     |
| 5  | API documentation                    | OpenAPI/Swagger spec and served UI                        |
| 6  | Environment template                 | `.env.example` file with all required variables            |
| 7  | README                               | Setup, development, and deployment instructions            |
| 8  | Docker configuration (optional)      | Dockerfile and docker-compose for local development        |

---

## 16. Glossary

| Term            | Definition                                                                              |
|-----------------|-----------------------------------------------------------------------------------------|
| Mining          | Passive coin-earning mechanic where coins accumulate over time while energy/health drain |
| tempCoins       | Coins in the mining buffer, not yet collected; lost if health reaches 0                  |
| Vault           | Storage capacity for tempCoins; when full, mining stops                                  |
| Spin Wheel      | Daily random prize mechanic with weighted probability distribution                       |
| Box Game        | Paid mini-game where player opens 3 of 12 boxes for random rewards                      |
| Car Game        | Paid racing mini-game with server-side anti-cheat validation                             |
| Telegram Stars  | Telegram's in-app digital currency (XTR) used for purchases                              |
| TON             | The Open Network blockchain; used for coin-to-crypto withdrawals                         |
| TMA             | Telegram Mini App — web application embedded within Telegram                             |
| initData        | Cryptographically signed payload from Telegram verifying user identity                   |
| Hot Wallet      | Server-controlled TON wallet used for automated withdrawal payouts                       |
| grammY          | Modern TypeScript framework for building Telegram bots                                   |
| Referral        | User who joined via another user's invite link                                           |
| Season          | Time-bounded competition period for leaderboard rankings                                 |

---

*End of Terms of Reference*
