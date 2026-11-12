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
    """Cream paper card: wobbly paper shape with a baked soft shadow (no outline).

    The loose ink outline lives in a separate layer (ink_outline) so a watercolor
    tint can sit between paper and ink.
    """
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'>
<filter id='s' x='-10%' y='-10%' width='130%' height='130%'><feGaussianBlur stdDeviation='3'/></filter>
<filter id='d' x='-5%' y='-5%' width='110%' height='110%'>
<feTurbulence type='fractalNoise' baseFrequency='.03' numOctaves='2' seed='{seed}'/>
<feDisplacementMap in='SourceGraphic' scale='4'/></filter>
<rect x='6' y='9' width='190' height='188' rx='5' fill='#5a4638' fill-opacity='.15' filter='url(#s)'/>
<rect x='3' y='3' width='192' height='190' rx='5' fill='{fill}' filter='url(#d)'/></svg>""")


def ink_outline(seed: int, ink="#5a4638") -> str:
    """Loose, doubled pen line: a main wobbly stroke + a lighter second pass that
    lifts off in places (dash gaps) and drifts a little."""
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'>
<filter id='a' x='-5%' y='-5%' width='110%' height='110%'>
<feTurbulence type='fractalNoise' baseFrequency='.028' numOctaves='2' seed='{seed}'/>
<feDisplacementMap in='SourceGraphic' scale='5'/></filter>
<filter id='b' x='-5%' y='-5%' width='110%' height='110%'>
<feTurbulence type='fractalNoise' baseFrequency='.05' numOctaves='2' seed='{seed + 50}'/>
<feDisplacementMap in='SourceGraphic' scale='6'/></filter>
<rect x='3.5' y='3.5' width='191' height='189' rx='5' fill='none' stroke='{ink}' stroke-opacity='.66' stroke-width='1.35' vector-effect='non-scaling-stroke' filter='url(#a)'/>
<rect x='4.6' y='2.6' width='190' height='190' rx='6' fill='none' stroke='{ink}' stroke-opacity='.32' stroke-width='.9' stroke-dasharray='150 9 70 5 210 12' vector-effect='non-scaling-stroke' filter='url(#b)'/></svg>""")


def pressed(svg_body: str, vb: str, seed: int) -> str:
    """Pressed-flower specimen: flat translucent petals, a hint of wobble."""
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='{vb}'>
<filter id='p' x='-10%' y='-10%' width='120%' height='120%'>
<feTurbulence type='fractalNoise' baseFrequency='.12' numOctaves='2' seed='{seed}'/>
<feDisplacementMap in='SourceGraphic' scale='1.8'/></filter>
<g filter='url(#p)'>{svg_body}</g></svg>""")


# ——— Torn paper (path based: cheap to rasterize, no filters) ———————————————

def _side_depths(rnd: random.Random, length: float, base: float, rough: float):
    """Irregular, non-repeating tear profile along one side: returns [(t, depth)]."""
    pts = []
    t = 0.0
    # low-frequency drift: a few random sines + a bounded random walk
    waves = [(rnd.uniform(0.004, 0.02), rnd.uniform(0, 6.28), rnd.uniform(0.6, 2.2)) for _ in range(3)]
    walk = 0.0
    bite_left = 0
    bite_depth = 0.0
    while t < length:
        drift = sum(a * math.sin(f * t + ph) for f, ph, a in waves) * rough
        walk = max(-4.0, min(4.0, walk + rnd.uniform(-1.1, 1.1) * rough))
        jag = rnd.uniform(-1, 1) * 3.4 * rough
        if bite_left == 0 and rnd.random() < 0.035 * rough:
            bite_left = rnd.randint(2, 4)
            bite_depth = rnd.uniform(4, 10) * rough
        bite = 0.0
        if bite_left:
            bite = bite_depth * (1 - abs(bite_left - 2.5) / 3)
            bite_left -= 1
        d = base + drift + walk + jag + bite
        pts.append((t, max(1.5, min(24.0, d))))
        # mostly medium steps, sometimes tiny fibrous ones, sometimes long flat-ish runs
        r = rnd.random()
        t += rnd.uniform(1.2, 3) if r < 0.25 else rnd.uniform(9, 16) if r > 0.9 else rnd.uniform(3.5, 8)
    pts.append((length, max(1.5, min(24.0, base + rnd.uniform(-2, 2) * rough))))
    return pts

def _outline(rnd, W, H, base, roughs, extra=0.0, jitter=0.0):
    pts = []
    sides = [
        (W, lambda s, d: (s, d)),
        (H, lambda s, d: (W - d, s)),
        (W, lambda s, d: (W - s, H - d)),
        (H, lambda s, d: (d, H - s)),
    ]
    for (length, place), rough in zip(sides, roughs):
        for s, d in _side_depths(rnd, length, base, rough):
            d = max(0.3, d - extra + rnd.uniform(-jitter, jitter))
            x, y = place(s, d)
            pts.append(f"{x:.0f} {y:.0f}")
    return "M" + " L".join(pts) + "Z"


def tear_mask(seed: int) -> str:
    """Torn-paper silhouette for mask-image, unique per seed.

    Solid paper + a semi-transparent fibrous deckle fringe just outside it + a
    few loose fibers. Each side gets its own roughness (some nearly cut-straight).
    """
    rnd = random.Random(seed * 7919 + 13)
    W = H = 400
    roughs = []
    for _ in range(4):
        r = rnd.random()
        roughs.append(rnd.uniform(0.18, 0.35) if r < 0.18 else rnd.uniform(0.55, 1.35))
    base = rnd.uniform(9, 12)
    core = _outline(random.Random(seed), W, H, base, roughs)
    fringe = _outline(random.Random(seed), W, H, base, roughs, extra=2.4, jitter=1.6)
    fibers = []
    for _ in range(rnd.randint(4, 9)):
        side = rnd.randint(0, 3)
        s = rnd.uniform(20, 380)
        ln = rnd.uniform(2.5, 6)
        a = rnd.uniform(-0.6, 0.6)
        if side == 0:
            x1, y1, x2, y2 = s, base, s + ln * math.sin(a), base - ln
        elif side == 1:
            x1, y1, x2, y2 = W - base, s, W - base + ln, s + ln * math.sin(a)
        elif side == 2:
            x1, y1, x2, y2 = s, H - base, s + ln * math.sin(a), H - base + ln
        else:
            x1, y1, x2, y2 = base, s, base - ln, s + ln * math.sin(a)
        fibers.append(f"M{x1:.0f} {y1:.0f}L{x2:.1f} {y2:.1f}")
    return uri(f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' preserveAspectRatio='none'>
<path d='{fringe}' fill='#fff' fill-opacity='.45'/>
<path d='{core}' fill='#fff'/>
<path d='{"".join(fibers)}' stroke='#fff' stroke-opacity='.55' stroke-width='1.1' fill='none'/></svg>""")


