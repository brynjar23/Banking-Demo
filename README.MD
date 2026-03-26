# Banking Demo

A full-stack banking application built as a technical demonstration. Features real-time account management, fund transfers, fraud detection, and event-driven architecture.

**Live demo:** https://brynjar23.github.io/Banking-Demo/
**API:** https://banking-demo-api.onrender.com/openapi/v1.json

> Note: The API is hosted on Render's free tier and may take 30–60 seconds to wake up on first request.

---

## Features

- User registration and login with JWT authentication
- Multiple bank accounts per user with ISK balances
- Fund transfers between accounts with real-time balance updates
- Account lookup by account number for cross-user transfers
- Fraud detection engine — flags large transfers and account-draining transactions
- Redis caching on transaction history with automatic cache invalidation
- RabbitMQ event publishing on every payment
- Transfer confirmation dialog before committing transactions
- Auto-migration of database schema on startup

---

## Tech stack

### Backend
- **.NET 10** — Web API with controller-based routing
- **Entity Framework Core 10** — ORM with code-first migrations
- **PostgreSQL** (Neon) — primary data store for users, accounts and transactions
- **Redis** (Upstash) — caching layer for transaction history
- **RabbitMQ** (CloudAMQP) — async payment event queue
- **JWT Bearer** — stateless authentication
- **Docker** — containerised deployment
- **BCrypt** — password hashing

### Frontend
- **React 19** with **TypeScript**
- **Vite** — build tooling
- **React Router** — client-side routing
- **Axios** — HTTP client with JWT interceptor

### Infrastructure
- **Render** — backend hosting (Docker container)
- **GitHub Pages** — frontend hosting
- **GitHub Actions** — CI/CD pipeline that builds and tests on every push, auto-deploys frontend to GitHub Pages
- **Neon** — serverless Postgres
- **Upstash** — serverless Redis
- **CloudAMQP** — managed RabbitMQ

---

## Security
- **BCrypt** — passwords are hashed with BCrypt before storage, never stored in plain text
- **JWT authentication** — stateless auth with signed tokens, validated on every request
- **Rate limiting** — login endpoint limited to 5 requests per minute to prevent brute force attacks
- **Security response headers** — `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy` headers on all responses
- **Input validation** — all incoming requests validated with FluentValidation before hitting business logic
- **HTTPS enforced** — all traffic encrypted in transit via Render and GitHub Pages
- **Secrets management** — connection strings and JWT secret stored as environment variables, never committed to source control
- **CORS policy** — API only accepts requests from known frontend origins

---

## Architecture
```
React (GitHub Pages)
    ↓ REST / JSON
.NET 10 Web API (Render)
    ↓
├── PostgreSQL — accounts, users, transactions
├── Redis — transaction cache
└── RabbitMQ — payment events
```

---

## Running locally

### Prerequisites
- .NET 10 SDK
- Node.js 18+
- Accounts on Neon, Upstash, and CloudAMQP (all free)

### Backend

Clone the repo and create `BankingDemo.Api/appsettings.json` based on `appsettings.Example.json`, filling in your connection strings.
```bash
dotnet ef database update --project BankingDemo.Infrastructure --startup-project BankingDemo.Api
cd BankingDemo.Api
dotnet run
```

### Frontend
```bash
cd banking-demo-ui
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project structure
```
Banking-Demo/
├── BankingDemo.Api/          # Controllers, Program.cs, Dockerfile
├── BankingDemo.Core/         # Models, DTOs
├── BankingDemo.Infrastructure/  # DbContext, EF migrations, services
└── banking-demo-ui/          # React frontend
```

---

## Fraud detection

Transfers are automatically flagged (not executed) if:
- The amount exceeds **500,000 ISK**
- The transfer would drain more than **90% of the account balance**

Flagged transactions are stored with status `Flagged` and shown with a red badge in the transaction history.