# Consolidated Microservices Architecture (MVP-Optimized)

## Service Consolidation Strategy

**From 15 services → 6 core services**

This consolidated architecture reduces operational complexity while maintaining clean domain boundaries and the ability to split services later as you scale.

---

## Consolidated Service Catalog

| Service | Port | Language | Consolidates | Database |
|---------|------|----------|--------------|----------|
| **API Gateway** | 8080 | Go | API Gateway only | - |
| **Core Platform** | 8081 | Python | Auth + Tenant + Notification | PostgreSQL |
| **Hiring Pipeline** | 8082 | Python | Job + Resume + Candidate Mgmt | PostgreSQL + MongoDB + S3 |
| **AI Engine** | 8083 | Python | Matching + Screening + Agent Orchestrator | PostgreSQL + MongoDB + Vector DB |
| **Interview & Decision** | 8084 | Python | Interview Orchestration + Voice AI + Decision Engine | PostgreSQL + MongoDB |
| **Compliance & Analytics** | 8085 | Python | Audit + Consent + Analytics | PostgreSQL |

---

## Service Breakdown

### 1. API Gateway (Unchanged)
**Responsibility:** Single entry point, routing, rate limiting, auth validation

**Why Keep Separate:** Critical path for all requests, needs high performance (Go)

**Scaling:** Horizontal (CPU-based)

---

### 2. Core Platform Service

**Consolidates:**
- Auth Service
- Tenant Management
- Notification Service

**Rationale:** These are tightly coupled administrative functions used by all other services

**Package Structure:**
```
core-platform/
├── auth/          # Authentication & authorization
├── tenant/        # Tenant management
├── notification/  # Email, SMS, push notifications
└── shared/        # Common utilities
```

**APIs:**
```
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh

# Tenants
POST   /api/v1/tenants
GET    /api/v1/tenants/:id
GET    /api/v1/tenants/:id/usage

# Notifications (internal)
POST   /internal/v1/notifications/send
```

**Database:** PostgreSQL (users, tenants, sessions, notifications)

**Scaling:** 2-5 pods

---

### 3. Hiring Pipeline Service

**Consolidates:**
- Job Management
- Resume Ingestion
- Candidate Management (basic CRUD)

**Rationale:** All part of the hiring workflow before AI processing

**Package Structure:**
```
hiring-pipeline/
├── jobs/          # Job CRUD, JD enrichment
├── resumes/       # Upload, parsing, storage
├── candidates/    # Candidate profiles
└── shared/        # Common domain logic
```

**APIs:**
```
# Jobs
POST   /api/v1/jobs
GET    /api/v1/jobs/:id
POST   /api/v1/jobs/:id/enrich
POST   /api/v1/jobs/:id/publish

# Resumes
POST   /api/v1/resumes/upload
GET    /api/v1/resumes/:id
POST   /api/v1/resumes/bulk

# Candidates
GET    /api/v1/candidates
GET    /api/v1/candidates/:id
```

**Databases:**
- PostgreSQL: jobs, candidates
- MongoDB: resumes, parsed data
- S3: resume files

**Events Produced:**
- `job.published` → Trigger matching
- `resume.parsed` → Trigger matching

**Scaling:** 2-8 pods (resume upload can spike)

---

### 4. AI Engine Service

**Consolidates:**
- AI Matching Engine
- AI Screening Service
- Agent Orchestrator

**Rationale:** All AI-powered operations, shared LLM infrastructure, similar scaling needs

**Package Structure:**
```
ai-engine/
├── matching/      # Resume-JD matching, scoring
├── screening/     # Chat screening agent
├── agents/        # LangGraph agent orchestrator
├── explainability/ # Explanation generation
└── llm/           # Shared LLM gateway, prompt management
```

**APIs:**
```
# Matching
POST   /api/v1/matching/score
GET    /api/v1/matching/:job_id/candidates
POST   /api/v1/matching/:job_id/shortlist
GET    /api/v1/matching/:id/explain

# Screening
POST   /api/v1/screening/sessions
POST   /api/v1/screening/sessions/:id/messages
POST   /api/v1/screening/sessions/:id/complete
GET    /api/v1/screening/sessions/:id/analysis
```

