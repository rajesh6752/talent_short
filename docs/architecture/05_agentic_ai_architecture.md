# Agentic AI Architecture - LangGraph Implementation

## 1. Agent Overview

| Agent | Responsibility | Primary LLM | Tools | Memory Type |
|-------|---------------|-------------|-------|-------------|
| Matching Agent | JD-Resume semantic matching | GPT-4o | VectorSearch, SkillExtractor | Short-term |
| Screening Agent | Text-based candidate screening | GPT-4o | QuestionGenerator, SentimentAnalyzer | Conversation |
| Voice Agent | AI-led voice interviews | GPT-4o | STT, TTS, EmotionDetector | Conversation |
| Decision Agent | Hiring recommendations | Claude 3.5 Sonnet | FeedbackAggregator, BiasChecker | Long-term |
| JD Enrichment Agent | Job description enhancement | GPT-4o | SkillExtractor, RequirementNormalizer | None |
| Explainability Agent | Generate AI decision explanations | Claude 3.5 | ExplanationFormatter, FactorRanker | Short-term |
| Bias Detection Agent | Identify hiring bias | Specialized model | BiasDetector, FairnessChecker | None |

---

## 2. LangGraph Workflows

### 2.1 Resume Matching Workflow

**Graph Structure:**
```mermaid
graph TD
    START[Resume Uploaded] --> PARSE[Parse Agent]
    PARSE --> EXTRACT[Extract Skills & Experience]
    EXTRACT --> EMBED[Generate Embedding]
    EMBED --> FIND_JOBS{Find Active Jobs}
    
    FIND_JOBS --> |For each job| MATCH[Matching Agent]
    MATCH --> VECTOR_SEARCH[Vector Similarity Search]
    VECTOR_SEARCH --> SCORE[Compute Match Score]
    
    SCORE --> EXPLAIN[Explainability Agent]
    EXPLAIN --> BIAS_CHECK[Bias Detection Agent]
    
    BIAS_CHECK --> |Bias Detected| HUMAN_REVIEW[Escalate to Human]
    BIAS_CHECK --> |No Bias| STORE[Store Match Result]
    
    STORE --> THRESHOLD{Score > Threshold?}
    THRESHOLD --> |Yes| SHORTLIST[Auto-Shortlist]
    THRESHOLD --> |No| ARCHIVE[Archive for Manual Review]
    
    SHORTLIST --> NOTIFY[Notify Recruiter]
    HUMAN_REVIEW --> NOTIFY
    ARCHIVE --> END[End]
    NOTIFY --> END
```

**LangGraph Implementation:**

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional

class MatchingState(TypedDict):
    resume_id: str
    resume_data: dict
    job_ids: List[str]
    current_job_idx: int
    matches: List[dict]
    bias_flags: List[dict]
    human_review_required: bool

def parse_resume(state: MatchingState) -> MatchingState:
    """Extract structured data from resume"""
    resume_data = llm_parse_resume(state["resume_id"])
    return {"resume_data": resume_data}

def generate_embedding(state: MatchingState) -> MatchingState:
    """Generate resume embedding"""
    embedding = embedding_model.embed(state["resume_data"])
    vector_db.upsert(state["resume_id"], embedding)
    return state

def find_active_jobs(state: MatchingState) -> MatchingState:
    """Find all active jobs for tenant"""
    jobs = db.query("SELECT id FROM jobs WHERE status='active'")
    return {"job_ids": [j.id for j in jobs], "current_job_idx": 0}

def match_with_job(state: MatchingState) -> MatchingState:
    """Match resume against current job"""
    job_id = state["job_ids"][state["current_job_idx"]]
    
    # Vector similarity search
    job_embedding = vector_db.get(f"job-{job_id}")
    similarity = cosine_similarity(
        vector_db.get(f"resume-{state['resume_id']}"),
        job_embedding
    )
    
    # LLM-based detailed matching with tools
    match_result = matching_agent.invoke({
        "resume": state["resume_data"],
        "job": get_job(job_id),
        "vector_similarity": similarity,
        "tools": [skill_extractor, gap_analyzer]
    })
    
    state["matches"].append({
        "job_id": job_id,
        "score": match_result["score"],
        "details": match_result["details"],
        "explanation": match_result["explanation"]
    })
    
    state["current_job_idx"] += 1
    return state

def check_bias(state: MatchingState) -> MatchingState:
    """Detect bias in matching"""
    for match in state["matches"]:
        bias_result = bias_agent.check_match(
            match, 
            state["resume_data"]
        )
        if bias_result["bias_detected"]:
            state["bias_flags"].append({
                "match_id": match["job_id"],
                "bias_type": bias_result["type"],
                "severity": bias_result["severity"],
                "explanation": bias_result["explanation"]
            })
            state["human_review_required"] = True
    return state

def route_after_bias_check(state: MatchingState) -> str:
    """Route based on bias detection"""
    if state["human_review_required"]:
        return "human_review"
    return "store_results"

# Build graph
workflow = StateGraph(MatchingState)

