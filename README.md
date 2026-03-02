# TaskFlow API

TaskFlow is a REST API for project and task management built with **NestJS**.
It includes **JWT authentication**, **Swagger documentation** and **end-to-end tests**.

This project is designed as a **portfolio backend project**, following real-world practices
(branching strategy, migrations, authentication, testing).

---

## Tech Stack
- Node.js + TypeScript
- NestJS
- PostgreSQL (Docker)
- Prisma ORM + migrations
- JWT authentication
- Swagger / OpenAPI
- Jest + Supertest (e2e tests)

---

## Requirements
- Node.js (recommended: LTS)
- Docker & Docker Compose
- Git

---

## Quick Start

### 1) Install dependencies
```bash
npm install
```

---

### 2) Start PostgreSQL with Docker
```bash
docker compose up -d
docker ps
```

The database is exposed on `127.0.0.1:5433`
(see `docker-compose.yml`).

---

### 3) Configure environment variables
Create a `.env` file from the example:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`

---

### 4) Run database migrations
```bash
npx prisma migrate dev
```

---

### 5) Start the API
```bash
npm run start:dev
```

---

## API Documentation (Swagger)
Swagger UI is available at:

http://localhost:3000/docs

---

## Authentication Flow
1. `POST /auth/register` → returns `accessToken`
2. Click **Authorize** in Swagger and paste the token  
   (Swagger adds `Bearer` automatically)
3. `GET /users/me` → returns the current user profile

---

## Prisma

Useful Prisma commands:

```bash
npx prisma migrate dev
npx prisma migrate deploy
npx prisma generate
```

---

## Testing

### Unit tests
```bash
npm test
```

---

### E2E tests
This project uses a **separate database** for e2e tests.

#### 1) Create `.env.test`
Create a `.env.test` file at the project root:

```env
NODE_ENV=test
PORT=3001
DATABASE_URL=postgresql://taskflow:taskflow@127.0.0.1:5433/taskflow_test?schema=public
JWT_ACCESS_SECRET=test_secret
JWT_ACCESS_EXPIRES_IN=15m
```

> `.env.test` must NOT be committed (it is ignored in `.gitignore`).

---

#### 2) Create the test database
```bash
docker exec -it taskflow-db psql -U taskflow -d postgres -c "CREATE DATABASE taskflow_test;"
```

---

#### 3) Run migrations + e2e tests
```bash
npm run test:e2e:all
```

---

## Scripts
- `npm run start:dev` – start in watch mode
- `npm run build` – compile the project
- `npm run lint` – lint and fix
- `npm run format` – prettier
- `npm run test:e2e:all` – run e2e tests

---

## Project Structure
- `src/auth` – authentication and JWT
- `src/users` – user endpoints
- `src/prisma` – Prisma service
- `prisma/` – schema and migrations
- `test/` – e2e tests

---

## Notes
- Conventional Commits are used (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Feature branches (`feature/*`) and PR-style workflow are followed,
  even as a solo developer.
