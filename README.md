# Looply

A Jira-inspired project management app for teams to plan sprints, track bugs, and ship features — all in one place.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Java 21, Spring Boot 3.3 |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (access token) + HTTP-only refresh token cookie |
| Real-time | WebSockets (STOMP) |
| Email | Resend (SMTP) |
| State Management | Zustand |
| Schema Migrations | Flyway |

---

## Features

- **Authentication** — Register, login, logout with JWT + refresh token rotation
- **Workspaces** — Create and manage multiple workspaces with role-based access (Owner, Admin, Member)
- **Projects** — Multiple projects per workspace, each with its own backlog and board
- **Kanban Board** — Drag and drop tickets across status columns (Backlog → Done) with real-time sync
- **Backlog View** — Grouped, filterable list of all tickets by status
- **Tickets** — Full ticket lifecycle with title, description, type, priority, story points, assignee, and team
- **Comments** — Per-ticket comments with real-time updates via WebSockets
- **@Mentions** — Type `@` in comments to mention teammates, with dropdown autocomplete and notifications
- **Ticket History** — Automatic audit log of every field change (who changed what and when)
- **In-app Notifications** — Bell icon with unread count for assignments, mentions, and comments
- **Email Notifications** — Welcome email on signup, mention alerts, and assignment alerts via Resend
- **Teams** — Colour-coded sub-teams within a project
- **Search** — Full-text ticket search across a workspace

---

## Project Structure

```
Looply/
├── backend/          # Spring Boot API
│   ├── src/
│   │   ├── main/java/com/flowdesk/
│   │   │   ├── controller/   # REST endpoints
│   │   │   ├── service/      # Business logic
│   │   │   ├── domain/       # JPA entities
│   │   │   ├── dto/          # Request / response records
│   │   │   ├── repository/   # Spring Data JPA repositories
│   │   │   ├── security/     # JWT filter, UserDetailsService
│   │   │   ├── config/       # Security, WebSocket, OpenAPI config
│   │   │   └── exception/    # Global exception handler
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/ # Flyway SQL migrations (V1–V8)
│   ├── .env.example
│   ├── Dockerfile
│   └── docker-compose.yml
└── frontend/         # React + Vite SPA
    └── src/
        ├── api/          # Axios API clients
        ├── components/   # Shared UI components
        ├── hooks/        # Custom React hooks
        ├── pages/        # Page-level components
        ├── store/        # Zustand state stores
        └── types/        # TypeScript type definitions
```

---

## Getting Started

### Prerequisites

- Java 21+
- Node.js 20+
- Maven 3.9+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Resend](https://resend.com) account for email (free tier works)

### Backend

1. Copy the example env file and fill in your values:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Required environment variables:
   ```
   DB_URL=jdbc:postgresql://<supabase-host>:5432/postgres
   DB_USERNAME=postgres
   DB_PASSWORD=<your-password>
   JWT_SECRET=<run: openssl rand -base64 32>
   RESEND_API_KEY=<your-resend-api-key>
   MAIL_FROM=noreply@yourdomain.com
   BASE_URL=http://localhost:5173
   ```

3. Run the backend:
   ```bash
   export $(cat .env | xargs) && ./mvnw spring-boot:run
   ```

   Flyway will automatically run all migrations on startup.

4. API docs available at: `http://localhost:8080/swagger-ui.html`

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173`

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new account |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/workspaces` | List workspaces |
| POST | `/api/v1/workspaces` | Create workspace |
| GET | `/api/v1/workspaces/{slug}/projects` | List projects |
| POST | `/api/v1/workspaces/{slug}/projects` | Create project |
| GET | `/api/v1/workspaces/{slug}/projects/{key}/tickets` | Get backlog |
| POST | `/api/v1/workspaces/{slug}/projects/{key}/tickets` | Create ticket |
| PATCH | `/api/v1/workspaces/{slug}/projects/{key}/tickets/{id}` | Update ticket |
| GET | `/api/v1/workspaces/{slug}/projects/{key}/tickets/{id}/history` | Ticket history |
| GET | `/api/v1/workspaces/{slug}/projects/{key}/tickets/{id}/comments` | List comments |
| POST | `/api/v1/workspaces/{slug}/projects/{key}/tickets/{id}/comments` | Add comment |
| GET | `/api/v1/notifications` | List notifications |

Full interactive docs at `/swagger-ui.html` when the backend is running.

---

## Database Migrations

Flyway migrations live in `backend/src/main/resources/db/migration/`:

| Version | Description |
|---|---|
| V1 | Users and refresh tokens |
| V2 | Workspaces and projects |
| V3 | Tickets |
| V4 | Comments |
| V5 | Teams |
| V6 | Notifications |
| V7 | Add OPEN ticket status |
| V8 | Ticket history (audit log) |

---

## Deployment

- **Frontend** → Vercel
- **Backend** → Railway / Render (Docker or JAR)
- **Database** → Supabase (managed PostgreSQL)
- **Email** → Resend (requires verified domain)