workflow.add_node("parse", parse_resume)
workflow.add_node("embed", generate_embedding)
workflow.add_node("find_jobs", find_active_jobs)
workflow.add_node("match", match_with_job)
workflow.add_node("bias_check", check_bias)
workflow.add_node("human_review", escalate_to_human)
workflow.add_node("store", store_matches)

workflow.set_entry_point("parse")
workflow.add_edge("parse", "embed")
workflow.add_edge("embed", "find_jobs")
workflow.add_conditional_edges(
    "find_jobs",
    lambda s: "match" if s["current_job_idx"] < len(s["job_ids"]) else "bias_check",
    {"match": "match", "bias_check": "bias_check"}
)
workflow.add_edge("match", "find_jobs")  # Loop for each job
workflow.add_conditional_edges(
    "bias_check",
    route_after_bias_check,
    {"human_review": "human_review", "store_results": "store"}
)
workflow.add_edge("human_review", END)
workflow.add_edge("store", END)

matching_graph = workflow.compile()
```

---

### 2.2 Screening Agent Workflow

**Graph Structure:**
```mermaid
graph TD
    START[Session Started] --> INIT[Initialize Context]
    INIT --> LOAD_JD[Load Job Description]
    LOAD_JD --> LOAD_RESUME[Load Resume]
    LOAD_RESUME --> GEN_Q[Generate Opening Question]
    
    GEN_Q --> WAIT[Wait for Candidate Response]
    WAIT --> ANALYZE[Analyze Response]
    
    ANALYZE --> SENTIMENT[Sentiment Analysis]
    SENTIMENT --> RED_FLAG{Red Flag Detected?}
    
    RED_FLAG --> |Yes| ESCALATE[Escalate to Human]
    RED_FLAG --> |No| SCORE[Score Response]
    
    SCORE --> CONTINUE{More Questions?}
    CONTINUE --> |Yes| GEN_FOLLOWUP[Generate Follow-up]
    CONTINUE --> |No| SUMMARIZE[Generate Summary]
    
    GEN_FOLLOWUP --> WAIT
    SUMMARIZE --> RECOMMEND[Make Recommendation]
    RECOMMEND --> END[End Session]
    ESCALATE --> END
