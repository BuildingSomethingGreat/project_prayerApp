"""App icons: the dawn light held in a rounded window, as on the splash screen.

Usage: python3 scripts/make_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icons"
TAUPE = (90, 68, 59)


def icon(size: int, inset: float) -> Image.Image:
    """`inset` is the margin around the orb as a fraction of the icon (larger for maskable)."""
    scale = 4
    s = size * scale
    art = Image.open(ROOT / "assets-src" / "higgsfield" / "dawn.png").convert("RGB")
    w, h = art.size
    art = art.crop((0, (h - w) // 2, w, (h + w) // 2)).filter(ImageFilter.GaussianBlur(6))

    m = int(s * inset)
    box = (m, m, s - m, s - m)
    radius = int((s - 2 * m) * 0.34)

    canvas = Image.new("RGB", (s, s), TAUPE)
    glow = Image.new("L", (s, s), 0)
    ImageDraw.Draw(glow).rounded_rectangle(box, radius, fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(s * 0.06))
    canvas.paste(Image.new("RGB", (s, s), (255, 200, 140)), mask=glow)

    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(s * 0.006))
    canvas.paste(art.resize((s, s), Image.LANCZOS), mask=mask)
    return canvas.resize((size, size), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
icon(192, 0.16).save(OUT / "icon-192.png")
icon(512, 0.16).save(OUT / "icon-512.png")
icon(512, 0.24).save(OUT / "icon-maskable-512.png")
icon(180, 0.14).save(OUT / "apple-touch-icon.png")
icon(64, 0.08).save(OUT / "favicon.png")
print("icons written to", OUT)
