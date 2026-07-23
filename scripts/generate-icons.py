#!/usr/bin/env python3
"""Generate LastBag app icon assets from official bag-mark geometry (lastbag-icon.svg)."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images"
BRAND = (216, 90, 48)
WHITE = (255, 255, 255)


def qbez(p0: tuple[float, float], c: tuple[float, float], p1: tuple[float, float], n: int = 40):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t**2 * p1[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t**2 * p1[1]
        pts.append((x, y))
    return pts


def draw_icon(size: int, rounded: bool) -> Image.Image:
    scale = size / 1024
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def s(v: float) -> float:
        return v * scale

    if rounded:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(s(220)), fill=BRAND + (255,))
    else:
        d.rectangle([0, 0, size - 1, size - 1], fill=BRAND + (255,))

    d.rounded_rectangle(
        [s(332), s(396), s(332 + 360), s(396 + 292)],
        radius=int(s(72)),
        fill=WHITE + (255,),
    )

    sw = max(1, int(s(64)))
    r = max(1, sw // 2)
    d.line([(s(436), s(396)), (s(436), s(256))], fill=WHITE, width=sw)
    d.line([(s(588), s(396)), (s(588), s(256))], fill=WHITE, width=sw)

    handle = qbez((436, 256), (436, 148), (512, 148)) + qbez((512, 148), (588, 148), (588, 256))[1:]
    handle_s = [(s(x), s(y)) for x, y in handle]
    for x, y in handle_s:
        d.ellipse([x - r, y - r, x + r, y + r], fill=WHITE)
    if len(handle_s) > 1:
        d.line(handle_s, fill=WHITE, width=sw, joint="curve")
    for cx in (436, 588):
        d.ellipse([s(cx) - r, s(396) - r, s(cx) + r, s(396) + r], fill=WHITE)

    left_poly = qbez((512, 484), (512, 412), (450, 412)) + qbez((450, 412), (450, 484), (512, 484))[1:]
    right_poly = qbez((512, 484), (512, 412), (574, 412)) + qbez((574, 412), (574, 484), (512, 484))[1:]
    d.polygon([(s(x), s(y)) for x, y in left_poly], fill=BRAND + (255,))
    d.polygon([(s(x), s(y)) for x, y in right_poly], fill=BRAND + (255,))

    stem_w = max(1, int(s(28)))
    d.line([(s(512), s(640)), (s(512), s(490))], fill=BRAND, width=stem_w)
    sr = max(1, stem_w // 2)
    d.ellipse([s(512) - sr, s(640) - sr, s(512) + sr, s(640) + sr], fill=BRAND)

    return img


def extract_transparent_mark(icon: Image.Image) -> Image.Image:
    img = icon.convert("RGBA")
    w, h = img.size
    px = img.load()
    visited = [[False] * w for _ in range(h)]
    q = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    bg: set[tuple[int, int]] = set()

    def is_brand(r: int, g: int, b: int, a: int) -> bool:
        return a < 10 or (abs(r - 216) < 28 and abs(g - 90) < 28 and abs(b - 48) < 28)

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
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
    OUT.mkdir(parents=True, exist_ok=True)

    icon_sq = draw_icon(1024, rounded=False).convert("RGB")
    icon_sq.save(OUT / "icon.png", optimize=True)

    icon_round = draw_icon(1024, rounded=True)
    icon_round.save(OUT / "iconapp.png", optimize=True)

    mark = extract_transparent_mark(icon_round)
    mark.save(OUT / "splash-mark.png", optimize=True)
    mark.save(OUT / "splash-icon.png", optimize=True)

    draw_icon(512, rounded=True).save(OUT / "logo-mark.png", optimize=True)
    mark.resize((512, 512), Image.Resampling.LANCZOS).save(OUT / "logo-mark-light.png", optimize=True)

    safe = int(1024 * 0.66)
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    m = mark.resize((safe, safe), Image.Resampling.LANCZOS)
    fg.paste(m, ((1024 - safe) // 2, (1024 - safe) // 2), m)
    fg.save(OUT / "android-icon-foreground.png", optimize=True)
    Image.new("RGB", (1024, 1024), BRAND).save(OUT / "android-icon-background.png", optimize=True)

    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    fp, mp = fg.load(), mono.load()
    for y in range(1024):
        for x in range(1024):
            _r, _g, _b, a = fp[x, y]
            if a > 20:
                mp[x, y] = (255, 255, 255, 255)
    mono.save(OUT / "android-icon-monochrome.png", optimize=True)

    icon_sq.resize((48, 48), Image.Resampling.LANCZOS).save(OUT / "favicon.png", optimize=True)
    print("Generated LastBag icon assets from official bag-mark geometry")


if __name__ == "__main__":
    main()