```

**LangGraph Implementation:**

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor

class ScreeningState(TypedDict):
    session_id: str
    candidate_id: str
    job_id: str
    conversation_history: List[dict]
    current_question: Optional[str]
    response_scores: List[float]
    red_flags: List[dict]
    sentiment_scores: List[float]
    should_continue: bool
    final_recommendation: Optional[str]

# Define tools
def generate_question_tool(context: dict) -> str:
    """Generate contextual screening question"""
    prompt = f"""
    Given the job requirements and candidate's resume, generate the next screening question.
    
    Job: {context['job_title']}
    Key Skills: {context['required_skills']}
    Resume Summary: {context['resume_summary']}
    Previous Questions: {context['asked_questions']}
    
    Generate a question that:
    1. Tests critical job requirements
    2. Builds on previous answers
    3. Is clear and focused
    4. Allows for detailed responses
    """
    return llm.invoke(prompt)

def sentiment_analysis_tool(text: str) -> dict:
    """Analyze sentiment of candidate response"""
    result = sentiment_model.analyze(text)
    return {
        "sentiment": result.label,  # positive, neutral, negative
        "confidence": result.score,
        "emotions": result.emotions  # confident, nervous, evasive, etc.
    }

def detect_red_flags_tool(response: str, context: dict) -> dict:
    """Detect red flags in candidate responses"""
    prompt = f"""
    Analyze this interview response for potential red flags:
    
    Response: {response}
    Question: {context['question']}
    
    Check for:
    - Dishonesty or exaggeration
    - Inappropriate language
    - Concerning attitudes
    - Major inconsistencies with resume
    
    Return JSON with: {{"red_flags": [...], "severity": "low|medium|high"}}
    """
    result = llm.invoke(prompt)
    return json.loads(result)

tools = [
    generate_question_tool,
    sentiment_analysis_tool,
    detect_red_flags_tool
]
tool_executor = ToolExecutor(tools)

# Agent nodes
def initialize_session(state: ScreeningState) -> ScreeningState:
    """Load job and resume context"""
    job = get_job(state["job_id"])
    resume = get_resume_by_candidate(state["candidate_id"])
    
    state["context"] = {
        "job_title": job.title,
        "required_skills": job.enriched_jd["extracted_skills"],
        "resume_summary": resume.parsed_data["summary"],
        "asked_questions": []
    }
    state["conversation_history"] = []
    state["should_continue"] = True
    return state

def generate_question(state: ScreeningState) -> ScreeningState:
    """Generate next question using LLM"""
    question = generate_question_tool(state["context"])
    
    state["current_question"] = question
    state["conversation_history"].append({
        "role": "agent",
        "content": question,
        "timestamp": datetime.now()
    })
    state["context"]["asked_questions"].append(question)
    
    return state

def analyze_response(state: ScreeningState) -> ScreeningState:
    """Analyze candidate's response"""
    last_response = state["conversation_history"][-1]
    
    # Sentiment analysis
    sentiment = sentiment_analysis_tool(last_response["content"])
    state["sentiment_scores"].append(sentiment["confidence"])
    
    # Red flag detection
    red_flag_check = detect_red_flags_tool(
        last_response["content"],
        {"question": state["current_question"]}
    )
    
    if red_flag_check["red_flags"]:
        state["red_flags"].extend(red_flag_check["red_flags"])
    
    # Score response
    score_prompt = f"""
    Score this interview response on a scale of 1-5.
    
    Question: {state["current_question"]}
    Response: {last_response["content"]}
    Job Requirements: {state["context"]["required_skills"]}
    
    Evaluate:
    - Relevance to question
    - Depth of knowledge
    - Communication clarity
    - Confidence level
    
    Return JSON: {{"score": X, "reasoning": "..."}}
    """
    score_result = llm.invoke(score_prompt)
    state["response_scores"].append(json.loads(score_result)["score"])
    
    return state

def check_red_flags(state: ScreeningState) -> str:
    """Route based on red flag severity"""
    if any(rf["severity"] == "high" for rf in state["red_flags"]):
        return "escalate"
    return "continue"

def decide_continuation(state: ScreeningState) -> str:
    """Decide whether to ask more questions"""
    num_questions = len(state["response_scores"])
    avg_score = sum(state["response_scores"]) / len(state["response_scores"])
    
    # Continue if:
    # - Less than 5 questions asked
    # - Average score is borderline (2.5-3.5) and need more data
    if num_questions < 5 or (2.5 < avg_score < 3.5 and num_questions < 8):
        return "continue"
    
    return "finalize"

def generate_summary(state: ScreeningState) -> ScreeningState:
    """Generate final screening summary"""
    prompt = f"""
    Generate a comprehensive screening summary.
    
    Questions Asked: {len(state["response_scores"])}
    Average Score: {sum(state["response_scores"]) / len(state["response_scores"])}
    Sentiment Trend: {state["sentiment_scores"]}
    Red Flags: {state["red_flags"]}
    
    Full Conversation:
    {json.dumps(state["conversation_history"], indent=2)}
    
    Provide:
    1. Overall assessment (1-5)
    2. Key strengths (3-5 points)
    3. Areas of concern (if any)
    4. Recommendation (proceed_to_interview, reject, needs_second_screening)
    5. Confidence in recommendation (0-1)
    
    Return JSON format.
    """
    
    summary = llm.invoke(prompt)
    summary_data = json.loads(summary)
    
    state["final_recommendation"] = summary_data["recommendation"]
    state["summary"] = summary_data
    
    return state

# Build graph
screening_workflow = StateGraph(ScreeningState)

screening_workflow.add_node("init", initialize_session)
screening_workflow.add_node("generate_q", generate_question)
screening_workflow.add_node("analyze", analyze_response)
screening_workflow.add_node("summarize", generate_summary)
screening_workflow.add_node("escalate", escalate_to_human_reviewer)

screening_workflow.set_entry_point("init")
screening_workflow.add_edge("init", "generate_q")
# After sending question, wait for user input (handled externally)
# When response received, trigger analyze
screening_workflow.add_conditional_edges(
    "analyze",
    check_red_flags,
    {"escalate": "escalate", "continue": "decide"}
)
screening_workflow.add_conditional_edges(
    "decide",
    decide_continuation,
    {"continue": "generate_q", "finalize": "summarize"}
)
screening_workflow.add_edge("summarize", END)
screening_workflow.add_edge("escalate", END)

screening_graph = screening_workflow.compile()
```

---

### 2.3 Decision Agent Workflow

**Graph Structure:**
```mermaid
graph TD
    START[Trigger Decision] --> GATHER[Gather All Data]
    GATHER --> MATCH_DATA[Get Match Score & Explanation]
    GATHER --> SCREENING_DATA[Get Screening Results]
    GATHER --> INTERVIEW_DATA[Get Interview Feedback]
    
    MATCH_DATA --> AGGREGATE[Aggregate Factors]
    SCREENING_DATA --> AGGREGATE
    INTERVIEW_DATA --> AGGREGATE
    
    AGGREGATE --> WEIGHT[Apply Weighted Scoring]
    WEIGHT --> BIAS_CHECK[Final Bias Check]
    
    BIAS_CHECK --> |Bias Found| FLAG[Flag for Review]
    BIAS_CHECK --> |Clean| RECOMMEND[Generate Recommendation]
    
    RECOMMEND --> CONFIDENCE{Confidence > 0.85?}
    CONFIDENCE --> |Yes| AUTO_DECIDE[Auto-Decision]
    CONFIDENCE --> |No| HUMAN_LOOP[Request Human Review]
    
    AUTO_DECIDE --> EXPLAIN[Generate Explanation]
    HUMAN_LOOP --> EXPLAIN
    FLAG --> EXPLAIN
    
    EXPLAIN --> AUDIT[Log to Audit Trail]
    AUDIT --> END[Store Decision]
```

**LangGraph Implementation:**