**Databases:**
- PostgreSQL: matches, explanations
- MongoDB: screening sessions
- Vector DB: resume/job embeddings
- Redis: agent state, caching

**Events Consumed:**
- `job.published`, `resume.parsed` → Auto-match

**Events Produced:**
- `candidate.scored`, `candidate.shortlisted`
- `screening.completed`

**Scaling:** 2-10 pods (includes GPU pods for embeddings)

**Cost:** Highest per-request (LLM calls)

---

### 5. Interview & Decision Service

**Consolidates:**
- Interview Orchestration
- Voice AI Service
- Decision Engine

**Rationale:** All post-screening hiring stages, sequential workflow

**Package Structure:**
```
interview-decision/
├── interviews/    # Scheduling, calendar integration
├── voice/         # Voice interview agent, STT/TTS
├── decisions/     # Decision aggregation & recommendations
└── integrations/  # Google Calendar, Zoom, Twilio
```

**APIs:**
```
# Interviews
POST   /api/v1/interviews/schedule
PUT    /api/v1/interviews/:id/reschedule
POST   /api/v1/interviews/:id/feedback

# Voice
POST   /api/v1/voice/sessions
GET    /api/v1/voice/sessions/:id/analysis

# Decisions
POST   /api/v1/decisions
PUT    /api/v1/decisions/:id/approve
GET    /api/v1/decisions/:id/explanation
```

**Databases:**
- PostgreSQL: interviews, feedback, decisions
- MongoDB: voice transcripts
- S3: voice recordings

**Events Consumed:**
- `screening.completed` → Schedule interview

**Events Produced:**
- `interview.scheduled`, `decision.made`

**Scaling:** 2-5 pods

---

### 6. Compliance & Analytics Service

**Consolidates:**
- Audit Logger
- Consent Manager
- Analytics Service

**Rationale:** All compliance/reporting functions, read-heavy, can share infrastructure

**Package Structure:**
```
compliance-analytics/
├── audit/         # Audit logging, model lineage
├── consent/       # GDPR consent management
├── analytics/     # Metrics aggregation, reporting
└── exports/       # Data export for GDPR
```

**APIs:**
```
# Audit
GET    /api/v1/audit/logs
GET    /api/v1/audit/entity/:type/:id

# Consent
POST   /api/v1/consent/collect
POST   /api/v1/consent/:candidate_id/revoke
DELETE /api/v1/consent/delete/:candidate_id

# Analytics
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/diversity
```

**Databases:**
- PostgreSQL: audit logs, consent records, analytics snapshots

**Events Consumed:**
- ALL events → Audit logging

**Scaling:** 2-4 pods (append-only writes, read replicas for analytics)

---

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│           CDN + WAF                      │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│      Load Balancer (ALB/NLB)             │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│      API Gateway (2-4 pods)              │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴──────────┬────────────────┐
       │                  │                │
┌──────▼─────┐   ┌───────▼──────┐  ┌─────▼──────┐
│Core Platform│   │Hiring Pipeline│  │AI Engine   │
│ (2-5 pods)  │   │  (2-8 pods)   │  │(2-10 pods) │
└─────────────┘   └───────────────┘  └────────────┘
       │                  │                │
       └──────────────────┼────────────────┘
                          │
       ┌──────────────────┼────────────────┐
       │                  │                │
┌──────▼─────┐   ┌───────▼──────────┐
│Interview &  │   │Compliance &      │
│Decision     │   │Analytics         │
│(2-5 pods)   │   │(2-4 pods)        │
└─────────────┘   └──────────────────┘
       │                  │
       └──────────┬───────┘
                  │
