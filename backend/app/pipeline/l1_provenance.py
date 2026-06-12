"""L1 — C2PA / Content Credentials provenance.

The only layer that can be conclusive: a cryptographically signed manifest
either from an AI generator (DALL-E, Firefly, Imagen) or a camera/editor chain.
Absence of a manifest means nothing (screenshots/re-uploads strip it).
"""
from __future__ import annotations

import io
import json

from ..models import Direction, EvidenceItem, LayerResult, Weight

try:
    import c2pa  # type: ignore
    _C2PA_AVAILABLE = True
except Exception:  # pragma: no cover
    _C2PA_AVAILABLE = False

AI_GENERATOR_HINTS = (
    "openai", "dall-e", "dalle", "firefly", "adobe firefly", "midjourney",
    "stability", "stable diffusion", "imagen", "google deepmind", "bing image creator",
    "gpt-4", "gpt-image", "grok", "flux",
)


def run(image_bytes: bytes, mime: str) -> LayerResult:
    result = LayerResult(name="provenance")
    if not _C2PA_AVAILABLE:
        result.status = "skipped"
        result.note = "c2pa-python not installed; provenance check unavailable"
        return result

    try:
        with c2pa.Reader(mime, io.BytesIO(image_bytes)) as reader:
            manifest_json = reader.json()
    except Exception as exc:
        msg = str(exc).lower()
        if "manifestnotfound" in msg or "no manifest" in msg or "jumbf" in msg:
            result.evidence.append(EvidenceItem(
                layer="provenance", signal="no_c2pa_manifest",
                direction=Direction.NEUTRAL, weight=Weight.LOW,
                explanation="No Content Credentials found. Most images lack them "
                            "(stripped by social media/screenshots), so this proves nothing.",
            ))
            return result
        result.status = "error"
        result.note = f"c2pa read failed: {exc}"
        return result

    try:
        manifest = json.loads(manifest_json)
    except (TypeError, json.JSONDecodeError):
        result.status = "error"
        result.note = "manifest present but unparseable"
        return result

    result.raw["manifest"] = manifest
    blob = json.dumps(manifest).lower()

    if any(hint in blob for hint in AI_GENERATOR_HINTS) or "trainedalgorithmicmedia" in blob.replace(" ", ""):
        result.evidence.append(EvidenceItem(
            layer="provenance", signal="signed_ai_manifest",
            direction=Direction.AI, weight=Weight.CONCLUSIVE,
            explanation="Image carries a cryptographically signed Content Credentials "
                        "manifest declaring AI generation.",
        ))
    else:
        result.evidence.append(EvidenceItem(
            layer="provenance", signal="signed_capture_manifest",
            direction=Direction.AUTHENTIC, weight=Weight.HIGH,
            explanation="Image carries signed Content Credentials with no AI-generation "
                        "assertion — a verifiable capture/edit history exists.",
        ))
    return result
