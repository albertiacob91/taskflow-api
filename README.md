# TaskFlow API

Production‑ready **task and project management REST API** built with
**NestJS**, **Prisma**, and **PostgreSQL**.

![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![NestJS](https://img.shields.io/badge/NestJS-backend-red)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-blue)
![License](https://img.shields.io/badge/license-MIT-green)

------------------------------------------------------------------------

## 🌐 Live API

Base URL\
https://taskflow-api-974b.onrender.com

Swagger Documentation\
https://taskflow-api-974b.onrender.com/docs

Health Check\
https://taskflow-api-974b.onrender.com/health

------------------------------------------------------------------------

## 🖥 Frontend Client

Live Application\
https://taskflow-web-delta.vercel.app

Frontend Repository\
https://github.com/albertiacob91/taskflow-web

------------------------------------------------------------------------

## 🚀 Features

-   REST API built with **NestJS**
-   **Prisma ORM** with PostgreSQL
-   **JWT authentication** with refresh token rotation
-   **Role‑based access control (RBAC)**
-   Projects, tasks and comments management
-   Project members and roles (owner / member / viewer)
-   File attachments for tasks
-   Notifications system
-   Activity logs (audit trail)
-   Advanced task filtering, search and sorting
-   Swagger / OpenAPI documentation
-   Docker production setup
-   Full **end‑to‑end testing** with Jest + Supertest

------------------------------------------------------------------------

## 🧰 Tech Stack

### Backend

-   NestJS
-   TypeScript
-   Prisma ORM
-   PostgreSQL

### Security

-   JWT access tokens
-   Refresh token rotation
-   Passport strategies
-   bcrypt password hashing

### DevOps

-   Docker
-   Docker Compose
-   GitHub Actions

### Testing

-   Jest
-   Supertest (E2E)

### Documentation

-   Swagger / OpenAPI

------------------------------------------------------------------------

## 📦 Project Architecture

``` mermaid
graph TD

Client[Frontend / Client] --> API[NestJS API]

API --> Auth[Auth Module]
API --> Users[Users Module]
API --> Projects[Projects Module]
API --> Tasks[Tasks Module]
API --> Comments[Comments Module]
API --> Attachments[Attachments Module]
API --> Notifications[Notifications Module]
API --> Activity[Activity Logs]

API --> DB[(PostgreSQL)]
DB --> Prisma[Prisma ORM]
```

The API follows a **modular architecture**, where each domain (users,
projects, tasks, etc.) is isolated in its own module.

------------------------------------------------------------------------

## ⚙️ Installation

### 1. Clone the repository

``` bash
git clone https://github.com/albertiacob91/taskflow-api.git
cd taskflow-api
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

``` env
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow
JWT_SECRET=super_secret_key
JWT_REFRESH_SECRET=super_refresh_secret
PORT=3001
```

------------------------------------------------------------------------

## ▶️ Running the API

Development mode

``` bash
npm run start:dev
```

API will run at:

http://localhost:3001

Swagger documentation:

http://localhost:3001/docs

------------------------------------------------------------------------

## 🗄 Database

Run migrations:

``` bash
npx prisma migrate dev
```

Seed the database:

``` bash
npm run db:seed
```

------------------------------------------------------------------------

## 🐳 Running with Docker

Start the production stack:

``` bash
docker compose -f docker-compose.prod.yml up --build
```

Stop containers:

``` bash
docker compose -f docker-compose.prod.yml down
```

------------------------------------------------------------------------

## 🧪 Testing

The project includes extensive **end‑to‑end tests** covering:

-   authentication and token rotation
-   role‑based permissions
-   users API
-   projects CRUD
-   tasks CRUD with filtering and sorting
-   comments system
-   project members and roles
-   attachments
-   notifications
-   activity logs
-   rate limiting
-   health endpoint

Run tests:

``` bash
npm run test:e2e
```

Run tests with database migration:

``` bash
npm run test:e2e:all
```

------------------------------------------------------------------------

## 📡 Example API Endpoints

### Authentication

POST /auth/register\
POST /auth/login\
POST /auth/refresh\
POST /auth/logout

### Projects

GET /projects\
POST /projects\
PATCH /projects/:id\
DELETE /projects/:id

### Tasks

GET /tasks\
POST /tasks\
PATCH /tasks/:id\
DELETE /tasks/:id

### Comments

POST /comments\
PATCH /comments/:id\
DELETE /comments/:id

------------------------------------------------------------------------

## 🏷 Release

Current stable version

v1.0.0

------------------------------------------------------------------------

## 👤 Author

Albert Luis Iacob Istrati

GitHub\
https://github.com/albertiacob91

------------------------------------------------------------------------

## 📄 License

MIT License
