# 🏥 H-02 Multi-Specialty Hospital Management & ACID Transaction Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

A high-concurrency Clinical Resource Management System and Personal Health Portal powered by an event-sourced **ACID Transaction Engine** with per-resource database locking, deterministic priority resolution (`EMERGENCY > CRITICAL > URGENT > ROUTINE`), idempotency protection, out-of-order event handling, and Saga compensation rollback.

---

## 🌟 Key System Capabilities

- 🔒 **ACID Transaction Engine**: Guarantees **0 Double Allocations** under high concurrency (tested with **1000 parallel requests**).
- 👑 **Super Admin & Department Workstations**: Executive analytics, resource control, staff management, and conflict overrides.
- 🩺 **Doctor Clinical Workstation**: Ward rounds, E-prescriptions, lab order generation, and active admission tracking.
- 🩹 **Nurse Continuous Care Station**: Shift vitals recording, care task checklists, patient transfer execution, and automatic **Abnormal Vitals Critical Alerts**.
- 🧑‍💼 **Receptionist Front Desk**: Patient registration, appointment booking, check-in queue token generation, and **Live Queue Call Screen**.
- 🧑 **Patient Personal Health Portal**: Read-only Electronic Health Records (EHR), appointment management, live admission status, and notifications feed.
- 🚀 **Render Blueprint Ready**: 1-Click deployment configuration (`render.yaml`) for instant hosting on Render.com.

---

## 🚀 Quick Startup Guide

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher

### 1. Installation
Clone or navigate to the project root and install all dependencies:
```bash
# Install root dependencies
npm install

# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

### 2. Database Setup & Seeding
The project uses SQLite via Prisma (`DATABASE_URL="file:./dev.db"`), requiring zero external database configuration:

```bash
# Push database schema & generate Prisma Client
npm run db:push

# Seed realistic synthetic hospital data (Depts, Doctors, Patients, Beds, Equipment, OTs, Transactions)
npm run seed
```

### 3. Run Application
Start the Fastify backend API server and Vite React frontend concurrently:
```bash
npm run dev
```
- 🌐 **Frontend Web App**: `http://localhost:3000`
- ⚙️ **Backend API**: `http://localhost:5000`
- 🔌 **Socket.IO Real-Time Feed**: `ws://localhost:5000`

---

## 🌐 Live Deployment on Render (1-Click)

This repository includes a [`render.yaml`](file:///c:/codefoge/render.yaml) blueprint for automatic deployment on [Render.com](https://render.com).

### Deployment Steps:
1. Push your repository to GitHub or GitLab.
2. Log into [dashboard.render.com](https://dashboard.render.com/) and click **New +** → **Blueprint**.
3. Select your repository. Render will automatically provision:
   - **`h02-backend`** (Fastify API, Prisma Database, Seed Data)
   - **`h02-frontend`** (Vite React Web Application)

*See [`DEPLOYMENT_GUIDE.md`](file:///c:/codefoge/DEPLOYMENT_GUIDE.md) for step-by-step instructions.*

---

## 🔑 Demo Credentials

All demo accounts use the standard password: **`password123`**

| Role | Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin** | `superadmin@hospital.com` | `password123` | Master control, audit logs & Simulation Lab |
| 🏢 **Dept Admin** | `admin.cardiology@hospital.com` | `password123` | Cardiology ward capacity & resource allocation |
| 🩺 **Doctor** | `doctor@hospital.com` | `password123` | Dr. Sarah Jenkins — Consultations & E-Prescriptions |
| 🩹 **Nurse** | `nurse@hospital.com` | `password123` | Nurse Emily Watson — Vitals, care checklist & alerts |
| 🧑‍💼 **Receptionist** | `reception@hospital.com` | `password123` | Patient lookup, appointment booking & queue call |
| 🧑 **Patient** | `patient@hospital.com` | `password123` | Patient John Doe — Admission status & medical records |

> **Pro Tip**: Use the **Role Switcher** in the top navigation bar to seamlessly toggle between user roles in real time!

---

## ⚡ H-02 Core Transaction Engine Architecture

Every clinical resource allocation (Bed, Doctor, Equipment, Operation Theatre) is processed through the deterministic H-02 Transaction Engine:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   REQUEST   │ ──> │   VALIDATE   │ ──> │  LOCK RESOURCE   │
└─────────────┘     └──────────────┘     └──────────────────┘
                                                   │
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   COMMIT    │ <── │   RESERVE    │ <── │  CHECK CONFLICT  │
└─────────────┘     └──────────────┘     └──────────────────┘
```

### Failure & Compensation Workflow
If secondary resource allocation fails (e.g. Bed reserved ✓, Doctor assigned ✓, Ventilator offline ✗):
```
[ FAILURE ] ──> [ COMPENSATING ] ──> [ RELEASE PREVIOUSLY RESERVED RESOURCES ] ──> [ ROLLED_BACK ]
```

### Transaction Guarantees
1. **Concurrency Protection**: Serializes competing requests targeting the exact same resource ID to guarantee **DOUBLE ALLOCATIONS = 0** under high concurrency.
2. **Deterministic Priority**: Higher priority requests (`EMERGENCY`) displace pending lower priority requests (`ROUTINE`), creating a tracked `Conflict` record.
3. **Idempotency Protection**: Duplicate transaction numbers (e.g. `TX-1001`) return the existing transaction state and log a `DUPLICATE` event.
4. **Out-of-Order Safety**: Sequence numbers protect transaction state from out-of-order event delivery (`OUT_OF_ORDER`).

---

## 🔬 H-02 Simulation Lab (Live Concurrency Testing)

Navigate to **Simulation Lab** (`/simulation`) in the frontend to trigger real-time backend scenarios:
- **Simulate Resource Conflict** (Emergency vs Routine ICU Bed request)
- **Simulate Duplicate Event** (Idempotency validation)
- **Simulate Out-of-Order Event** (Sequence validation)
- **Run 100 / 500 / 1000 Concurrent Requests** (Real-time latency gauges, throughput, and **DOUBLE ALLOCATIONS: 0** verification)

---

## 📐 Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── config/          # Prisma & env configuration
│   │   ├── controllers/     # Auth, Resource, Patient, Transaction & Simulation handlers
│   │   ├── engine/          # H-02 Engine (Locking, Priority, Idempotency, Saga Rollback)
│   │   ├── routes/          # Fastify API route declarations
│   │   ├── services/        # Simulation Lab service
│   │   ├── websocket/       # Socket.IO real-time event broadcaster
│   │   ├── seed.ts          # Synthetic hospital data generator
│   │   └── app.ts           # Fastify server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Header, Sidebar, StatusBadge, TransactionTimeline
│   │   ├── context/         # AuthContext & SocketContext
│   │   ├── pages/           # Super Admin, Admin, Doctor, Nurse, Receptionist, Patient, Simulation Lab
│   │   ├── services/        # Dynamic API client
│   │   └── App.tsx          # Main layout & router
│   └── package.json
├── prisma/
│   └── schema.prisma        # Complete database model
├── render.yaml              # Render 1-click deployment blueprint
└── DEPLOYMENT_GUIDE.md      # Step-by-step deployment guide
```

---

## 📜 License

This project is open-source under the [MIT License](LICENSE).