```python
class DecisionState(TypedDict):
    match_id: str
    candidate_id: str
    job_id: str
    
    # Input data
    match_score: float
    match_explanation: str
    screening_score: float
    screening_summary: dict
    interview_feedbacks: List[dict]
    voice_interview_score: Optional[float]
    
    # Processing
    weighted_factors: List[dict]
    total_score: float
    bias_check_result: dict
    
    # Output
    recommendation: str  # 'hire', 'no_hire', 'hold'
    confidence: float
    requires_human_review: bool
    explanation: dict
    audit_log: dict

def gather_matching_data(state: DecisionState) -> DecisionState:
    """Fetch matching results"""
    match = db.get_match(state["match_id"])
    state["match_score"] = match.score
    state["match_explanation"] = match.explanation
    return state

def gather_screening_data(state: DecisionState) -> DecisionState:
    """Fetch screening results"""
    screening = db.get_screening_by_match(state["match_id"])
    if screening:
        state["screening_score"] = screening.analysis["overall_score"]
        state["screening_summary"] = screening.analysis
    else:
        state["screening_score"] = None
    return state

def gather_interview_data(state: DecisionState) -> DecisionState:
    """Fetch all interview feedback"""
    interviews = db.get_interviews_by_match(state["match_id"])
    feedbacks = []
    for interview in interviews:
        interview_feedbacks = db.get_feedback(interview.id)
        feedbacks.extend([{
            "interview_type": interview.interview_type,
            "rating": fb.rating,
            "recommendation": fb.recommendation,
            "notes": fb.notes,
            "red_flags": fb.red_flags
        } for fb in interview_feedbacks])
    
    state["interview_feedbacks"] = feedbacks
    return state

def aggregate_and_weight(state: DecisionState) -> DecisionState:
    """Apply weighted scoring model"""
    
    # Configurable weights per hiring stage
    weights = {
        "match_score": 0.25,
        "screening": 0.25,
        "interviews": 0.40,
        "voice_interview": 0.10
    }
    
    factors = []
    
    # Match score factor
    if state["match_score"]:
        factors.append({
            "type": "match_score",
            "weight": weights["match_score"],
            "value": state["match_score"],
            "normalized": state["match_score"] / 100,  # normalize to 0-1
            "contribution": (state["match_score"] / 100) * weights["match_score"]
        })
    
    # Screening factor
    if state["screening_score"]:
        factors.append({
            "type": "screening",
            "weight": weights["screening"],
            "value": state["screening_score"],
            "normalized": state["screening_score"] / 5,  # 1-5 scale to 0-1
            "contribution": (state["screening_score"] / 5) * weights["screening"]
        })
    
    # Interview factor (average of all)
    if state["interview_feedbacks"]:
        avg_interview_rating = sum(fb["rating"] for fb in state["interview_feedbacks"]) / len(state["interview_feedbacks"])
        factors.append({
            "type": "interviews",
            "weight": weights["interviews"],
            "value": avg_interview_rating,
            "normalized": avg_interview_rating / 5,
            "contribution": (avg_interview_rating / 5) * weights["interviews"]
        })
    
    # Voice interview factor
    if state.get("voice_interview_score"):
        factors.append({
            "type": "voice_interview",
            "weight": weights["voice_interview"],
            "value": state["voice_interview_score"],
            "normalized": state["voice_interview_score"] / 5,
            "contribution": (state["voice_interview_score"] / 5) * weights["voice_interview"]
        })
    
    # Calculate total weighted score
    total_score = sum(f["contribution"] for f in factors) * 100  # convert back to 0-100
    
    state["weighted_factors"] = factors
    state["total_score"] = total_score
    
    return state

def final_bias_check(state: DecisionState) -> DecisionState:
    """Comprehensive bias check on final decision"""
    
    bias_prompt = f"""
    Perform a comprehensive bias check on this hiring decision.
    
    Candidate Profile:
    - Match Score: {state["match_score"]}
    - Screening: {state["screening_score"]}
    - Interview Ratings: {[fb["rating"] for fb in state["interview_feedbacks"]]}
    
    Interview Notes:
    {json.dumps([fb["notes"] for fb in state["interview_feedbacks"]], indent=2)}
    
    Red Flags Raised:
    {json.dumps([fb["red_flags"] for fb in state["interview_feedbacks"]], indent=2)}
    
    Check for:
    1. Affinity bias (favoring similar backgrounds)
    2. Recency bias (overweighting recent interviews)
    3. Halo/horn effect (one factor dominating)
    4. Gender/age/ethnicity bias indicators
    5. Cultural fit as proxy for discrimination
    
    Return JSON:
    {{
        "bias_detected": true|false,
        "bias_types": [...],
        "confidence": 0.0-1.0,
        "evidence": "...",
        "recommendation": "proceed|flag_for_review"
    }}
    """
    
    bias_result = llm.invoke(bias_prompt)
    state["bias_check_result"] = json.loads(bias_result)
    
    if state["bias_check_result"]["bias_detected"]:
        state["requires_human_review"] = True
    
    return state

def generate_recommendation(state: DecisionState) -> DecisionState:
    """LLM generates final recommendation"""
    
    decision_prompt = f"""
    Make a final hiring recommendation based on all available data.
    
    Weighted Score: {state["total_score"]}/100
    Factor Breakdown: {json.dumps(state["weighted_factors"], indent=2)}
    
    Screening Summary: {state["screening_summary"]}
    Interview Feedback: {state["interview_feedbacks"]}
    Bias Check: {state["bias_check_result"]}
    
    Provide:
    1. Recommendation: 'hire', 'no_hire', or 'hold'
    2. Confidence: 0.0-1.0
    3. Key reasoning (3-5 sentences)
    4. Deciding factors (list)
    5. Risks/concerns if any
    
    Return JSON.
    """
    
    decision = llm.invoke(decision_prompt)
    decision_data = json.loads(decision)
    
    state["recommendation"] = decision_data["recommendation"]
    state["confidence"] = decision_data["confidence"]
    
    # Require human review if confidence < 0.85
    if state["confidence"] < 0.85:
        state["requires_human_review"] = True
    
    # Store reasoning
    state["explanation"] = {
        "recommendation": decision_data["recommendation"],
        "confidence": decision_data["confidence"],
        "reasoning": decision_data["reasoning"],
        "deciding_factors": decision_data["deciding_factors"],
        "risks": decision_data.get("risks", []),
        "total_score": state["total_score"],
        "factor_breakdown": state["weighted_factors"]
    }
    
    return state

def generate_explanation(state: DecisionState) -> DecisionState:
    """Generate GDPR-compliant explanation"""
    
    explain_prompt = f"""
    Generate a clear, human-readable explanation of this hiring decision for the candidate.
    
    This must be GDPR-compliant and explain:
    - What data was used
    - How the decision was made
    - What factors contributed most
    - Why they were/weren't selected
    
    Decision: {state["recommendation"]}
    Score: {state["total_score"]}
    Factors: {state["weighted_factors"]}
    
    Tone: Professional, respectful, constructive
    Length: 150-300 words
    """
    
    explanation = llm.invoke(explain_prompt)
    state["explanation"]["candidate_facing_text"] = explanation
    
    return state

def create_audit_log(state: DecisionState) -> DecisionState:
    """Generate comprehensive audit log"""
    
    state["audit_log"] = {
        "decision_id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "match_id": state["match_id"],
        "recommendation": state["recommendation"],
        "confidence": state["confidence"],
        "total_score": state["total_score"],
        "factors": state["weighted_factors"],
        "bias_check": state["bias_check_result"],
        "human_review_required": state["requires_human_review"],
        "model_version": "claude-3.5-sonnet-20241022",
        "prompt_version": "decision_v1.2",
        "explanation": state["explanation"]
    }
    
    # Log to audit database
    audit_service.log(state["audit_log"])
    
    return state

# Build decision workflow
decision_workflow = StateGraph(DecisionState)

decision_workflow.add_node("gather_match", gather_matching_data)
decision_workflow.add_node("gather_screening", gather_screening_data)
decision_workflow.add_node("gather_interviews", gather_interview_data)
decision_workflow.add_node("aggregate", aggregate_and_weight)
decision_workflow.add_node("bias_check", final_bias_check)
decision_workflow.add_node("recommend", generate_recommendation)
decision_workflow.add_node("explain", generate_explanation)
decision_workflow.add_node("audit", create_audit_log)

decision_workflow.set_entry_point("gather_match")
decision_workflow.add_edge("gather_match", "gather_screening")
decision_workflow.add_edge("gather_screening", "gather_interviews")
decision_workflow.add_edge("gather_interviews", "aggregate")
decision_workflow.add_edge("aggregate", "bias_check")
decision_workflow.add_edge("bias_check", "recommend")
decision_workflow.add_edge("recommend", "explain")
decision_workflow.add_edge("explain", "audit")
decision_workflow.add_edge("audit", END)

decision_graph = decision_workflow.compile()
```

