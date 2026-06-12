from enum import Enum

from pydantic import BaseModel, Field


class Direction(str, Enum):
    AI = "ai"                  # signal points toward AI-generated/manipulated
    AUTHENTIC = "authentic"    # signal points toward a real capture
    NEUTRAL = "neutral"        # informational only


class Weight(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CONCLUSIVE = "conclusive"  # cryptographic provenance only


class Verdict(str, Enum):
    VERIFIED_AUTHENTIC = "verified_authentic"    # signed camera/edit provenance
    LIKELY_AUTHENTIC = "likely_authentic"
    INCONCLUSIVE = "inconclusive"
    LIKELY_AI = "likely_ai"
    CONFIRMED_AI = "confirmed_ai"                # signed AI-generator provenance


class EvidenceItem(BaseModel):
    layer: str
    signal: str
    direction: Direction
    weight: Weight
    explanation: str


class LayerResult(BaseModel):
    name: str
    status: str = "ok"  # ok | skipped | error
    evidence: list[EvidenceItem] = Field(default_factory=list)
    raw: dict = Field(default_factory=dict)
    note: str | None = None


class AnalysisReport(BaseModel):
    report_id: str
    sha256: str
    verdict: Verdict
    confidence: float = Field(ge=0, le=1)
    summary: str
    evidence: list[EvidenceItem]
    layers: dict[str, LayerResult]
    engine: str  # "claude" | "rules"
    cached: bool = False