def tear_strip(seed: int, amp=3.4, side_amp=2.2) -> str:
    """Clip-path torn strip with irregular spacing (labels, peeks, tape)."""
    rnd = random.Random(seed * 104729 + 7)

    def edge(y0, sign):
        pts = []
        x = 0.0
        walk = rnd.uniform(0, amp)
        while x < 100:
            walk = max(0.0, min(amp, walk + rnd.uniform(-1.2, 1.2)))
            y = walk + (rnd.uniform(0.8, 1.6) * amp if rnd.random() < 0.06 else 0)
            pts.append((x, y0 + sign * y))
            x += rnd.uniform(1.4, 7.5)
        pts.append((100, y0 + sign * rnd.uniform(0, amp)))
        return pts

    def ends(x0, sign):
        n = rnd.randint(3, 6)
        ys = sorted(rnd.uniform(8, 92) for _ in range(n))
        return [(x0 + sign * rnd.uniform(0, side_amp), y) for y in ys]

    top = edge(0, 1)
    right = ends(100, -1)
    bottom = list(reversed(edge(100, -1)))
    left = list(reversed(ends(0, 1)))
    pts = top + right + bottom + left
    return "polygon(" + ", ".join(f"{x:.1f}% {y:.1f}%" for x, y in pts) + ")"


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


PRESSED_VIOLA = pressed("""
<path d='M30 44c1 6 2 11 5 16' stroke='#8a9a6c' stroke-width='1.1' fill='none' stroke-linecap='round'/>
<g fill-opacity='.72' stroke-opacity='.55' stroke-width='.7'>
<path d='M30 30c-9-2-15-9-13-16 5-4 12 0 14 8z' fill='#c9a6c4' stroke='#8d6788'/>
<path d='M30 30c8-3 12-11 9-17-6-3-11 2-11 10z' fill='#bf9dc0' stroke='#8d6788'/>
<path d='M30 31c-10 1-17-3-18-9 4-4 12-2 17 5z' fill='#dcc0d4' stroke='#8d6788'/>
<path d='M30 31c9 0 16-4 16-10-4-4-11-2-15 5z' fill='#d8bcd2' stroke='#8d6788'/>
<path d='M30 31c-5 6-5 13 0 16 6-2 7-10 1-16z' fill='#f0d98f' stroke='#a88a3e'/></g>
<g stroke='#6f4d6c' stroke-opacity='.45' stroke-width='.5' fill='none'>
<path d='M30 30l-8-9M30 30l6-10M29 31l-10-3M31 31l10-3M30 32v8'/></g>
<circle cx='30' cy='31' r='1.6' fill='#e7b34b'/>""", "0 0 60 64", 21)

