"""Generate the static SVG artwork used by the site.

Run with:  python scripts/make-art.py
Outputs:   public/images/banner.svg, avatar.svg, og.svg, favicon.svg,
           public/images/covers/*.svg
"""

import math
import os
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "public", "images")
COVERS = os.path.join(IMG, "covers")

random.seed(20250120)


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


# The hero banner lives in scripts/make-banner.py


# ---------------------------------------------------------------- covers ---

COVER_SPECS = [
    ("markdown", ["#ffe6f0", "#ffd0e4"], ["#f9a8c9", "#c6a4f0"], "hash"),
    ("example", ["#e8f3ff", "#d7e6ff"], ["#9cc0f7", "#b6a6f2"], "spark"),
    ("video", ["#ffe9e2", "#ffd7cb"], ["#f7a98c", "#f2c1d8"], "play"),
    ("architecture", ["#e6f7f2", "#d2efe7"], ["#7fd3bb", "#9fb8f4"], "grid"),
    ("database", ["#eef1ff", "#dfe4ff"], ["#a8b4f5", "#8fd8e8"], "stack"),
    ("redis", ["#ffe9ec", "#ffd9df"], ["#f8949f", "#f7b9c6"], "layers"),
    ("storage", ["#e9f6ff", "#d6ecff"], ["#8cc8f0", "#a9e2d0"], "bucket"),
    ("design", ["#fdf1ff", "#f3e2ff"], ["#c9a4f0", "#f9b4cf"], "shapes"),
    ("sakura", ["#ffeef5", "#ffdfec"], ["#f7a8c4", "#e3b6f0"], "flower"),
]


