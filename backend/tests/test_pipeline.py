"""End-to-end pipeline tests with synthetic fixtures (no API key required)."""
import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from PIL.PngImagePlugin import PngInfo

from app.main import app
from app.models import Direction, Verdict
from app.pipeline import runner

client = TestClient(app)


def make_camera_jpeg() -> bytes:
    """Noisy image with camera EXIF — should lean authentic."""
    rng = np.random.default_rng(42)
    base = rng.integers(40, 215, (512, 512, 3), dtype=np.uint8)
    noise = rng.normal(0, 6, base.shape)
    arr = np.clip(base.astype(np.float32) + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)

    exif = img.getexif()
    exif[271] = "Canon"                 # Make
    exif[272] = "Canon EOS R6"          # Model
    exif[306] = "2026:06:01 10:00:00"   # DateTime
    ifd = exif.get_ifd(0x8769)
    ifd[33434] = (1, 250)               # ExposureTime
    ifd[33437] = (28, 10)               # FNumber
    ifd[34855] = 400                    # ISO
    ifd[36867] = "2026:06:01 10:00:00"  # DateTimeOriginal

    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=92, exif=exif)
    return buf.getvalue()


def make_sd_png() -> bytes:
    """Smooth gradient PNG with Stable Diffusion parameters chunk — should lean AI."""
    x = np.linspace(0, 255, 512, dtype=np.float32)
    arr = np.stack(np.broadcast_arrays(x[None, :], x[:, None], np.float32(128)), axis=-1).astype(np.uint8)
    img = Image.fromarray(arr)

    meta = PngInfo()
    meta.add_text("parameters",
                  "a photo of a cat, masterpiece\nNegative prompt: blurry\n"
                  "Steps: 30, Sampler: DPM++ 2M, CFG scale: 7, Seed: 12345, Model: sd_xl_base_1.0")
    buf = io.BytesIO()
    img.save(buf, "PNG", pnginfo=meta)
    return buf.getvalue()


def make_bare_png() -> bytes:
    """No metadata at all — should be inconclusive-ish."""
    rng = np.random.default_rng(7)
    arr = rng.integers(0, 255, (256, 256, 3), dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, "PNG")
    return buf.getvalue()


# ---------- pipeline-level ----------

def test_camera_jpeg_leans_authentic():
    report = runner.analyze(make_camera_jpeg(), "image/jpeg")
    assert report.verdict in (Verdict.LIKELY_AUTHENTIC, Verdict.INCONCLUSIVE)
    signals = {e.signal for e in report.evidence}
    assert "camera_exif_present" in signals
    assert report.engine == "rules"  # no API key in test env


def test_sd_png_flagged_ai():
    report = runner.analyze(make_sd_png(), "image/png")
    assert report.verdict in (Verdict.LIKELY_AI, Verdict.CONFIRMED_AI)
    signals = {e.signal for e in report.evidence}
    assert "sd_generation_params" in signals
    assert "ai_tool_fingerprint" in signals


def test_bare_image_never_confident():
    report = runner.analyze(make_bare_png(), "image/png")
    assert report.verdict in (Verdict.INCONCLUSIVE, Verdict.LIKELY_AUTHENTIC, Verdict.LIKELY_AI)
    # Without strong evidence, confidence must stay modest.
    if report.verdict != Verdict.INCONCLUSIVE:
        assert report.confidence <= 0.6


def test_evidence_directions_valid():
    report = runner.analyze(make_sd_png(), "image/png")
    assert all(isinstance(e.direction, Direction) for e in report.evidence)
    assert 0 <= report.confidence <= 1


# ---------- API-level ----------

def test_api_analyze_and_cache():
    data = make_sd_png()
    r1 = client.post("/v1/analyze", files={"file": ("x.png", data, "image/png")})
    assert r1.status_code == 200
    body = r1.json()
    assert body["verdict"] in ("likely_ai", "confirmed_ai")
    assert body["cached"] is False

    r2 = client.post("/v1/analyze", files={"file": ("x.png", data, "image/png")})
    assert r2.json()["cached"] is True

    r3 = client.get(f"/v1/report/{body['report_id']}")
    assert r3.status_code == 200


def test_api_rejects_bad_type():
    r = client.post("/v1/analyze", files={"file": ("x.txt", b"hello", "text/plain")})
    assert r.status_code == 415


def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert "claude_enabled" in body
    # Service flags reflect missing credentials in the test env.
    assert body["supabase_enabled"] is False
    assert body["upstash_enabled"] is False


# ---------- rate limiting / budget ----------

def make_distinct_png(seed: int) -> bytes:
    rng = np.random.default_rng(seed)
    arr = rng.integers(0, 255, (64, 64, 3), dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, "PNG")
    return buf.getvalue()


@pytest.fixture()
def clean_counters():
    from app import ratelimit
    ratelimit._local_counts.clear()
    yield
    ratelimit._local_counts.clear()


def test_rate_limit_blocks_after_quota(monkeypatch, clean_counters):
    from app.config import settings
    monkeypatch.setattr(settings, "rate_limit_anon_daily", 2)

    for i in range(2):
        r = client.post("/v1/analyze", files={"file": (f"a{i}.png", make_distinct_png(100 + i), "image/png")})
        assert r.status_code == 200
    r = client.post("/v1/analyze", files={"file": ("a2.png", make_distinct_png(102), "image/png")})
    assert r.status_code == 429
    assert "Sign in" in r.json()["detail"]


def test_cache_hit_does_not_burn_quota(monkeypatch, clean_counters):
    from app.config import settings
    monkeypatch.setattr(settings, "rate_limit_anon_daily", 1)

    data = make_distinct_png(200)
    r1 = client.post("/v1/analyze", files={"file": ("b.png", data, "image/png")})
    assert r1.status_code == 200
    # Quota exhausted, but the same image is served from cache — no 429.
    r2 = client.post("/v1/analyze", files={"file": ("b.png", data, "image/png")})
    assert r2.status_code == 200
    assert r2.json()["cached"] is True


def test_claude_budget_kill_switch(monkeypatch, clean_counters):
    from app import ratelimit
    from app.config import settings
    monkeypatch.setattr(settings, "claude_daily_call_budget", 1)

    assert ratelimit.claude_budget_ok() is True
    ratelimit.count_claude_use()
    assert ratelimit.claude_budget_ok() is False


def test_budget_off_forces_rules_engine():
    report = runner.analyze(make_sd_png(), "image/png", use_claude=False)
    assert report.engine == "rules"
    assert report.verdict in (Verdict.LIKELY_AI, Verdict.CONFIRMED_AI)


def test_history_requires_supabase():
    r = client.get("/v1/history")
    assert r.status_code == 501  # Supabase not configured in test env