---

## 3. Agent Memory Strategies

### 3.1 Short-Term Memory (Within Task)
```python
from langgraph.checkpoint import MemorySaver

# In-memory checkpointing for single workflow execution
memory_saver = MemorySaver()

# Persist state between agent steps
graph_with_memory = workflow.compile(checkpointer=memory_saver)

# Execute with thread_id for continuity
result = graph_with_memory.invoke(
    input_data,
    config={"configurable": {"thread_id": "match-123"}}
)
```

### 3.2 Conversation Memory (Multi-Turn)
```python
from langchain.memory import ConversationBufferWindowMemory

# For screening/voice agents
screening_memory = ConversationBufferWindowMemory(
    k=10,  # Last 10 exchanges
    memory_key="chat_history",
    return_messages=True
)

# Store in Redis for persistence
redis_memory = RedisChatMessageHistory(
    session_id=f"screening-{session_id}",
    url="redis://localhost:6379",
    ttl=2592000  # 30 days
)
```

### 3.3 Long-Term Memory (Cross-Session)
```python
# Store insights about candidates across multiple interactions
from langchain.vectorstores import Pinecone

long_term_memory = Pinecone(
    index_name="candidate-memory",
    embedding=OpenAIEmbeddings()
)

# Store interaction summary
long_term_memory.add_texts(
    texts=[screening_summary],
    metadatas=[{
        "candidate_id": candidate_id,
        "interaction_type": "screening",
        "timestamp": datetime.now(),
        "outcome": "positive"
    }]
)

# Retrieve context for future interactions
relevant_context = long_term_memory.similarity_search(
    f"Previous interactions with candidate {candidate_id}",
    k=5
)
```

