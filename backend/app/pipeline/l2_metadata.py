"""L2 — Metadata analysis (EXIF, PNG text chunks, XMP, software tags).

Pure-Python via Pillow. Looks for:
- AI-tool fingerprints (Stable Diffusion 'parameters' chunk, AI software tags, XMP hints)
- Camera capture evidence (make/model, exposure, GPS) — supports authenticity
- Absence of everything — weak AI lean (but screenshots also produce this)
"""
from __future__ import annotations

import io
import re

from PIL import Image
from PIL.ExifTags import TAGS

from ..models import Direction, EvidenceItem, LayerResult, Weight

AI_SOFTWARE_PATTERNS = re.compile(
    r"(stable.?diffusion|midjourney|dall.?e|firefly|imagen|leonardo\.ai|nightcafe|"
    r"artbreeder|runway|flux\.?1|comfyui|automatic1111|invokeai|novelai|niji|"
    r"sd_?xl|sd[ _-]?v?[12]\.[0-9]|dreamshaper|juggernaut[ _-]?xl|realvis|"
    r"bing image creator|ideogram|recraft|grok)", re.IGNORECASE)

SD_CHUNK_KEYS = {"parameters", "prompt", "workflow", "negative_prompt", "sd-metadata"}

CAMERA_TAGS = {"Make", "Model", "ExposureTime", "FNumber", "ISOSpeedRatings",
               "FocalLength", "LensModel", "GPSInfo", "DateTimeOriginal"}


def run(image_bytes: bytes) -> LayerResult:
    result = LayerResult(name="metadata")
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.load()
    except Exception as exc:
        result.status = "error"
        result.note = f"cannot open image: {exc}"
        return result

    result.raw["format"] = img.format
    result.raw["size"] = list(img.size)

    text_blobs: list[str] = []

    # --- PNG text chunks (Stable Diffusion & ComfyUI write generation params here) ---
    png_text = dict(getattr(img, "text", {}) or {})
    if png_text:
        result.raw["png_text_keys"] = list(png_text.keys())
        text_blobs.extend(f"{k}={v}" for k, v in png_text.items())
        sd_keys = SD_CHUNK_KEYS & {k.lower() for k in png_text}
        if sd_keys:
            result.evidence.append(EvidenceItem(
                layer="metadata", signal="sd_generation_params",
                direction=Direction.AI, weight=Weight.HIGH,
                explanation=f"PNG contains AI-generation parameter chunks ({', '.join(sorted(sd_keys))}) "
                            "— written by Stable Diffusion-family tools.",
            ))

    # --- EXIF ---
    exif = img.getexif()
    exif_named: dict[str, str] = {}
    for tag_id, value in exif.items():
        name = TAGS.get(tag_id, str(tag_id))
        exif_named[name] = str(value)[:200]
    # IFD sub-blocks (ExposureTime etc. live in Exif IFD)
    try:
        for tag_id, value in exif.get_ifd(0x8769).items():
            exif_named[TAGS.get(tag_id, str(tag_id))] = str(value)[:200]
    except Exception:
        pass
    if exif_named:
        result.raw["exif"] = exif_named
        text_blobs.extend(f"{k}={v}" for k, v in exif_named.items())

    # --- XMP ---
    xmp = img.info.get("xmp") or img.info.get("XML:com.adobe.xmp")
    if xmp:
        xmp_str = xmp.decode("utf-8", "ignore") if isinstance(xmp, bytes) else str(xmp)
        text_blobs.append(xmp_str)
        if "digitalsourcetype" in xmp_str.lower() and "trainedalgorithmicmedia" in xmp_str.lower().replace(" ", ""):
            result.evidence.append(EvidenceItem(
                layer="metadata", signal="iptc_ai_source_type",
                direction=Direction.AI, weight=Weight.HIGH,
                explanation="XMP declares digitalSourceType=trainedAlgorithmicMedia — "
                            "the IPTC standard label for AI-generated media.",
            ))

    # --- AI software fingerprints across all text ---
    combined = "\n".join(text_blobs)
    match = AI_SOFTWARE_PATTERNS.search(combined)
    if match:
        result.evidence.append(EvidenceItem(
            layer="metadata", signal="ai_tool_fingerprint",
            direction=Direction.AI, weight=Weight.HIGH,
            explanation=f"Metadata references AI tool '{match.group(0)}'.",
        ))

    # --- Camera capture evidence ---
    camera_present = CAMERA_TAGS & exif_named.keys()
    if {"Make", "Model"} <= camera_present and len(camera_present) >= 4:
        result.evidence.append(EvidenceItem(
            layer="metadata", signal="camera_exif_present",
            direction=Direction.AUTHENTIC, weight=Weight.MEDIUM,
            explanation=f"Camera capture metadata present ({', '.join(sorted(camera_present))}). "
                        "Forgeable, but consistent with a real photo.",
        ))
    elif not exif_named and not png_text:
        result.evidence.append(EvidenceItem(
            layer="metadata", signal="no_metadata",
            direction=Direction.NEUTRAL, weight=Weight.LOW,
            explanation="No EXIF or embedded metadata at all. Typical of AI output, but also "
                        "of screenshots and social-media re-uploads.",
        ))
    return result
