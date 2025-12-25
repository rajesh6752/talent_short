# Complete Data Architecture

## Database Strategy

| Database | Purpose | Cost/Month |
|----------|---------|------------|
| **PostgreSQL 15+** | All structured + semi-structured data (JSONB) | $250 |
| **pgvector / Pinecone** | Vector embeddings for semantic search | $0 / $70 |
| **Redis 7+** | Cache, sessions, queues, pub/sub | $30 |
| **S3 / GCS** | File storage (resumes, recordings) | $25 |
| **Total** | | **$305/month** |

---

## 1. PostgreSQL - Complete Production Schema

### Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- Encryption functions
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector for embeddings
```

### Database Overview

**35+ Tables across 9 domains:**
1. Core Platform (7 tables) - Tenants, users, auth
2. Jobs (4 tables) - Job postings, skills, requirements
3. Candidates (2 tables) - Profiles and resumes
4. Matching (2 tables) - Scores and explanations
5. Screening (1 table) - AI chat sessions
6. Interviews (4 tables) - Scheduling, feedback
7. Voice (1 table) - Voice AI sessions
8. Decisions (4 tables) - Hiring decisions, offers
9. Compliance (6 tables) - Audit logs, GDPR
10. Notifications (2 tables) - Templates, sent logs
11. Analytics (3 tables) - Metrics, funnels, costs

---

### Core Platform Tables

#### Tenants
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'free' 
        CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    status VARCHAR(30) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'suspended', 'cancelled')),
    settings JSONB DEFAULT '{}'::jsonb,
    onboarded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;
```

#### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    status VARCHAR(30) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'locked')),
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

#### Tenant-User Relationships (RBAC)
```sql
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL 
        CHECK (role IN ('admin', 'recruiter', 'interviewer', 'viewer')),
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'active',
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
```

#### LLM Provider Configurations (BYOK - Bring Your Own Key)
```sql
CREATE TABLE llm_provider_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Provider details
    provider VARCHAR(50) NOT NULL 
        CHECK (provider IN ('openai', 'anthropic', 'google', 'gemini', 'custom')),
    provider_name VARCHAR(100),  -- Display name, e.g., "Production OpenAI"
    
    -- API configuration (encrypted)
    api_key_encrypted TEXT NOT NULL,  -- Encrypted with pgcrypto
    api_endpoint TEXT,  -- Custom endpoint if applicable
    organization_id VARCHAR(255),  -- For OpenAI org ID
    
    -- Model preferences
    default_model VARCHAR(100),  -- e.g., 'gpt-4o', 'claude-3.5-sonnet'
    enabled_models TEXT[],  -- Array of enabled models
    
    -- Usage limits (optional)
    monthly_budget_usd DECIMAL(10,2),
    monthly_spend_usd DECIMAL(10,2) DEFAULT 0,
    rate_limit_rpm INTEGER,  -- Requests per minute
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,  -- Default provider for this tenant
    last_used_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, provider, provider_name)
);

CREATE INDEX idx_llm_configs_tenant ON llm_provider_configs(tenant_id);
CREATE INDEX idx_llm_configs_active ON llm_provider_configs(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_llm_configs_default ON llm_provider_configs(tenant_id, is_default) WHERE is_default = true;

-- Function to encrypt/decrypt API keys
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(pgp_sym_encrypt(api_key, encryption_key), 'base64');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_key, 'base64'), encryption_key);
END;
$$ LANGUAGE plpgsql;
```

**Usage Example:**
```sql
-- Insert encrypted API key
INSERT INTO llm_provider_configs (
    tenant_id, provider, provider_name, api_key_encrypted, 
    default_model, is_default
) VALUES (
    'tenant-uuid',
    'openai',
    'Production OpenAI',
    encrypt_api_key('sk-proj-...', 'encryption-secret'),
    'gpt-4o',
    true
);

-- Retrieve and decrypt
SELECT 
    id, provider, provider_name, default_model,
    decrypt_api_key(api_key_encrypted, 'encryption-secret') as api_key
FROM llm_provider_configs
WHERE tenant_id = 'tenant-uuid' AND is_active = true;
```

---

### Jobs Tables