---

## 4. Tool Definitions

### 4.1 Matching Agent Tools
```python
from langchain.tools import tool

@tool
def extract_skills_from_text(text: str) -> List[str]:
    """Extract technical skills from resume text"""
    prompt = """
    Extract all technical skills from this text.
    Return as JSON array of strings.
    
    Text: {text}
    """
    result = llm.invoke(prompt.format(text=text))
    return json.loads(result)

@tool
def calculate_skill_gap(required_skills: List[dict], candidate_skills: List[str]) -> dict:
    """Calculate skill gaps between job requirements and candidate"""
    gaps = []
    matches = []
    
    for req_skill in required_skills:
        if req_skill["name"].lower() in [s.lower() for s in candidate_skills]:
            matches.append(req_skill["name"])
        else:
            gaps.append({
                "skill": req_skill["name"],
                "required": req_skill["required"],
                "years_required": req_skill.get("years", 0)
            })
    
    return {
        "matched_skills": matches,
        "skill_gaps": gaps,
        "match_percentage": len(matches) / len(required_skills) * 100
    }

@tool
def semantic_search_similar_candidates(job_id: str, top_k: int = 10) -> List[dict]:
    """Search vector DB for similar candidates"""
    job_embedding = vector_db.get(f"job-{job_id}")
    results = vector_db.query(
        vector=job_embedding,
        top_k=top_k,
        filter={"type": "resume"}
    )
    return [{"candidate_id": r.id, "similarity": r.score} for r in results]
```

### 4.2 Screening Agent Tools
```python
@tool
def generate_followup_question(question: str, answer: str, job_context: dict) -> str:
    """Generate intelligent follow-up question"""
    prompt = f"""
    Based on the candidate's answer, generate a relevant follow-up question.
    
    Original Question: {question}
    Candidate's Answer: {answer}
    Job Context: {job_context}
    
    The follow-up should:
    - Probe deeper into their answer
    - Test technical depth
    - Clarify ambiguities
    - Be specific and focused
    """
    return llm.invoke(prompt)

@tool
def analyze_sentiment(text: str) -> dict:
    """Analyze sentiment and emotion in candidate response"""
    # Use specialized sentiment model
    result = sentiment_analyzer(text)
    return {
        "sentiment": result[0]["label"],  # POSITIVE, NEUTRAL, NEGATIVE
        "confidence": result[0]["score"],
        "emotions": emotion_detector(text)
    }

@tool
def detect_evasiveness(question: str, answer: str) -> bool:
    """Detect if candidate is being evasive"""
    prompt = f"""
    Determine if this answer directly addresses the question or is evasive.
    
    Question: {question}
    Answer: {answer}
    
    Return JSON: {{"evasive": true|false, "confidence": 0.0-1.0, "reasoning": "..."}}
    """
    result = llm.invoke(prompt)
    return json.loads(result)
```

### 4.3 Voice Agent Tools
```python
@tool
def transcribe_audio(audio_file_url: str) -> dict:
    """Transcribe audio to text with timestamps"""
    audio = download_audio(audio_file_url)
    result = deepgram.transcribe(audio, {
        "punctuate": True,
        "diarize": True,
        "timestamps": True
    })
    return result

@tool
def detect_emotion_from_voice(audio_segment: bytes) -> dict:
    """Detect emotion from voice tonality"""
    result = voice_emotion_detector.analyze(audio_segment)
    return {
        "emotion": result.emotion,  # happy, sad, angry, confident, nervous
        "confidence": result.confidence,
        "arousal": result.arousal,  # energy level
        "valence": result.valence  # positive/negative
    }

@tool
def generate_voice_response(text: str, voice_persona: str = "professional") -> bytes:
    """Generate speech from text"""
    audio = elevenlabs.generate(
        text=text,
        voice="Rachel" if voice_persona == "professional" else "Adam",
        model="eleven_multilingual_v2"
    )
    return audio
```

---

## 5. Explainability Framework

### 5.1 Explain Match Score
```python
def explain_match_decision(match_id: str) -> dict:
    """Generate human-readable explanation for match score"""
    match = db.get_match(match_id)
    
    explanation_prompt = f"""
    Explain this resume-job match score in simple terms for a recruiter.
    
    Match Score: {match.score}/100
    
    Match Details:
    - Skill Match: {match.details["skill_match"]}/100
    - Experience Match: {match.details["experience_match"]}/100
    - Education Match: {match.details["education_match"]}/100
    
    Skill Gaps:
    {json.dumps(match.skill_gaps, indent=2)}
    
    Strengths:
    {json.dumps(match.strengths, indent=2)}
    
    Generate explanation with:
    1. One-sentence summary
    2. Top 3 reasons for the score
    3. Main concerns/gaps
    4. Recommendation for next steps
    
    Be specific and actionable.
    """
    
    explanation = llm.invoke(explanation_prompt)
    
    return {
        "match_id": match_id,
        "explanation_text": explanation,
        "generated_at": datetime.now(),
        "model_used": "gpt-4o"
    }
```

