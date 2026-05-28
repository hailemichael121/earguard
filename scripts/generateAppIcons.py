#!/usr/bin/env python3
"""Generate Android/iOS launcher icons from assets/icons/app-icon-source.png."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "icons"
SOURCE_DOWNLOADS = Path.home() / "Downloads" / "Gemini_Generated_Image_kx3bo7kx3bo7kx3b.png"
SOURCE_ASSET = ASSETS / "app-icon-source.png"

ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

IOS_ICONS = [
    ("icon-20@2x.png", 40, "iphone", "2x", "20x20"),
    ("icon-20@3x.png", 60, "iphone", "3x", "20x20"),
    ("icon-29@2x.png", 58, "iphone", "2x", "29x29"),
    ("icon-29@3x.png", 87, "iphone", "3x", "29x29"),
    ("icon-40@2x.png", 80, "iphone", "2x", "40x40"),
    ("icon-40@3x.png", 120, "iphone", "3x", "40x40"),
    ("icon-60@2x.png", 120, "iphone", "2x", "60x60"),
    ("icon-60@3x.png", 180, "iphone", "3x", "60x60"),
    ("icon-1024.png", 1024, "ios-marketing", "1x", "1024x1024"),
]


def make_background(size: int) -> Image.Image:
    bg = Image.new("RGBA", (size, size))
    draw = ImageDraw.Draw(bg)
    top = (232, 244, 255, 255)  # light blue
    bottom = (240, 232, 255, 255)  # light purple
    for y in range(size):
        t = y / max(size - 1, 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,)
        draw.line([(0, y), (size, y)], fill=color)
    return bg


def render_icon(logo: Image.Image, size: int, padding_ratio: float = 0.12) -> Image.Image:
    canvas = make_background(size)
    pad = int(size * padding_ratio)
    inner = size - pad * 2
    logo_rgba = logo.convert("RGBA")
    logo_rgba.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    x = (size - logo_rgba.width) // 2
    y = (size - logo_rgba.height) // 2
    canvas.alpha_composite(logo_rgba, (x, y))
    return canvas.convert("RGB")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)

    if SOURCE_DOWNLOADS.exists() and not SOURCE_ASSET.exists():
        shutil.move(SOURCE_DOWNLOADS, SOURCE_ASSET)
    elif SOURCE_DOWNLOADS.exists():
        SOURCE_DOWNLOADS.unlink()

    if not SOURCE_ASSET.exists():
        raise SystemExit(f"Missing source icon: {SOURCE_ASSET}")

    logo = Image.open(SOURCE_ASSET)

    master = render_icon(logo, 1024)
    master_path = ASSETS / "app-icon.png"
    master.save(master_path, "PNG")
    print(f"Wrote {master_path}")

    android_res = ROOT / "android" / "app" / "src" / "main" / "res"
    for folder, px in ANDROID_SIZES.items():
        out_dir = android_res / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        icon = render_icon(logo, px)
        icon.save(out_dir / "ic_launcher.png", "PNG")
        icon.save(out_dir / "ic_launcher_round.png", "PNG")
        print(f"Wrote Android {folder} ({px}px)")

    ios_dir = ROOT / "ios" / "EarGuard" / "Images.xcassets" / "AppIcon.appiconset"
    ios_dir.mkdir(parents=True, exist_ok=True)
    images = []
    for filename, px, idiom, scale, size in IOS_ICONS:
        icon = render_icon(logo, px)
        icon.save(ios_dir / filename, "PNG")
        print(f"Wrote iOS {filename} ({px}px)")
        images.append(
            {
                "filename": filename,
                "idiom": idiom,
                "scale": scale,
                "size": size,
            }
        )

    contents = {"images": images, "info": {"author": "xcode", "version": 1}}
    (ios_dir / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n", encoding="utf-8")
    print("Done.")


if __name__ == "__main__":
    main()
