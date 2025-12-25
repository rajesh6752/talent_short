# Frontend Architecture - AI Hiring Platform

## Tech Stack
- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand + React Query
- **Auth:** NextAuth.js
- **Real-time:** Socket.io

## Application Structure
```
app/
├── (auth)/              # Login, register
├── (dashboard)/         # Recruiter portal
│   ├── jobs/
│   ├── candidates/
│   ├── screening/
│   └── analytics/
├── (candidate)/         # Candidate portal
└── (admin)/            # Admin portal
```

## Role-Based Flows

### Recruiter Dashboard
1. **Jobs** → Create → Enrich with AI → Publish
2. **Candidates** → View ranked → Shortlist → Schedule screening
3. **Screening** → Monitor sessions → Review results
4. **Interviews** → Schedule → Collect feedback
5. **Analytics** → Metrics, diversity, cost

### Candidate Portal
1. **Browse Jobs** → Apply with resume
2. **Screening** → AI chat interface
3. **Status** → Track application progress

### Admin Portal
1. **Tenants** → Manage, monitor usage
2. **Audit Logs** → Compliance review
3. **System Health** → Metrics, costs

## Key Components

**Match Score Card**
- Progress bar (0-100%)
- Skill match badges
- Explanation text
- Shortlist action

**Candidate Timeline**
- Applied → Screening → Interview → Decision
- Visual progress indicator
- Timestamps per stage

**Screening Chat**
- Real-time WebSocket messaging
- Agent/candidate message bubbles
- Sentiment indicators
- Session controls

**Analytics Dashboard**
- Time-to-hire metrics
- Conversion funnel
- Diversity charts
- Cost breakdown

## State Management

**Zustand (Global)**
```tsx
useAuthStore() // User, tenant, token
useUIStore()   // Sidebar, theme
```

**React Query (Server)**
```tsx
useJobs()      // List, filter, search
useJob(id)     // Single job detail
useCandidates(jobId) // Ranked candidates
```

## API Integration
```tsx
// Centralized API client with interceptors
api.auth.login()
api.jobs.create()
api.resumes.upload()
api.matching.getCandidates()
api.screening.sendMessage()
```

## Responsive & Accessible
- Mobile-first design (sm, md, lg, xl breakpoints)
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast 4.5:1+

## Performance
- Code splitting with dynamic imports
- Image optimization (Next.js Image)
- Memoization (useMemo, useCallback)
- Virtual scrolling for large lists

## i18n Support
- English, Spanish, French, German
- RTL support ready
- Date/time localization

This provides a production-ready frontend that integrates seamlessly with the backend microservices.