#### Jobs
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(100),
    location VARCHAR(255),
    employment_type VARCHAR(50) 
        CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
    experience_min INTEGER CHECK (experience_min >= 0),
    experience_max INTEGER CHECK (experience_max >= 0),
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'active', 'closed', 'cancelled')),
    
    -- AI enrichment stored as JSONB
    enriched_jd JSONB,
    
    -- Vector embedding for semantic search
    embedding vector(1536),  -- OpenAI ada-002 dimensions
    
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CHECK (experience_max >= experience_min),
    CHECK (salary_max >= salary_min OR (salary_max IS NULL AND salary_min IS NULL))
);

CREATE INDEX idx_jobs_tenant ON jobs(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_status ON jobs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_enriched ON jobs USING GIN (enriched_jd);
CREATE INDEX idx_jobs_embedding ON jobs USING hnsw (embedding vector_cosine_ops);
```

#### Job Skills (Extracted from JD)
```sql
CREATE TABLE job_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill VARCHAR(100) NOT NULL,
    category VARCHAR(50),  -- 'technical', 'soft', 'language'
    required BOOLEAN DEFAULT false,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, skill)
);

CREATE INDEX idx_job_skills_job ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill ON job_skills(skill);
```

---

### Candidates & Resumes Tables

#### Candidates
```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    location VARCHAR(255),
    source VARCHAR(50),  -- 'job_board', 'referral', 'linkedin', 'direct'
    
    -- GDPR consent
    consent_version VARCHAR(20),
    consent_given_at TIMESTAMPTZ,
    consent_ip INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_candidates_tenant ON candidates(tenant_id);
CREATE INDEX idx_candidates_email ON candidates(email);
```

#### Resumes (JSONB storage)
```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    
    -- File metadata
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,  -- S3 URL
    file_size INTEGER,
    file_type VARCHAR(50),   -- 'pdf', 'docx', 'txt'
    
    -- Parsed data as JSONB (replaces MongoDB)
    parsed_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Vector embedding
    embedding vector(1536),
    
    -- Full-text search
    search_vector tsvector,
    
    -- Metadata
    parsed BOOLEAN DEFAULT false,
    parsed_at TIMESTAMPTZ,
    parser_version VARCHAR(20),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, candidate_id)
);

CREATE INDEX idx_resumes_tenant ON resumes(tenant_id);
CREATE INDEX idx_resumes_parsed_data ON resumes USING GIN (parsed_data);
CREATE INDEX idx_resumes_search ON resumes USING GIN (search_vector);
CREATE INDEX idx_resumes_embedding ON resumes USING hnsw (embedding vector_cosine_ops);
```

**Example JSONB structure for `parsed_data`:**
```json
{
  "personal": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe"
  },
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "start_date": "2020-01",
      "end_date": null,
      "current": true,
      "description": "Led team of 5 engineers...",
      "technologies": ["Python", "AWS", "Kubernetes"]
    }
  ],
  "education": [
    {
      "degree": "BS Computer Science",
      "institution": "Stanford University",
      "graduation_year": 2015,
      "gpa": 3.8
    }
  ],
  "skills": {
    "technical": ["Python", "JavaScript", "AWS", "Docker", "PostgreSQL"],
    "soft": ["Leadership", "Communication"],
    "languages": ["English", "Spanish"]
  },
  "summary": "Experienced software engineer with 8+ years..."
}
```

---

### Matching Tables

#### Candidate-Job Matches
```sql
CREATE TABLE candidate_job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    
    -- Match score (0-100)
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    
    -- Match details as JSONB
    match_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Bias detection flags
    bias_flags JSONB DEFAULT '[]'::jsonb,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'scored' 
        CHECK (status IN ('scored', 'shortlisted', 'screening', 'interviewing', 
                         'rejected', 'offered', 'hired')),
    stage VARCHAR(50) DEFAULT 'matching',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_matches_job ON candidate_job_matches(job_id);
CREATE INDEX idx_matches_score ON candidate_job_matches(score DESC);
CREATE INDEX idx_matches_status ON candidate_job_matches(status);
CREATE INDEX idx_matches_job_status ON candidate_job_matches(job_id, status);
```

#### Match Explanations (AI Explainability)
```sql
CREATE TABLE match_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES candidate_job_matches(id) ON DELETE CASCADE,
    explanation_text TEXT NOT NULL,
    factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_version VARCHAR(50),
    prompt_version VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_explanations_match ON match_explanations(match_id);
