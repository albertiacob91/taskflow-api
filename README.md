# TaskFlow API

![CI](https://github.com/albertiacob91/taskflow-api/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-22.x-green)
![NestJS](https://img.shields.io/badge/NestJS-11-red)
![Prisma](https://img.shields.io/badge/Prisma-5.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)
![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)

Backend API for a **project and task management system** inspired by
tools like **Linear / Jira / ClickUp**.

This project demonstrates a **production-ready backend architecture**
using **NestJS**, **Prisma**, and **PostgreSQL**, including
authentication, permissions, activity logs, real-time notifications,
testing, and Docker deployment.

------------------------------------------------------------------------

# Features

## Authentication & Security

-   JWT authentication
-   Refresh token rotation
-   Secure logout
-   Rate limiting
-   Role-based access control

## Project Management

-   Create, update, delete projects
-   Project membership system
-   Roles: OWNER, MEMBER, VIEWER
-   Permissions enforcement

## Tasks

-   Create, update, delete tasks
-   Assign tasks to users
-   Status and priority system
-   Advanced filters (search, sorting, due date range, assignedTo,
    createdBy)

## Comments

-   Comment on tasks
-   Edit/delete by author
-   Activity tracking

## Attachments

-   Upload files to tasks
-   List attachments
-   Delete attachments

## Notifications

-   Task assignment notifications
-   Comment notifications
-   WebSocket realtime updates

## Activity Log

Tracks system activity including: - Project changes - Task changes -
Comment actions - Member changes

## Observability

-   Request ID middleware
-   Request logging
-   Health check endpoint

## Testing

End‑to‑end tests with Jest and Supertest covering: authentication,
permissions, projects, tasks, comments, notifications, attachments, and
activity logs.

## DevOps

-   Docker production build
-   Docker Compose environment
-   Prisma migrations
-   Seed script
-   GitHub Actions CI

------------------------------------------------------------------------

# Tech Stack

Backend: NestJS\
Database: PostgreSQL + Prisma ORM\
Authentication: JWT + Passport\
Validation: class-validator / class-transformer\
Realtime: Socket.IO\
Testing: Jest + Supertest\
Infrastructure: Docker / Docker Compose\
Documentation: Swagger (OpenAPI)

------------------------------------------------------------------------

# System Architecture

``` mermaid
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
Notifications --> Prisma
Activity --> Prisma

Prisma --> DB
```

# Authentication Flow

``` mermaid
sequenceDiagram

participant User
participant API
participant DB

User->>API: POST /auth/login
API->>DB: Validate credentials
DB-->>API: User found
API-->>User: accessToken + refreshToken

User->>API: Request protected endpoint
API->>API: Validate JWT
API-->>User: Response

User->>API: POST /auth/refresh
API->>DB: Validate refresh token
API-->>User: New tokens
```

------------------------------------------------------------------------

# Running with Docker

Start production environment:

    npm run docker:prod

API:

    http://localhost:3001

Swagger:

    http://localhost:3001/docs

Health check:

    http://localhost:3001/health
