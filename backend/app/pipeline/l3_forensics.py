"""L3 — Classical image forensics (Pillow + NumPy only; Lambda-friendly).

Three cheap statistical probes. Each yields LOW-weight signals only —
forensics suggests, never proves. Thresholds are starting points to be
calibrated against a labeled test set (see ARCHITECTURE.md build order #2).

- ELA (Error Level Analysis): recompression residual uniformity
- Noise residual: sensor noise level (AI images are often too clean)
- FFT: radially-averaged spectrum slope (natural images follow ~1/f power law)
"""
from __future__ import annotations

import io

import numpy as np
from PIL import Image, ImageFilter

from ..models import Direction, EvidenceItem, LayerResult, Weight

MAX_ANALYSIS_DIM = 1024


def run(image_bytes: bytes) -> LayerResult:
    result = LayerResult(name="forensics")
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        result.status = "error"
        result.note = f"cannot open image: {exc}"
        return result

    if max(img.size) > MAX_ANALYSIS_DIM:
        img.thumbnail((MAX_ANALYSIS_DIM, MAX_ANALYSIS_DIM), Image.LANCZOS)

    arr = np.asarray(img, dtype=np.float32)
    gray = arr.mean(axis=2)

    _ela(img, result)
    _noise_residual(img, result)
    _fft_spectrum(gray, result)
    return result


def _ela(img: Image.Image, result: LayerResult) -> None:
    """Recompress at q=90 and measure residual statistics."""
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=90)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")
    diff = np.abs(np.asarray(img, np.float32) - np.asarray(recompressed, np.float32))
    mean, std = float(diff.mean()), float(diff.std())
    result.raw["ela"] = {"mean": round(mean, 3), "std": round(std, 3)}

    # Block-level variance of the residual: spliced/composited regions stand out.
    h, w = diff.shape[:2]
    bs = 32
    blocks = diff[: h // bs * bs, : w // bs * bs].mean(axis=2)
    blocks = blocks.reshape(h // bs, bs, w // bs, bs).mean(axis=(1, 3))
    block_spread = float(blocks.std())
    result.raw["ela"]["block_spread"] = round(block_spread, 3)

    if mean > 1.0 and block_spread > 2.5 * max(mean, 1e-6):
        result.evidence.append(EvidenceItem(
            layer="forensics", signal="ela_inconsistent_regions",
            direction=Direction.AI, weight=Weight.LOW,
            explanation="Error-level analysis shows regions with markedly different "
                        "compression history — possible splicing or local edits.",
        ))


def _noise_residual(img: Image.Image, result: LayerResult) -> None:
    """Sensor noise estimate: image minus median-filtered self."""
    denoised = img.filter(ImageFilter.MedianFilter(3))
    residual = np.asarray(img, np.float32) - np.asarray(denoised, np.float32)
    noise_std = float(residual.std())
    result.raw["noise"] = {"residual_std": round(noise_std, 3)}

    if noise_std < 1.2:
        result.evidence.append(EvidenceItem(
            layer="forensics", signal="abnormally_low_noise",
            direction=Direction.AI, weight=Weight.LOW,
            explanation="Almost no sensor noise detected. Real camera photos carry noise; "
                        "AI renders and heavily smoothed images often don't. "
                        "(Heavy compression can also cause this.)",
        ))
    elif noise_std > 4.0:
        result.evidence.append(EvidenceItem(
            layer="forensics", signal="natural_sensor_noise",
            direction=Direction.AUTHENTIC, weight=Weight.LOW,
            explanation="Noise profile consistent with a real camera sensor.",
        ))


def _fft_spectrum(gray: np.ndarray, result: LayerResult) -> None:
    """Radially-averaged power spectrum. Natural images: power ~ 1/f^alpha, alpha≈2.
    Strong deviation or periodic spikes hint at synthesis/upsampling artifacts."""
    f = np.fft.fftshift(np.fft.fft2(gray - gray.mean()))
    power = np.abs(f) ** 2
    h, w = power.shape
    cy, cx = h // 2, w // 2
    y, x = np.indices(power.shape)
    r = np.hypot(y - cy, x - cx).astype(int)
    rmax = min(cy, cx)
    radial = np.bincount(r.ravel(), power.ravel())[:rmax]
    counts = np.bincount(r.ravel())[:rmax]
    radial = radial / np.maximum(counts, 1)

    lo, hi = max(2, rmax // 20), rmax - 1
    freqs = np.arange(lo, hi)
    spectrum = radial[lo:hi]
    valid = spectrum > 0
    if valid.sum() < 10:
        return
    alpha, _ = np.polyfit(np.log(freqs[valid]), np.log(spectrum[valid]), 1)
    alpha = float(-alpha)
    result.raw["fft"] = {"spectral_slope_alpha": round(alpha, 3)}

    if alpha < 1.0 or alpha > 3.6:
        result.evidence.append(EvidenceItem(
            layer="forensics", signal="abnormal_frequency_spectrum",
            direction=Direction.AI, weight=Weight.LOW,
            explanation=f"Frequency spectrum slope (α={alpha:.2f}) deviates from the "
                        "~1/f² power law of natural photographs.",
        ))
