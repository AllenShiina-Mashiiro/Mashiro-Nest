"""Generate public/images/banner.svg — the hero illustration.

Composition: a hazy morning sky with a soft sun, drifting petals, depth-of-field
bokeh, and a single blossom branch entering from the top-left corner.

Run: python scripts/make-banner.py
"""

import math
import os
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "images", "banner.svg")

W, H = 1600, 640


def qbez(p0, c, p1, t):
    x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t**2 * p1[0]
    y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t**2 * p1[1]
    return x, y


def build():
    rnd = random.Random(77)
    p = []

    def add(s):
        p.append(s)

    add(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
        f'preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">'
    )
    add(
        """
<defs>
  <linearGradient id="sky" x1="0.05" y1="0" x2="0.95" y2="1">
    <stop offset="0" stop-color="#8fc4ee"/>
    <stop offset="0.24" stop-color="#b6dbf6"/>
    <stop offset="0.46" stop-color="#dcebf8"/>
    <stop offset="0.64" stop-color="#f6e8f2"/>
    <stop offset="0.82" stop-color="#fde3dd"/>
    <stop offset="1" stop-color="#f9d8e2"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fffdf2" stop-opacity="0.95"/>
    <stop offset="0.35" stop-color="#fff8e6" stop-opacity="0.55"/>
    <stop offset="0.7" stop-color="#fff2e2" stop-opacity="0.18"/>
    <stop offset="1" stop-color="#fff2e2" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="bokeh" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fffafd" stop-opacity="0.65"/>
    <stop offset="0.62" stop-color="#ffdcec" stop-opacity="0.32"/>
    <stop offset="0.92" stop-color="#fbc4dd" stop-opacity="0.12"/>
    <stop offset="1" stop-color="#fbc4dd" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="bokehLav" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fdf7ff" stop-opacity="0.6"/>
    <stop offset="0.62" stop-color="#e9d8f8" stop-opacity="0.3"/>
    <stop offset="1" stop-color="#d8c4f0" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="bark" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#4b4163"/>
    <stop offset="0.5" stop-color="#665980"/>
    <stop offset="1" stop-color="#3f3757"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#f8d6dd"/>
    <stop offset="0.38" stop-color="#f1bfcb"/>
    <stop offset="0.74" stop-color="#e7a9bb"/>
    <stop offset="1" stop-color="#d697a9"/>
  </linearGradient>
  <filter id="fog" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="40"/>
  </filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="10"/>
  </filter>
  <filter id="mini" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="2.4"/>
  </filter>
  <filter id="ray" x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur stdDeviation="26"/>
  </filter>
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
</defs>
"""
    )

    # ------------------------------------------------------------------ sky --
    add(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
    add(
        f'<circle cx="{W*0.70:.0f}" cy="{H*0.29:.0f}" r="{H*0.52:.0f}" fill="url(#sun)"/>'
    )

    # ------------------------------------------------------ atmospheric haze --
    add('<g filter="url(#fog)">')
    for cx, cy, rx, color, op in (
        (0.18, 0.16, 0.26, "#ffe7f1", 0.55),
        (0.52, 0.06, 0.30, "#ffdfeb", 0.45),
        (0.86, 0.20, 0.24, "#ffe9f2", 0.5),
        (0.38, 0.62, 0.30, "#fff1e6", 0.55),
        (0.72, 0.78, 0.26, "#ffe3e8", 0.4),
    ):
        add(
            f'<ellipse cx="{W*cx:.0f}" cy="{H*cy:.0f}" rx="{W*rx:.0f}" ry="{W*rx*0.55:.0f}" '
            f'fill="{color}" opacity="{op}"/>'
        )
    add("</g>")

    # ---------------------------------------------------------------- bokeh --
    add('<g filter="url(#soft)">')
    for _ in range(26):
        cx, cy = rnd.uniform(-0.05, 1.05), rnd.uniform(-0.05, 1.0)
        r = rnd.uniform(28, 96)
        add(
            f'<circle cx="{W*cx:.0f}" cy="{H*cy:.0f}" r="{r:.0f}" '
            f'fill="url(#{rnd.choice(["bokeh","bokeh","bokehLav"])})" '
            f'opacity="{rnd.uniform(0.25, 0.6):.2f}"/>'
        )
    add("</g>")

    # ------------------------------------------------------- blossom branch --
    branch_defs = [
        ((-0.04, -0.02), (0.14, 0.14), (0.34, 0.155), 26),
        ((0.16, 0.10), (0.20, 0.02), (0.30, -0.04), 10),
        ((0.24, 0.145), (0.33, 0.20), (0.43, 0.185), 8),
        ((0.13, 0.075), (0.16, 0.16), (0.20, 0.24), 7),
        ((0.32, 0.155), (0.36, 0.10), (0.40, 0.045), 5),
    ]

    add('<g fill="none" stroke="url(#bark)" stroke-linecap="round">')
    for (x0, y0), (cx, cy), (x1, y1), w in branch_defs:
        add(
            f'<path d="M {W*x0:.0f} {H*y0:.0f} Q {W*cx:.0f} {H*cy:.0f} {W*x1:.0f} {H*y1:.0f}" '
            f'stroke-width="{w}" opacity="0.85"/>'
        )
    add("</g>")
    add('<g fill="none" stroke="#b9a8c9" stroke-linecap="round" opacity="0.35">')
    for (x0, y0), (cx, cy), (x1, y1), w in branch_defs:
        add(
            f'<path d="M {W*x0:.0f} {H*y0:.0f} Q {W*cx:.0f} {H*cy:.0f} {W*x1:.0f} {H*y1:.0f}" '
            f'stroke-width="{max(1.5, w*0.28):.1f}" transform="translate(0 2)"/>'
        )
    add("</g>")

    clusters = []
    for (x0, y0), (cx, cy), (x1, y1), w in branch_defs:
        n = 5 if w >= 20 else 4 if w >= 8 else 3
        for i in range(n):
            t = 0.25 + 0.75 * (i / max(1, n - 1))
            bx, by = qbez((x0, y0), (cx, cy), (x1, y1), t)
            tx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx)
            ty = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy)
            norm = math.hypot(tx, ty) or 1
            side = -1 if i % 2 else 1
            off = side * rnd.uniform(0.018, 0.055)
            clusters.append((bx - ty / norm * off, by + tx / norm * off, 0.03 + 0.02 * t))

    add('<g filter="url(#soft)">')
    for bx, by, spread in clusters:
        for _ in range(6):
            add(
                f'<circle cx="{W*(bx + rnd.gauss(0, spread)):.0f}" '
                f'cy="{H*(by + rnd.gauss(0, spread*0.8)):.0f}" r="{rnd.uniform(10, 26):.0f}" '
                f'fill="url(#bokeh)" opacity="{rnd.uniform(0.4, 0.8):.2f}"/>'
            )
    add("</g>")

    # out-of-focus blossoms framing the top edge
    for fx in (0.44, 0.56, 0.66, 0.90, 0.97):
        clusters.append((fx, -0.02, 0.035))

    petal_colors = [
        "#ffffff", "#fff9fd", "#ffeef6", "#ffe1ef", "#fdd2e6",
        "#fac6de", "#f6cdea", "#eecff4",
    ]
    add('<g filter="url(#mini)">')
    for bx, by, spread in clusters:
        for _ in range(46):
            cx = bx + rnd.gauss(0, spread * 1.25)
            cy = by + rnd.gauss(0, spread * 1.0)
            r = rnd.uniform(2.2, 6.2) * (1.35 if rnd.random() < 0.12 else 1)
            add(
                f'<circle cx="{W*cx:.0f}" cy="{H*cy:.0f}" r="{r:.1f}" '
                f'fill="{rnd.choice(petal_colors)}" opacity="{rnd.uniform(0.5, 0.95):.2f}"/>'
            )
    add("</g>")

    add('<g opacity="0.85">')
    for bx, by, spread in clusters:
        for _ in range(6):
            add(
                f'<circle cx="{W*(bx + rnd.gauss(0, spread*1.2)):.0f}" '
                f'cy="{H*(by + rnd.gauss(0, spread)):.0f}" r="{rnd.uniform(1.1, 2.4):.1f}" '
                f'fill="#ffffff" opacity="{rnd.uniform(0.6, 0.95):.2f}"/>'
            )
    add("</g>")

    # --------------------------------------------------------------- petals --
    add('<g filter="url(#soft)" opacity="0.4">')
    for _ in range(16):
        px, py = rnd.uniform(0, W), rnd.uniform(0, H)
        s = rnd.uniform(10, 18)
        add(
            f'<ellipse cx="{px:.0f}" cy="{py:.0f}" rx="{s:.1f}" ry="{s*0.55:.1f}" fill="#ffffff" '
            f'opacity="{rnd.uniform(0.25, 0.5):.2f}" transform="rotate({rnd.uniform(0,180):.0f} {px:.0f} {py:.0f})"/>'
        )
    add("</g>")

    # drifting petals, denser towards the right/bottom
    add("<g>")
    for _ in range(200):
        px = rnd.uniform(0, W) * (0.6 + 0.4 * rnd.random())
        py = rnd.uniform(0, H)
        s = rnd.uniform(2.2, 6.6)
        op = rnd.uniform(0.35, 0.95) * (1 - 0.5 * (py / H))
        paint = rnd.choice(
            ["#ffffff", "#ffe8f2", "#fbd2e6", "#f7c0da", "#d6dff8", "#e8d3f7"]
        )
        add(
            f'<ellipse cx="{px:.0f}" cy="{py:.0f}" rx="{s:.1f}" ry="{s*0.5:.1f}" fill="{paint}" '
            f'opacity="{op:.2f}" transform="rotate({rnd.uniform(0,180):.0f} {px:.0f} {py:.0f})"/>'
        )
    add("</g>")

    # ----------------------------------------------------------- light rays --
    add('<g filter="url(#ray)">')
    for i in range(3):
        x = W * (0.58 + i * 0.14)
        add(
            f'<polygon points="{x:.0f},0 {x+130:.0f},0 {x+10:.0f},{H:.0f} {x-120:.0f},{H:.0f}" '
            f'fill="#ffffff" opacity="{rnd.uniform(0.05, 0.09):.2f}"/>'
        )
    add("</g>")

    # -------------------------------------------------------- window frame ---
    for x, w in ((-4, 42), (W - 38, 42)):
        add(f'<rect x="{x}" y="0" width="{w}" height="{H}" fill="url(#wood)" opacity="0.9"/>')
        for j in range(4):
            gx = x + 5 + j * (w / 4)
            add(f'<rect x="{gx:.0f}" y="0" width="1.2" height="{H}" fill="#b8768c" opacity="0.15"/>')
        add(f'<rect x="{x + 2}" y="0" width="2" height="{H}" fill="#ffe2e9" opacity="0.4"/>')
        add(f'<rect x="{x + w - 3}" y="0" width="3" height="{H}" fill="#bd7c90" opacity="0.55"/>')

        for _ in range(5):
            cxp = x + rnd.uniform(6, w - 6)
            cyp = rnd.uniform(0, H)
            for _ in range(rnd.randint(2, 3)):
                fx = cxp + rnd.uniform(-10, 10)
                fy = cyp + rnd.uniform(-16, 16)
                fr = rnd.uniform(4.0, 7.2)
                for k in range(5):
                    a = k * (2 * math.pi / 5) + rnd.uniform(-0.25, 0.25)
                    qx = fx + math.cos(a) * fr
                    qy = fy + math.sin(a) * fr
                    add(
                        f'<ellipse cx="{qx:.1f}" cy="{qy:.1f}" rx="{fr*0.9:.1f}" ry="{fr*0.5:.1f}" '
                        f'fill="{rnd.choice(["#5b7fd4", "#6d90e0", "#4a6fc4"])}" opacity="0.78" '
                        f'transform="rotate({math.degrees(a):.0f} {qx:.1f} {qy:.1f})"/>'
                    )
                add(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="{fr*0.34:.1f}" fill="#fff3c4" opacity="0.85"/>')

    # ------------------------------------------------------------- finishing -
    add(f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity="0.05"/>')
    add(
        f'<rect width="{W}" height="{H}" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>'
    )
    add("</svg>")

    return "".join(p)


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(build())
    print("banner written:", OUT)