┌─────────────────▼───────────────────────┐
│  Data Layer                             │
│  PostgreSQL • MongoDB • Vector DB       │
│  Redis • S3 • Kafka                     │
└─────────────────────────────────────────┘
```

**Total Pods:** ~12-36 (vs 30-90 for 15 services)

---

## Technology Choices

### Why Python for Most Services?
- **Unified codebase** → Easier to maintain, shared libraries
- **Rich AI ecosystem** → LangChain, LangGraph, ML libraries
- **Rapid development** → FastAPI for quick iteration
- **Team efficiency** → One primary language vs Go + Python

### When to Use Go?
- **API Gateway only** → High-performance entry point

---

## Development Workflow

### Monorepo Structure
```
ai-hiring-platform/
├── services/
│   ├── api-gateway/        # Go
│   ├── core-platform/      # Python
│   ├── hiring-pipeline/    # Python
│   ├── ai-engine/          # Python
│   ├── interview-decision/ # Python
│   └── compliance-analytics/ # Python
├── shared/
│   ├── python/             # Shared Python libraries
│   │   ├── database/
│   │   ├── messaging/
│   │   └── auth/
│   └── protos/             # gRPC definitions (optional)
├── infrastructure/
│   ├── terraform/
│   ├── kubernetes/
│   └── docker/
└── frontend/
```

### Local Development
```bash
# Start all services with Docker Compose
docker-compose up

# Or run individually
cd services/core-platform && make dev
cd services/ai-engine && make dev
```

---

## Inter-Service Communication

### Synchronous (API calls)
```python
# Via internal HTTP (service mesh)
response = requests.get(
    "http://core-platform:8081/internal/v1/tenants/123"
)

# Or via gRPC (optional, for performance)
tenant = tenant_client.GetTenant(tenant_id="123")
```

### Asynchronous (Events)
```python
# Publish event
kafka.publish(
    topic="jobs",
    event={
        "type": "job.published",
        "data": {"job_id": "123", ...}
    }
)

# Consume events
@kafka.consumer(topic="jobs")
def handle_job_published(event):
    # Trigger matching
    matching_service.match_candidates(event["data"]["job_id"])
```

---

## Migration Path to Full Microservices

When you reach scale (>1000 resumes/day), split services:

### Phase 1 (MVP): 6 services ✅
Current consolidated architecture

### Phase 2 (Growth): 9 services
**Split AI Engine:**
- Matching Service
- Screening Service  
- Agent Orchestrator

**Rationale:** Different scaling needs, matching is high-volume

### Phase 3 (Scale): 12 services
**Split Hiring Pipeline:**
- Job Management
- Resume Ingestion (high write volume)
- Candidate Management

**Split Core Platform:**
- Auth Service (critical path)
- Tenant + Notification (bundled)

### Phase 4 (Enterprise): 15 services
Full microservices (original design)

---

## Comparison: Consolidated vs Full Microservices

| Aspect | Consolidated (6) | Full MS (15) |
|--------|------------------|--------------|
| **Complexity** | Low | High |
| **Dev Speed** | Fast | Slower |
| **Deploy Time** | 5 min | 15 min |
| **Debug Ease** | Easy | Complex |
| **Team Size** | 2-5 devs | 8-15 devs |
| **Ops Overhead** | Low | High |
| **Independent Scaling** | Limited | Full |
| **Fault Isolation** | Moderate | Excellent |
| **Code Reuse** | High | Low |
| **Best For** | MVP, Startup | Enterprise, Scale |

---

## Recommended Approach

### Start with 6 Services (This Design)
**Timeline:** Months 0-6 (MVP phase)
- Faster development
- Lower operational cost
- Easier debugging
- Sufficient for 10-100 resumes/day/tenant

### Evolve to 9-12 Services
**Timeline:** Months 6-18 (Growth phase)
- Split AI Engine first (different scaling)
- Split Resume Ingestion (high write volume)
- Keep Core Platform bundled

### Full 15 Services
**Timeline:** 18+ months (Enterprise phase)
- Only when you have 10+ engineering team
- Operating at high scale (1000+ resumes/day)
- Need maximum fault isolation

---

## Updated Cost Estimate (6 Services)

| Category | Monthly Cost |
|----------|-------------|
| Compute (6 services, ~20 pods) | **$600** ↓ |
| Databases | $340 |
| Storage | $25 |
| Messaging (Kafka) | $450 |
| AI/ML (LLM, Voice, Embeddings) | $1,110 |
| Vector DB | $70 |
| Monitoring | $150 |
| Misc | $100 |
| **Total** | **~$2,845/month** ↓ |

**Savings:** ~$200/month vs 15-service architecture

---

This consolidated architecture gives you **80% of the benefits with 40% of the complexity**. Perfect for MVP and early growth stages! 🚀
