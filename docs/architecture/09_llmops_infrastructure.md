# LLMOps & AI Infrastructure

## Model Selection Strategy

### Primary LLMs

| Use Case | Model | Rationale | Cost |
|----------|-------|-----------|------|
| Resume Parsing | GPT-4o-mini | Fast, accurate extraction | $0.15/1M tokens |
| JD Enrichment | GPT-4o | Better understanding of requirements | $2.50/1M tokens |
| Semantic Matching | GPT-4o | Complex reasoning needed | $2.50/1M tokens |
| Screening Agent | GPT-4o | Conversational quality critical | $2.50/1M tokens |
| Voice Interview | GPT-4o | Real-time, low latency | $2.50/1M tokens |
| Decision Making | Claude 3.5 Sonnet | Superior reasoning, safety | $3.00/1M tokens |
| Explainability | Claude 3.5 Sonnet | Clear, structured explanations | $3.00/1M tokens |

### Fallback Strategy
- Primary: OpenAI GPT-4o
- Secondary: Anthropic Claude 3.5
- Tertiary: Open-source (Llama 3, Mistral) on self-hosted

### Cost Optimization
- Use **GPT-4o-mini** for simple tasks (parsing, classification)
- Use **GPT-4o** only when reasoning depth required
- Cache frequently used prompts (OpenAI prompt caching)
- Batch requests where possible

---

## Embedding Strategy

### Vector Generation
- **Model:** OpenAI text-embedding-ada-002 (1536 dimensions)
- **Alternative:** Cohere embed-english-v3.0 (cheaper for scale)
- **Cost:** $0.10/1M tokens (OpenAI)

### When to Embed
- Every resume upon parsing
- Every job description upon enrichment
- Update embeddings on significant edits

### Caching Strategy
```python
# Cache embeddings in vector DB with metadata
{
  "id": "resume-{id}",
  "vector": [0.012, -0.034, ...],
  "metadata": {
    "entity_type": "resume",
    "entity_id": "uuid",
    "created_at": "timestamp",
    "version": "ada-002"
  }
}
```

---

## Prompt Engineering

### Prompt Templates

**Resume Parsing Prompt (v1.2):**
```python
RESUME_PARSE_PROMPT = """
Extract structured information from this resume.

Resume Text:
{resume_text}

Return JSON with these exact fields:
{{
  "personal": {{
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string"
  }},
  "experience": [
    {{
      "title": "string",
      "company": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or null",
      "current": boolean,
      "description": "string",
      "technologies": ["string"]
    }}
  ],
  "education": [...],
  "skills": {{
    "technical": ["string"],
    "soft": ["string"],
    "languages": ["string"]
  }}
}}

Only include fields with data. Be precise.
"""
```

**Matching Explanation Prompt (v2.1):**
```python
MATCH_EXPLANATION_PROMPT = """
Explain why this resume matches the job description.

Job Requirements:
{job_requirements}

Candidate Profile:
{candidate_profile}

Match Score: {score}/100

Provide a clear explanation:
1. One-sentence summary
2. Top 3 matching strengths
3. Key skill gaps
4. Recommendation (yes/no/maybe)

Be specific. Use numbers and examples.
"""
```

### Prompt Versioning
- Store in Git: `prompts/{agent_type}/{prompt_name}_v{version}.txt`
- Track in database: `prompt_versions` table
- A/B test new versions before full rollout
- Monitor quality metrics per version

### Prompt Optimization Process
1. **Baseline:** Create initial prompt, measure performance
2. **Iterate:** Test variations (few-shot examples, formatting, instructions)
3. **Evaluate:** Run against ground truth dataset (50+ examples)
4. **A/B Test:** Roll out to 10% traffic
5. **Analyze:** Compare metrics (accuracy, latency, cost)
6. **Deploy:** Full rollout if >5% improvement

---

## Model Evaluation

### Offline Evaluation

**Metrics:**
- **Accuracy:** % of correct extractions/decisions
- **Precision/Recall:** For classification tasks
- **F1 Score:** Harmonic mean of precision/recall
- **Latency:** P50, P95, P99 response times
- **Cost:** $ per 1K requests

**Ground Truth Dataset:**
- 100 resumes (manually labeled)
- 50 job descriptions (manually enriched)
- 20 screening conversations (human-scored)
- 30 hiring decisions (validated outcomes)

**Evaluation Frequency:**
- Weekly: Automated tests against ground truth
- Monthly: Manual review of sample outputs
- Quarterly: External audit of AI quality

### Online Evaluation

**A/B Testing:**
```python
# Route 10% of traffic to new model/prompt
if random.random() < 0.1:
    result = new_model.invoke(prompt)
    track_metric("new_model", result)
else:
    result = current_model.invoke(prompt)
    track_metric("current_model", result)
```

**Metrics Dashboard:**
- Success rate (% of non-error responses)
- User satisfaction (thumbs up/down on AI outputs)
- Downstream conversion (shortlist → interview rate)
- Human override rate (% of AI decisions changed by humans)

---

## Voice AI Infrastructure

### Speech-to-Text
- **Primary:** Deepgram Nova-2 (real-time, high accuracy)
- **Backup:** OpenAI Whisper (batch processing)
- **Cost:** $0.0043/min (Deepgram)

