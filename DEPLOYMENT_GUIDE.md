# 🚀 Render Deployment Guide — H-02 Hospital Management System

This repository is fully configured for **1-Click Deployment** on [Render.com](https://render.com).

---

## 🎯 Option 1: Automatic Blueprint Deployment (Recommended)

1. **Push your code to GitHub or GitLab**:
   Ensure your local repository changes are pushed to your GitHub or GitLab repository.

2. **Log into Render**:
   Go to [dashboard.render.com](https://dashboard.render.com/) and log in or sign up.

3. **Deploy via Blueprints**:
   - Click the **New +** button in the top right.
   - Select **Blueprint**.
   - Connect your GitHub repository (`h02-hospital-management-system`).
   - Render will automatically detect the [`render.yaml`](file:///c:/codefoge/render.yaml) file.
   - Click **Apply**.

Render will automatically provision:
- 🟢 **`h02-backend`** (Fastify API + Socket.IO + Prisma DB + Seeded Demo Data)
- 🔵 **`h02-frontend`** (React Vite Web App linked directly to `h02-backend`)

---

## 🛠️ Option 2: Manual Deployment via Render Dashboard

If you prefer to create the services manually on Render:

### Step 1: Deploy Backend Web Service
1. Click **New +** -> **Web Service**.
2. Connect your repository and select root directory `backend`.
3. Settings:
   - **Name**: `h02-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: `10000`
     - `JWT_SECRET`: `your-secret-key-here`
4. Copy your backend service URL (e.g. `https://h02-backend.onrender.com`).

### Step 2: Deploy Frontend Static Site
1. Click **New +** -> **Static Site**.
2. Connect your repository and select root directory `frontend`.
3. Settings:
   - **Name**: `h02-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: `https://h02-backend.onrender.com` (Your backend URL from Step 1)
4. Under **Redirects/Rewrites**, add:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

---

## 🔑 Demo Logins Ready Post-Deployment

| Role | Email | Password |
|---|---|---|
| 👑 Super Admin | `superadmin@hospital.com` | `password123` |
| 🏢 Department Admin | `admin.cardiology@hospital.com` | `password123` |
| 🩺 Doctor | `doctor@hospital.com` | `password123` |
| 🩺 Nurse | `nurse@hospital.com` | `password123` |
| 🧑‍💼 Receptionist | `reception@hospital.com` | `password123` |
| 🧑 Patient | `patient@hospital.com` | `password123` |
