#!/usr/bin/env python3
"""Generate src/styles/assets.css — inline SVG textures + masks as CSS custom properties.

Run: python3 scripts/gen-look-assets.py
Everything is procedural (feTurbulence etc.) so the looks ship with no image files.
"""
import math
import random
from pathlib import Path
from urllib.parse import quote

OUT = Path(__file__).resolve().parent.parent / "src" / "styles" / "assets.css"


def uri(svg: str) -> str:
    svg = " ".join(svg.split())
    return 'url("data:image/svg+xml,' + quote(svg, safe=" =:/'.,-();") + '")'


def grain(freq: float, alpha: float, rgb=(0.1, 0.1, 0.14), size=180, seed=2) -> str:
    r, g, b = rgb
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}'>
<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='{freq}' numOctaves='3' seed='{seed}' stitchTiles='stitch'/>
<feColorMatrix values='0 0 0 0 {r} 0 0 0 0 {g} 0 0 0 0 {b} 0 0 0 {alpha} 0'/></filter>
<rect width='100%' height='100%' filter='url(#g)'/></svg>""")


def speckle(freq, rgb, a_mul, a_off, size=240, seed=7) -> str:
    r, g, b = rgb
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}'>
<filter id='c'><feTurbulence type='fractalNoise' baseFrequency='{freq}' numOctaves='3' seed='{seed}' stitchTiles='stitch'/>
<feColorMatrix values='0 0 0 0 {r} 0 0 0 0 {g} 0 0 0 0 {b} 0 0 0 {a_mul} {a_off}'/></filter>
<rect width='100%' height='100%' filter='url(#c)'/></svg>""")


def wash(fill: str, seed: int, opacity=0.5) -> str:
    """Watercolor blob: organic displaced ellipses with a pooled edge + lighter bloom."""
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 160' preserveAspectRatio='none'>
<filter id='w' x='-15%' y='-15%' width='130%' height='130%'>
<feTurbulence type='fractalNoise' baseFrequency='.022' numOctaves='4' seed='{seed}'/>
<feDisplacementMap in='SourceGraphic' scale='34'/><feGaussianBlur stdDeviation='1.1'/></filter>
<g filter='url(#w)'>
<ellipse cx='100' cy='80' rx='82' ry='60' fill='{fill}' fill-opacity='{opacity}'/>
<ellipse cx='96' cy='78' rx='74' ry='52' fill='{fill}' fill-opacity='.3'/>
<ellipse cx='88' cy='72' rx='44' ry='28' fill='#fff' fill-opacity='.22'/>
</g></svg>""")


def drawn_card(fill: str, seed: int, ink="#5a4638") -> str:
    """Cream paper card with a loose, wobbly ink outline and a baked soft shadow."""
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'>
<filter id='s' x='-10%' y='-10%' width='130%' height='130%'><feGaussianBlur stdDeviation='3'/></filter>
<filter id='d' x='-5%' y='-5%' width='110%' height='110%'>
<feTurbulence type='fractalNoise' baseFrequency='.045' numOctaves='2' seed='{seed}'/>
<feDisplacementMap in='SourceGraphic' scale='3.2'/></filter>
<rect x='6' y='9' width='190' height='188' rx='5' fill='#5a4638' fill-opacity='.16' filter='url(#s)'/>
<g filter='url(#d)'>
<rect x='3' y='3' width='192' height='190' rx='5' fill='{fill}'/>
<rect x='3' y='3' width='192' height='190' rx='5' fill='none' stroke='{ink}' stroke-opacity='.62' stroke-width='1.3' vector-effect='non-scaling-stroke'/>
</g></svg>""")


def torn_mask(seed: int, rough=11) -> str:
    """White torn-paper silhouette for mask-image (colors come from CSS)."""
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'>
<filter id='t' x='-5%' y='-5%' width='110%' height='110%'>
<feTurbulence type='fractalNoise' baseFrequency='.09' numOctaves='4' seed='{seed}'/>
<feDisplacementMap in='SourceGraphic' scale='{rough}'/></filter>
<rect x='6' y='6' width='188' height='188' fill='#fff' filter='url(#t)'/></svg>""")


def blob_mask(seed: int) -> str:
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 160' preserveAspectRatio='none'>
<filter id='w' x='-10%' y='-10%' width='120%' height='120%'>
<feTurbulence type='fractalNoise' baseFrequency='.03' numOctaves='3' seed='{seed}'/>
<feDisplacementMap in='SourceGraphic' scale='16'/><feGaussianBlur stdDeviation='.6'/></filter>
<rect x='10' y='10' width='180' height='140' rx='20' fill='#fff' filter='url(#w)'/></svg>""")


