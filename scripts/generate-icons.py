#!/usr/bin/env python3
"""Generate LastBag app icon assets from assets/images/iconapp.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images"
SOURCE = OUT / "iconapp.png"

BRAND_RGB = (216, 90, 48)  # #D85A30 terracotta


def is_bg(r: int, g: int, b: int) -> bool:
    return r > 190 and 70 < g < 110 and 30 < b < 70 and r > g + 100


def is_white(r: int, g: int, b: int) -> bool:
    return r > 210 and g > 210 and b > 210


def load_source() -> Image.Image:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source artwork: {SOURCE}")
    return Image.open(SOURCE).convert("RGBA")


def resize_source(size: int) -> Image.Image:
    return load_source().resize((size, size), Image.Resampling.LANCZOS)


def extract_light_mark(size: int) -> Image.Image:
    """White sack only — transparent background (splash, adaptive foreground)."""
    src = resize_source(size)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    src_px = src.load()
    out_px = out.load()

    for y in range(size):
        for x in range(size):
            r, g, b, _a = src_px[x, y]
            if is_bg(r, g, b):
                out_px[x, y] = (0, 0, 0, 0)
            elif is_white(r, g, b):
                out_px[x, y] = (255, 255, 255, 255)
            else:
                # terracotta crease lines inside the sack
                out_px[x, y] = (255, 255, 255, 200)

    return out


def save_icon() -> None:
    resize_source(1024).convert("RGB").save(OUT / "icon.png", optimize=True)


def save_logo_mark() -> None:
    resize_source(512).save(OUT / "logo-mark.png", optimize=True)


def save_logo_mark_light() -> None:
    extract_light_mark(512).save(OUT / "logo-mark-light.png", optimize=True)


def save_android_foreground() -> None:
    extract_light_mark(1024).save(OUT / "android-icon-foreground.png", optimize=True)


def save_android_background() -> None:
    Image.new("RGB", (1024, 1024), BRAND_RGB).save(OUT / "android-icon-background.png", optimize=True)


def save_monochrome() -> None:
    extract_light_mark(1024).save(OUT / "android-icon-monochrome.png", optimize=True)


def save_splash() -> None:
    extract_light_mark(1024).save(OUT / "splash-mark.png", optimize=True)
    extract_light_mark(1024).save(OUT / "splash-icon.png", optimize=True)


def save_favicon() -> None:
    resize_source(48).convert("RGB").save(OUT / "favicon.png", optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    save_icon()
    save_logo_mark()
    save_logo_mark_light()
    save_android_foreground()
    save_android_background()
    save_monochrome()
    save_splash()
    save_favicon()
    print("Generated LastBag icon assets from", SOURCE)


if __name__ == "__main__":
    main()
