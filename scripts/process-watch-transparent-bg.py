"""Remove near-uniform studio backdrop from watch PNGs (border-sampled bg + tolerance)."""

from __future__ import annotations

import statistics
import sys
from pathlib import Path

from PIL import Image


def border_rgb_samples(im: Image.Image, band: int = 3) -> list[tuple[int, int, int]]:
    w, h = im.size
    out: list[tuple[int, int, int]] = []
    for x in range(w):
        for y in range(band):
            out.append(im.getpixel((x, y))[:3])
            out.append(im.getpixel((x, h - 1 - y))[:3])
    for y in range(h):
        for x in range(band):
            out.append(im.getpixel((x, y))[:3])
            out.append(im.getpixel((w - 1 - x, y))[:3])
    return out


def median_bg(samples: list[tuple[int, int, int]]) -> tuple[float, float, float]:
    rs = [s[0] for s in samples]
    gs = [s[1] for s in samples]
    bs = [s[2] for s in samples]
    return statistics.median(rs), statistics.median(gs), statistics.median(bs)


def dist_sq(r: int, g: int, b: int, br: float, bg: float, bb: float) -> float:
    return (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2


def main() -> None:
    if len(sys.argv) < 3 or (len(sys.argv) - 1) % 2 != 0:
        print(
            "Usage: process-watch-transparent-bg.py <in1> <out1> [in2 out2 ...]",
            file=sys.stderr,
        )
        sys.exit(2)

    pairs = list(zip(sys.argv[1::2], sys.argv[2::2]))
    tol = 52 * 52
    feather = 28 * 28

    for src_s, dst_s in pairs:
        src = Path(src_s)
        dst = Path(dst_s)
        im = Image.open(src).convert("RGBA")
        w, h = im.size
        br, bg_, bb = median_bg(border_rgb_samples(im))
        px = im.load()
        for y in range(h):
            for x in range(w):
                r, g, b, _a = px[x, y]
                d2 = dist_sq(r, g, b, br, bg_, bb)
                if d2 <= tol:
                    px[x, y] = (r, g, b, 0)
                elif d2 < tol + feather:
                    t = (d2 - tol) / feather
                    alpha = int(round(max(0.0, min(1.0, t)) * 255))
                    px[x, y] = (r, g, b, alpha)
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst)
        print(f"Wrote {dst}")


if __name__ == "__main__":
    main()