def star_polygon(points=14, inner=0.72, jitter=0.1, seed=4) -> str:
    rnd = random.Random(seed)
    pts = []
    for i in range(points * 2):
        ang = math.pi * i / points - math.pi / 2
        r = 50 if i % 2 == 0 else 50 * inner
        r *= 1 + rnd.uniform(-jitter, jitter)
        pts.append(f"{50 + r * math.cos(ang):.1f}% {50 + r * math.sin(ang):.1f}%")
    return "polygon(" + ", ".join(pts) + ")"


def torn_polygon(seed: int, amp=2.4, side=1.1, n=26) -> str:
    """Clip-path torn strip (used for small labels/tape where masks are overkill)."""
    rnd = random.Random(seed)
    pts = []
    for i in range(n + 1):
        pts.append(f"{100 * i / n:.1f}% {rnd.uniform(0, amp):.1f}%")
    for i in range(1, 4):
        pts.append(f"{100 - rnd.uniform(0, side):.1f}% {25 * i:.1f}%")
    for i in range(n, -1, -1):
        pts.append(f"{100 * i / n:.1f}% {100 - rnd.uniform(0, amp):.1f}%")
    for i in range(3, 0, -1):
        pts.append(f"{rnd.uniform(0, side):.1f}% {25 * i:.1f}%")
    return "polygon(" + ", ".join(pts) + ")"


def ticket_mask() -> str:
    # Notched ticket: perforation circles cut from both short ends.
    return uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' preserveAspectRatio='none'>
<mask id='m'><rect width='100' height='40' fill='#fff'/>
<circle cx='0' cy='20' r='5' fill='#000'/><circle cx='100' cy='20' r='5' fill='#000'/></mask>
<rect width='100' height='40' fill='#fff' mask='url(#m)'/></svg>""")


SPRIG = uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 60' fill='none'>
<path d='M20 58C20 40 19 24 22 4' stroke='#6f8b6c' stroke-width='1.4' stroke-linecap='round'/>
<g fill='#b9ccb2' stroke='#6f8b6c' stroke-width='1'>
<path d='M20 46c-6-1-10-5-11-10 6 0 10 4 11 10z'/><path d='M20.5 38c6-1 10-5 11-10-6 0-10 4-11 10z'/>
<path d='M20.5 28c-5-1-8-5-9-9 5 0 8 4 9 9z'/><path d='M21 20c5-1 8-4 9-8-5 0-8 3-9 8z'/></g>
<g fill='#f1b9a0' stroke='#b9786a' stroke-width='.9'><circle cx='22' cy='7' r='4'/><circle cx='22' cy='7' r='1.3' fill='#e8c9a0'/></g>
</svg>""")

FLOWER = uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>
<g fill='#f1b9a0' fill-opacity='.9' stroke='#b9786a' stroke-width='1'>
<ellipse cx='20' cy='10' rx='5' ry='8'/><ellipse cx='20' cy='30' rx='5' ry='8'/>
<ellipse cx='10' cy='20' rx='8' ry='5'/><ellipse cx='30' cy='20' rx='8' ry='5'/></g>
<circle cx='20' cy='20' r='4' fill='#e8c9a0' stroke='#b9786a'/></svg>""")

HEART = uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
<path d='M12 21s-7.5-4.6-9.4-8.4C1 9.4 2.6 5.8 6 5.4c2.2-.3 4 .9 6 3 2-2.1 3.8-3.3 6-3 3.4.4 5 4 3.4 7.2C19.5 16.4 12 21 12 21z'
fill='#e9a891' stroke='#9c6a5c' stroke-width='1.2' stroke-linejoin='round'/></svg>""")

COMIC_STAR = uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>
<path d='M20 2l5.3 11.6 12.7 1.4-9.5 8.6 2.7 12.4L20 29.7 8.8 36l2.7-12.4L2 15l12.7-1.4z'
fill='#FFD600' stroke='#111' stroke-width='3' stroke-linejoin='round'/></svg>""")

COMIC_HEART = uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
<path d='M12 21s-7.5-4.6-9.4-8.4C1 9.4 2.6 5.8 6 5.4c2.2-.3 4 .9 6 3 2-2.1 3.8-3.3 6-3 3.4.4 5 4 3.4 7.2C19.5 16.4 12 21 12 21z'
fill='#FF2ECC' stroke='#111' stroke-width='2.2' stroke-linejoin='round'/><path d='M6.5 8.5c.8-1 2-1.3 3-.9' stroke='#fff' stroke-width='1.6' stroke-linecap='round' fill='none'/></svg>""")