def glyph(kind, cx, cy, size, color):
    s = size
    if kind == "hash":
        return (
            f'<g stroke="{color}" stroke-width="{s*0.1:.1f}" stroke-linecap="round" opacity="0.5">'
            f'<line x1="{cx-s*0.28:.0f}" y1="{cy-s*0.42:.0f}" x2="{cx-s*0.12:.0f}" y2="{cy+s*0.42:.0f}"/>'
            f'<line x1="{cx+s*0.12:.0f}" y1="{cy-s*0.42:.0f}" x2="{cx+s*0.28:.0f}" y2="{cy+s*0.42:.0f}"/>'
            f'<line x1="{cx-s*0.45:.0f}" y1="{cy-s*0.14:.0f}" x2="{cx+s*0.45:.0f}" y2="{cy-s*0.14:.0f}"/>'
            f'<line x1="{cx-s*0.45:.0f}" y1="{cy+s*0.14:.0f}" x2="{cx+s*0.45:.0f}" y2="{cy+s*0.14:.0f}"/>'
            f"</g>"
        )
    if kind == "spark":
        return (
            f'<path d="M {cx} {cy-s*0.5} L {cx+s*0.12} {cy-s*0.12} L {cx+s*0.5} {cy} '
            f'L {cx+s*0.12} {cy+s*0.12} L {cx} {cy+s*0.5} L {cx-s*0.12} {cy+s*0.12} '
            f'L {cx-s*0.5} {cy} L {cx-s*0.12} {cy-s*0.12} Z" fill="{color}" opacity="0.45"/>'
        )
    if kind == "play":
        return (
            f'<circle cx="{cx}" cy="{cy}" r="{s*0.52:.0f}" fill="none" stroke="{color}" '
            f'stroke-width="{s*0.07:.1f}" opacity="0.45"/>'
            f'<path d="M {cx-s*0.14:.0f} {cy-s*0.22:.0f} L {cx+s*0.24:.0f} {cy} '
            f'L {cx-s*0.14:.0f} {cy+s*0.22:.0f} Z" fill="{color}" opacity="0.55"/>'
        )
    if kind == "grid":
        out = []
        for i in range(4):
            for j in range(4):
                r = s * 0.045
                out.append(
                    f'<circle cx="{cx-s*0.36+i*s*0.24:.0f}" cy="{cy-s*0.36+j*s*0.24:.0f}" '
                    f'r="{r:.1f}" fill="{color}" opacity="0.4"/>'
                )
        return "".join(out)
    if kind == "stack":
        out = []
        for i in range(3):
            out.append(
                f'<ellipse cx="{cx}" cy="{cy-s*0.22+i*s*0.22:.0f}" rx="{s*0.4:.0f}" '
                f'ry="{s*0.13:.0f}" fill="none" stroke="{color}" stroke-width="{s*0.06:.1f}" opacity="0.45"/>'
            )
        return "".join(out)
    if kind == "layers":
        out = []
        for i in range(3):
            y = cy - s * 0.26 + i * s * 0.26
            out.append(
                f'<path d="M {cx-s*0.42:.0f} {y:.0f} L {cx} {y-s*0.18:.0f} L {cx+s*0.42:.0f} {y:.0f} '
                f'L {cx} {y+s*0.18:.0f} Z" fill="{color}" opacity="{0.22+0.14*i:.2f}"/>'
            )
        return "".join(out)
    if kind == "bucket":
        return (
            f'<path d="M {cx-s*0.34:.0f} {cy-s*0.3:.0f} L {cx-s*0.24:.0f} {cy+s*0.36:.0f} '
            f'L {cx+s*0.24:.0f} {cy+s*0.36:.0f} L {cx+s*0.34:.0f} {cy-s*0.3:.0f} Z" '
            f'fill="none" stroke="{color}" stroke-width="{s*0.07:.1f}" opacity="0.45"/>'
            f'<ellipse cx="{cx}" cy="{cy-s*0.3:.0f}" rx="{s*0.34:.0f}" ry="{s*0.11:.0f}" '
            f'fill="none" stroke="{color}" stroke-width="{s*0.07:.1f}" opacity="0.45"/>'
        )
    if kind == "shapes":
        return (
            f'<circle cx="{cx-s*0.18:.0f}" cy="{cy-s*0.1:.0f}" r="{s*0.28:.0f}" fill="{color}" opacity="0.35"/>'
            f'<rect x="{cx-s*0.02:.0f}" y="{cy-s*0.02:.0f}" width="{s*0.5:.0f}" height="{s*0.5:.0f}" '
            f'rx="{s*0.1:.0f}" fill="{color}" opacity="0.3" transform="rotate(18 {cx+s*0.2:.0f} {cy+s*0.2:.0f})"/>'
        )
    # flower
    out = []
    for k in range(5):
        a = k * (2 * math.pi / 5) - math.pi / 2
        px = cx + math.cos(a) * s * 0.22
        py = cy + math.sin(a) * s * 0.22
        out.append(
            f'<ellipse cx="{px:.0f}" cy="{py:.0f}" rx="{s*0.2:.0f}" ry="{s*0.13:.0f}" '
            f'fill="{color}" opacity="0.4" transform="rotate({math.degrees(a)+90:.0f} {px:.0f} {py:.0f})"/>'
        )
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{s*0.07:.0f}" fill="#ffffff" opacity="0.7"/>')
    return "".join(out)


def cover(name, base, accent, kind):
    rnd = random.Random(name)
    w, h = 960, 640
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">',
        f"""<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{base[0]}"/>
    <stop offset="1" stop-color="{base[1]}"/>
  </linearGradient>
  <filter id="blur" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="46"/>
  </filter>
</defs>""",
        f'<rect width="{w}" height="{h}" fill="url(#bg)"/>',
        '<g filter="url(#blur)">',
    ]
    for i in range(5):
        cx = rnd.uniform(0, w)
        cy = rnd.uniform(0, h)
        r = rnd.uniform(120, 280)
        color = accent[i % len(accent)]
        out.append(
            f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}" fill="{color}" '
            f'opacity="{rnd.uniform(0.25, 0.5):.2f}"/>'
        )
    out.append("</g>")

    # fine diagonal lines
    out.append(f'<g stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.2">')
    for i in range(-2, 26):
        x = i * 46
        out.append(f'<line x1="{x}" y1="0" x2="{x - 160}" y2="{h}"/>')
    out.append("</g>")

    out.append(f'<circle cx="{w*0.5:.0f}" cy="{h*0.5:.0f}" r="250" fill="#ffffff" opacity="0.18"/>')
    out.append(glyph(kind, w * 0.5, h * 0.5, 300, accent[0]))
    out.append(
        f'<rect width="{w}" height="{h}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>'
    )
    out.append("</svg>")
    write(os.path.join(COVERS, f"{name}.svg"), "".join(out))