### 5.2 Explain Hiring Decision
```python
def explain_hiring_decision(decision_id: str, for_candidate: bool = False) -> str:
    """Generate GDPR-compliant decision explanation"""
    decision = db.get_decision(decision_id)
    
    if for_candidate:
        prompt = f"""
        Write a respectful, constructive explanation for why we made this hiring decision.
        This will be shared with the candidate.
        
        Decision: {"Proceeding to next round" if decision.recommendation == "hire" else "Not moving forward"}
        
        Key Factors:
        {json.dumps(decision.factors, indent=2)}
        
        Guidelines:
        - Be honest but tactful
        - Focus on objective criteria
        - Offer constructive feedback where appropriate
        - Thank them for their time
        - Keep it 150-200 words
        - NEVER mention protected characteristics
        - Don't compare to other candidates
        """
    else:
        # Internal explanation for recruiters
        prompt = f"""
        Provide detailed reasoning for this hiring decision (internal use).
        
        Recommendation: {decision.recommendation}
        Confidence: {decision.confidence}
        Total Score: {decision.reasoning["total_score"]}
        Factors: {json.dumps(decision.reasoning["factors"], indent=2)}
        
        Include:
        - What data drove the decision
        - Why the AI recommended this
        - Any edge cases or uncertainties
        - Suggested next steps
        """
    
    return llm.invoke(prompt)
```

---

## 6. Human-in-the-Loop Escalation

### 6.1 Escalation Triggers
```python
def should_escalate_to_human(state: dict, agent_type: str) -> bool:
    """Determine if human review is needed"""
    
    escalation_rules = {
        "matching": [
            lambda s: any(flag["severity"] == "high" for flag in s.get("bias_flags", [])),
            lambda s: s.get("match_score", 0) > 95,  # Suspiciously high
            lambda s: len(s.get("skill_gaps", [])) > 5 and s.get("match_score", 0) > 80  # Paradox
        ],
        "screening": [
            lambda s: any(flag["severity"] in ["high", "critical"] for flag in s.get("red_flags", [])),
            lambda s: s.get("sentiment_score", 1.0) < 0.3,  # Very negative
            lambda s: s.get("evasiveness_count", 0) > 3
        ],
        "decision": [
            lambda s: s.get("confidence", 1.0) < 0.85,
            lambda s: s.get("bias_check_result", {}).get("bias_detected", False),
            lambda s: s.get("recommendation") == "hire" and s.get("total_score", 0) < 70,  # Paradox
            lambda s: len(s.get("interview_feedbacks", [])) > 0 and \
                     any(fb["recommendation"] == "strong_no_hire" for fb in s.get("interview_feedbacks", []))
        ]
    }
    
    rules = escalation_rules.get(agent_type, [])
    return any(rule(state) for rule in rules)

def escalate_to_human_reviewer(state: dict, agent_type: str, reason: str) -> dict:
    """Create human review task"""
    review_task = {
        "id": str(uuid.uuid4()),
        "agent_type": agent_type,
        "state_snapshot": state,
        "escalation_reason": reason,
        "priority": "high" if "bias" in reason.lower() else "normal",
        "assigned_to": determine_reviewer(agent_type),
        "created_at": datetime.now(),
        "status": "pending",
        "context": generate_review_context(state, agent_type)
    }
    
    # Store in review queue
    db.create_review_task(review_task)
    
    # Notify reviewer
    notification_service.send({
        "type": "human_review_required",
        "task_id": review_task["id"],
        "reason": reason,
        "urgency": "high" if review_task["priority"] == "high" else "normal"
    })
    
    return {"escalated": True, "review_task_id": review_task["id"]}
```

---

## 7. Bias Detection & Mitigation