def comic_burst(fill, seed):
    rnd = random.Random(seed)
    pts = []
    n = 12
    for i in range(n * 2):
        ang = math.pi * i / n - math.pi / 2
        r = (46 if i % 2 == 0 else 30) * (1 + rnd.uniform(-0.08, 0.08))
        pts.append(f"{50 + r * math.cos(ang):.1f},{50 + r * math.sin(ang):.1f}")
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
<polygon points='{" ".join(pts)}' fill='{fill}' stroke='#111' stroke-width='5' stroke-linejoin='round'/>
<path d='M54 26 38 54h12l-5 22 17-30H50z' fill='#fff' stroke='#111' stroke-width='3.5' stroke-linejoin='round'/></svg>""")

COMIC_BURST = comic_burst("#FF2ECC", 5)
COMIC_BURST_Y = comic_burst("#FFD600", 8)

CROSSHAIR = uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' fill='none' stroke='#000' stroke-width='2'>
<circle cx='30' cy='30' r='14'/><path d='M30 4v52M4 30h52'/></svg>""")

RISO_ASTERISK = uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' fill='none' stroke='#000' stroke-width='3.2' stroke-linecap='round'>
<path d='M20 5v30M7 12.5l26 15M33 12.5l-26 15'/></svg>""")

BARCODE = uri("""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20' preserveAspectRatio='none' fill='#000'>
<rect x='0' width='2' height='20'/><rect x='4' width='1' height='20'/><rect x='7' width='3' height='20'/>
<rect x='12' width='1' height='20'/><rect x='15' width='2' height='20'/><rect x='19' width='1' height='20'/>
<rect x='22' width='3' height='20'/><rect x='27' width='1' height='20'/><rect x='30' width='2' height='20'/>
<rect x='34' width='1' height='20'/><rect x='37' width='3' height='20'/></svg>""")

vars_ = {
    # Paper + grain
    "--tex-grain": grain(0.85, 0.5),
    "--tex-grain-fine": grain(1.4, 0.42, seed=5, size=140),
    # Cork: dark pores + light flecks
    "--tex-cork-dark": speckle(0.42, (0.36, 0.22, 0.1), 3.2, -1.55, seed=7),
    "--tex-cork-mid": speckle(0.9, (0.45, 0.3, 0.15), 1.8, -0.75, seed=3, size=180),
    "--tex-cork-light": speckle(0.55, (0.99, 0.92, 0.76), 3.0, -1.6, seed=11, size=200),
    # Storybook watercolor washes
    "--wash-peach": wash("#f0b89c", 3),
    "--wash-sage": wash("#a9c2a0", 8),
    "--wash-duck": wash("#a9cbc7", 13),
    "--wash-cream": wash("#efe2c6", 21, 0.7),
    "--wash-apricot": wash("#ecc59b", 17),
    # Storybook hand-drawn cards (4 tones)
    "--sb-card-0": drawn_card("#fffaf1", 3),
    "--sb-card-1": drawn_card("#fcebe0", 9),
    "--sb-card-2": drawn_card("#eef3e8", 14),
    "--sb-card-3": drawn_card("#ebf3f1", 19),
    # Storybook pinned boards (opaque pastel paper)
    "--sb-board-0": drawn_card("#f6d6c3", 23),
    "--sb-board-1": drawn_card("#d5e2cc", 27),
    "--sb-board-2": drawn_card("#d2e5e2", 31),
    "--sb-board-3": drawn_card("#f7eedc", 35),
    # Masks
    "--mask-torn-a": torn_mask(4),
    "--mask-torn-b": torn_mask(9, 13),
    "--mask-torn-c": torn_mask(15, 9),
    "--mask-blob-a": blob_mask(5),
    "--mask-blob-b": blob_mask(12),
    "--mask-ticket": ticket_mask(),
    # Doodles
    "--img-sprig": SPRIG,
    "--img-flower": FLOWER,
    "--img-heart": HEART,
    "--img-comic-star": COMIC_STAR,
    "--img-asterisk": RISO_ASTERISK,
    "--img-barcode": BARCODE,
    "--img-comic-heart": COMIC_HEART,
    "--img-comic-burst": COMIC_BURST,
    "--img-comic-burst-y": COMIC_BURST_Y,
    "--mask-crosshair": CROSSHAIR,
    # Shapes
    "--clip-burst": star_polygon(14, 0.74, 0.08, 4),
    "--clip-burst-spiky": star_polygon(18, 0.62, 0.14, 9),
    "--clip-torn-strip": torn_polygon(3),
    "--clip-torn-strip-b": torn_polygon(8, 3.2, 1.4),
}

lines = [
    "/* AUTO-GENERATED by scripts/gen-look-assets.py — do not edit by hand. */",
    ":root {",
]
for k, v in vars_.items():
    lines.append(f"  {k}: {v};")
lines.append("}")
OUT.write_text("\n".join(lines) + "\n")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