```

---

###Screening Tables

#### Screening Sessions
```sql
CREATE TABLE screening_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES candidate_job_matches(id) ON DELETE CASCADE,
    
    -- Session metadata
    session_type VARCHAR(30) DEFAULT 'text_chat' 
        CHECK (session_type IN ('text_chat', 'voice_call')),
    status VARCHAR(30) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'abandoned', 'cancelled')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Conversation messages as JSONB array (replaces MongoDB)
    messages JSONB DEFAULT '[]'::jsonb,
    
    -- AI analysis as JSONB
    analysis JSONB,
    
    -- Access control for candidate
    access_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_screening_tenant ON screening_sessions(tenant_id);
CREATE INDEX idx_screening_job ON screening_sessions(job_id);
CREATE INDEX idx_screening_messages ON screening_sessions USING GIN (messages);
```

**Example messages JSONB:**
```json
[
  {
    "message_id": "uuid",
    "timestamp": "2025-01-15T10:30:00Z",
    "role": "agent",
    "content": "Hello! Thanks for applying. Let's discuss your Python experience.",
    "metadata": {"sentiment": "neutral"}
  },
  {
    "message_id": "uuid",
    "timestamp": "2025-01-15T10:30:45Z",
    "role": "candidate",
    "content": "I have 8 years of Python experience...",
    "metadata": {"confidence": 0.85}
  }
]
```

---

### Interviews Tables

#### Interviews
```sql
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES candidate_job_matches(id) ON DELETE CASCADE,
    
    interview_type VARCHAR(50) NOT NULL 
        CHECK (interview_type IN ('screening', 'technical', 'behavioral', 'voice', 'final', 'hr')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Meeting details
    meeting_url TEXT,
    meeting_password VARCHAR(50),
    meeting_provider VARCHAR(30) 
        CHECK (meeting_provider IN ('zoom', 'google_meet', 'teams', 'phone', 'in_person')),
    
    status VARCHAR(30) DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_tenant ON interviews(tenant_id);
CREATE INDEX idx_interviews_scheduled ON interviews(scheduled_at);
CREATE INDEX idx_interviews_status ON interviews(status);
```

#### Interview Feedback
```sql
CREATE TABLE interview_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    panel_member_id UUID NOT NULL REFERENCES interview_panel(id) ON DELETE CASCADE,
    
    -- Ratings (1-5 scale)
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    technical_rating INTEGER CHECK (technical_rating BETWEEN 1 AND 5),
    cultural_fit_rating INTEGER CHECK (cultural_fit_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    
    recommendation VARCHAR(30) NOT NULL 
        CHECK (recommendation IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
    
    notes TEXT,
    red_flags JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(interview_id, panel_member_id)
);
```

---

### Voice Interview Tables

```sql
CREATE TABLE voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    
    -- Twilio call metadata
    call_sid VARCHAR(100) UNIQUE,
    candidate_phone VARCHAR(20),
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(30) DEFAULT 'scheduled',
    
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Recording (stored in S3)
    recording_url TEXT,
    
    -- Transcript as JSONB (replaces MongoDB)
    transcript JSONB DEFAULT '{"segments": []}'::jsonb,
    
    -- AI analysis
    analysis JSONB,
    
    -- Model metadata
    agent_model VARCHAR(50),  -- 'gpt-4o'
    stt_provider VARCHAR(50),  -- 'deepgram'
    tts_provider VARCHAR(50),  -- 'elevenlabs'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_interview ON voice_sessions(interview_id);
```

---

### Compliance & Audit Tables

#### Audit Logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL,  -- 'candidate.created', 'job.published'
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    ip_address INET,
    user_agent TEXT,
    request_id UUID
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

#### Model Lineage (AI Governance)
```sql
CREATE TABLE model_lineage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    
    agent_type VARCHAR(50) NOT NULL,  -- 'matching', 'screening'
    model_name VARCHAR(100) NOT NULL,  -- 'gpt-4o'
    model_version VARCHAR(50),
    prompt_template_id VARCHAR(100),
    prompt_hash VARCHAR(64),
    
    input_hash VARCHAR(64),
    output_hash VARCHAR(64),
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    latency_ms INTEGER,
    
    entity_id UUID,  -- match_id, session_id, etc.
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_lineage_agent ON model_lineage(agent_type);
CREATE INDEX idx_lineage_timestamp ON model_lineage(timestamp DESC);
```

#### Consent Records (GDPR)
```sql
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    consent_version VARCHAR(20) NOT NULL,
    consent_text TEXT NOT NULL,
    collected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_consent_candidate ON consent_records(candidate_id);
```

#### Notification Templates (Email/SMS Templates)
```sql
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL 
        CHECK (template_type IN ('offer', 'rejection', 'interview_invite', 
                                 'screening_invite', 'reminder', 'custom')),
    
    -- Template content
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    
    -- Available variables
    variables JSONB DEFAULT '[]'::jsonb,  -- ['{{candidate_name}}', '{{job_title}}']
    
    -- Supported channels
    channels TEXT[] DEFAULT ARRAY['email'],  -- ['email', 'sms']
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_notification_templates_tenant ON notification_templates(tenant_id);
CREATE INDEX idx_notification_templates_type ON notification_templates(template_type);
```

#### Webhooks (External Integrations)
```sql
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    url TEXT NOT NULL,
    name VARCHAR(255),
    description TEXT,
    
    -- Events to subscribe to
    events TEXT[] NOT NULL,  -- ['candidate.created', 'job.published', 'interview.scheduled']
    
    -- Security
    secret_key VARCHAR(255) NOT NULL,  -- For HMAC signature
    
    -- Headers to include
    custom_headers JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_active ON webhooks(tenant_id, is_active) WHERE is_active = true;
```

#### Webhook Delivery Logs
```sql
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery attempt
    status VARCHAR(30) NOT NULL 
        CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
    http_status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) 
    WHERE status = 'retrying';
```

#### Resume Parser Configurations
```sql
CREATE TABLE resume_parser_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Parser provider
    provider VARCHAR(50) NOT NULL 
        CHECK (provider IN ('textkernel', 'sovren', 'affinda', 'llm_custom')),
    provider_name VARCHAR(100),
    
    -- API configuration (encrypted)
    api_key_encrypted TEXT NOT NULL,
    api_endpoint TEXT,
    account_id VARCHAR(255),
    
    -- Parser settings
    language VARCHAR(10) DEFAULT 'en',
    output_format VARCHAR(20) DEFAULT 'json',
    
    -- Usage tracking
    total_parses INTEGER DEFAULT 0,
    successful_parses INTEGER DEFAULT 0,
    failed_parses INTEGER DEFAULT 0,
    avg_parse_time_ms INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, provider, provider_name)
);