# ---------------------------------------------------------------- avatar ---


def avatar():
    w = h = 480
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe7f0"/>
      <stop offset="0.55" stop-color="#f6e7ff"/>
      <stop offset="1" stop-color="#dff6ee"/>
    </linearGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#f6e6d8"/>
      <stop offset="0.6" stop-color="#e8cdbd"/>
      <stop offset="1" stop-color="#d3b0a3"/>
    </linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff0e9"/>
      <stop offset="1" stop-color="#ffdfd4"/>
    </linearGradient>
    <linearGradient id="eye" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8fdcf2"/>
      <stop offset="0.55" stop-color="#5aa9e0"/>
      <stop offset="1" stop-color="#3c6fb8"/>
    </linearGradient>
    <linearGradient id="hoodie" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#bdf0dd"/>
      <stop offset="1" stop-color="#8fdcbf"/>
    </linearGradient>
    <filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>

  <rect width="{w}" height="{h}" fill="url(#bg)"/>
  <circle cx="120" cy="110" r="90" fill="#ffffff" opacity="0.55" filter="url(#b)"/>
  <circle cx="390" cy="150" r="70" fill="#ffc9dc" opacity="0.5" filter="url(#b)"/>
  <circle cx="250" cy="430" r="120" fill="#b8f0da" opacity="0.45" filter="url(#b)"/>

  <!-- back hair -->
  <path d="M240 96 C120 96 84 210 96 320 C104 400 150 440 240 440 C330 440 376 400 384 320 C396 210 360 96 240 96 Z" fill="url(#hair)"/>

  <!-- shoulders / hoodie -->
  <path d="M96 470 C110 388 168 350 240 350 C312 350 370 388 384 470 Z" fill="url(#hoodie)"/>
  <path d="M188 352 Q240 392 292 352 L292 380 Q240 418 188 380 Z" fill="#ffffff" opacity="0.55"/>

  <!-- face -->
  <ellipse cx="240" cy="248" rx="118" ry="126" fill="url(#skin)"/>

  <!-- ears -->
  <ellipse cx="124" cy="258" rx="16" ry="24" fill="url(#skin)"/>
  <ellipse cx="356" cy="258" rx="16" ry="24" fill="url(#skin)"/>

  <!-- bangs -->
  <path d="M122 214 C136 138 200 108 240 108 C282 108 344 140 358 214
           C336 196 316 186 300 186 C296 210 286 226 272 236
           C264 206 250 190 236 186 C222 198 208 214 196 236
           C180 218 162 206 148 200 C138 204 128 208 122 214 Z" fill="url(#hair)"/>
  <path d="M122 214 C150 168 196 146 240 146 C284 146 330 168 358 214" fill="none" stroke="#c9a596" stroke-opacity="0.35" stroke-width="3"/>

  <!-- eyes -->
  <g>
    <ellipse cx="196" cy="262" rx="26" ry="30" fill="#ffffff"/>
    <ellipse cx="196" cy="264" rx="19" ry="24" fill="url(#eye)"/>
    <circle cx="190" cy="254" r="7" fill="#ffffff" opacity="0.95"/>
    <circle cx="204" cy="276" r="4" fill="#ffffff" opacity="0.7"/>
    <path d="M168 232 Q196 220 224 234" stroke="#a97f74" stroke-width="6" stroke-linecap="round" fill="none"/>
  </g>
  <g>
    <!-- winking eye -->
    <path d="M272 260 Q292 246 312 260" stroke="#a97f74" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M276 268 Q292 276 308 268" stroke="#a97f74" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.5"/>
  </g>

  <!-- blush -->
  <ellipse cx="168" cy="300" rx="22" ry="12" fill="#ffb3c7" opacity="0.55"/>
  <ellipse cx="312" cy="300" rx="22" ry="12" fill="#ffb3c7" opacity="0.55"/>

  <!-- mouth -->
  <path d="M228 306 Q240 320 252 306" stroke="#d97e8f" stroke-width="5" stroke-linecap="round" fill="none"/>

  <!-- hair clip -->
  <g transform="translate(320 176) rotate(12)">
    <path d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill="#ffd977"/>
    <circle cx="0" cy="0" r="3" fill="#fff6d8"/>
  </g>
  <g transform="translate(158 168) rotate(-14)">
    <path d="M0 0 C-14 -12 -26 -2 -14 8 Z" fill="#f79ab5"/>
    <path d="M0 0 C14 -12 26 -2 14 8 Z" fill="#f79ab5"/>
    <circle cx="0" cy="2" r="4" fill="#ffd9e5"/>
  </g>

  <!-- hair highlights -->
  <path d="M150 190 C170 160 200 148 236 146" stroke="#fff6ec" stroke-opacity="0.55" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M330 192 C316 168 296 154 270 148" stroke="#fff6ec" stroke-opacity="0.4" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>'''
    write(os.path.join(IMG, "avatar.svg"), svg)


# -------------------------------------------------------------------- og ---


def og():
    w, h = 1200, 630
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b2230"/>
      <stop offset="0.55" stop-color="#2a2b44"/>
      <stop offset="1" stop-color="#4a3450"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#7dd3b8" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#7dd3b8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#f490b6" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#f490b6" stop-opacity="0"/>
    </radialGradient>
    <filter id="b"><feGaussianBlur stdDeviation="50"/></filter>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#bg)"/>
  <circle cx="980" cy="140" r="300" fill="url(#glow2)" filter="url(#b)"/>
  <circle cx="180" cy="520" r="320" fill="url(#glow)" filter="url(#b)"/>
  <g stroke="#ffffff" stroke-opacity="0.08" stroke-width="1.5">
    <line x1="0" y1="160" x2="1200" y2="80"/>
    <line x1="0" y1="460" x2="1200" y2="380"/>
  </g>
  <text x="96" y="300" font-family="Quicksand, Segoe UI, sans-serif" font-size="86" font-weight="700" fill="#ffffff">Mizuki</text>
  <text x="100" y="356" font-family="Quicksand, Segoe UI, sans-serif" font-size="30" fill="#ffffff" fill-opacity="0.72">One demo website</text>
  <g font-family="Quicksand, Segoe UI, sans-serif" font-size="20" fill="#ffffff" fill-opacity="0.55">
    <text x="100" y="452">Next.js · Prisma · PostgreSQL · Redis · S3 · Tailwind CSS</text>
  </g>
  <rect x="96" y="392" width="72" height="4" rx="2" fill="#7dd3b8"/>
</svg>'''
    write(os.path.join(IMG, "og.svg"), svg)


def favicon():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7dd3b8"/>
      <stop offset="1" stop-color="#f490b6"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#g)"/>
  <path d="M18 46 V22 l14 14 14-14 v24" fill="none" stroke="#ffffff" stroke-width="6"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''
    write(os.path.join(ROOT, "public", "favicon.svg"), svg)


if __name__ == "__main__":
    avatar()
    og()
    favicon()
    for name, base, accent, kind in COVER_SPECS:
        cover(name, base, accent, kind)
    print("art generated")
