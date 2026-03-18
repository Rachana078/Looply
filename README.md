# Looply

A Jira-inspired project management app for teams to plan sprints, track bugs, and ship features — all in one place.

**Live demo → [looply.rachanap.com](https://looply.rachanap.com)**

---

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Login</strong></td>
    <td align="center"><strong>Signup</strong></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/d5a70b0d-8c9e-46ae-825e-27f92248fb04" alt="Login" /></td>
    <td><img src="https://github.com/user-attachments/assets/2cd2363e-4b0d-475d-aa19-d09b0346c09b" alt="Signup" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Workspaces</strong></td>
    <td align="center"><strong>Inside Workspace</strong></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/46215d8c-fff2-42df-b0fb-ca61c08a977c" alt="Workspaces" /></td>
    <td><img src="https://github.com/user-attachments/assets/14d7fd71-be69-4b0b-92a5-c988b8e1cc21" alt="Inside Workspace" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Backlog</strong></td>
    <td align="center"><strong>Kanban Board</strong></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/40fbf103-3e79-4a0e-969f-ef2787ccf3c0" alt="Backlog" /></td>
    <td><img src="https://github.com/user-attachments/assets/98cfbc6a-fc81-4e75-8fdb-bc294a034cb0" alt="Kanban Board" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Project Settings / Team Labels</strong></td>
    <td align="center"><strong>Profile Page</strong></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/ff2398de-710b-4a92-ba05-18819467f42a" alt="Project Settings" /></td>
    <td><img src="https://github.com/user-attachments/assets/ee4abe9c-c95c-4646-be0f-e408dbe225a5" alt="Profile Page" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Settings Page</strong></td>
    <td align="center"><strong>Ticket Assignment Email</strong></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/e059a3ad-f4cf-420b-b554-83251c1c3fa8" alt="Settings Page" /></td>
    <td><img src="https://github.com/user-attachments/assets/aaa2557e-44f3-4a9d-b4f6-7b20abe94e42" alt="Ticket Assignment Email" /></td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Java 21, Spring Boot 3.3 |
| Database | PostgreSQL (Supabase) |
| Auth | JWT access token + HTTP-only refresh token cookie |
| Real-time | WebSockets (STOMP over SockJS) |
| Email | Resend (HTTP API) |
| State Management | Zustand |
| Schema Migrations | Flyway |

---

## Features

- **Authentication** — Register, email verification, login, logout with JWT + refresh token rotation
- **Workspaces** — Create and manage multiple workspaces with role-based access (Owner, Admin, Member)
- **Projects** — Multiple projects per workspace, each with its own backlog and board
- **Kanban Board** — Drag and drop tickets across status columns with real-time sync
- **Backlog View** — Grouped, filterable list of all tickets by status
- **Tickets** — Full ticket lifecycle with title, description, type, priority, story points, assignee, and team
- **Comments** — Per-ticket comments with real-time updates via WebSockets
- **@Mentions** — Type `@` in comments to mention teammates, with dropdown autocomplete and in-app notifications
- **Ticket History** — Automatic audit log of every field change (who changed what and when)
- **In-app Notifications** — Bell icon with unread count for assignments, mentions, and comments
- **Email Notifications** — Verification email on signup, welcome email on verify, mention alerts, and assignment alerts
- **Teams** — Colour-coded sub-teams within a project
- **Search** — Full-text ticket search across a workspace

---

## Project Structure

```
Looply/
├── backend/                          # Spring Boot API
│   ├── src/main/java/com/flowdesk/
│   │   ├── controller/               # REST endpoints
│   │   ├── service/                  # Business logic
│   │   ├── domain/                   # JPA entities
│   │   ├── dto/                      # Request / response records
│   │   ├── repository/               # Spring Data JPA repositories
│   │   ├── security/                 # JWT filter, WebSocket auth interceptor
│   │   ├── config/                   # Security, WebSocket, OpenAPI config
│   │   └── exception/                # Global exception handler
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/             # Flyway SQL migrations (V1–V10)
│   ├── .env.example
│   ├── Dockerfile
│   └── docker-compose.yml
└── frontend/                         # React + Vite SPA
    └── src/
        ├── api/                      # Axios API clients
        ├── components/               # Shared UI components
        ├── hooks/                    # Custom React hooks
        ├── pages/                    # Page-level components
        ├── store/                    # Zustand state stores
        └── types/                    # TypeScript type definitions
```

---

## Local Development

### Backend

```bash
cd backend
cp .env.example .env   # fill in DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, RESEND_API_KEY
docker-compose up      # starts the Spring Boot app on :8080
```

Or run directly with Maven:

```bash
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # starts Vite dev server on :5173
```

The frontend defaults to `http://localhost:8080/api/v1` when running locally.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL JDBC URL |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key for signing JWTs |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `MAIL_FROM` | Sender address (default: `onboarding@resend.dev`) |
| `BASE_URL` | Frontend URL for email links (e.g. `https://looply.rachanap.com`) |

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new account |
| GET | `/api/v1/auth/verify-email?token=` | Verify email address |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/workspaces` | List workspaces |
| POST | `/api/v1/workspaces` | Create workspace |
| DELETE | `/api/v1/workspaces/{slug}` | Delete workspace (owner only) |
| GET | `/api/v1/workspaces/{slug}/projects` | List projects |
| POST | `/api/v1/workspaces/{slug}/projects` | Create project |
| GET | `/api/v1/workspaces/{slug}/projects/{key}/tickets` | Get backlog |
| POST | `/api/v1/workspaces/{slug}/projects/{key}/tickets` | Create ticket |
| PATCH | `/api/v1/workspaces/{slug}/projects/{key}/tickets/{id}` | Update ticket |
| GET | `/api/v1/workspaces/{slug}/projects/{key}/tickets/{id}/history` | Ticket history |
| GET | `/api/v1/workspaces/{slug}/projects/{key}/tickets/{id}/comments` | List comments |
| POST | `/api/v1/workspaces/{slug}/projects/{key}/tickets/{id}/comments` | Add comment |
| GET | `/api/v1/notifications` | List notifications |

Full interactive docs available at `/swagger-ui.html` when the backend is running.

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Custom domain via [looply.rachanap.com](https://looply.rachanap.com) |
| Backend | [Render](https://render.com) (Docker) |
| Database | [Supabase](https://supabase.com) (managed PostgreSQL) |
| Email | [Resend](https://resend.com) (HTTP API) |
