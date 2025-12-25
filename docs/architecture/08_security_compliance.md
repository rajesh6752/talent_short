# Security & Compliance Framework

## Security Architecture

### Authentication & Authorization
- **OAuth2/OIDC** for authentication
- **JWT tokens** (15min access, 7-day refresh)
- **RBAC** with roles: admin, recruiter, interviewer, viewer
- **SSO** support (Google, Microsoft, Okta)
- **MFA** optional per tenant

### Network Security
```
Internet → WAF → ALB → API Gateway → Services
         ↓
    Rate Limiting
    DDoS Protection
    IP Whitelisting
```

### Data Protection
- **Encryption at Rest:** AES-256 (all databases, S3)
- **Encryption in Transit:** TLS 1.3 (all inter-service)
- **PII Masking:** Automatic in logs
- **Secrets Management:** HashiCorp Vault / AWS Secrets Manager
- **Key Rotation:** 90-day automatic rotation

### API Security
- Rate limiting: 1000 req/hour/tenant
- Request signing for webhooks
- Input validation & sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention (content security policy)
- CSRF tokens for state-changing operations

---

## GDPR Compliance

### Data Subject Rights

**Right to Access**
- API: `GET /api/v1/consent/export/:candidate_id`
- Returns all data in machine-readable format (JSON)
- Includes: resume, screening transcripts, interview feedback, decisions

**Right to Deletion**
- API: `DELETE /api/v1/consent/delete/:candidate_id`
- Cascade deletes across all services:
  - PostgreSQL: candidates table (cascade to matches, interviews, decisions)
  - MongoDB: resumes, screening sessions, voice sessions
  - S3: resume files, voice recordings
  - Vector DB: embeddings
- Retention: 30 days in quarantine, then permanent deletion
- Audit log: "GDPR deletion completed" with proof

**Right to Explanation**
- Every AI decision includes human-readable explanation
- Stored in `match_explanations`, `decision_factors` tables
- Available via API: `GET /api/v1/matching/:id/explain`

**Consent Management**
- Explicit consent collected before resume processing
- Version tracking for consent text changes
- Consent records include: IP address, timestamp, version
- Revocation: `POST /api/v1/consent/:candidate_id/revoke`

### Data Minimization
- Only collect necessary PII
- Automatic anonymization after 2 years (optional)
- No tracking cookies without consent

### Data Retention Policies
| Data Type | Active Period | Archive Period | Deletion |
|-----------|--------------|----------------|----------|
| Resumes | 2 years | 3-5 years (encrypted) | After GDPR request |
| Audit Logs | 2 years | 7 years (compliance) | After 10 years |
| Personal Data | Until revoked | - | Immediate on request |
| Analytics (aggregated) | Forever | - | Never (anonymized) |

---

## EEOC Compliance

### Fair Hiring Practices
- **Bias Detection:** AI scans every match/decision for bias indicators
- **Blind Screening:** Optional mode to hide protected characteristics
- **Adverse Impact Analysis:** Monitor selection rates by demographic
- **Structured Interviews:** Consistent questions per role

### Protected Characteristics
System NEVER uses for decision-making:
- Race, color, ethnicity
- Gender, gender identity
- Age
- Religion
- Disability status
- National origin
- Genetic information

### Diversity Metrics
- Tracked separately from hiring decisions
- Voluntary self-identification
- Aggregated reporting only
- API: `GET /api/v1/analytics/diversity`

### Record Keeping
- All hiring decisions logged for 2 years minimum
- Interview notes retained
- Rejection reasons documented
- Available for EEOC audit

---

## SOC2 Compliance

### Security Controls

**Access Control (CC6.1)**
- MFA for privileged accounts
- Principle of least privilege
- Regular access reviews (quarterly)
- Automatic deprovisioning on termination

**Change Management (CC8.1)**
- All changes via pull requests
- Code review required (2 approvers)
- Automated testing before deployment
- Rollback procedures documented

