"""Generate the wax-seal SVG assets from the CSS component in the design mock.

Translates .seal / .tm-logo (radial-gradient wax, inset highlight + rim shadow,
dashed inner ring, display-face label) into gradient-only SVG. No <filter>:
cairosvg's filter support is partial, and gradients render identically in every
browser AND in the rasteriser, so what ships is what was reviewed.

Text is converted to outlines. Favicons and OG images are fetched without the
page, so no webfont is available to them -- live <text> would silently fall back
to a system serif.
"""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen

FONT = "/Users/sarahchen/Documents/projects/shindig-thingamajig/_site/assets/fonts/fraunces.woff2"

# From _data/palettes.js (taskmaster.light) + the mock's derived wax shades.
PRIMARY = "#8b1e1e"   # palette primary -- the mid stop
WAX_LIT = "#B33A32"   # lit face of the wax
WAX_DARK = "#6B1414"  # shadowed rim
LABEL = "#FCEFE3"     # label ink on wax
PARCHMENT = "#faf6f0"
INK = "#2b2625"

_inst = instancer.instantiateVariableFont(TTFont(FONT), {"wght": 800}, inplace=False)
_gs = _inst.getGlyphSet()
_cmap = _inst.getBestCmap()
UPM = _inst["head"].unitsPerEm


def text_path(s, size, tracking_em=0.0, weight_inst=_inst):
    """Return (path_d, advance_width) for `s` rendered at `size` px, y-down."""
    gs, cmap = weight_inst.getGlyphSet(), weight_inst.getBestCmap()
    hmtx = weight_inst["hmtx"]
    scale = size / UPM
    track = tracking_em * size
    parts, x = [], 0.0
    for ch in s:
        gn = cmap.get(ord(ch))
        if gn is None:
            x += size * 0.4 + track
            continue
        pen = SVGPathPen(gs)
        gs[gn].draw(pen)
        d = pen.getCommands()
        if d:
            # y-flip: font space is y-up, SVG is y-down.
            parts.append(f'<path d="{d}" transform="translate({x:.2f} 0) scale({scale:.5f} {-scale:.5f})"/>')
        x += hmtx[gn][0] * scale + track
    return "".join(parts), max(0.0, x - track)


def seal_defs(uid):
    """Gradients for one seal instance. cx/cy/r mirror the CSS radial-gradient:
    `circle at 34% 28%` with the default farthest-corner extent, which for a
    square box resolves to r = sqrt(.66^2 + .72^2) = 0.9767 of the width."""
    return f"""
  <radialGradient id="wax{uid}" gradientUnits="objectBoundingBox" cx="0.34" cy="0.28" r="0.9767">
    <stop offset="0" stop-color="{WAX_LIT}"/>
    <stop offset="0.46" stop-color="{PRIMARY}"/>
    <stop offset="1" stop-color="{WAX_DARK}"/>
  </radialGradient>
  <!-- inset 0 -4px 10px rgba(0,0,0,.42): a rim shadow hugging the edge. -->
  <radialGradient id="rim{uid}" gradientUnits="objectBoundingBox" cx="0.5" cy="0.46" r="0.5">
    <stop offset="0.72" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.42"/>
  </radialGradient>
  <!-- inset 0 2px 5px rgba(255,255,255,.28): the lit top edge. -->
  <linearGradient id="lit{uid}" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.28"/>
    <stop offset="0.22" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <!-- 0 6px 16px rgba(107,20,20,.34): the cast shadow, as a soft ellipse. -->
  <radialGradient id="cast{uid}" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0.55" stop-color="{WAX_DARK}" stop-opacity="0.34"/>
    <stop offset="1" stop-color="{WAX_DARK}" stop-opacity="0"/>
  </radialGradient>"""


def seal(cx, cy, r, label, uid, label_size_ratio=0.146, tracking=0.14, cast=True, ring=True):
    """One wax seal. Geometry is proportional to r so it scales cleanly:
    the dashed ring sits at the CSS `inset: 9px` on a 104px seal = r-8.65%."""
    ring_r = r * (1 - 9 / 52)          # ::after inset:9px against r=52
    ring_w = max(0.6, r * (1 / 52))    # 1px border at the same scale
    fs = r * 2 * label_size_ratio
    d, w = text_path(label, fs, tracking)
    out = []
    if cast:
        out.append(f'<ellipse cx="{cx}" cy="{cy + r*0.06}" rx="{r*1.16:.2f}" ry="{r*1.16:.2f}" fill="url(#cast{uid})"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#wax{uid})"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#rim{uid})"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#lit{uid})"/>')
    if ring:
        # Dropped at favicon sizes: a dashed ring at 16px is noise, not detail.
        out.append(
            f'<circle cx="{cx}" cy="{cy}" r="{ring_r:.2f}" fill="none" '
            f'stroke="{LABEL}" stroke-opacity="0.42" stroke-width="{ring_w:.2f}" '
            f'stroke-dasharray="{r*0.075:.2f} {r*0.055:.2f}"/>'
        )
    # Optical centring: cap-height/2 rather than the em box.
    out.append(f'<g fill="{LABEL}" transform="translate({cx - w/2:.2f} {cy + fs*0.355:.2f})">{d}</g>')
    return "\n  ".join(out)


# ---- favicon: the TM badge, legible at 16px ---------------------------------
fav = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="A Shindig Thingamajig">
  <title>A Shindig Thingamajig</title>
  <defs>{seal_defs('F')}
  </defs>
  {seal(32, 32, 31, "TM", "F", label_size_ratio=0.44, tracking=0.02, cast=False, ring=False)}
</svg>
"""

# ---- OG image: the §8.1 home layout -- seam, seal, wordmark ------------------
W, H = 1200, 630
seam_y, seal_r = 372, 96
title_d, title_w = text_path("A Shindig Thingamajig", 66, 0.005)
sub_d, sub_w = text_path("Hang out with Sarah and friends", 30, 0.01)
gap = seal_r + 34
og = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img"
     aria-label="A Shindig Thingamajig">
  <title>A Shindig Thingamajig</title>
  <defs>{seal_defs('O')}
  </defs>
  <rect width="{W}" height="{H}" fill="{PARCHMENT}"/>
  <!-- the seam from PRD 8.1: two rules running out from a centred seal -->
  <line x1="96" y1="{seam_y}" x2="{W/2 - gap}" y2="{seam_y}" stroke="{INK}" stroke-opacity="0.28" stroke-width="2"/>
  <line x1="{W/2 + gap}" y1="{seam_y}" x2="{W - 96}" y2="{seam_y}" stroke="{INK}" stroke-opacity="0.28" stroke-width="2"/>
  {seal(W/2, seam_y, seal_r, "TM", "O", label_size_ratio=0.20, tracking=0.14)}
  <!-- Title above the seam, tagline below: the 8.1 home layout, which is also
       what stops the card reading as a logo floating in empty parchment. -->
  <g fill="{INK}" transform="translate({(W - title_w)/2:.2f} 246)">{title_d}</g>
  <g fill="{INK}" fill-opacity="0.66" transform="translate({(W - sub_w)/2:.2f} 522)">{sub_d}</g>
</svg>
"""

open("favicon.svg", "w").write(fav)
open("og-seal.svg", "w").write(og)
print("favicon.svg", len(fav), "bytes")
print("og-seal.svg", len(og), "bytes")
