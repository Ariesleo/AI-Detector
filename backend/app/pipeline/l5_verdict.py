"""L5 — Verdict aggregation.

Two engines:
- claude: Sonnet weighs all evidence and writes the verdict via forced tool schema
- rules:  deterministic weighted scoring — fallback when no API key, and the
          sanity floor: conclusive provenance signals always override.
"""
from __future__ import annotations

import json

from ..config import settings
from ..models import Direction, EvidenceItem, LayerResult, Verdict, Weight

WEIGHT_SCORES = {Weight.LOW: 1.0, Weight.MEDIUM: 2.5, Weight.HIGH: 5.0, Weight.CONCLUSIVE: 100.0}

VERDICT_TOOL = {
    "name": "deliver_verdict",
    "description": "Deliver the final analysis verdict.",
    "input_schema": {
        "type": "object",
        "properties": {
            "verdict": {"type": "string", "enum": [v.value for v in Verdict]},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "summary": {"type": "string", "description": "2-4 sentences, plain language, cites the evidence"},
        },
        "required": ["verdict", "confidence", "summary"],
    },
}

PROMPT = """You are the reasoning layer of an AI-image detection pipeline. Below are the \
evidence signals collected by deterministic forensic layers and a vision pass.

Evidence:
{evidence}

Layer notes (skipped/errored layers):
{notes}

Rules for your verdict:
- A 'conclusive' provenance signal dictates the verdict outright (confirmed_ai or verified_authentic).
- 'high' metadata signals (e.g. Stable Diffusion parameter chunks) justify likely_ai with high confidence.
- 'low' forensic signals alone NEVER justify more than inconclusive — they are weak hints.
- Absence of evidence is not evidence of authenticity. Default toward inconclusive.
- Never overstate. False accusations harm real photographers; false clearances spread misinformation.
- confidence reflects evidence strength, not your gut feeling.
- summary: plain language, cite the specific evidence, note what could NOT be checked."""


def aggregate(evidence: list[EvidenceItem], layers: dict[str, LayerResult],
              use_claude: bool = True) -> tuple[Verdict, float, str, str]:
    """Returns (verdict, confidence, summary, engine).

    use_claude=False forces the rules engine (daily Claude budget kill-switch).
    """
    # Conclusive provenance short-circuits both engines.
    for e in evidence:
        if e.weight == Weight.CONCLUSIVE and e.direction == Direction.AI:
            return (Verdict.CONFIRMED_AI, 0.98,
                    "Cryptographically signed Content Credentials declare this image AI-generated.", "rules")

    if settings.anthropic_api_key and use_claude:
        try:
            return _claude_verdict(evidence, layers)
        except Exception:
            pass  # fall through to rules
    return _rules_verdict(evidence)


def _claude_verdict(evidence: list[EvidenceItem], layers: dict[str, LayerResult]) -> tuple[Verdict, float, str, str]:
    import anthropic

    notes = {n: f"{l.status}: {l.note}" for n, l in layers.items() if l.status != "ok"} or "none"
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    resp = client.messages.create(
        model=settings.claude_verdict_model,
        max_tokens=1024,
        tools=[VERDICT_TOOL],
        tool_choice={"type": "tool", "name": "deliver_verdict"},
        messages=[{"role": "user", "content": PROMPT.format(
            evidence=json.dumps([e.model_dump() for e in evidence], indent=1),
            notes=json.dumps(notes) if isinstance(notes, dict) else notes,
        )}],
    )
    payload = next(b.input for b in resp.content if b.type == "tool_use")
    return (Verdict(payload["verdict"]), max(0.0, min(1.0, float(payload["confidence"]))),
            payload["summary"], "claude")


def _rules_verdict(evidence: list[EvidenceItem]) -> tuple[Verdict, float, str, str]:
    ai = sum(WEIGHT_SCORES[e.weight] for e in evidence if e.direction == Direction.AI)
    auth = sum(WEIGHT_SCORES[e.weight] for e in evidence if e.direction == Direction.AUTHENTIC)
    net = ai - auth
    strong_ai = any(e.direction == Direction.AI and e.weight in (Weight.HIGH, Weight.CONCLUSIVE) for e in evidence)
    strong_auth = any(e.direction == Direction.AUTHENTIC and e.weight in (Weight.HIGH, Weight.CONCLUSIVE) for e in evidence)

    if strong_auth and not strong_ai:
        verdict, conf = Verdict.LIKELY_AUTHENTIC, min(0.85, 0.6 + auth / 25)
    elif strong_ai:
        verdict, conf = Verdict.LIKELY_AI, min(0.9, 0.65 + ai / 25)
    elif net >= 4.0:          # multiple medium/low AI signals, nothing authentic
        verdict, conf = Verdict.LIKELY_AI, 0.55
    elif net <= -3.0:
        verdict, conf = Verdict.LIKELY_AUTHENTIC, 0.55
    else:
        verdict, conf = Verdict.INCONCLUSIVE, 0.4

    ai_sig = [e.signal for e in evidence if e.direction == Direction.AI]
    auth_sig = [e.signal for e in evidence if e.direction == Direction.AUTHENTIC]
    summary = (f"Rule-based verdict (no Claude key configured). "
               f"AI-leaning signals: {', '.join(ai_sig) or 'none'}. "
               f"Authenticity signals: {', '.join(auth_sig) or 'none'}. "
               "Weak forensic hints alone are never treated as proof.")
    return verdict, round(conf, 2), summary, "rules"
