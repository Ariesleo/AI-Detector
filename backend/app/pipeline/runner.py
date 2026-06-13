"""Pipeline orchestrator: hash → L1-L3 in parallel threads → L4 → L5 verdict."""
from __future__ import annotations

import hashlib
import uuid
from concurrent.futures import ThreadPoolExecutor

from ..models import AnalysisReport, LayerResult
from . import l1_provenance, l2_metadata, l3_forensics, l4_vision, l5_verdict


def analyze(image_bytes: bytes, mime: str = "image/jpeg", use_llm: bool = True) -> AnalysisReport:
    """use_llm=False disables the L4/L5 LLM calls (daily budget kill-switch)."""
    sha256 = hashlib.sha256(image_bytes).hexdigest()

    with ThreadPoolExecutor(max_workers=4) as pool:
        f1 = pool.submit(l1_provenance.run, image_bytes, mime)
        f2 = pool.submit(l2_metadata.run, image_bytes)
        f3 = pool.submit(l3_forensics.run, image_bytes)
        f4 = pool.submit(l4_vision.run, image_bytes, use_llm)
        layers: dict[str, LayerResult] = {
            "provenance": f1.result(),
            "metadata": f2.result(),
            "forensics": f3.result(),
            "vision": f4.result(),
        }

    evidence = [e for layer in layers.values() for e in layer.evidence]
    verdict, confidence, summary, engine = l5_verdict.aggregate(evidence, layers, use_llm=use_llm)

    return AnalysisReport(
        report_id=uuid.uuid4().hex[:12],
        sha256=sha256,
        verdict=verdict,
        confidence=confidence,
        summary=summary,
        evidence=evidence,
        layers=layers,
        engine=engine,
    )
