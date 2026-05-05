"""Remove solid studio background via BFS from image edges (avoids eating dark dial details)."""

from __future__ import annotations

import statistics
import sys
from collections import deque
from pathlib import Path

from PIL import Image


def median_edge_rgb(im: Image.Image) -> tuple[float, float, float]:
    w, h = im.size
    px = im.load()
    samples: list[tuple[int, int, int]] = []
    for x in range(w):
        samples.append(px[x, 0][:3])
        samples.append(px[x, h - 1][:3])
    for y in range(h):
        samples.append(px[0, y][:3])
        samples.append(px[w - 1, y][:3])
    return (
        statistics.median(s[0] for s in samples),
        statistics.median(s[1] for s in samples),
        statistics.median(s[2] for s in samples),
    )


def dist_sq(
    r: int, g: int, b: int, br: float, bg: float, bb: float,
) -> float:
    return (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2


def main() -> None:
    if len(sys.argv) != 4:
        print(
            "Usage: remove-bg-flood-fill.py <input.png> <output.png> <tol:int>",
            file=sys.stderr,
        )
        sys.exit(2)
    tol = int(sys.argv[3])
    tol_sq = tol * tol
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    br, bg_, bb = median_edge_rgb(im)

    def near_bg(r: int, g: int, b: int) -> bool:
        return dist_sq(r, g, b, br, bg_, bb) <= tol_sq

    q: deque[tuple[int, int]] = deque()
    seen: set[tuple[int, int]] = set()

    def seed(x: int, y: int) -> None:
        if not (0 <= x < w and 0 <= y < h):
            return
        if (x, y) in seen:
            return
        r, g, b, _ = px[x, y]
        if near_bg(r, g, b):
            seen.add((x, y))
            q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        r, g, b, _a = px[x, y]
        px[x, y] = (r, g, b, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < w and 0 <= ny < h) or (nx, ny) in seen:
                continue
            r2, g2, b2, _ = px[nx, ny]
            if near_bg(r2, g2, b2):
                seen.add((nx, ny))
                q.append((nx, ny))

    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst)
    print(f"Wrote {dst} (flood, tol={tol})")


if __name__ == "__main__":
    main()
