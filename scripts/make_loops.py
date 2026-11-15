"""Turn the Higgsfield gradient stills into seamless, endlessly looping motion.

Each frame samples the still through a displacement field built from sinusoids
whose phase advances by a whole number of turns over the clip, so the last
frame flows into the first with no cut or crossfade.

Usage: python3 scripts/make_loops.py
Needs: numpy, Pillow, ffmpeg.
"""
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "higgsfield"
OUT = ROOT / "public" / "media"

W, H = 540, 960          # output size (portrait, phone-first)
FPS = 24
SECONDS = 20
FRAMES = FPS * SECONDS
TAU = 2 * np.pi

# (cycles per loop, x frequency, y frequency, phase, x amplitude, y amplitude)
# Amplitudes are fractions of the frame. Whole-number cycles keep the loop seamless.
WAVES = [
    (1, 0.9, 1.3, 0.0, 0.075, 0.050),
    (1, 1.7, 0.6, 1.9, 0.040, 0.065),
    (2, 0.5, 2.1, 4.1, 0.022, 0.028),
]


def sample(img: np.ndarray, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Bilinear sample with edge clamping."""
    h, w, _ = img.shape
    x = np.clip(x, 0, w - 1.001)
    y = np.clip(y, 0, h - 1.001)
    x0 = x.astype(np.int32)
    y0 = y.astype(np.int32)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]
    top = img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx
    bot = img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx
    return top * (1 - fy) + bot * fy


def render(name: str) -> None:
    still = Image.open(SRC / f"{name}.png").convert("RGB")
    # Blur away the baked-in grain so it doesn't swim; grain is re-added in CSS.
    # Oversize the source so displaced samples never reach the clamped edge.
    still = still.resize((int(W * 1.3), int(H * 1.3)), Image.LANCZOS)
    still = still.filter(ImageFilter.GaussianBlur(14))
    img = np.asarray(still, dtype=np.float32)
    sh, sw, _ = img.shape

    u, v = np.meshgrid(np.linspace(0, 1, W, dtype=np.float32),
                       np.linspace(0, 1, H, dtype=np.float32))
    base_x = (sw - W) / 2 + u * W
    base_y = (sh - H) / 2 + v * H

    OUT.mkdir(parents=True, exist_ok=True)
    mp4 = OUT / f"{name}.mp4"
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)],
        stdin=subprocess.PIPE)

    rng = np.random.default_rng(7)
    for i in range(FRAMES):
        t = i / FRAMES
        dx = np.zeros_like(u)
        dy = np.zeros_like(u)
        for cycles, fx, fy, phase, ax, ay in WAVES:
            arg = TAU * (cycles * t + fx * u + fy * v) + phase
            dx += ax * np.sin(arg)
            dy += ay * np.cos(arg * 0.9 + phase)
        frame = sample(img, base_x + dx * W, base_y + dy * H)
        # A slow breath of light, in and out once per loop.
        frame *= 1.0 + 0.035 * np.sin(TAU * t)
        # Sub-visible dither so 8-bit video doesn't band on smooth gradients.
        frame += rng.uniform(-0.6, 0.6, frame.shape[:2] + (1,)).astype(np.float32)
        out = np.clip(frame, 0, 255).astype(np.uint8)
        if i == 0:
            Image.fromarray(out).save(OUT / f"{name}.jpg", quality=82)
        ff.stdin.write(out.tobytes())
    ff.stdin.close()
    ff.wait()
    print(f"{name}: {mp4.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    for scene in ["dawn", "ember", "honey", "dusk"]:
        render(scene)
