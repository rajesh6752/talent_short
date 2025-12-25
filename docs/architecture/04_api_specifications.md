# Complete API Specifications

## API Overview

**Base URL:** `https://api.hiring-platform.com`  
**Version:** v1  
**Authentication:** Bearer JWT tokens  
**Content-Type:** `application/json`

---

## Common Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
X-Tenant-ID: {tenant_id}  (optional, auto-detected from token)
X-Request-ID: {uuid}      (for tracing)
```

---

## Common Error Responses

All endpoints return standard error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "uuid",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**HTTP Status Codes:**
- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `422` Unprocessable Entity
- `429` Too Many Requests
- `500` Internal Server Error

---

# SERVICE 1: CORE PLATFORM

## Authentication APIs

### POST /api/v1/auth/register
Create a new user account

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response: 201 Created**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "status": "active",
    "email_verified_at": null,
    "created_at": "2025-01-15T10:00:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "token_type": "Bearer"
  }
}
```

---

### POST /api/v1/auth/login
Authenticate user

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response: 200 OK**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "tenants": [
      {
        "tenant_id": "uuid",
        "tenant_name": "Acme Corp",
        "role": "admin",
        "status": "active"
      }
    ],
    "last_login_at": "2025-01-15T10:00:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "token_type": "Bearer"
  }
}
```

---

### POST /api/v1/auth/refresh
Refresh access token

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response: 200 OK**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

---

### POST /api/v1/auth/logout
Logout user (invalidate tokens)

**Request:** Empty body

**Response: 204 No Content**

---

### GET /api/v1/auth/me
Get current user profile

**Response: 200 OK**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "avatar_url": "https://cdn.example.com/avatars/uuid.jpg",
  "status": "active",
  "email_verified_at": "2025-01-10T12:00:00Z",
  "current_tenant": {
    "id": "uuid",
    "name": "Acme Corp",
    "role": "admin",
    "permissions": ["jobs:create", "candidates:view", "interviews:schedule"]
  },
  "created_at": "2025-01-01T10:00:00Z"
}
```

---

## Tenant Management APIs

### POST /api/v1/tenants
Create a new tenant (organization)

**Request:**
```json
{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "plan": "pro"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "plan": "pro",
  "status": "active",
  "settings": {
    "timezone": "UTC",
    "locale": "en",
    "auto_screening": true
  },
  "onboarded_at": "2025-01-15T10:00:00Z",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/tenants/:id
Get tenant details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "plan": "pro",
  "status": "active",
  "settings": {
    "timezone": "UTC",
    "locale": "en",
    "auto_screening": true,
    "screening_threshold": 75
  },
  "members_count": 12,
  "active_jobs_count": 5,
  "onboarded_at": "2025-01-15T10:00:00Z",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### PUT /api/v1/tenants/:id
Update tenant settings

**Request:**
```json
{
  "name": "Acme Corp",
  "settings": {
    "timezone": "America/New_York",
    "auto_screening": false,
    "screening_threshold": 80
  }
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "settings": {
    "timezone": "America/New_York",
    "auto_screening": false,
    "screening_threshold": 80
  },
  "updated_at": "2025-01-15T11:00:00Z"
}
```

---

### GET /api/v1/tenants/:id/usage
Get tenant usage & quota

**Response: 200 OK**
```json
{
  "tenant_id": "uuid",
  "plan": "pro",
  "quotas": {
    "resumes_per_month": {
      "limit": 1000,
      "used": 342,
      "remaining": 658,
      "reset_date": "2025-02-01"
    },
    "active_jobs": {
      "limit": 50,
      "used": 12,
      "remaining": 38
    },
    "ai_screening_minutes": {
      "limit": 500,
      "used": 187,
      "remaining": 313,
      "reset_date": "2025-02-01"
    }
  },
  "current_period": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  }
}
```

---

### POST /api/v1/tenants/:id/members
Invite user to tenant

**Request:**
```json
{
  "email": "recruiter@acme.com",
  "role": "recruiter",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "user": {
    "id": "uuid",
    "email": "recruiter@acme.com",
    "first_name": "Jane",
    "last_name": "Smith"
  },
  "role": "recruiter",
  "status": "pending",
  "invited_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/tenants/:id/members
List tenant members

**Query Parameters:**
- `role` (optional): Filter by role (admin, recruiter, interviewer, viewer)
- `status` (optional): Filter by status (active, inactive, pending)
- `search` (optional): Search by name or email
- `sort_by` (optional): Sort field (joined_at, first_name, last_name, email, role) - default: joined_at
- `sort_order` (optional): asc or desc - default: desc
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "email": "john@acme.com",
        "first_name": "John",
        "last_name": "Doe",
        "avatar_url": "https://..."
      },
      "role": "admin",
      "status": "active",
      "joined_at": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

## LLM Provider Configuration APIs

### POST /api/v1/tenants/:id/llm-configs
Add LLM provider configuration (BYOK - Bring Your Own Key)

**Request:**
```json
{
  "provider": "gemini",
  "provider_name": "Production Gemini",
  "api_key": "AIza...",
  "default_model": "gemini-2.0-flash-exp",
  "enabled_models": ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
  "monthly_budget_usd": 500.00,
  "rate_limit_rpm": 1000,
  "is_default": true
}
```

**Supported Providers:**
- `openai` - OpenAI (GPT-4o, GPT-4o-mini, GPT-3.5-turbo, etc.)
- `anthropic` - Anthropic (Claude 3.5 Sonnet, Claude Opus, etc.)
- `gemini` - Google Gemini (Gemini 2.0 Flash, Gemini 1.5 Pro, etc.)
- `custom` - Custom OpenAI-compatible endpoint

**Response: 201 Created**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "provider": "openai",
  "provider_name": "Production OpenAI",
  "api_endpoint": "https://api.openai.com/v1",
  "organization_id": "org-...",
  "default_model": "gpt-4o",
  "enabled_models": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  "monthly_budget_usd": 1000.00,
  "monthly_spend_usd": 0,
  "rate_limit_rpm": 500,
  "is_active": true,
  "is_default": true,
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/tenants/:id/llm-configs
List LLM provider configurations

**Query Parameters:**
- `provider` (optional): Filter by provider (openai, anthropic, gemini, custom)
- `is_active` (optional): Filter by active status (true/false)
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "provider": "openai",
      "provider_name": "Production OpenAI",
      "default_model": "gpt-4o",
      "enabled_models": ["gpt-4o", "gpt-4o-mini"],
      "monthly_budget_usd": 1000.00,
      "monthly_spend_usd": 234.56,
      "rate_limit_rpm": 500,
      "is_active": true,
      "is_default": true,
      "last_used_at": "2025-01-24T15:30:00Z",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Note:** API keys are never returned in responses for security

---

### GET /api/v1/tenants/:id/llm-configs/:config_id
Get LLM config details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "provider": "openai",
  "provider_name": "Production OpenAI",
  "api_endpoint": "https://api.openai.com/v1",
  "organization_id": "org-...",
  "default_model": "gpt-4o",
  "enabled_models": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  "monthly_budget_usd": 1000.00,
  "monthly_spend_usd": 234.56,
  "rate_limit_rpm": 500,
  "is_active": true,
  "is_default": true,
  "last_used_at": "2025-01-24T15:30:00Z",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

---

### PUT /api/v1/tenants/:id/llm-configs/:config_id
Update LLM configuration

**Request:**
```json
{
  "provider_name": "Updated OpenAI",
  "api_key": "sk-proj-new-key...",
  "default_model": "gpt-4o-mini",
  "enabled_models": ["gpt-4o", "gpt-4o-mini"],
  "monthly_budget_usd": 1500.00,
  "is_active": true,
  "is_default": false
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "provider_name": "Updated OpenAI",
  "default_model": "gpt-4o-mini",
  "monthly_budget_usd": 1500.00,
  "is_default": false,
  "updated_at": "2025-01-25T10:00:00Z"
}
```

---

### DELETE /api/v1/tenants/:id/llm-configs/:config_id
Delete LLM configuration

**Response: 204 No Content**

---

### POST /api/v1/tenants/:id/llm-configs/:config_id/test
Test LLM configuration (verify API key works)

**Request:** Empty body

**Response: 200 OK**
```json
{
  "status": "success",
  "message": "Successfully connected to OpenAI API",
  "provider": "openai",
  "available_models": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  "rate_limits": {
    "requests_per_minute": 500,
    "tokens_per_minute": 150000
  },
  "tested_at": "2025-01-25T10:00:00Z"
}
```