### 7.1 Bias Detection Agent
```python
class BiasDetectionAgent:
    """Specialized agent for detecting various forms of bias"""
    
    def __init__(self):
        self.bias_model = load_fairness_model()
        self.llm = get_llm("claude-3.5-sonnet")
    
    def check_match_bias(self, match_data: dict, resume_data: dict) -> dict:
        """Check for bias in resume matching"""
        
        # Check for name bias
        name_bias = self.detect_name_bias(resume_data["personal"]["full_name"])
        
        # Check for university prestige bias
        education_bias = self.detect_education_bias(resume_data["education"])
        
        # Check for location bias
        location_bias = self.detect_location_bias(
            resume_data["personal"].get("location"),
            match_data.get("required_location")
        )
        
        # LLM-based holistic bias check
        llm_bias_check = self.llm.invoke(f"""
        Analyze this resume matching for potential bias.
        
        Resume: {json.dumps(resume_data, indent=2)}
        Match Score: {match_data["score"]}
        Match Reasoning: {match_data["explanation"]}
        
        Check for:
        - Affinity bias (favoring similar backgrounds)
        - Prestige bias (overvaluing brand-name companies/schools)
        - Recency bias (overvaluing recent experience)
        - Age bias indicators
        - Gender bias indicators
        
        Return JSON: {{
            "bias_detected": true|false,
            "bias_types": [...],
            "confidence": 0.0-1.0,
            "evidence": "...",
            "severity": "low|medium|high"
        }}
        """)
        
        result = json.loads(llm_bias_check)
        
        # Combine all bias checks
        all_biases = []
        if name_bias["bias_likely"]:
            all_biases.append(name_bias)
        if education_bias["bias_likely"]:
            all_biases.append(education_bias)
        if location_bias["bias_likely"]:
            all_biases.append(location_bias)
        if result["bias_detected"]:
            all_biases.extend(result["bias_types"])
        
        return {
            "bias_detected": len(all_biases) > 0,
            "biases": all_biases,
            "overall_severity": max([b.get("severity", "low") for b in all_biases], default="low"),
            "recommendation": "flag_for_review" if len(all_biases) > 0 else "proceed"
        }
    
    def detect_name_bias(self, name: str) -> dict:
        """Detect potential name-based bias"""
        # Use name ethnicity detection model
        ethnicity_pred = name_ethnicity_model.predict(name)
        
        # If name strongly suggests non-majority ethnicity and score is low, flag
        # (This is oversimplified - production would be more nuanced)
        return {
            "type": "name_bias",
            "bias_likely": False,  # Conservative - only flag clear cases
            "confidence": 0.0,
            "note": "Name-based bias detection performed"
        }
    
    def detect_education_bias(self, education: List[dict]) -> dict:
        """Detect prestige bias in education weighting"""
        ivy_league = ["Harvard", "Yale", "Princeton", "Stanford", "MIT"]
        
        has_ivy = any(
            any(school in edu.get("institution", "") for school in ivy_league)
            for edu in education
        )
        
        # Check if having ivy league is being overweighted
        # (Production would analyze actual scoring logic)
        return {
            "type": "education_prestige_bias",
            "bias_likely": False,
            "has_prestigious_school": has_ivy
        }
```

---

## 8. Agent Orchestration Service

```python
class AgentOrchestrator:
    """Central orchestrator for all AI agents"""
    
    def __init__(self):
        self.matching_graph = matching_graph
        self.screening_graph = screening_graph
        self.decision_graph = decision_graph
        self.explainability_agent = ExplainabilityAgent()
        self.bias_agent = BiasDetectionAgent()
    
    async def execute_matching_workflow(self, resume_id: str) -> dict:
        """Execute full matching workflow"""
        initial_state = {
            "resume_id": resume_id,
            "matches": [],
            "bias_flags": [],
            "human_review_required": False
        }
        
        result = await self.matching_graph.ainvoke(initial_state)
        
        # Generate explanation for each match
        for match in result["matches"]:
            explanation = await self.explainability_agent.explain_match(match["job_id"], resume_id)
            match["explanation"] = explanation
        
        # Log to lineage
        log_model_lineage({
            "workflow": "matching",
            "resume_id": resume_id,
            "num_jobs_matched": len(result["matches"]),
            "human_review_required": result["human_review_required"]
        })
        
        return result
    
    async def execute_screening_session(self, session_id: str, user_message: str) -> dict:
        """Process screening conversation turn"""
        # Load existing state
        state = await self.load_session_state(session_id)
        
        # Add user message to conversation
        state["conversation_history"].append({
            "role": "candidate",
            "content": user_message,
            "timestamp": datetime.now()
        })
        
        # Execute agent graph
        result = await self.screening_graph.ainvoke(state)
        
        # Save state
        await self.save_session_state(session_id, result)
        
        return {
            "session_id": session_id,
            "agent_response": result["conversation_history"][-1],
            "status": result.get("status", "in_progress"),
            "summary": result.get("summary") if result.get("status") == "completed" else None
        }
    
    async def execute_decision_workflow(self, match_id: str) -> dict:
        """Execute hiring decision workflow"""
        initial_state = {
            "match_id": match_id,
            "weighted_factors": [],
            "requires_human_review": False
        }
        
        result = await self.decision_graph.ainvoke(initial_state)
        
        # Generate candidate-facing explanation
        candidate_explanation = await self.explainability_agent.explain_decision(
            result["audit_log"]["decision_id"],
            for_candidate=True
        )
        result["candidate_explanation"] = candidate_explanation
        
        return result
```

---

This agentic AI architecture provides:
- ✅ Full LangGraph implementation for all agents
- ✅ Tool-using, memory-enabled agents
- ✅ Human-in-the-loop escalation
- ✅ Comprehensive explainability
- ✅ Bias detection & mitigation
- ✅ Audit trail for AI governance
- ✅ Production-ready patterns

**Next: Frontend Architecture, Event Workflows, and Implementation Roadmap**