**Monitoring (CC7.2)**
- Real-time security alerts
- Anomaly detection (failed logins, unusual data access)
- 24/7 monitoring via Datadog
- Incident response plan (<1hr detection, <4hr containment)

**Data Classification**
- **Critical:** PII, credentials, encryption keys
- **Confidential:** Interview feedback, hiring decisions
- **Internal:** Job postings, candidate counts
- **Public:** Marketing content

### Audit Logging
All actions logged with:
- User ID, IP address, timestamp
- Action type (create, read, update, delete, export)
- Resource type and ID
- Success/failure status
- Change details (before/after for updates)

**Retention:** 7 years (immutable storage)

### Backup & Recovery
- **RPO:** 5 minutes (PostgreSQL continuous WAL archiving)
- **RTO:** 15 minutes (automated failover)
- **Testing:** Monthly DR drills
- **Geographic redundancy:** Multi-region backups

---

## AI Governance

### Model Lineage Tracking
Every AI operation logged:
```sql
model_lineage (
  timestamp, agent_type, model_name, model_version,
  prompt_template_id, prompt_hash,
  input_hash, output_hash,
  tokens_used, cost_usd, latency_ms
)
```

### Prompt Versioning
- All prompts stored in version control
- Semantic versioning (v1.0, v1.1, v2.0)
- A/B testing for prompt improvements
- Rollback capability

### Bias Audits
- **Frequency:** Weekly automated, quarterly manual review
- **Metrics:** Demographic parity, equal opportunity
- **Thresholds:** >5% disparity triggers human review
- **Remediation:** Prompt adjustments, model retraining

### Human Oversight
- **High-stakes decisions:** Human approval required (confidence <85%)
- **Bias flags:** Automatic escalation to human reviewer
- **Red flags:** Immediate human intervention
- **Override capability:** Humans can override any AI decision

### Explainability Standards
Every AI decision includes:
1. One-sentence summary
2. Top 3 contributing factors with weights
3. Confidence score (0-1)
4. Model version used
5. Timestamp

---

## Incident Response Plan

### Security Incident Workflow
1. **Detection** (<1 hour): Automated alerts + manual reporting
2. **Containment** (<4 hours): Isolate affected systems
3. **Investigation** (<24 hours): Root cause analysis
4. **Remediation** (<72 hours): Fix + patch deployment
5. **Communication** (<4 hours for data breach): Notify affected users
6. **Post-Mortem** (<1 week): Document lessons learned

### Data Breach Notification
- **GDPR:** 72 hours to supervisory authority
- **Users:** "Without undue delay" via email
- **Includes:** What happened, data affected, remediation steps

### Incident Severity Levels
- **Critical:** Data breach, system-wide outage, security vulnerability
- **High:** Service degradation, partial outage, failed access controls
- **Medium:** Performance issues, minor bugs
- **Low:** Cosmetic issues, feature requests

---

## Vulnerability Management

### Security Scanning
- **SAST:** SonarQube on every commit
- **DAST:** Weekly scans on staging
- **Dependency scanning:** Snyk/Dependabot daily
- **Container scanning:** Trivy on image builds
- **Penetration testing:** Quarterly by external firm

### Patching Policy
- **Critical vulnerabilities:** Patch within 24 hours
- **High vulnerabilities:** Patch within 7 days
- **Medium/Low:** Patch within 30 days
- **Zero-day:** Emergency patch process (<4 hours)

---

## Compliance Certifications Roadmap

**Phase 1 (Launch):**
- ✅ GDPR compliant
- ✅ EEOC best practices
- ✅ Basic security controls

**Phase 2 (6 months):**
- ⏳ SOC2 Type I certification
- ⏳ ISO 27001 準備開始

**Phase 3 (12 months):**
- ⏳ SOC2 Type II certification
- ⏳ HIPAA readiness (for healthcare clients)

**Phase 4 (18 months):**
- ⏳ ISO 27001 certification
- ⏳ FedRAMP readiness (for government clients)

---

This security and compliance framework ensures the platform meets enterprise standards from day one while providing a clear path to additional certifications.