CREATE INDEX idx_resume_parser_tenant ON resume_parser_configs(tenant_id);
CREATE INDEX idx_resume_parser_active ON resume_parser_configs(tenant_id, is_active) 
    WHERE is_active = true;
```

#### Saved Searches (User Filters)
```sql
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    search_type VARCHAR(50) NOT NULL 
        CHECK (search_type IN ('candidates', 'jobs', 'interviews', 'decisions')),
    
    -- Saved filter criteria
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_by VARCHAR(100),
    sort_order VARCHAR(10),
    
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, search_type, name)
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_type ON saved_searches(search_type);
```

#### Referrals (Employee Referral Program)
```sql
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Referral details
    referral_source VARCHAR(100),  -- 'internal_portal', 'email_link', 'direct'
    referral_code VARCHAR(50) UNIQUE,
    notes TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'applied', 'interviewing', 'hired', 'rejected')),
    
    -- Reward management
    reward_amount DECIMAL(10,2),
    reward_currency VARCHAR(3) DEFAULT 'USD',
    reward_status VARCHAR(30) DEFAULT 'pending' 
        CHECK (reward_status IN ('pending', 'approved', 'paid', 'denied')),
    reward_paid_at TIMESTAMPTZ,
    
    hired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_tenant ON referrals(tenant_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_candidate ON referrals(candidate_id);
CREATE INDEX idx_referrals_status ON referrals(status);
```

---

### Helper Functions & Triggers

#### Auto-update `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at 
    BEFORE UPDATE ON candidates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to all tables with updated_at column)
