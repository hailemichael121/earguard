#!/usr/bin/env python3
"""Generate Android/iOS launcher icons from assets/icons/app-icon-source.png."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "icons"
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


def render_icon(source: Image.Image, size: int) -> Image.Image:
    source_rgba = source.convert("RGBA")
    if source_rgba.size == (size, size):
        return source_rgba.copy()
    return source_rgba.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)

    if not SOURCE_ASSET.exists():
        raise SystemExit(f"Missing source icon: {SOURCE_ASSET}")

    with Image.open(SOURCE_ASSET) as logo:
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
        (ios_dir / "Contents.json").write_text(
            json.dumps(contents, indent=2) + "\n",
            encoding="utf-8",
        )
        print("Done.")


if __name__ == "__main__":
    main()
