from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import structlog
from prometheus_client import Counter, Histogram, generate_latest
from fastapi.responses import Response

from services.analyzer import TextAnalyzer
from services.claim_extractor import ClaimExtractor
from services.embedding_service import EmbeddingService

load_dotenv()

logger = structlog.get_logger()

app = FastAPI(title="Satya AI Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
REQUEST_COUNT = Counter('ai_requests_total', 'Total AI requests', ['endpoint', 'status'])
REQUEST_LATENCY = Histogram('ai_request_duration_seconds', 'Request latency')

# Initialize services
analyzer = TextAnalyzer()
claim_extractor = ClaimExtractor()
embedding_service = EmbeddingService()

class AnalyzeRequest(BaseModel):
    text: str
    url: Optional[str] = None
    language: Optional[str] = "en"

class BatchAnalyzeRequest(BaseModel):
    items: List[AnalyzeRequest]

class Entity(BaseModel):
    text: str
    type: str
    span: List[int]

class Sentiment(BaseModel):
    polarity: float
    label: str

class SourceCandidate(BaseModel):
    source_name: str
    url: str
    confidence: float

class AnalyzeResponse(BaseModel):
    claim: str
    paraphrase: str
    entities: List[Entity]
    sentiment: Sentiment
    bias_score: float
    sensationalism_score: float
    toxicity_score: float
    factuality_score: float
    source_candidates: List[SourceCandidate]
    verdict_suggestion: str
    explainability: str
    model_version: str
    confidence: float

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != os.getenv("AI_SERVICE_KEY"):
        raise HTTPException(status_code=401, detail="Invalid API key")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest, api_key: str = Header(None, alias="X-API-Key")):
    try:
        verify_api_key(api_key)
        
        with REQUEST_LATENCY.time():
            # Extract claim
            claim = claim_extractor.extract_claim(request.text, request.language)
            
            # Generate paraphrase
            paraphrase = claim_extractor.paraphrase_claim(claim, request.language)
            
            # Analyze text
            analysis = analyzer.analyze(request.text, request.language)
            
            # Extract entities
            entities = analyzer.extract_entities(request.text, request.language)
            
            # Compute scores
            bias_score = analysis["bias_score"]
            sensationalism_score = analysis["sensationalism_score"]
            toxicity_score = analysis.get("toxicity_score", 0.0)
            factuality_score = analysis["factuality_score"]
            
            # Sentiment analysis
            sentiment = analysis["sentiment"]
            
            # Find similar sources (embedding-based)
            source_candidates = embedding_service.find_similar_sources(claim)
            
            # Determine verdict
            verdict_suggestion, explainability, confidence = _compute_verdict(
                factuality_score, bias_score, sensationalism_score, toxicity_score
            )
            
            REQUEST_COUNT.labels(endpoint='analyze', status='success').inc()
            
            return AnalyzeResponse(
                claim=claim,
                paraphrase=paraphrase,
                entities=entities,
                sentiment=Sentiment(**sentiment),
                bias_score=bias_score,
                sensationalism_score=sensationalism_score,
                toxicity_score=toxicity_score,
                factuality_score=factuality_score,
                source_candidates=source_candidates,
                verdict_suggestion=verdict_suggestion,
                explainability=explainability,
                model_version="1.0.0",
                confidence=confidence
            )
            
    except Exception as e:
        REQUEST_COUNT.labels(endpoint='analyze', status='error').inc()
        logger.error("analysis_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/batch")
async def analyze_batch(request: BatchAnalyzeRequest, api_key: str = Header(None, alias="X-API-Key")):
    verify_api_key(api_key)
    
    results = []
    for item in request.items:
        try:
            result = await analyze_text(item, api_key)
            results.append({"success": True, "data": result})
        except Exception as e:
            results.append({"success": False, "error": str(e)})
    
    return {"results": results, "total": len(results)}

def _compute_verdict(factuality: float, bias: float, sensationalism: float, toxicity: float):
    """Compute verdict based on scores with explainability."""
    factors = []
    
    # Base score from factuality
    base_score = factuality * 0.5
    factors.append(f"Factuality: {factuality:.2f} (weight: 0.5)")
    
    # Penalty for bias
    bias_penalty = bias * 0.2
    base_score -= bias_penalty
    factors.append(f"Bias penalty: -{bias_penalty:.2f}")
    
    # Penalty for sensationalism
    sens_penalty = sensationalism * 0.15
    base_score -= sens_penalty
    factors.append(f"Sensationalism penalty: -{sens_penalty:.2f}")
    
    # Penalty for toxicity
    if toxicity > 0.5:
        tox_penalty = toxicity * 0.15
        base_score -= tox_penalty
        factors.append(f"Toxicity penalty: -{tox_penalty:.2f}")
    
    # Determine verdict
    confidence = min(abs(base_score - 0.5) * 2, 1.0)
    
    if base_score >= 0.75:
        verdict = "true"
    elif base_score >= 0.50:
        verdict = "misleading"
    elif base_score >= 0.30:
        verdict = "unverified"
    else:
        verdict = "false"
    
    explainability = f"Verdict '{verdict}' based on: " + "; ".join(factors[:3])
    
    return verdict, explainability, confidence

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