### Text-to-Speech
- **Primary:** ElevenLabs (natural, expressive)
- **Backup:** Google Cloud TTS (cost-effective)
- **Cost:** $0.33/1K characters (ElevenLabs)

### Voice Pipeline
```
Candidate Call → Twilio → Deepgram STT → LLM → ElevenLabs TTS → Twilio → Candidate
                                ↓
                           Real-time transcript
                                ↓
                          Emotion detection
```

### Emotion Detection
- Model: Hugging Face emotion classifier
- Input: Transcribed text + voice audio features
- Output: {confident, nervous, evasive, positive, negative}
- Use: Adjust agent tone, flag concerns

---

## LLM Gateway & Rate Limiting

### Centralized Gateway
```python
class LLMGateway:
    def __init__(self):
        self.providers = {
            "openai": OpenAIClient(),
            "anthropic": AnthropicClient(),
            "cohere": CohereClient()
        }
        self.rate_limiter = RateLimiter()
        self.cache = RedisCache()
    
    def invoke(self, provider, model, prompt, cache_key=None):
        # Check cache
        if cache_key and (cached := self.cache.get(cache_key)):
            return cached
        
        # Rate limit
        self.rate_limiter.check(provider)
        
        # Call LLM
        result = self.providers[provider].complete(model, prompt)
        
        # Cache result
        if cache_key:
            self.cache.set(cache_key, result, ttl=3600)
        
        # Log lineage
        self.log_lineage(provider, model, prompt, result)
        
        return result
```

### Rate Limits
| Provider | Tier | Limit |
|----------|------|-------|
| OpenAI | Tier 3 | 10K RPM, 2M TPM |
| Anthropic | Commercial | 5K RPM, 400K TPM |
| Deepgram | Pay-as-you-go | Unlimited |

### Circuit Breaker
```python
# If 3 consecutive failures, switch to backup provider
if failure_count >= 3:
    provider = "anthropic"  # fallback
    log_alert("OpenAI circuit breaker opened")
```

---

## Monitoring & Observability

### AI-Specific Metrics

**Per Agent:**
- Invocation count
- Success rate
- Average latency (P50, P95, P99)
- Cost per invocation
- Token usage (input/output)
- Error rate by type

**Per Model:**
- Total requests
- Total cost
- Average quality score (human feedback)
- Drift detected (yes/no)

**Dashboards:**
1. **LLM Overview:** Costs, usage, errors across all models
2. **Agent Performance:** Per-agent success rates, latency
3. **Quality Metrics:** User satisfaction, human override rates
4. **Cost Analysis:** Daily spend by model, cost per hire

### Alerting Rules
```yaml
alerts:
  - name: High LLM Error Rate
    condition: error_rate > 5%
    severity: critical
    notify: on-call-engineer
  
  - name: LLM Cost Spike
    condition: daily_cost > $500 AND increase > 50%
    severity: high
    notify: platform-team
  
  - name: Model Latency Degradation
    condition: p95_latency > 3s
    severity: medium
    notify: ai-team
```

---

## Safety & Content Moderation

### Input Validation
- Max prompt length: 10K tokens
- Reject prompts with PII injection attempts
- SQL injection detection in user inputs
- Profanity filter for candidate responses

### Output Validation
- Check for hallucinations (verify against source documents)
- Detect toxic/biased language in AI responses
- Soft-reject outputs with confidence <0.7
- Human review queue for flagged outputs

### Content Moderation
```python
# OpenAI Moderation API
moderation_result = openai.Moderation.create(input=text)

if moderation_result.flagged:
    # Log incident
    # Block content
    # Escalate to human reviewer
```

---

## Cost Management

### Budget Allocation (Monthly)
- Matching: $300 (60% of AI budget)
- Screening: $150 (30%)
- Voice: $50 (10%)
- **Total:** $500/month initially

### Cost Tracking
```python
# Log every LLM call with cost
track_cost(
    tenant_id=tenant_id,
    agent_type="matching",
    model="gpt-4o",
    input_tokens=250,
    output_tokens=150,
    cost_usd=0.00125
)

# Alert if tenant exceeds quota
if get_monthly_cost(tenant_id) > quota:
    send_alert("Tenant {tenant_id} exceeded AI quota")
```

### Optimization Strategies
1. **Caching:** 40% cache hit rate = 40% cost savings
2. **Prompt compression:** Reduce input tokens by 20%
3. **Model selection:** Use mini models where possible
4. **Batching:** Combine multiple requests
5. **Lazy loading:** Only call LLMs when necessary

---

## Continuous Improvement

### Feedback Loop
1. User provides thumbs up/down on AI outputs
2. Store in `ai_feedback` table
3. Weekly analysis: What's working, what's not?
4. Monthly: Retrain prompts on negative feedback samples

### Model Fine-Tuning (Future)
- Collect 1000+ examples per use case
- Fine-tune GPT-4o-mini on domain-specific data
- Reduce costs by 3-5x with comparable quality
- Timeline: 6-12 months post-launch

---

This LLMOps infrastructure ensures reliable, cost-effective, and continuously improving AI capabilities.
