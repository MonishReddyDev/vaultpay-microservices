# VaultPay - Microservices Digital Wallet

VaultPay is a highly scalable, event-driven digital wallet application built using a microservices architecture. It demonstrates modern backend patterns, particularly the **Choreography Saga Pattern** for distributed transactions, ensuring high availability and robust data consistency across decoupled services.

## 🚀 Features
- **Secure Authentication:** JWT-based user authentication and authorization via an API Gateway.
- **Wallet Management:** Users can add funds, check balances, and view transaction history.
- **Peer-to-Peer Transfers:** Atomic, ACID-compliant money transfers using database-level row locking (Optimistic Concurrency Control via Prisma).
- **Asynchronous Bill Payments:** Event-driven bill payments utilizing RabbitMQ to orchestrate decoupled interactions between the Payment Service and Wallet Service.
- **Modern UI:** A sleek, responsive dashboard built with React and Vite.

## 🏗 Architecture & Tech Stack

### Tech Stack
- **Frontend:** React, Vite, Framer Motion
- **API Gateway & Microservices:** Node.js, Fastify, TypeScript
- **Database:** PostgreSQL (with Prisma ORM)
- **Message Broker:** RabbitMQ
- **Caching & Rate Limiting:** Redis

### Microservices Breakdown
1. **API Gateway:** Routes incoming traffic, enforces rate limits, and validates JWTs before forwarding requests.
2. **Auth Service:** Handles user registration, login, and profile lookups.
3. **Wallet Service:** Manages user balances and atomic P2P transfers.
4. **Transaction Service:** Provides read-optimized APIs for viewing transaction histories.
5. **Payment Service:** Processes bill payments and mobile recharges asynchronously using event choreography.

## 🔄 Event-Driven Architecture (Saga Pattern)
When a user pays a bill, the system does not use synchronous HTTP calls (which can cause cascading failures). Instead, it uses a **Choreography Saga**:
1. The **Payment Service** receives the request, creates a `PENDING` payment record, and publishes a `wallet.debit.request` event to RabbitMQ.
2. The **Wallet Service** consumes this event, securely debits the user's wallet using an ACID transaction, and publishes a `wallet.debit.confirmed` event.
3. The **Payment Service** consumes the confirmation event and updates the payment status to `COMPLETED`.

## 🛠 Local Setup & Installation

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)

### 1. Start Infrastructure
Start the required infrastructure (PostgreSQL, RabbitMQ, Redis) using Docker:
```bash
cd vaultpay-backend
docker-compose up -d
```

### 2. Build Shared Library
The microservices depend on a shared library for messaging and common utilities.
```bash
cd vaultpay-backend/shared
npm install
npm run build
```

### 3. Install Dependencies & Run Migrations
In the `vaultpay-backend` directory, install all service dependencies and run Prisma migrations:
```bash
npm install
npm run generate
npm run migrate
```

### 4. Start the Application
Start the backend API gateway and all microservices concurrently:
```bash
npm run dev
```

In a separate terminal, start the frontend UI:
```bash
cd vaultpay-ui
npm install
npm run dev
```

## 📸 Screenshots & Demo
*(Add screenshots or a GIF of the application here)*

## 📄 License
This project is licensed under the MIT License.
