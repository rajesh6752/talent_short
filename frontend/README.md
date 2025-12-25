# AI Hiring Platform - Frontend

Modern Next.js 15 frontend with authentication for the AI Hiring Platform.

## Features

- ✅ User Registration
- ✅ User Login
- ✅ JWT Token Management
- ✅ Auto Token Refresh
- ✅ Protected Routes
- ✅ Dashboard
- ✅ Responsive Design

## Tech Stack

- **Next.js 15** - App Router
- **React 19** - Latest React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Server state
- **Zustand** - Client state
- **Axios** - API client

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/
│   ├── login/         # Login page
│   ├── register/      # Registration page
│   ├── dashboard/     # Protected dashboard
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Landing page
│   └── providers.tsx  # React Query provider
├── lib/
│   ├── api.ts         # Axios API client
│   └── store.ts       # Zustand auth store
└── components/        # Reusable components
```

## Pages

### Landing Page (`/`)
- Welcome screen with login/register buttons

### Login (`/login`)
- Email/password authentication
- Auto redirects to dashboard on success

### Register (`/register`)
- User registration form
- Creates account and auto-logins

### Dashboard (`/dashboard`)
- Protected route (requires authentication)
- Shows user profile
- Logout functionality

## API Integration

All API calls go through the axios client (`lib/api.ts`) which:

- Automatically adds JWT tokens to requests
- Handles token refresh on 401 errors
- Redirects to login on auth failures

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

## Authentication Flow

1. User logs in/registers
2. Tokens saved to Zustand store + localStorage
3. All API requests include access token
4. On token expiry (401), auto-refresh using refresh token
5. On refresh failure, redirect to login

---

**Built with ❤️ for the AI Hiring Platform**