**Error Response: 400 Bad Request**
```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or expired",
    "provider": "openai"
  }
}
```

---

### GET /api/v1/tenants/:id/llm-configs/:config_id/usage
Get usage statistics for LLM configuration

**Query Parameters:**
- `from_date` (optional): Start date (ISO 8601)
- `to_date` (optional): End date (ISO 8601)

**Response: 200 OK**
```json
{
  "config_id": "uuid",
  "provider": "openai",
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  },
  "usage": {
    "total_requests": 15420,
    "total_tokens": 4567890,
    "total_cost_usd": 234.56,
    "by_model": {
      "gpt-4o": {
        "requests": 8500,
        "tokens": 2500000,
        "cost_usd": 180.00
      },
      "gpt-4o-mini": {
        "requests": 6920,
        "tokens": 2067890,
        "cost_usd": 54.56
      }
    },
    "by_use_case": {
      "matching": 56.50,
      "screening": 89.20,
      "decision": 45.30,
      "other": 43.56
    }
  },
  "budget": {
    "monthly_limit": 1000.00,
    "current_spend": 234.56,
    "remaining": 765.44,
    "percentage_used": 23.46
  }
}
```

---

## Agent Model Configuration APIs

### POST /api/v1/tenants/:id/agent-configs
Configure model for specific AI agent

**Request:**
```json
{
  "agent_type": "matching",
  "llm_config_id": "uuid",
  "model_name": "gpt-4o-mini",
  "fallback_model": "gpt-3.5-turbo",
  "temperature": 0.5,
  "max_tokens": 1500,
  "top_p": 1.0
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "agent_type": "matching",
  "llm_config": {
    "id": "uuid",
    "provider": "openai",
    "provider_name": "Production OpenAI"
  },
  "model_name": "gpt-4o-mini",
  "fallback_model": "gpt-3.5-turbo",
  "temperature": 0.5,
  "max_tokens": 1500,
  "top_p": 1.0,
  "is_active": true,
  "created_at": "2025-01-25T10:00:00Z"
}
```

---

### GET /api/v1/tenants/:id/agent-configs
List all agent configurations