PRESSED_FERN = pressed("""
<path d='M8 70C18 52 26 34 44 6' stroke='#7f9767' stroke-width='1.2' fill='none' stroke-linecap='round'/>
<g fill='#a3b98b' fill-opacity='.68' stroke='#6f8a5a' stroke-opacity='.5' stroke-width='.6'>
<path d='M13 61c-5-1-8-4-8-7 4 0 7 3 8 7z'/><path d='M14 60c4-3 9-3 11-1-3 3-7 3-11 1z'/>
<path d='M18 52c-5-2-8-5-8-8 4 0 7 3 8 8z'/><path d='M19 51c4-3 9-4 11-2-3 3-7 4-11 2z'/>
<path d='M23 44c-5-2-7-5-7-8 4 1 6 3 7 8z'/><path d='M24 43c4-3 8-4 10-2-3 3-6 4-10 2z'/>
<path d='M28 36c-4-2-6-5-6-7 4 0 6 3 6 7z'/><path d='M29 35c4-2 7-3 9-1-3 2-6 3-9 1z'/>
<path d='M33 28c-4-1-5-4-5-6 3 0 5 2 5 6z'/><path d='M34 27c3-2 6-2 8-1-2 2-5 3-8 1z'/>
<path d='M38 20c-3-1-4-3-4-5 3 0 4 2 4 5z'/><path d='M39 19c3-2 5-2 6-1-2 2-4 2-6 1z'/></g>""", "0 0 52 74", 33)

PRESSED_DAISY = pressed("""
<path d='M26 30c-2 12-1 22 3 30' stroke='#8a9a6c' stroke-width='1' fill='none' stroke-linecap='round'/>
<g fill='#fbf1d8' fill-opacity='.82' stroke='#b89d70' stroke-opacity='.55' stroke-width='.6'>
<ellipse cx='26' cy='15' rx='3' ry='9'/><ellipse cx='26' cy='15' rx='3' ry='9' transform='rotate(40 26 24)'/>
<ellipse cx='26' cy='15' rx='3' ry='9' transform='rotate(85 26 24)'/><ellipse cx='26' cy='15' rx='3' ry='8' transform='rotate(130 26 24)'/>
<ellipse cx='26' cy='15' rx='3' ry='9' transform='rotate(178 26 24)'/><ellipse cx='26' cy='15' rx='3' ry='8.5' transform='rotate(222 26 24)'/>
<ellipse cx='26' cy='15' rx='3' ry='9' transform='rotate(270 26 24)'/><ellipse cx='26' cy='15' rx='3' ry='8' transform='rotate(315 26 24)'/></g>
<circle cx='26' cy='24' r='4.4' fill='#e3b25a' fill-opacity='.9'/><circle cx='26' cy='24' r='4.4' fill='none' stroke='#a4782f' stroke-opacity='.5' stroke-width='.6' stroke-dasharray='1 1.2'/>""", "0 0 52 62", 45)

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
    "--sb-ink-0": ink_outline(3),
    "--sb-ink-1": ink_outline(9),
    "--sb-ink-2": ink_outline(14, "#56604f"),
    "--sb-ink-3": ink_outline(19, "#4f5d5c"),
    "--img-pressed-viola": PRESSED_VIOLA,
    "--img-pressed-fern": PRESSED_FERN,
    "--img-pressed-daisy": PRESSED_DAISY,
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
    "--mask-torn-a": "var(--tear-mask-0)",
    "--mask-torn-b": "var(--tear-mask-5)",
    "--mask-torn-c": "var(--tear-mask-9)",
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
    "--clip-torn-strip": "var(--tear-strip-0)",
    "--clip-torn-strip-b": "var(--tear-strip-4)",
}
TEARS = 12
STRIPS = 8
for i in range(TEARS):
    vars_[f"--tear-mask-{i}"] = tear_mask(101 + i * 17)
for i in range(STRIPS):
    vars_[f"--tear-strip-{i}"] = tear_strip(301 + i * 23)

lines = [
    "/* AUTO-GENERATED by scripts/gen-look-assets.py — do not edit by hand. */",
    ":root {",
]
for k, v in vars_.items():
    lines.append(f"  {k}: {v};")
lines.append("}")
OUT.write_text("\n".join(lines) + "\n")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
