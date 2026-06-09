<p align="center">
  <h1 align="center">🔐 VaultPay — Backend Microservices</h1>
  <p align="center">
    <strong>A production-grade digital wallet platform built with microservices architecture</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white" alt="Fastify" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/RabbitMQ-3.12-FF6600?logo=rabbitmq&logoColor=white" alt="RabbitMQ" />
    <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</p>

---

## 📋 Overview

**VaultPay** is a fully functional digital wallet system decomposed into independent microservices. Each service owns its data, communicates asynchronously via RabbitMQ, and is orchestrated through a centralized API Gateway with JWT-based authentication.

This project demonstrates real-world backend engineering patterns used at companies like PayPal, Stripe, and Razorpay.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│                      http://localhost:5173                    │
└──────────────────────┬───────────────────────────────────────┘
                       │  HTTPS / REST
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   🌐 API GATEWAY (:3000)                     │
│            Fastify + JWT Auth + Reverse Proxy                │
│     • Authenticates all requests via Bearer tokens           │
│     • Injects x-user-id, x-user-email headers upstream      │
│     • Routes /api/auth/*, /api/wallet/*, /api/transactions/* │
└────┬──────────┬──────────┬──────────┬────────────────────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌─────────┐┌─────────┐┌──────────┐┌──────────┐
│ 🔐 Auth ││ 💰Wallet││📊 Txn    ││ 💳Payment│
│ :3001   ││ :3002   ││ :3003    ││ :3004    │
│         ││         ││          ││          │
│ • Signup││ • Query ││ • Immut. ││ • Bill   │
│ • Login ││   balance││  ledger  ││   pay    │
│ • JWT   ││ • Transf││ • Event  ││ • Rechar │
│ • Passwd││   er    ││   consum ││   ge     │
│ • Profl ││ • OCC   ││   er     ││          │
└────┬────┘└────┬────┘└────┬─────┘└────┬─────┘
     │          │          │           │
     ▼          ▼          ▼           ▼
┌──────────────────────────────────────────────┐
│          PostgreSQL 16 (:5433)                │
│   True Database-Per-Service Architecture      │
│   (auth_db, wallet_db, txn_db, payment_db)    │
└──────────────────────────────────────────────┘

     │          │          │           │
     └──────────┴──────┬───┴───────────┘
                       ▼
┌──────────────────────────────────────────────┐
│       🐇 RabbitMQ 3.12 (:5672 / :15672)     │
│    Event-Driven Async Communication          │
│    • wallet.transfer.completed               │
│    • user.registered                         │
│    • wallet.debit.completed                  │
└──────────────────────────────────────────────┘
```

---

## 🧩 Services Breakdown

| Service | Port | Responsibility | Key Patterns |
|---------|------|---------------|--------------|
| **API Gateway** | 3000 | Single entry point, JWT verification, reverse proxy | Gateway pattern, token injection |
| **Auth Service** | 3001 | User registration, login, password management, JWT issuance | bcrypt hashing, JWT RS256-compatible |
| **Wallet Service** | 3002 | Balance queries, money transfers, wallet provisioning | **Optimistic Concurrency Control (OCC)**, atomic DB transactions |
| **Transaction Service** | 3003 | Immutable financial ledger, transaction history | Event-driven consumer, CQRS-like read model |
| **Payment Service** | 3004 | Bill payments, mobile recharges | RabbitMQ consumer, idempotent processing |

---

## 🔑 Key Engineering Decisions

### 1. Optimistic Concurrency Control (OCC)
The Wallet Service uses a `version` field on each wallet record. During transfers, both the sender and receiver wallets are conditionally updated (`WHERE id = ? AND version = ?`) inside a single Prisma `$transaction`. If any concurrent modification occurred, the version check fails and the transfer is safely retried or rejected — preventing double-spending without pessimistic locks.

### 2. Event-Driven Architecture
After a successful transfer, the Wallet Service publishes a `wallet.transfer.completed` event to RabbitMQ. The Transaction Service and Payment Service consume these events asynchronously, ensuring:
- **Loose coupling** — services don't call each other directly
- **Eventual consistency** — the ledger is updated independently
- **Resilience** — if Transaction Service is down, messages queue up and are processed later

### 3. API Gateway Pattern
All client requests flow through a single gateway that:
- Verifies JWT tokens before forwarding
- Injects `x-user-id` / `x-user-email` headers so downstream services never handle raw tokens
- Provides a clean `/api/*` namespace

### 4. Database Per-Service Architecture
Each microservice connects to its own fully isolated database (`auth_db`, `wallet_db`, `transaction_db`, `payment_db`) inside the PostgreSQL instance. No foreign keys cross service boundaries — cross-service references use event-carried state transfer. This ensures strict decoupling and eliminates shared-state race conditions.

---

## 🗃️ Database Schemas

### Auth Service
```sql
User {
  id        UUID PRIMARY KEY
  email     VARCHAR UNIQUE
  phone     VARCHAR UNIQUE
  name      VARCHAR
  password  VARCHAR (bcrypt hash)
  createdAt TIMESTAMP
  updatedAt TIMESTAMP
}
```

### Wallet Service
```sql
Wallet {
  id        UUID PRIMARY KEY
  userId    UUID UNIQUE        -- cross-service ref (no FK)
  balance   DECIMAL(20,2)
  currency  VARCHAR DEFAULT 'USD'
  version   INT DEFAULT 0      -- OCC version field
  createdAt TIMESTAMP
  updatedAt TIMESTAMP
}

WalletTransaction {
  id          UUID PRIMARY KEY
  walletId    UUID REFERENCES Wallet(id)
  type        ENUM('CREDIT','DEBIT')
  amount      DECIMAL(20,2)
  description TEXT
  createdAt   TIMESTAMP
}
```

### Transaction Service
```sql
Transaction {
  id            UUID PRIMARY KEY
  fromUserId    UUID
  toUserId      UUID
  amount        DECIMAL(20,2)
  currency      VARCHAR
  type          VARCHAR
  description   TEXT
  idempotencyKey UUID UNIQUE    -- prevents duplicate processing
  date          TIMESTAMP
}
```

---

## 🚀 Getting Started

### Prerequisites
- **Docker** & **Docker Compose** installed
- **Node.js 18+** (for local development without Docker)

### Quick Start (Docker — Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/vaultpay-backend.git
cd vaultpay-backend

# 2. Copy environment files
cp api-gateway/.env.example api-gateway/.env.docker
cp auth-service/.env.example auth-service/.env.docker
cp wallet-service/.env.example wallet-service/.env.docker
cp transaction-service/.env.example transaction-service/.env.docker
cp payment-service/.env.example payment-service/.env.docker

# 3. Build & launch all services
docker-compose up -d --build

# 4. Verify all containers are running
docker ps
```

All services will be available at `http://localhost:3000/api/*`

### Local Development (Without Docker)

```bash
# 1. Start infrastructure only
npm run infra:up    # Starts Postgres, RabbitMQ, Redis in Docker

# 2. Install dependencies for each service
cd shared && npm install && npm run build && cd ..
cd auth-service && npm install && cd ..
cd wallet-service && npm install && cd ..
# ... repeat for other services

# 3. Run all services concurrently
npm run dev
```

---

## 🔌 API Reference

### Auth Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT |
| `GET` | `/api/auth/profile` | ✅ | Get current user profile |
| `PUT` | `/api/auth/password` | ✅ | Change password |

### Wallet Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/wallet/balance` | ✅ | Get wallet balance |
| `POST` | `/api/wallet/transfer` | ✅ | Transfer money to another user |
| `POST` | `/api/wallet/debit` | ✅ | Debit (for bill payments) |
| `GET` | `/api/wallet/lookup?phone=` | ✅ | Look up recipient by phone |

### Transaction Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/transactions` | ✅ | Get transaction history |

### Payment Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/bills/pay` | ✅ | Pay a bill |
| `POST` | `/api/recharge` | ✅ | Mobile recharge |

---

## 📁 Project Structure

```
vaultpay-backend/
├── api-gateway/              # 🌐 Centralized entry point
│   └── src/
│       ├── server.ts         # Fastify server setup
│       ├── proxy.ts          # Reverse proxy + JWT injection
│       └── plugins/auth.ts   # JWT verification plugin
│
├── auth-service/             # 🔐 User management & authentication
│   ├── prisma/schema.prisma  # User model
│   └── src/
│       ├── controller.ts     # Request handlers
│       ├── service.ts        # Business logic (bcrypt, JWT)
│       └── routes.ts         # Route definitions
│
├── wallet-service/           # 💰 Balance & transfers
│   ├── prisma/schema.prisma  # Wallet + WalletTransaction models
│   └── src/
│       ├── controller.ts     # Request handlers
│       ├── service.ts        # Transfer with OCC logic
│       ├── consumer.ts       # RabbitMQ event consumer
│       └── routes.ts         # Route definitions
│
├── transaction-service/      # 📊 Immutable ledger
│   ├── prisma/schema.prisma  # Transaction model
│   └── src/
│       ├── controller.ts     # History query handler
│       ├── service.ts        # Ledger operations
│       └── consumer.ts       # Consumes wallet events
│
├── payment-service/          # 💳 Bill pay & recharges
│   ├── prisma/schema.prisma  # Bill/Recharge models
│   └── src/
│       ├── controller.ts     # Bill pay handler
│       └── consumer.ts       # Event consumer
│
├── shared/                   # 📦 Shared library
│   └── src/
│       ├── logger.ts         # Pino structured logger
│       ├── rabbitmq.ts       # RabbitMQ connection helper
│       └── redis.ts          # Redis client helper
│
└── docker-compose.yml        # 🐳 Full stack orchestration
```

---

## 🧪 Testing the API

A Postman collection is included for manual API testing. Import `POSTMAN_COLLECTION.json` into Postman.

---

## 📄 License

This project is built as a portfolio demonstration of microservices architecture patterns.

---

<p align="center">
  Built with ❤️ by <strong>Monish Reddy</strong>
</p>
