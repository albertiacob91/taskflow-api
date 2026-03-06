# TaskFlow API

Backend API for a **project and task management system** inspired by tools like **Linear / Jira / ClickUp**.

This project demonstrates a **production-ready backend architecture** using **NestJS**, **Prisma**, and **PostgreSQL**, including authentication, permissions, activity logs, real-time notifications, testing, and Docker deployment.

---

# Features

### Authentication & Security

* JWT authentication
* Refresh token rotation
* Secure logout
* Rate limiting
* Role-based access control

### Project Management

* Create, update, delete projects
* Project membership system
* Role system:

  * OWNER
  * MEMBER
  * VIEWER
* Permissions enforcement

### Tasks

* Create, update, delete tasks
* Assign tasks to users
* Status and priority system
* Advanced filters:

  * search
  * sorting
  * due date range
  * assignedTo / createdBy

### Comments

* Comment on tasks
* Edit/delete by author
* Activity tracking

### Attachments

* Upload files to tasks
* List attachments
* Delete attachments

### Notifications

* Task assignment notifications
* Comment notifications
* WebSocket realtime updates

### Activity Log

Track system activity:

* Project created/updated/deleted
* Task created/updated/deleted
* Comment actions
* Member changes

### Observability

* Request ID middleware
* Request logging
* Health check endpoint

### Testing

Comprehensive **end-to-end testing** with Jest and Supertest.

Coverage includes:

* authentication
* permissions
* projects
* tasks
* comments
* notifications
* attachments
* activity logs

### DevOps

* Docker production build
* Docker Compose environment
* Prisma migrations
* Seed script
* GitHub Actions CI

---

# Tech Stack

Backend framework

* NestJS

Database

* PostgreSQL
* Prisma ORM

Authentication

* JWT
* Passport

Validation

* class-validator
* class-transformer

Realtime

* Socket.IO

Testing

* Jest
* Supertest

Infrastructure

* Docker
* Docker Compose

Documentation

* Swagger (OpenAPI)

---

## System Architecture

```mermaid
graph TD

Client[Client / Frontend]

API[NestJS API]

Auth[Auth Module]
Users[Users Module]
Projects[Projects Module]
Tasks[Tasks Module]
Comments[Comments Module]
Attachments[Attachments Module]
Notifications[Notifications Module]
Activity[Activity Log]

Prisma[Prisma ORM]
DB[(PostgreSQL Database)]

Client --> API

API --> Auth
API --> Users
API --> Projects
API --> Tasks
API --> Comments
API --> Attachments
API --> Notifications
API --> Activity

Auth --> Prisma
Users --> Prisma
Projects --> Prisma
Tasks --> Prisma
Comments --> Prisma
Attachments --> Prisma
Activity --> Prisma

Prisma --> DB

# Project Structure

```
src/
 ├── auth
 ├── users
 ├── projects
 ├── tasks
 ├── comments
 ├── attachments
 ├── notifications
 ├── activity
 ├── health
 ├── prisma
 └── common
```

---

# API Documentation

Swagger UI:

```
http://localhost:3001/docs
```

Example endpoints:

```
POST /auth/register
POST /auth/login
GET  /users/me

POST /projects
GET  /projects
PATCH /projects/:id

POST /tasks
GET  /tasks
PATCH /tasks/:id

POST /comments
GET  /comments

POST /attachments
GET  /notifications
```

---

# Running the Project

## Install dependencies

```
npm install
```

---

# Running with Docker (recommended)

Start production environment:

```
npm run docker:prod
```

API will be available at:

```
http://localhost:3001
```

Swagger:

```
http://localhost:3001/docs
```

Health check:

```
http://localhost:3001/health
```

---

# Database

The project uses **Prisma migrations**.

Apply migrations:

```
npx prisma migrate deploy
```

---

# Seed Database

Generate demo data:

```
npm run db:seed
```

Example users:

```
admin@taskflow.dev
member@taskflow.dev
viewer@taskflow.dev
password: Password123!
```

---

# Running Tests

Start test database:

```
docker compose up -d
```

Run migrations for test DB:

```
npm run test:e2e:prepare
```

Run tests:

```
npm run test:e2e
```

Test coverage includes:

* authentication
* permissions
* projects
* tasks
* comments
* activity logs
* notifications
* attachments

---

# Example Architecture

```
Client
   │
   ▼
NestJS API
   │
   ├── Auth
   ├── Projects
   ├── Tasks
   ├── Comments
   ├── Attachments
   ├── Notifications
   └── Activity Log
   │
   ▼
Prisma ORM
   │
   ▼
PostgreSQL
```

---

# Production Features

This backend includes several features commonly used in production systems:

* secure authentication
* permission system
* activity audit logging
* realtime notifications
* Docker deployment
* CI pipeline
* end-to-end tests

---

# Author

Backend project built for portfolio purposes.

Stack focus:

* Node.js
* NestJS
* Prisma
* PostgreSQL
* Docker

---

# License

UNLICENSED