**Query Parameters:**
- `agent_type` (optional): Filter by agent type
- `is_active` (optional): Filter by active status (true/false)
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "agent_type": "matching",
      "llm_config": {
        "id": "uuid",
        "provider": "openai",
        "provider_name": "Production OpenAI"
      },
      "model_name": "gpt-4o-mini",
      "fallback_model": "gpt-3.5-turbo",
      "temperature": 0.5,
      "max_tokens": 1500,
      "performance": {
        "avg_latency_ms": 850,
        "avg_tokens_per_request": 1200,
        "avg_cost_per_request": 0.0024,
        "total_requests": 15420
      },
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "agent_type": "decision",
      "llm_config": {
        "id": "uuid2",
        "provider": "anthropic",
        "provider_name": "Claude API"
      },
      "model_name": "claude-3.5-sonnet",
      "temperature": 0.7,
      "max_tokens": 2000,
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 7,
    "pages": 1
  }
}
```

---

### GET /api/v1/tenants/:id/agent-configs/:agent_type
Get configuration for specific agent

**Response: 200 OK**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "agent_type": "matching",
  "llm_config": {
    "id": "uuid",
    "provider": "openai",
    "provider_name": "Production OpenAI",
    "default_model": "gpt-4o"
  },
  "model_name": "gpt-4o-mini",
  "fallback_model": "gpt-3.5-turbo",
  "temperature": 0.5,
  "max_tokens": 1500,
  "top_p": 1.0,
  "performance": {
    "avg_latency_ms": 850,
    "avg_tokens_per_request": 1200,
    "avg_cost_per_request": 0.0024,
    "total_requests": 15420,
    "last_30_days": {
      "requests": 3200,
      "total_cost_usd": 7.68,
      "success_rate": 99.2
    }
  },
  "is_active": true,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

---

### PUT /api/v1/tenants/:id/agent-configs/:agent_type
Update agent configuration

**Request:**
```json
{
  "model_name": "gpt-4o",
  "temperature": 0.6,
  "max_tokens": 2000,
  "is_active": true
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "agent_type": "matching",
  "model_name": "gpt-4o",
  "temperature": 0.6,
  "max_tokens": 2000,
  "updated_at": "2025-01-25T11:00:00Z"
}
```

---

### DELETE /api/v1/tenants/:id/agent-configs/:agent_type
Delete agent configuration (reverts to system default)

**Response: 204 No Content**

---

### GET /api/v1/tenants/:id/agent-configs/recommendations
Get model recommendations for each agent based on usage patterns

**Response: 200 OK**
```json
{
  "recommendations": [
    {
      "agent_type": "matching",
      "current_model": "gpt-4o",
      "recommended_model": "gpt-4o-mini",
      "reason": "Your matching workload is consistent and deterministic. Switching to gpt-4o-mini could save 70% on costs with minimal quality impact.",
      "estimated_savings_monthly": 125.50,
      "quality_impact": "low",
      "confidence": 0.89
    },
    {
      "agent_type": "decision",
      "current_model": "gpt-4o-mini",
      "recommended_model": "claude-3.5-sonnet",
      "reason": "Decision-making requires nuanced reasoning. Claude 3.5 Sonnet shows 15% better performance on complex hiring decisions.",
      "estimated_cost_increase_monthly": 45.00,
      "quality_impact": "high_improvement",
      "confidence": 0.76
    },
    {
      "agent_type": "screening",
      "current_model": "gpt-4o-mini",
      "recommended_model": "gpt-4o-mini",
      "reason": "Current model is optimal for your screening workload.",
      "estimated_savings_monthly": 0,
      "quality_impact": "none",
      "confidence": 0.95
    }
  ],
  "total_potential_savings": 80.50,
  "analyzed_period_days": 30
}
```

---

### GET /api/v1/agent-types
List all available agent types and their descriptions

**Response: 200 OK**
```json
{
  "agent_types": [
    {
      "type": "matching",
      "name": "Resume-Job Matching Agent",
      "description": "Scores candidate resumes against job requirements",
      "recommended_models": ["gpt-4o-mini", "gemini-2.0-flash-exp", "gpt-3.5-turbo"],
      "default_temperature": 0.5,
      "typical_tokens": 1500,
      "cost_sensitivity": "high"
    },
    {
      "type": "screening",
      "name": "AI Screening Agent",
      "description": "Conducts conversational screening interviews",
      "recommended_models": ["gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro"],
      "default_temperature": 0.7,
      "typical_tokens": 2000,
      "cost_sensitivity": "medium"
    },
    {
      "type": "voice",
      "name": "Voice Interview Agent",
      "description": "Conducts voice-based interviews with real-time responses",
      "recommended_models": ["gpt-4o", "gpt-4o-realtime", "gemini-2.0-flash-exp"],
      "default_temperature": 0.8,
      "typical_tokens": 1800,
      "cost_sensitivity": "low",
      "special_requirements": "Low latency required"
    },
    {
      "type": "decision",
      "name": "Hiring Decision Agent",
      "description": "Makes final hiring recommendations with reasoning",
      "recommended_models": ["gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro", "claude-opus"],
      "default_temperature": 0.7,
      "typical_tokens": 2500,
      "cost_sensitivity": "low"
    },
    {
      "type": "jd_enrichment",
      "name": "Job Description Enrichment Agent",
      "description": "Extracts skills and requirements from job descriptions",
      "recommended_models": ["gpt-4o-mini", "gemini-2.0-flash-exp", "gpt-3.5-turbo"],
      "default_temperature": 0.3,
      "typical_tokens": 1000,
      "cost_sensitivity": "high"
    },
    {
      "type": "explainability",
      "name": "AI Explainability Agent",
      "description": "Generates human-readable explanations for AI decisions",
      "recommended_models": ["gpt-4o", "claude-3.5-sonnet"],
      "default_temperature": 0.6,
      "typical_tokens": 1500,
      "cost_sensitivity": "medium"
    },
    {
      "type": "bias_detection",
      "name": "Bias Detection Agent",
      "description": "Analyzes decisions for potential bias",
      "recommended_models": ["gpt-4o", "claude-3.5-sonnet"],
      "default_temperature": 0.4,
      "typical_tokens": 1200,
      "cost_sensitivity": "low"
    }
  ]
}
```

---

# SERVICE 2: HIRING PIPELINE

## Job Management APIs

### POST /api/v1/jobs
Create a new job posting

**Request:**
```json
{
  "title": "Senior Software Engineer",
  "description": "We are looking for an experienced software engineer...",
  "department": "Engineering",
  "location": "San Francisco, CA",
  "employment_type": "full_time",
  "experience_min": 5,
  "experience_max": 10,
  "salary_min": 150000,
  "salary_max": 200000,
  "salary_currency": "USD",
  "settings": {
    "auto_screening": true,
    "screening_threshold": 75
  }
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "title": "Senior Software Engineer",
  "description": "We are looking for...",
  "department": "Engineering",
  "location": "San Francisco, CA",
  "employment_type": "full_time",
  "experience_min": 5,
  "experience_max": 10,
  "salary_min": 150000,
  "salary_max": 200000,
  "salary_currency": "USD",
  "status": "draft",
  "settings": {
    "auto_screening": true,
    "screening_threshold": 75
  },
  "created_by": "uuid",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/jobs
List all jobs

**Query Parameters:**
- `status` (optional): Filter by status (draft, active, closed, cancelled) - supports comma-separated values
- `department` (optional): Filter by department
- `employment_type` (optional): Filter by employment type (full_time, part_time, contract, internship)
- `location` (optional): Filter by location
- `search` (optional): Full-text search in title/description
- `experience_min` (optional): Filter by minimum experience years
- `experience_max` (optional): Filter by maximum experience years
- `salary_min` (optional): Filter by minimum salary
- `salary_max` (optional): Filter by maximum salary
- `created_by` (optional): Filter by creator UUID
- `created_after` (optional): Created after date (ISO 8601)
- `created_before` (optional): Created before date (ISO 8601)
- `published_after` (optional): Published after date (ISO 8601)
- `sort_by` (optional): Sort field (created_at, updated_at, published_at, title, department, candidates_count) - default: created_at
- `sort_order` (optional): asc or desc - default: desc
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Senior Software Engineer",
      "department": "Engineering",
      "location": "San Francisco, CA",
      "employment_type": "full_time",
      "status": "active",
      "candidates_count": 87,
      "shortlisted_count": 12,
      "published_at": "2025-01-10T10:00:00Z",
      "created_at": "2025-01-09T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

### GET /api/v1/jobs/:id
Get job details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "title": "Senior Software Engineer",
  "description": "Full job description...",
  "department": "Engineering",
  "location": "San Francisco, CA",
  "employment_type": "full_time",
  "experience_min": 5,
  "experience_max": 10,
  "salary_min": 150000,
  "salary_max": 200000,
  "salary_currency": "USD",
  "status": "active",
  "enriched_jd": {
    "required_skills": ["Python", "AWS", "Kubernetes"],
    "preferred_skills": ["Go", "Docker"],
    "responsibilities": ["Lead team", "Design architecture"],
    "qualifications": ["BS in CS", "5+ years experience"]
  },
  "settings": {
    "auto_screening": true,
    "screening_threshold": 75
  },
  "metrics": {
    "total_applicants": 87,
    "shortlisted": 12,
    "screening": 5,
    "interviewing": 3,
    "offered": 1
  },
  "published_at": "2025-01-10T10:00:00Z",
  "created_by": "uuid",
  "created_at": "2025-01-09T10:00:00Z"
}
```

---

### PUT /api/v1/jobs/:id
Update job details

**Request:**
```json
{
  "title": "Senior Software Engineer (Updated)",
  "description": "Updated description...",
  "status": "active"
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "title": "Senior Software Engineer (Updated)",
  "description": "Updated description...",
  "status": "active",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

---

### POST /api/v1/jobs/:id/enrich
Enrich JD with AI (extract skills, requirements)

**Request:** Empty body

**Response: 200 OK**
```json
{
  "job_id": "uuid",
  "enriched_jd": {
    "required_skills": ["Python", "AWS", "Kubernetes", "PostgreSQL"],
    "preferred_skills": ["Go", "Docker", "Terraform"],
    "soft_skills": ["Leadership", "Communication"],
    "responsibilities": [
      "Lead team of 5 engineers",
      "Design scalable architecture",
      "Mentor junior developers"
    ],
    "qualifications": [
      "BS in Computer Science or equivalent",
      "5+ years backend development",
      "Experience with microservices"
    ],
    "screening_questions": [
      "Describe your experience with Kubernetes",
      "How do you approach system design?",
      "Tell me about a challenging technical problem you solved"
    ]
  },
  "model_version": "gpt-4o",
  "enriched_at": "2025-01-15T10:05:00Z"
}
```

---

### POST /api/v1/jobs/:id/publish
Publish job (make it active for applications)

**Request:** Empty body

**Response: 200 OK**
```json
{
  "id": "uuid",
  "status": "active",
  "published_at": "2025-01-15T10:00:00Z"
}
```

---

### DELETE /api/v1/jobs/:id
Soft delete a job

**Response: 204 No Content**

---

## Resume Management APIs

### POST /api/v1/resumes/upload
Upload resume (multipart/form-data)

**Request:**
```
Content-Type: multipart/form-data

file: resume.pdf (binary)
metadata: {
  "candidate_email": "candidate@example.com",
  "candidate_name": "Alice Johnson",
  "source": "linkedin",
  "consent_given": true
}
```

**Response: 201 Created**
```json
{
  "resume": {
    "id": "uuid",
    "candidate_id": "uuid",
    "file_name": "resume.pdf",
    "file_url": "https://s3.../resumes/uuid.pdf",
    "file_size": 245678,
    "file_type": "pdf",
    "parsed": false,
    "uploaded_at": "2025-01-15T10:00:00Z"
  },
  "candidate": {
    "id": "uuid",
    "email": "candidate@example.com",
    "first_name": "Alice",
    "last_name": "Johnson",
    "source": "linkedin",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "parse_job_id": "uuid"
}
```

---

### GET /api/v1/resumes/:id
Get resume details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "candidate_id": "uuid",
  "file_name": "resume.pdf",
  "file_url": "https://s3.../resumes/uuid.pdf",
  "file_size": 245678,
  "file_type": "pdf",
  "parsed": true,
  "parsed_at": "2025-01-15T10:01:30Z",
  "parsed_data": {
    "personal": {
      "full_name": "Alice Johnson",
      "email": "candidate@example.com",
      "phone": "+1234567890",
      "location": "New York, NY",
      "linkedin": "linkedin.com/in/alicejohnson"
    },
    "experience": [
      {
        "title": "Senior Developer",
        "company": "Tech Corp",
        "start_date": "2020-01",
        "end_date": null,
        "current": true,
        "description": "Led development of...",
        "technologies": ["Python", "React", "AWS"]
      }
    ],
    "education": [
      {
        "degree": "BS Computer Science",
        "institution": "MIT",
        "graduation_year": 2015,
        "gpa": 3.9
      }
    ],
    "skills": {
      "technical": ["Python", "JavaScript", "AWS", "Docker"],
      "soft": ["Leadership", "Communication"],
      "languages": ["English", "Spanish"]
    },
    "summary": "Experienced software engineer with 8+ years..."
  },
  "uploaded_at": "2025-01-15T10:00:00Z"
}
```

---

### POST /api/v1/resumes/bulk
Bulk upload resumes

**Request:**
```json
{
  "resumes": [
    {
      "file_url": "https://external.com/resume1.pdf",
      "candidate_email": "candidate1@example.com",
      "source": "job_board"
    },
    {
      "file_url": "https://external.com/resume2.pdf",
      "candidate_email": "candidate2@example.com",
      "source": "referral"
    }
  ]
}
```

**Response: 202 Accepted**
```json
{
  "batch_id": "uuid",
  "total": 2,
  "status": "processing",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

## Candidate Management APIs

### GET /api/v1/candidates
List all candidates

**Query Parameters:**
- `search` (optional): Search by name or email
- `source` (optional): Filter by source (linkedin, referral, job_board, direct) - supports comma-separated values
- `location` (optional): Filter by location
- `current_company` (optional): Filter by current company
- `resume_uploaded` (optional): Filter by resume status (true/false)
- `consent_given` (optional): Filter by consent status (true/false)
- `created_after` (optional): Created after date (ISO 8601)
- `created_before` (optional): Created before date (ISO 8601)
- `sort_by` (optional): Sort field (created_at, updated_at, first_name, last_name, email, current_company) - default: created_at
- `sort_order` (optional): asc or desc - default: desc
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "candidate@example.com",
      "first_name": "Alice",
      "last_name": "Johnson",
      "current_title": "Senior Developer",
      "current_company": "Tech Corp",
      "location": "New York, NY",
      "source": "linkedin",
      "resume_uploaded": true,
      "applications_count": 3,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 342,
    "pages": 18,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### GET /api/v1/candidates/:id
Get candidate profile

**Response: 200 OK**
```json
{
  "id": "uuid",
  "email": "candidate@example.com",
  "first_name": "Alice",
  "last_name": "Johnson",
  "phone": "+1234567890",
  "linkedin_url": "linkedin.com/in/alicejohnson",
  "github_url": "github.com/alicejohnson",
  "current_title": "Senior Developer",
  "current_company": "Tech Corp",
  "location": "New York, NY",
  "source": "linkedin",
  "resume": {
    "id": "uuid",
    "file_url": "https://s3.../resumes/uuid.pdf",
    "uploaded_at": "2025-01-15T10:00:00Z"
  },
  "applications": [
    {
      "job_id": "uuid",
      "job_title": "Senior Software Engineer",
      "status": "screening",
      "match_score": 87.5,
      "applied_at": "2025-01-15T10:00:00Z"
    }
  ],
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

# SERVICE 3: AI ENGINE

## Matching APIs

### POST /api/v1/matching/score
Score a candidate for a job

**Request:**
```json
{
  "job_id": "uuid",
  "candidate_id": "uuid",
  "resume_id": "uuid"
}
```

**Response: 200 OK**
```json
{
  "match_id": "uuid",
  "job_id": "uuid",
  "candidate_id": "uuid",
  "score": 87.5,
  "match_details": {
    "skill_match": 90,
    "experience_match": 85,
    "education_match": 88,
    "location_match": 100,
    "overall_fit": 87.5
  },
  "matched_skills": ["Python", "AWS", "Kubernetes", "Docker"],
  "missing_skills": ["Go", "Terraform"],
  "bias_flags": [],
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/matching/:job_id/candidates
Get ranked candidates for a job

**Query Parameters:**
- `min_score` (optional): Minimum match score (0-100) - default: 0
- `max_score` (optional): Maximum match score (0-100)
- `status` (optional): Filter by match status (scored, shortlisted, screening, interviewing, rejected) - supports comma-separated values
- `has_bias_flags` (optional): Filter by bias flags presence (true/false)
- `matched_skills` (optional): Filter by matched skills (comma-separated)
- `created_after` (optional): Matched after date (ISO 8601)
- `sort_by` (optional): Sort field (score, created_at, updated_at) - default: score
- `sort_order` (optional): asc or desc - default: desc  
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "job": {
    "id": "uuid",
    "title": "Senior Software Engineer"
  },
  "data": [
    {
      "match_id": "uuid",
      "candidate": {
        "id": "uuid",
        "email": "candidate@example.com",
        "first_name": "Alice",
        "last_name": "Johnson",
        "current_title": "Senior Developer"
      },
      "score": 87.5,
      "status": "scored",
      "matched_skills": ["Python", "AWS", "Kubernetes"],
      "missing_skills": ["Go"],
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### POST /api/v1/matching/:job_id/shortlist
Shortlist candidates

**Request:**
```json
{
  "match_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response: 200 OK**
```json
{
  "shortlisted": 3,
  "matches": [
    {
      "match_id": "uuid1",
      "status": "shortlisted",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET /api/v1/matching/:match_id/explain
Get AI explanation for match score

**Response: 200 OK**
```json
{
  "match_id": "uuid",
  "score": 87.5,
  "explanation": {
    "summary": "Alice is an excellent match for this Senior Software Engineer role with 8 years of relevant experience and strong technical skills.",
    "strengths": [
      "8 years of Python development experience matches requirement",
      "Proven AWS and Kubernetes expertise in current role",
      "Strong leadership experience managing teams of 5+",
      "Educational background from top-tier university"
    ],
    "gaps": [
      "No Go language experience (preferred but not required)",
      "Limited Terraform experience"
    ],
    "recommendation": "Strong hire - proceed to screening",
    "confidence": 0.92
  },
  "factors": {
    "skills": {
      "weight": 0.4,
      "score": 90,
      "details": "9/10 required skills matched"
    },
    "experience": {
      "weight": 0.3,
      "score": 85,
      "details": "8 years vs 5-10 required"
    },
    "education": {
      "weight": 0.2,
      "score": 88,
      "details": "BS CS from MIT"
    },
    "other": {
      "weight": 0.1,
      "score": 100,
      "details": "Great location match"
    }
  },
  "model_version": "gpt-4o",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

## Screening APIs

### POST /api/v1/screening/sessions
Create screening session

**Request:**
```json
{
  "match_id": "uuid",
  "session_type": "text_chat",
  "expires_in": 86400
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "match_id": "uuid",
  "candidate_id": "uuid",
  "job_id": "uuid",
  "session_type": "text_chat",
  "status": "pending",
  "access_token": "unique_token_for_candidate",
  "access_url": "https://app.hiring-platform.com/screening/unique_token",
  "expires_at": "2025-01-16T10:00:00Z",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/screening/sessions
List all screening sessions

**Query Parameters:**
- `job_id` (optional): Filter by job UUID
- `candidate_id` (optional): Filter by candidate UUID
- `match_id` (optional): Filter by match UUID
- `status` (optional): Filter by status (pending, in_progress, completed, abandoned, cancelled) - supports comma-separated values
- `session_type` (optional): Filter by session type (text_chat, voice_call)
- `started_after` (optional): Started after date (ISO 8601)
- `started_before` (optional): Started before date (ISO 8601)
- `completed_after` (optional): Completed after date (ISO 8601)
- `sort_by` (optional): Sort field (created_at, started_at, completed_at, duration_seconds) - default: created_at
- `sort_order` (optional): asc or desc - default: desc
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "candidate": {
        "id": "uuid",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "job": {
        "id": "uuid",
        "title": "Senior Software Engineer"
      },
      "session_type": "text_chat",
      "status": "completed",
      "started_at": "2025-01-15T10:00:00Z",
      "completed_at": "2025-01-15T10:45:00Z",
      "duration_seconds": 2700,
      "created_at": "2025-01-15T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### POST /api/v1/screening/sessions/:id/messages
Send message in screening session

**Request:**
```json
{
  "role": "candidate",
  "content": "I have 8 years of Python experience, primarily in backend development..."
}
```

**Response: 200 OK**
```json
{
  "message": {
    "id": "uuid",
    "role": "candidate",
    "content": "I have 8 years of Python experience...",
    "timestamp": "2025-01-15T10:30:00Z",
    "metadata": {
      "confidence": 0.85,
      "sentiment": "positive"
    }
  },
  "agent_response": {
    "id": "uuid",
    "role": "agent",
    "content": "That's impressive! Can you describe a challenging Python project you worked on?",
    "timestamp": "2025-01-15T10:30:05Z",
    "metadata": {
      "intent": "follow_up_question"
    }
  }
}
```

---

### GET /api/v1/screening/sessions/:id/transcript
Get full conversation transcript

**Response: 200 OK**
```json
{
  "session_id": "uuid",
  "status": "completed",
  "started_at": "2025-01-15T10:00:00Z",
  "completed_at": "2025-01-15T10:45:00Z",
  "duration_seconds": 2700,
  "messages": [
    {
      "id": "uuid",
      "role": "agent",
      "content": "Hello! Thanks for applying...",
      "timestamp": "2025-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "candidate",
      "content": "Thank you! I'm excited...",
      "timestamp": "2025-01-15T10:00:30Z"
    }
  ],
  "message_count": 24
}
```

---

### POST /api/v1/screening/sessions/:id/complete
Complete screening session

**Request:** Empty body

**Response: 200 OK**
```json
{
  "session_id": "uuid",
  "status": "completed",
  "completed_at": "2025-01-15T10:45:00Z",
  "analysis": {
    "overall_score": 85,
    "technical_competence": 88,
    "communication_clarity": 90,
    "cultural_fit": 82,
    "red_flags": [],
    "summary": "Strong candidate with excellent Python skills and clear communication. Demonstrated problem-solving ability through specific examples.",
    "recommendation": "Proceed to technical interview",
    "confidence": 0.87
  }
}
```

---

### GET /api/v1/screening/sessions/:id/analysis
Get AI analysis of screening session

**Response: 200 OK**
```json
{
  "session_id": "uuid",
  "analysis": {
    "overall_score": 85,
    "dimensions": {
      "technical_competence": {
        "score": 88,
        "evidence": ["Demonstrated deep Python knowledge", "Explained microservices architecture clearly"]
      },
      "communication": {
        "score": 90,
        "evidence": ["Clear and concise responses", "Good use of examples"]
      },
      "problem_solving": {
        "score": 85,
        "evidence": ["Structured approach to challenges", "Mentioned specific debugging strategies"]
      },
      "cultural_fit": {
        "score": 82,
        "evidence": ["Aligns with collaborative values", "Mentioned mentoring junior developers"]
      }
    },
    "strengths": [
      "Deep technical knowledge in Python and AWS",
      "Excellent communication skills",
      "Proven leadership experience"
    ],
    "concerns": [
      "Limited experience with Go (preferred skill)",
      "No mention of Terraform experience"
    ],
    "red_flags": [],
    "summary": "Strong candidate with excellent technical skills...",
    "recommendation": "Proceed to technical interview",
    "confidence": 0.87,
    "next_steps": ["Schedule technical interview", "Focus on system design questions"]
  },
  "model_version": "gpt-4o",
  "analyzed_at": "2025-01-15T10:45:30Z"
}
```

---

# SERVICE 4: INTERVIEW & DECISION

## Interview APIs

### POST /api/v1/interviews/schedule
Schedule an interview

**Request:**
```json
{
  "match_id": "uuid",
  "interview_type": "technical",
  "scheduled_at": "2025-01-20T14:00:00Z",
  "duration_minutes": 60,
  "timezone": "America/New_York",
  "panel_members": ["user_id1", "user_id2"],
  "meeting_provider": "zoom",
  "notes": "Focus on system design"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "match_id": "uuid",
  "interview_type": "technical",
  "scheduled_at": "2025-01-20T14:00:00Z",
  "duration_minutes": 60,
  "timezone": "America/New_York",
  "meeting_url": "https://zoom.us/j/123456789",
  "meeting_password": "abc123",
  "meeting_provider": "zoom",
  "panel": [
    {
      "user_id": "uuid1",
      "name": "John Doe",
      "role": "interviewer",
      "status": "accepted"
    }
  ],
  "status": "scheduled",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/interviews
List interviews

**Query Parameters:**
- `job_id` (optional): Filter by job UUID
- `candidate_id` (optional): Filter by candidate UUID
- `match_id` (optional): Filter by match UUID
- `status` (optional): Filter by status (scheduled, rescheduled, in_progress, completed, cancelled, no_show) - supports comma-separated values
- `interview_type` (optional): Filter by interview type (screening, technical, behavioral, voice, final, hr) - supports comma-separated values
- `panel_member_id` (optional): Filter by panel member UUID
- `from_date` (optional): Scheduled from date (ISO 8601)
- `to_date` (optional): Scheduled to date (ISO 8601)
- `meeting_provider` (optional): Filter by provider (zoom, google_meet, teams, phone, in_person)
- `feedback_submitted` (optional): Filter by feedback status (true/false)
- `sort_by` (optional): Sort field (scheduled_at, created_at, updated_at, duration_minutes, interview_type) - default: scheduled_at
- `sort_order` (optional): asc or desc - default: asc
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "candidate": {
        "id": "uuid",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "job": {
        "id": "uuid",
        "title": "Senior Software Engineer"
      },
      "interview_type": "technical",
      "scheduled_at": "2025-01-20T14:00:00Z",
      "duration_minutes": 60,
      "status": "scheduled",
      "panel_count": 2,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

### GET /api/v1/interviews/:id
Get interview details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "match_id": "uuid",
  "candidate": {
    "id": "uuid",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "current_title": "Senior Developer"
  },
  "job": {
    "id": "uuid",
    "title": "Senior Software Engineer",
    "department": "Engineering"
  },
  "interview_type": "technical",
  "scheduled_at": "2025-01-20T14:00:00Z",
  "duration_minutes": 60,
  "timezone": "America/New_York",
  "meeting_url": "https://zoom.us/j/123456789",
  "meeting_password": "abc123",
  "meeting_provider": "zoom",
  "panel": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@acme.com"
      },
      "role": "interviewer",
      "status": "accepted",
      "feedback_submitted": false
    }
  ],
  "status": "scheduled",
  "notes": "Focus on system design",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### PUT /api/v1/interviews/:id/reschedule
Reschedule interview

**Request:**
```json
{
  "scheduled_at": "2025-01-21T15:00:00Z",
  "reason": "Candidate requested different time"
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "scheduled_at": "2025-01-21T15:00:00Z",
  "status": "rescheduled",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

---

### POST /api/v1/interviews/:id/feedback
Submit interview feedback

**Request:**
```json
{
  "rating": 4,
  "technical_rating": 5,
  "cultural_fit_rating": 4,
  "communication_rating": 4,
  "recommendation": "hire",
  "notes": "Strong technical skills, good system design thinking. Explained trade-offs well.",
  "red_flags": []
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "interview_id": "uuid",
  "panel_member_id": "uuid",
  "rating": 4,
  "technical_rating": 5,
  "cultural_fit_rating": 4,
  "communication_rating": 4,
  "recommendation": "hire",
  "notes": "Strong technical skills...",
  "red_flags": [],
  "created_at": "2025-01-20T15:30:00Z"
}
```

---

## Voice Interview APIs

### POST /api/v1/voice/sessions
Create voice interview session

**Request:**
```json
{
  "interview_id": "uuid",
  "candidate_phone": "+1234567890",
  "scheduled_at": "2025-01-20T14:00:00Z"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "interview_id": "uuid",
  "candidate_phone": "+1234567890",
  "status": "scheduled",
  "scheduled_at": "2025-01-20T14:00:00Z",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/voice/sessions
List all voice interview sessions

**Query Parameters:**
- `interview_id` (optional): Filter by interview UUID
- `candidate_id` (optional): Filter by candidate UUID (via interview)
- `status` (optional): Filter by status (scheduled, in_progress, completed, failed, cancelled) - supports comma-separated values
- `direction` (optional): Filter by call direction (inbound, outbound)
- `started_after` (optional): Started after date (ISO 8601)
- `started_before` (optional): Started before date (ISO 8601)
- `min_duration` (optional): Minimum duration in seconds
- `max_duration` (optional): Maximum duration in seconds
- `sort_by` (optional): Sort field (started_at, ended_at, duration_seconds, created_at) - default: started_at
- `sort_order` (optional): asc or desc - default: desc
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "interview": {
        "id": "uuid",
        "candidate_name": "Alice Johnson",
        "job_title": "Senior Software Engineer"
      },
      "call_sid": "CA1234567890",
      "status": "completed",
      "started_at": "2025-01-20T14:00:00Z",
      "ended_at": "2025-01-20T14:25:00Z",
      "duration_seconds": 1500,
      "direction": "outbound",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 28,
    "pages": 2,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### GET /api/v1/voice/sessions/:id
Get voice session details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "interview_id": "uuid",
  "call_sid": "CA1234567890",
  "candidate_phone": "+1234567890",
  "direction": "outbound",
  "status": "completed",
  "started_at": "2025-01-20T14:00:00Z",
  "ended_at": "2025-01-20T14:25:00Z",
  "duration_seconds": 1500,
  "recording_url": "https://s3.../recordings/uuid.mp3",
  "transcript": {
    "segments": [
      {
        "timestamp": "2025-01-20T14:00:05Z",
        "speaker": "agent",
        "text": "Hello! This is AI Assistant calling about your application..."
      },
      {
        "timestamp": "2025-01-20T14:00:15Z",
        "speaker": "candidate",
        "text": "Hi! Yes, I'm ready for the interview."
      }
    ]
  },
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET /api/v1/voice/sessions/:id/analysis
Get AI analysis of voice interview

**Response: 200 OK**
```json
{
  "session_id": "uuid",
  "analysis": {
    "overall_score": 82,
    "technical_score": 85,
    "communication_score": 88,
    "confidence_level": 0.78,
    "emotions_detected": {
      "confident": 0.65,
      "nervous": 0.20,
      "positive": 0.80,
      "neutral": 0.15
    },
    "speaking_metrics": {
      "avg_words_per_minute": 145,
      "filler_words_count": 12,
      "clarity_score": 0.85
    },
    "key_points": [
      "Strong Python and AWS knowledge demonstrated",
      "Clear examples of problem-solving",
      "Good understanding of system design principles"
    ],
    "concerns": [
      "Hesitated on distributed systems questions",
      "Limited Go language experience mentioned"
    ],
    "recommendation": "Proceed to final round",
    "confidence": 0.82
  },
  "analyzed_at": "2025-01-20T14:26:00Z"
}
```

---

## Decision APIs

### GET /api/v1/decisions
List all hiring decisions

**Query Parameters:**
- `job_id` (optional): Filter by job UUID
- `candidate_id` (optional): Filter by candidate UUID
- `match_id` (optional): Filter by match UUID
- `recommendation` (optional): Filter by AI recommendation (hire, no_hire, hold) - supports comma-separated values
- `status` (optional): Filter by decision status (pending, approved, rejected, escalated) - supports comma-separated values
- `min_confidence` (optional): Minimum confidence score (0-1)
- `approved_by` (optional): Filter by approver UUID
- `created_after` (optional): Created after date (ISO 8601)
- `created_before` (optional): Created before date (ISO 8601)
- `sort_by` (optional): Sort field (created_at, updated_at, approved_at, confidence_score, recommendation) - default: created_at
- `sort_order` (optional): asc or desc - default: desc
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "candidate": {
        "id": "uuid",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "job": {
        "id": "uuid",
        "title": "Senior Software Engineer"
      },
      "recommendation": "hire",
      "confidence_score": 0.89,
      "status": "pending",
      "created_at": "2025-01-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

---

### POST /api/v1/decisions
Create hiring decision

**Request:**
```json
{
  "match_id": "uuid",
  "generate_ai_recommendation": true
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "match_id": "uuid",
  "candidate": {
    "id": "uuid",
    "name": "Alice Johnson"
  },
  "job": {
    "id": "uuid",
    "title": "Senior Software Engineer"
  },
  "recommendation": "hire",
  "confidence_score": 0.89,
  "reasoning": {
    "summary": "Alice is a strong candidate with excellent technical skills, proven experience, and cultural alignment.",
    "factors": [
      {
        "factor": "Technical Skills",
        "weight": 0.35,
        "score": 90,
        "evidence": "Strong match on required skills, excellent interview performance"
      },
      {
        "factor": "Experience",
        "weight": 0.25,
        "score": 88,
        "evidence": "8 years relevant experience, leadership roles"
      },
      {
        "factor": "Cultural Fit",
        "weight": 0.20,
        "score": 85,
        "evidence": "Collaborative mindset, mentoring experience"
      },
      {
        "factor": "Interview Performance",
        "weight": 0.20,
        "score": 87,
        "evidence": "Positive feedback from all interviewers"
      }
    ],
    "aggregate_score": 87.9
  },
  "status": "pending",
  "created_at": "2025-01-22T10:00:00Z"
}
```

---

### GET /api/v1/decisions/:id
Get decision details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "match_id": "uuid",
  "candidate": {
    "id": "uuid",
    "name": "Alice Johnson",
    "email": "alice@example.com"
  },
  "job": {
    "id": "uuid",
    "title": "Senior Software Engineer"
  },
  "recommendation": "hire",
  "confidence_score": 0.89,
  "reasoning": {
    "summary": "Alice is a strong candidate...",
    "factors": [...]
  },
  "status": "pending",
  "created_by": "uuid",
  "created_at": "2025-01-22T10:00:00Z"
}
```

---

### PUT /api/v1/decisions/:id/approve
Approve hiring decision

**Request:**
```json
{
  "approved": true,
  "notes": "Excellent candidate, proceeding with offer"
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "status": "approved",
  "approved_by": "uuid",
  "approved_at": "2025-01-22T11:00:00Z"
}
```

---

### GET /api/v1/decisions/:id/explanation
Get detailed explanation for decision

**Response: 200 OK**
```json
{
  "decision_id": "uuid",
  "explanation": {
    "candidate_facing": "Based on your application, resume, and interview performance, we have determined that your skills and experience align well with our requirements for this position.",
    "internal": "Detailed internal reasoning with specific scores and evidence",
    "factors": [
      {
        "name": "Resume Match",
        "weight": 0.15,
        "score": 87.5,
        "contribution": 13.125,
        "explanation": "Strong skill alignment with 9/10 required skills"
      },
      {
        "name": "Screening Performance",
        "weight": 0.20,
        "score": 85,
        "contribution": 17.0,
        "explanation": "Excellent communication and technical knowledge"
      },
      {
        "name": "Interview Feedback",
        "weight": 0.40,
        "score": 88,
        "contribution": 35.2,
        "explanation": "Positive feedback from all panel members"
      },
      {
        "name": "Voice Interview",
        "weight": 0.15,
        "score": 82,
        "contribution": 12.3,
        "explanation": "Good confidence and clarity"
      },
      {
        "name": "Overall Fit",
        "weight": 0.10,
        "score": 85,
        "contribution": 8.5,
        "explanation": "Cultural alignment and growth potential"
      }
    ],
    "total_score": 86.125,
    "bias_check": {
      "passed": true,
      "flags": []
    }
  },
  "model_version": "claude-3.5-sonnet",
  "generated_at": "2025-01-22T10:00:30Z"
}
```

---

# SERVICE 5: COMPLIANCE & ANALYTICS

## Audit APIs

### GET /api/v1/audit/logs
Get audit logs

**Query Parameters:**
- `user_id` (optional): Filter by user UUID
- `entity_type` (optional): Filter by entity type (job, candidate, interview, decision, etc.)
- `entity_id` (optional): Filter specific entity UUID
- `action` (optional): Filter by action (e.g., candidate.shortlisted, job.published) - supports comma-separated values
- `from_date` (optional): From date (ISO 8601)
- `to_date` (optional): To date (ISO 8601)
- `ip_address` (optional): Filter by IP address
- `sort_by` (optional): Sort field (timestamp, action, entity_type) - default: timestamp
- `sort_order` (optional): asc or desc - default: desc
- `page` (default: 1): Page number
- `limit` (default: 50, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "timestamp": "2025-01-15T10:00:00Z",
      "user": {
        "id": "uuid",
        "email": "john@acme.com",
        "name": "John Doe"
      },
      "action": "candidate.shortlisted",
      "entity_type": "candidate_job_match",
      "entity_id": "uuid",
      "metadata": {
        "job_id": "uuid",
        "match_score": 87.5
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "pages": 25,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### GET /api/v1/audit/entity/:type/:id
Get audit trail for specific entity

**Response: 200 OK**
```json
{
  "entity_type": "job",
  "entity_id": "uuid",
  "events": [
    {
      "timestamp": "2025-01-15T10:00:00Z",
      "action": "job.created",
      "user": "John Doe",
      "metadata": {"status": "draft"}
    },
    {
      "timestamp": "2025-01-15T11:00:00Z",
      "action": "job.enriched",
      "user": "system",
      "metadata": {"model": "gpt-4o"}
    },
    {
      "timestamp": "2025-01-15T12:00:00Z",
      "action": "job.published",
      "user": "John Doe",
      "metadata": {"status": "active"}
    }
  ],
  "total_events": 3
}
```

---

## Notification APIs

### GET /api/v1/notifications
List sent notifications

**Query Parameters:**
- `recipient_type` (optional): Filter by recipient type (user, candidate)
- `recipient_id` (optional): Filter by recipient UUID
- `channel` (optional): Filter by channel (email, sms, in_app, push) - supports comma-separated values
- `status` (optional): Filter by status (queued, sent, delivered, failed, bounced) - supports comma-separated values
- `template_id` (optional): Filter by template UUID
- `sent_after` (optional): Sent after date (ISO 8601)
- `sent_before` (optional): Sent before date (ISO 8601)
- `sort_by` (optional): Sort field (created_at, sent_at, delivered_at) - default: created_at
- `sort_order` (optional): asc or desc - default: desc
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Items per page

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "recipient_type": "candidate",
      "recipient_email": "candidate@example.com",
      "channel": "email",
      "subject": "Your application to Senior Software Engineer",
      "status": "delivered",
      "sent_at": "2025-01-15T10:00:00Z",
      "delivered_at": "2025-01-15T10:00:05Z",
      "created_at": "2025-01-15T09:59:58Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 567,
    "pages": 29,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Email Template Management APIs

### POST /api/v1/notifications/templates
Create email/SMS template

**Request:**
```json
{
  "name": "Interview Invitation",
  "description": "Template for inviting candidates to interviews",
  "template_type": "interview_invite",
  "subject": "Interview Invitation for {{job_title}}",
  "body_html": "<p>Hi {{candidate_name}},</p><p>We'd like to invite you for an interview...</p>",
  "body_text": "Hi {{candidate_name}}, We'd like to invite you...",
  "variables": ["{{candidate_name}}", "{{job_title}}", "{{interview_date}}", "{{interview_link}}"],
  "channels": ["email", "sms"]
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Interview Invitation",
  "template_type": "interview_invite",
  "subject": "Interview Invitation for {{job_title}}",
  "variables": ["{{candidate_name}}", "{{job_title}}", "{{interview_date}}", "{{interview_link}}"],
  "channels": ["email", "sms"],
  "is_active": true,
  "created_at": "2025-01-25T10:00:00Z"
}
```

---

### GET /api/v1/notifications/templates
List all email templates

**Query Parameters:**
- `template_type` (optional): Filter by type
- `is_active` (optional): Filter active templates
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Interview Invitation",
      "template_type": "interview_invite",
      "subject": "Interview Invitation for {{job_title}}",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

---

### GET /api/v1/notifications/templates/:id
Get template details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Interview Invitation",
  "description": "Template for inviting candidates...",
  "template_type": "interview_invite",
  "subject": "Interview Invitation for {{job_title}}",
  "body_html": "<p>Hi {{candidate_name}}...</p>",
  "body_text": "Hi {{candidate_name}}...",
  "variables": ["{{candidate_name}}", "{{job_title}}", "{{interview_date}}"],
  "channels": ["email", "sms"],
  "is_default": false,
  "is_active": true,
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### PUT /api/v1/notifications/templates/:id
Update template

**Request:**
```json
{
  "subject": "Updated: Interview Invitation for {{job_title}}",
  "body_html": "<p>Updated content...</p>",
  "is_active": true
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "subject": "Updated: Interview Invitation for {{job_title}}",
  "updated_at": "2025-01-25T11:00:00Z"
}
```

---

### DELETE /api/v1/notifications/templates/:id
Delete template

**Response: 204 No Content**

---

### POST /api/v1/notifications/templates/:id/preview
Preview template with sample data

**Request:**
```json
{
  "data": {
    "candidate_name": "Alice Johnson",
    "job_title": "Senior Software Engineer",
    "interview_date": "January 30, 2025",
    "interview_link": "https://zoom.us/j/123456"
  }
}
```

**Response: 200 OK**
```json
{
  "subject": "Interview Invitation for Senior Software Engineer",
  "body_html": "<p>Hi Alice Johnson,</p><p>We'd like to invite you for an interview on January 30, 2025...</p>",
  "body_text": "Hi Alice Johnson, We'd like to invite you..."
}
```

---

## Webhook Management APIs

### POST /api/v1/webhooks
Register webhook endpoint

**Request:**
```json
{
  "url": "https://my-app.com/hooks/hiring",
  "name": "My ATS Integration",
  "description": "Sync candidates to our ATS",
  "events": ["candidate.created", "candidate.hired", "job.published"],
  "custom_headers": {
    "X-API-Key": "secret"
  }
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "url": "https://my-app.com/hooks/hiring",
  "name": "My ATS Integration",
  "events": ["candidate.created", "candidate.hired", "job.published"],
  "secret_key": "whsec_...",
  "is_active": true,
  "created_at": "2025-01-25T10:00:00Z"
}
```

**Note:** `secret_key` is returned only once for HMAC signature verification

---

### GET /api/v1/webhooks
List webhooks

**Query Parameters:**
- `is_active` (optional): Filter by active status
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "url": "https://my-app.com/hooks/hiring",
      "name": "My ATS Integration",
      "events": ["candidate.created", "candidate.hired"],
      "is_active": true,
      "last_triggered_at": "2025-01-24T15:30:00Z",
      "last_success_at": "2025-01-24T15:30:00Z",
      "failure_count": 0,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

---

### GET /api/v1/webhooks/:id
Get webhook details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "url": "https://my-app.com/hooks/hiring",
  "name": "My ATS Integration",
  "description": "Sync candidates to our ATS",
  "events": ["candidate.created", "candidate.hired", "job.published"],
  "is_active": true,
  "last_triggered_at": "2025-01-24T15:30:00Z",
  "last_success_at": "2025-01-24T15:30:00Z",
  "last_failure_at": null,
  "failure_count": 0,
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Note:** `secret_key` is never returned in responses

---

### PUT /api/v1/webhooks/:id
Update webhook

**Request:**
```json
{
  "url": "https://my-app.com/hooks/hiring-v2",
  "events": ["candidate.created", "candidate.hired", "interview.scheduled"],
  "is_active": true
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "url": "https://my-app.com/hooks/hiring-v2",
  "events": ["candidate.created", "candidate.hired", "interview.scheduled"],
  "updated_at": "2025-01-25T11:00:00Z"
}
```

---

### DELETE /api/v1/webhooks/:id
Delete webhook

**Response: 204 No Content**

---

### POST /api/v1/webhooks/:id/test
Test webhook delivery

**Request:** Empty body

**Response: 200 OK**
```json
{
  "status": "success",
  "http_status_code": 200,
  "response_time_ms": 145,
  "message": "Webhook delivered successfully"
}
```

**Error Response: 400 Bad Request**
```json
{
  "error": {
    "code": "WEBHOOK_DELIVERY_FAILED",
    "message": "Connection refused",
    "http_status_code": null
  }
}
```

---

### GET /api/v1/webhooks/:id/deliveries
Get webhook delivery history

**Query Parameters:**
- `status` (optional): Filter by status
- `from_date` (optional)
- `to_date` (optional)
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "candidate.created",
      "status": "delivered",
      "http_status_code": 200,
      "attempt_count": 1,
      "delivered_at": "2025-01-24T15:30:00Z",
      "created_at": "2025-01-24T15:30:00Z"
    },
    {
      "id": "uuid2",
      "event_type": "job.published",
      "status": "failed",
      "http_status_code": 500,
      "error_message": "Internal Server Error",
      "attempt_count": 3,
      "created_at": "2025-01-23T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

## Resume Parser Configuration APIs

### POST /api/v1/resume-parsers
Add resume parser configuration

**Request:**
```json
{
  "provider": "textkernel",
  "provider_name": "Production Textkernel",
  "api_key": "tk_...",
  "account_id": "account123",
  "language": "en",
  "is_default": true
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "provider": "textkernel",
  "provider_name": "Production Textkernel",
  "account_id": "account123",
  "language": "en",
  "is_active": true,
  "is_default": true,
  "created_at": "2025-01-25T10:00:00Z"
}
```

---

### GET /api/v1/resume-parsers
List parser configurations

**Query Parameters:**
- `provider` (optional): Filter by provider
- `is_active` (optional)
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "provider": "textkernel",
      "provider_name": "Production Textkernel",
      "language": "en",
      "total_parses": 1245,
      "successful_parses": 1198,
      "failed_parses": 47,
      "success_rate": 96.2,
      "avg_parse_time_ms": 850,
      "is_active": true,
      "is_default": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
```

---

### GET /api/v1/resume-parsers/:id
Get parser config details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "provider": "textkernel",
  "provider_name": "Production Textkernel",
  "account_id": "account123",
  "language": "en",
  "output_format": "json",
  "total_parses": 1245,
  "successful_parses": 1198,
  "failed_parses": 47,
  "avg_parse_time_ms": 850,
  "is_active": true,
  "is_default": true,
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### PUT /api/v1/resume-parsers/:id
Update parser configuration

**Request:**
```json
{
  "api_key": "tk_new_key...",
  "is_active": true
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "is_active": true,
  "updated_at": "2025-01-25T11:00:00Z"
}
```

---

### DELETE /api/v1/resume-parsers/:id
Delete parser configuration

**Response: 204 No Content**

---

### POST /api/v1/resume-parsers/:id/test
Test parser with sample resume

**Request:**
```
Content-Type: multipart/form-data

file: sample-resume.pdf (binary)
```

**Response: 200 OK**
```json
{
  "status": "success",
  "parse_time_ms": 720,
  "parsed_data": {
    "personal": {
      "full_name": "Test Candidate",
      "email": "test@example.com"
    },
    "experience": [...],
    "education": [...],
    "skills": [...]
  }
}
```

---

## Saved Searches APIs

### POST /api/v1/saved-searches
Save a search filter

**Request:**
```json
{
  "name": "Senior Python Developers",
  "description": "Python devs with 5+ years",
  "search_type": "candidates",
  "filters": {
    "skills": ["Python"],
    "experience_min": 5,
    "location": "San Francisco"
  },
  "sort_by": "created_at",
  "sort_order": "desc"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "name": "Senior Python Developers",
  "search_type": "candidates",
  "filters": {...},
  "is_default": false,
  "created_at": "2025-01-25T10:00:00Z"
}
```

---

### GET /api/v1/saved-searches
List saved searches

**Query Parameters:**
- `search_type` (optional): Filter by type
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Senior Python Developers",
      "search_type": "candidates",
      "is_default": false,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

---

### GET /api/v1/saved-searches/:id
Get saved search details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "name": "Senior Python Developers",
  "description": "Python devs with 5+ years",
  "search_type": "candidates",
  "filters": {
    "skills": ["Python"],
    "experience_min": 5,
    "location": "San Francisco"
  },
  "sort_by": "created_at",
  "sort_order": "desc",
  "is_default": false,
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### PUT /api/v1/saved-searches/:id
Update saved search

**Request:**
```json
{
  "name": "Updated Name",
  "filters": {...},
  "is_default": true
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "is_default": true,
  "updated_at": "2025-01-25T11:00:00Z"
}
```

---

### DELETE /api/v1/saved-searches/:id
Delete saved search

**Response: 204 No Content**

---

## Referral Program APIs

### POST /api/v1/referrals
Create referral

**Request:**
```json
{
  "candidate_id": "uuid",
  "job_id": "uuid",
  "notes": "Great fit for this role"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "referrer_user_id": "uuid",
  "candidate_id": "uuid",
  "job_id": "uuid",
  "referral_code": "REF-ABC123",
  "status": "pending",
  "reward_status": "pending",
  "created_at": "2025-01-25T10:00:00Z"
}
```

---

### GET /api/v1/referrals
List referrals

**Query Parameters:**
- `status` (optional): Filter by status
- `reward_status` (optional): Filter by reward status
- `referrer_user_id` (optional): Filter by referrer
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "referrer": {
        "id": "uuid",
        "name": "John Doe"
      },
      "candidate": {
        "id": "uuid",
        "name": "Alice Johnson"
      },
      "job": {
        "id": "uuid",
        "title": "Senior Software Engineer"
      },
      "referral_code": "REF-ABC123",
      "status": "hired",
      "reward_amount": 1000.00,
      "reward_status": "approved",
      "hired_at": "2025-01-20T10:00:00Z",
      "created_at": "2025-01-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### GET /api/v1/referrals/:id
Get referral details

**Response: 200 OK**
```json
{
  "id": "uuid",
  "referrer_user_id": "uuid",
  "candidate_id": "uuid",
  "job_id": "uuid",
  "referral_code": "REF-ABC123",
  "referral_source": "internal_portal",
  "notes": "Great fit for this role",
  "status": "hired",
  "reward_amount": 1000.00,
  "reward_currency": "USD",
  "reward_status": "approved",
  "reward_paid_at": null,
  "hired_at": "2025-01-20T10:00:00Z",
  "created_at": "2025-01-10T10:00:00Z"
}
```

---

### PUT /api/v1/referrals/:id/reward
Approve/Pay referral reward

**Request:**
```json
{
  "reward_status": "approved",
  "reward_amount": 1000.00
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "reward_status": "approved",
  "reward_amount": 1000.00,
  "updated_at": "2025-01-25T10:00:00Z"
}
```

---

### GET /api/v1/referrals/stats
Get referral program statistics

**Response: 200 OK**
```json
{
  "total_referrals": 145,
  "pending": 23,
  "hired": 12,
  "rejected": 110,
  "total_rewards_paid": 12000.00,
  "total_rewards_pending": 3000.00,
  "top_referrers": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "total_referrals": 15,
      "successful_hires": 4,
      "total_earned": 4000.00
    }
  ],
  "conversion_rate": 8.3
}
```

---

## Consent Management APIs

### POST /api/v1/consent/collect
Collect candidate consent

**Request:**
```json
{
  "candidate_id": "uuid",
  "consent_version": "1.0",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "candidate_id": "uuid",
  "consent_version": "1.0",
  "collected_at": "2025-01-15T10:00:00Z",
  "ip_address": "192.168.1.1"
}
```

---

### POST /api/v1/consent/:candidate_id/revoke
Revoke candidate consent

**Request:** Empty body

**Response: 200 OK**
```json
{
  "candidate_id": "uuid",
  "revoked_at": "2025-01-15T10:00:00Z",
  "status": "revoked"
}
```

---

### GET /api/v1/consent/export/:candidate_id
Export candidate data (GDPR right to access)

**Response: 200 OK**
```json
{
  "export_id": "uuid",
  "candidate_id": "uuid",
  "status": "processing",
  "download_url": null,
  "estimated_completion": "2025-01-15T10:05:00Z",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Later GET /api/v1/consent/export/:export_id:**
```json
{
  "export_id": "uuid",
  "status": "completed",
  "download_url": "https://s3.../exports/uuid.zip",
  "expires_at": "2025-01-22T10:00:00Z",
  "completed_at": "2025-01-15T10:04:30Z"
}
```

---

### DELETE /api/v1/consent/delete/:candidate_id
Delete candidate data (GDPR right to be forgotten)

**Request:** Empty body

**Response: 202 Accepted**
```json
{
  "deletion_request_id": "uuid",
  "candidate_id": "uuid",
  "status": "pending",
  "estimated_completion": "2025-01-15T10:30:00Z",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

## Analytics APIs

### GET /api/v1/analytics/dashboard
Get dashboard metrics

**Query Parameters:**
- `from_date` (optional)
- `to_date` (optional)

**Response: 200 OK**
```json
{
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  },
  "overview": {
    "total_jobs": 12,
    "active_jobs": 5,
    "total_candidates": 342,
    "new_candidates_this_period": 87,
    "total_interviews": 45,
    "offers_made": 8,
    "hires": 3
  },
  "funnel": {
    "applied": 342,
    "screened": 87,
    "shortlisted": 45,
    "interviewed": 23,
    "offered": 8,
    "hired": 3
  },
  "conversion_rates": {
    "application_to_screen": 0.254,
    "screen_to_interview": 0.264,
    "interview_to_offer": 0.348,
    "offer_to_hire": 0.375
  },
  "avg_time_to_hire_days": 21,
  "top_sources": [
    {"source": "linkedin", "count": 145},
    {"source": "referral", "count": 89},
    {"source": "job_board", "count": 67}
  ]
}
```

---

### GET /api/v1/analytics/diversity
Get diversity metrics

**Response: 200 OK**
```json
{
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  },
  "candidate_pool": {
    "total": 342,
    "demographics": {
      "gender": {
        "male": 0.52,
        "female": 0.45,
        "other": 0.03
      },
      "ethnicity": {
        "asian": 0.35,
        "white": 0.40,
        "black": 0.15,
        "hispanic": 0.08,
        "other": 0.02
      }
    }
  },
  "hired": {
    "total": 3,
    "demographics": {
      "gender": {
        "male": 0.67,
        "female": 0.33
      }
    }
  },
  "adverse_impact_analysis": {
    "passed": true,
    "notes": "No significant adverse impact detected"
  }
}
```

---

### GET /api/v1/analytics/cost
Get cost analytics

**Query Parameters:**
- `from_date` (optional)
- `to_date` (optional)
- `service` (optional)

**Response: 200 OK**
```json
{
  "period": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  },
  "total_cost_usd": 1250.50,
  "breakdown": {
    "ai_matching": 450.25,
    "ai_screening": 320.75,
    "voice_interviews": 180.50,
    "ai_decisions": 125.00,
    "embeddings": 95.00,
    "other": 79.00
  },
  "per_candidate_cost": 3.65,
  "per_hire_cost": 416.83,
  "trend": {
    "previous_period_cost": 1100.00,
    "change_percent": 13.68,
    "direction": "increase"
  }
}
```

---

## Rate Limiting

All endpoints are rate limited per tenant:

| Endpoint Category | Limit |
|------------------|-------|
| Auth (login, register) | 10 req/min |
| Job Management | 100 req/min |
| Matching (scoring) | 50 req/min |
| Screening | 200 req/min |
| Analytics | 60 req/min |
| All Others | 100 req/min |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642342800
```

---

This completes the API specification for all 6 consolidated services with 60+ endpoints!
