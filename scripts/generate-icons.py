#!/usr/bin/env python3
"""Generate LastBag app icon PNGs from assets/images/lastbag-icon.svg."""

from __future__ import annotations

from collections import deque
from io import BytesIO
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images"
SVG = OUT / "lastbag-icon.svg"
BRAND = (216, 90, 48)


def render_svg(size: int = 1024) -> Image.Image:
    png = cairosvg.svg2png(
        bytestring=SVG.read_bytes(),
        output_width=size,
        output_height=size,
    )
    return Image.open(BytesIO(png)).convert("RGBA")


def extract_mark(src: Image.Image) -> Image.Image:
    w, h = src.size
    px = src.load()
    visited = [[False] * w for _ in range(h)]
    q = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    bg: set[tuple[int, int]] = set()

    def is_brand(r: int, g: int, b: int, a: int) -> bool:
        return a < 8 or (abs(r - 216) < 30 and abs(g - 90) < 30 and abs(b - 48) < 30)

    while q:
        x, y = q.popleft()
        if not (0 <= x < w and 0 <= y < h) or visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if not is_brand(r, g, b, a):
            continue
        bg.add((x, y))
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            if (x, y) not in bg:
                op[x, y] = px[x, y]
    return out


def main() -> None:
    if not SVG.exists():
        raise FileNotFoundError(SVG)

    OUT.mkdir(parents=True, exist_ok=True)
    src = render_svg(1024)

    icon = Image.new("RGB", (1024, 1024), BRAND)
    icon.paste(src, (0, 0), src)
    icon.save(OUT / "icon.png", optimize=True)
    icon.save(OUT / "app-icon.png", optimize=True)

    src.save(OUT / "iconapp.png", optimize=True)
    src.resize((512, 512), Image.Resampling.LANCZOS).save(OUT / "logo-mark.png", optimize=True)

    mark = extract_mark(src)
    mark.save(OUT / "splash-mark.png", optimize=True)
    mark.save(OUT / "splash-logo.png", optimize=True)
    mark.save(OUT / "splash-icon.png", optimize=True)
    mark.resize((512, 512), Image.Resampling.LANCZOS).save(OUT / "logo-mark-light.png", optimize=True)

    safe = int(1024 * 0.66)
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    m = mark.resize((safe, safe), Image.Resampling.LANCZOS)
    fg.paste(m, ((1024 - safe) // 2, (1024 - safe) // 2), m)
    fg.save(OUT / "android-icon-foreground.png", optimize=True)
    Image.new("RGB", (1024, 1024), BRAND).save(OUT / "android-icon-background.png", optimize=True)

    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    fp, mop = fg.load(), mono.load()
    for y in range(1024):
        for x in range(1024):
            _r, _g, _b, a = fp[x, y]
            if a > 20:
                mop[x, y] = (255, 255, 255, 255)
    mono.save(OUT / "android-icon-monochrome.png", optimize=True)

    icon.resize((48, 48), Image.Resampling.LANCZOS).save(OUT / "favicon.png", optimize=True)
    print("Generated icon assets from", SVG.name)


if __name__ == "__main__":
    main()
