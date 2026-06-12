"""L4 — Claude vision triage (optional; requires ANTHROPIC_API_KEY).

Semantic anomaly check: the things classical forensics can't see —
hands, garbled text, impossible reflections/shadows, texture "AI sheen".
Forced through a tool schema so output is structured, never free text.
"""
from __future__ import annotations

import base64
import io

from PIL import Image

from ..config import settings
from ..models import Direction, EvidenceItem, LayerResult, Weight

VISION_TOOL = {
    "name": "report_visual_findings",
    "description": "Report visual anomaly findings for the analyzed image.",
    "input_schema": {
        "type": "object",
        "properties": {
            "findings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "signal": {"type": "string", "description": "snake_case id, e.g. malformed_hands"},
                        "direction": {"type": "string", "enum": ["ai", "authentic", "neutral"]},
                        "weight": {"type": "string", "enum": ["low", "medium"]},
                        "explanation": {"type": "string"},
                    },
                    "required": ["signal", "direction", "weight", "explanation"],
                },
            },
            "overall_impression": {"type": "string"},
        },
        "required": ["findings", "overall_impression"],
    },
}

PROMPT = """Examine this image for visual evidence of AI generation or manipulation.

Check specifically: anatomy (hands, teeth, eyes, limb joints), text/signage legibility, \
reflections and shadows vs light sources, texture realism (skin/hair/fabric "AI sheen"), \
background object coherence, geometric consistency (perspective, repeated patterns).

Rules:
- Report only what you can actually see; do not speculate.
- A clean image is a finding too: report direction=neutral, signal=no_visual_anomalies.
- Maximum weight you may assign is "medium" — visual inspection is never conclusive. \
Modern generators often produce flawless images, and real photos can look odd.
- 0-5 findings, each one sentence."""


def run(image_bytes: bytes, enabled: bool = True) -> LayerResult:
    result = LayerResult(name="vision")
    if not settings.anthropic_api_key:
        result.status = "skipped"
        result.note = "ANTHROPIC_API_KEY not set"
        return result
    if not enabled:
        result.status = "skipped"
        result.note = "daily Claude budget reached — vision pass disabled until tomorrow"
        return result

    try:
        import anthropic

        media_type, b64 = _prepare(image_bytes)
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        resp = client.messages.create(
            model=settings.claude_vision_model,
            max_tokens=1024,
            tools=[VISION_TOOL],
            tool_choice={"type": "tool", "name": "report_visual_findings"},
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                    {"type": "text", "text": PROMPT},
                ],
            }],
        )
        payload = next(b.input for b in resp.content if b.type == "tool_use")
    except Exception as exc:
        result.status = "error"
        result.note = f"vision call failed: {exc}"
        return result

    result.raw["overall_impression"] = payload.get("overall_impression", "")
    for f in payload.get("findings", []):
        try:
            result.evidence.append(EvidenceItem(
                layer="vision",
                signal=f["signal"],
                direction=Direction(f["direction"]),
                weight=Weight(f["weight"]) if f["weight"] in ("low", "medium") else Weight.LOW,
                explanation=f["explanation"],
            ))
        except (KeyError, ValueError):
            continue
    return result


def _prepare(image_bytes: bytes) -> tuple[str, str]:
    """Downscale to the token-efficient cap and re-encode as JPEG."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    if max(img.size) > settings.max_image_dimension:
        img.thumbnail((settings.max_image_dimension,) * 2, Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    return "image/jpeg", base64.b64encode(buf.getvalue()).decode()
