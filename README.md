
# TaskFlow API

Production-ready REST API for project and task management built with **NestJS**, **Prisma**, and **PostgreSQL**.

This project demonstrates how to build a scalable backend using modern TypeScript tooling, JWT authentication, role‑based access control, Docker deployment, and end‑to‑end testing.

---

## Features

- NestJS REST API architecture
- Prisma ORM with PostgreSQL
- JWT authentication with refresh token rotation
- Role-based access control (ADMIN / USER)
- Project, task, and comment management
- File attachments support
- Notifications system
- Activity logs for auditing
- Advanced task filtering and search
- Swagger API documentation
- Docker setup for production
- Full end-to-end testing with Jest and Supertest

---

## Tech Stack

**Backend**
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL

**Authentication & Security**
- JWT (access + refresh tokens)
- Passport
- bcrypt

**Infrastructure**
- Docker
- Docker Compose

**Testing**
- Jest
- Supertest (E2E)

**Documentation**
- Swagger / OpenAPI

---

## Project Structure

```
src/
 ├── auth/            # Authentication and JWT logic
 ├── users/           # User management
 ├── projects/        # Project management
 ├── tasks/           # Task CRUD and filtering
 ├── comments/        # Task comments
 ├── attachments/     # File uploads
 ├── notifications/   # Notification system
 ├── activity/        # Activity logs
 ├── common/          # Guards, pipes, middleware
 └── prisma/          # Prisma service
```

A modular structure like this is commonly recommended for scalable NestJS APIs.

---

## Installation

### 1. Clone the repository

```
git clone https://github.com/albertiacob91/taskflow-api.git
cd taskflow-api
```

### 2. Install dependencies

```
npm install
```

### 3. Configure environment variables

```
cp .env.example .env
```

Update the following values:

```
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3001
```

---

## Running the API

### Development

```
npm run start:dev
```

API will run at:

```
http://localhost:3001
```

Swagger documentation:

```
http://localhost:3001/docs
```

---

## Database

Apply migrations:

```
npx prisma migrate dev
```

Seed the database:

```
npm run db:seed
```

---

## Running with Docker

Build and run the production stack:

```
docker compose -f docker-compose.prod.yml up --build
```

Stop containers:

```
docker compose -f docker-compose.prod.yml down
```

---

## Testing

The project includes extensive **end‑to‑end tests** covering:

- authentication and token rotation
- role‑based permissions
- users API
- projects, tasks, comments CRUD
- project members and roles
- attachments
- notifications
- activity logs
- health check endpoint
- login rate limiting

Run tests:

```
npm run test:e2e
```

Run tests with database migration:

```
npm run test:e2e:all
```

---

## Example API Endpoints

### Auth

```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Projects

```
GET /projects
POST /projects
PATCH /projects/:id
DELETE /projects/:id
```

### Tasks

```
GET /tasks
POST /tasks
PATCH /tasks/:id
DELETE /tasks/:id
```

### Comments

```
POST /comments
PATCH /comments/:id
DELETE /comments/:id
```

---

## Release

Current stable version:

```
v1.0.0
```

This release represents the first stable version of the TaskFlow backend API.

---

## Author

Albert Luis Iacob Istrati

GitHub  
https://github.com/albertiacob91

---

## License

MIT License