```

#### Auto-generate Full-Text Search Vector
```sql
CREATE OR REPLACE FUNCTION update_resume_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.parsed_data->>'summary', '') || ' ' ||
        COALESCE(NEW.parsed_data->'personal'->>'full_name', '') || ' ' ||
        COALESCE(jsonb_array_to_text(NEW.parsed_data->'skills'->'technical'), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resumes_search
    BEFORE INSERT OR UPDATE OF parsed_data ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_resume_search_vector();
```

---

### Row-Level Security (Multi-Tenancy)

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their tenant's data
CREATE POLICY tenant_isolation_jobs ON jobs
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_candidates ON candidates
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Set tenant context in application
-- SET app.current_tenant = 'tenant-uuid';
```

---

## 2. Vector Database Schema

### Option A: pgvector (PostgreSQL Extension) - RECOMMENDED

**Pros:** No additional cost, integrated with PostgreSQL  
**Cons:** Slower than specialized vector DBs at massive scale

Already included in jobs and resumes tables:
```sql
-- Add vector column
ALTER TABLE resumes ADD COLUMN embedding vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX ON resumes USING hnsw (embedding vector_cosine_ops);

-- Query: Find similar resumes
SELECT id, 1 - (embedding <=> :job_embedding) as similarity
FROM resumes
WHERE tenant_id = :tenant_id
ORDER BY embedding <=> :job_embedding
LIMIT 50;
```

---

### Option B: Pinecone (Managed Vector DB)

**Pros:** Optimized for vectors, very fast  
**Cons:** $70/month minimum

**Index Configuration:**
```python
import pinecone

pinecone.init(api_key="your-api-key", environment="us-west4-gcp")

# Create index
pinecone.create_index(
    name="hiring-platform-prod",
    dimension=1536,  # OpenAI ada-002
    metric="cosine",
    pod_type="p1.x1",  # Starter pod
    metadata_config={
        "indexed": ["tenant_id", "entity_type", "job_id"]
    }
)
```

**Record Structure:**
```python
{
    "id": "resume-{uuid}",
    "values": [0.012, -0.034, ...],  # 1536-dim vector
    "metadata": {
        "tenant_id": "uuid",
        "entity_type": "resume",
        "entity_id": "uuid",
        "candidate_id": "uuid",
        "created_at": "2025-01-15T10:00:00Z",
        "parser_version": "1.0"
    }
}
```

**Query:**
```python
index = pinecone.Index("hiring-platform-prod")

results = index.query(
    vector=job_embedding,
    filter={"tenant_id": tenant_id, "entity_type": "resume"},
    top_k=50,
    include_metadata=True
)
```

---

### Option C: Weaviate (Self-Hosted/Cloud)

**Pros:** Open-source, feature-rich, hybrid search  
**Cons:** Operational overhead if self-hosted

**Schema Definition:**
```python
import weaviate

client = weaviate.Client("http://localhost:8080")

client.schema.create_class({
    "class": "Resume",
    "vectorizer": "none",  # We provide our own vectors
    "properties": [
        {"name": "tenant_id", "dataType": ["string"]},
        {"name": "candidate_id", "dataType": ["string"]},
        {"name": "resume_id", "dataType": ["string"]},
        {"name": "created_at", "dataType": ["date"]},
        {"name": "parsed_data", "dataType": ["text"]}
    ]
})
```

**Insert:**
```python
client.data_object.create(
    class_name="Resume",
    data_object={
        "tenant_id": str(tenant_id),
        "candidate_id": str(candidate_id),
        "resume_id": str(resume_id),
        "created_at": "2025-01-15T10:00:00Z",
        "parsed_data": json.dumps(parsed_data)
    },
    vector=embedding_vector
)
```

**Query:**
```python
result = (
    client.query
    .get("Resume", ["candidate_id", "resume_id"])
    .with_near_vector({"vector": job_embedding})
    .with_where({
        "path": ["tenant_id"],
        "operator": "Equal",
        "valueString": str(tenant_id)
    })
    .with_limit(50)
    .do()
)
```

---

## 3. Redis Data Structures

### Cache Structures
```python
# Match scores (TTL: 1 hour)
redis.setex(
    f"match:{match_id}:score",
    3600,
    json.dumps({"score": 87.5, "explanation": "..."})
)

# Tenant quotas (TTL: 5 minutes)
redis.setex(f"quota:{tenant_id}:resumes", 300, str(usage_count))

# Job embeddings (TTL: 24 hours)
redis.setex(f"embedding:job:{job_id}", 86400, pickle.dumps(embedding))
```

### Session Storage
```python
# User sessions
redis.setex(
    f"session:{token_hash}",
    86400,  # 24 hours
    json.dumps({"user_id": "uuid", "tenant_id": "uuid"})
)
```

### Rate Limiting
```python
# Rate limit per tenant per endpoint
key = f"ratelimit:{tenant_id}:{endpoint}:{minute}"
count = redis.incr(key)
redis.expire(key, 60)

if count > limit:
    raise RateLimitExceeded()
```

### Queues (Background Jobs)
```python
# Add job to queue
redis.lpush("queue:resume_parse", json.dumps({
    "resume_id": "uuid",
    "priority": "normal",
    "created_at": datetime.utcnow().isoformat()
}))

# Worker consumes
job = redis.brpop("queue:resume_parse", timeout=5)
```

### Pub/Sub (Event Streaming)
```python
# Publish event
redis.publish("events:jobs", json.dumps({
    "type": "job.published",
    "data": {"job_id": "uuid", "tenant_id": "uuid"}
}))

# Subscribe
pubsub = redis.pubsub()
pubsub.subscribe("events:jobs", "events:candidates")
for message in pubsub.listen():
    handle_event(message)
```

---

## 4. S3 Bucket Organization

```
s3://hiring-platform-prod/
│
├── resumes/
│   └── {tenant_id}/
│       └── {candidate_id}/
│           └── {resume_id}.pdf
│
├── recordings/
│   └── {tenant_id}/
│       └── {session_id}/
│           ├── call.mp3
│           └── transcript.json
│
├── exports/
│   └── {tenant_id}/
│       └── gdpr-export-{candidate_id}-{timestamp}.zip
│
└── avatars/
    └── {user_id}.jpg
```

**Security:**
- Server-side encryption (AES-256)
- All buckets private
- Signed URLs with 1-hour expiration
- Versioning enabled

**Lifecycle Policies:**
```json
{
  "Rules": [
    {
      "Id": "DeleteOldExports",
      "Status": "Enabled",
      "Prefix": "exports/",
      "Expiration": {"Days": 7}
    },
    {
      "Id": "ArchiveOldRecordings",
      "Status": "Enabled",
      "Prefix": "recordings/",
      "Transitions": [{
        "Days": 90,
        "StorageClass": "GLACIER"
      }]
    }
  ]
}
```

---

## Backup & Disaster Recovery

### PostgreSQL
- **Continuous WAL archiving** to S3
- **Daily snapshots** (retained for 30 days)
- **Point-in-time recovery** (PITR) enabled
- **Cross-region replication** for DR
- **RTO:** 15 minutes
- **RPO:** 5 minutes

### Redis
- **AOF persistence** enabled
- **Daily RDB snapshots**
- **Multi-AZ cluster** for HA

### S3
- **Versioning** enabled
- **Cross-region replication**
- **Glacier archival** after 90 days

---

## Migration Guide

### From MongoDB/Kafka to PostgreSQL
```python
# Migrate resumes from MongoDB
for resume in mongodb.resumes.find():
    postgres.execute("""
        INSERT INTO resumes (
            id, tenant_id, candidate_id,
            file_name, file_url, parsed_data,
            uploaded_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        resume["_id"],
        resume["tenant_id"],
        resume["candidate_id"],
        resume["file_name"],
        resume["file_url"],
        Json(resume["parsed_data"]),
        resume["uploaded_at"]
    ))
```

---

This complete data architecture provides production-ready schemas for all 4 databases with clear migration paths and scaling strategies!
