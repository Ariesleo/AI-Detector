#!/usr/bin/env python3
"""Generate Veritas PWA / favicon assets into web/public.

Brand: midnight background (#0a0f1e), a luminous teal→green "V" that doubles
as a checkmark (Veritas = verified / what is real). Run with the project's
Pillow:  python3 web/scripts/gen-icons.py
Regenerate any time the mark changes — icons are build artifacts, committed
for convenience but reproducible from this script alone.
"""
from __future__ import annotations

import math
import os

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), os.pardir, "public")
os.makedirs(OUT, exist_ok=True)

SS = 4  # supersample factor for crisp downscaled edges

# brand palette
ABYSS = (6, 10, 20)
DEEP = (18, 30, 56)        # lifted midnight for gradient core
GLOW = (45, 212, 191)      # teal accent (rgba(45,212,191))
STROKE = (110, 245, 215)   # bright mint for the crisp mark


def _radial_bg(size: int, full_bleed: bool, radius_frac: float) -> Image.Image:
    """Squircle (or full-bleed) tile with a radial midnight→abyss gradient
    plus a soft teal glow offset toward the mark."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    cx, cy = size / 2, size * 0.46
    maxd = math.hypot(size, size) / 2
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy) / maxd
            t = min(1.0, d * 1.15)
            r = int(DEEP[0] + (ABYSS[0] - DEEP[0]) * t)
            g = int(DEEP[1] + (ABYSS[1] - DEEP[1]) * t)
            b = int(DEEP[2] + (ABYSS[2] - DEEP[2]) * t)
            px[x, y] = (r, g, b, 255)

    if not full_bleed:
        # carve a rounded-square (squircle) alpha mask
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, size - 1, size - 1], radius=int(size * radius_frac), fill=255
        )
        img.putalpha(mask)
    return img


def _checkmark(size: int, content_frac: float) -> Image.Image:
    """A bold V/checkmark stroke with a teal glow on a transparent layer."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    inset = (1 - content_frac) / 2
    s = size

    def pt(fx: float, fy: float) -> tuple[int, int]:
        return (int((inset + fx * content_frac) * s), int((inset + fy * content_frac) * s))

    # checkmark vertices in unit content space
    p1 = pt(0.10, 0.46)
    p2 = pt(0.40, 0.78)
    p3 = pt(0.90, 0.16)
    w = int(s * content_frac * 0.14)

    def draw_stroke(draw: ImageDraw.ImageDraw, color, width: int) -> None:
        draw.line([p1, p2, p3], fill=color, width=width, joint="curve")
        for p in (p1, p2, p3):  # round the caps / joints
            r = width // 2
            draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=color)

    # glow pass (blurred teal, drawn fatter)
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_stroke(ImageDraw.Draw(glow), GLOW + (255,), int(w * 1.5))
    glow = glow.filter(ImageFilter.GaussianBlur(s * 0.035))
    layer = Image.alpha_composite(layer, glow)
    layer = Image.alpha_composite(layer, glow)  # double for intensity

    # crisp mark on top
    draw_stroke(ImageDraw.Draw(layer), STROKE + (255,), w)
    return layer


def build(px: int, *, full_bleed: bool, content_frac: float, radius_frac: float = 0.225) -> Image.Image:
    size = px * SS
    base = _radial_bg(size, full_bleed, radius_frac)
    mark = _checkmark(size, content_frac)
    if not full_bleed:  # clip the mark to the squircle too
        mark.putalpha(Image.composite(mark.getchannel("A"), Image.new("L", (size, size), 0), base.getchannel("A")))
    out = Image.alpha_composite(base, mark)
    return out.resize((px, px), Image.LANCZOS)


def save(img: Image.Image, name: str) -> None:
    path = os.path.join(OUT, name)
    img.save(path)
    print(f"  wrote {os.path.relpath(path)}")


def main() -> None:
    # standard ("any" purpose) — squircle with transparent corners
    save(build(192, full_bleed=False, content_frac=0.62), "icon-192.png")
    save(build(512, full_bleed=False, content_frac=0.62), "icon-512.png")
    # maskable — full bleed, mark inside the ~60% safe zone
    save(build(512, full_bleed=True, content_frac=0.52), "maskable-512.png")
    # iOS home screen — full bleed (iOS applies its own rounding)
    save(build(180, full_bleed=True, content_frac=0.60), "apple-touch-icon.png")
    # small favicon PNG fallback
    save(build(48, full_bleed=False, content_frac=0.64), "favicon-48.png")
    print("Done.")


if __name__ == "__main__":
    main()
