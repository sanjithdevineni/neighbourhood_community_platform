# Neighbourhood Community Platform

## Description
Neighbourhood Community Platform is a local community web app where neighbors can:
- post and view announcements
- view local alerts
- create, edit, delete, and browse events
- mark event interest
- explore the neighbourhood

The project is split into:
- `frontend/` (Angular)
- `backend/` (Go + Gin + GORM + SQLite)

## Team
- Sanjith Devineni (Frontend)
- Justin Kim (Backend)
- Parvathi Nalla (Backend)
- Bindhu Sree Reddy (Frontend)

## Prerequisites
- Node.js 20+ and npm
- Go 1.22+ (or compatible with `backend/go.mod`)

## Project Structure
- `frontend/` Angular app and unit tests
- `backend/` REST API server, DB models, routes, middleware
- `backend/community.db` SQLite database (runtime/generated)

## Run Locally

### 1) Start backend
```bash
cd backend
go mod tidy
go run main.go
```

Backend default URL: `http://localhost:8080`

### 2) Start frontend
```bash
cd frontend
npm install
npm run start
```

Frontend default URL: `http://localhost:4200`

## Authentication Flow
- App opens at `/login`
- Unauthenticated users are redirected to `/login`
- After successful login, user is navigated to `/home`
- User can sign up if they do not have an accout, and then login
- Once logged in, user can access the homepage, alerts page, events page, and more

## Running Tests

### Frontend unit tests
```bash
cd frontend
npm run test:unit
```

### Run specific tests
```bash
cd frontend
npm run test:unit -- --include src/app/pages/events/events.spec.ts
```

## Notes
- Event image URLs are served from `backend/uploads/...`
- In local dev, frontend uses Angular proxy config for API and upload routing.
- Runtime artifacts (`community.db`, logs, generated uploads) may change during local runs.