# design-system/icons/generate_pwa_icons.py
# Génère les 4 icons PWA mela en tant que placeholders design-fidèles.
# Dépendance : Pillow (présent dans le bench Frappe)
# Usage : python3 design-system/icons/generate_pwa_icons.py
from PIL import Image, ImageDraw, ImageFont
import os

# Design tokens (F01)
BRAND_NAVY = (12, 53, 71)       # #0C3547
ACCENT_AMBER = (217, 119, 6)    # #D97706
WHITE = (255, 255, 255)
BG_CREAM = (248, 247, 244)      # #F8F7F4

# Try to find a usable bold font
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
]


def find_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_wordmark(draw, center_x, center_y, scale):
    """Draw 'm.' wordmark — 'm' in white and '.' in amber."""
    font_size = int(280 * scale)
    font_m = find_font(font_size)
    font_dot = find_font(int(340 * scale))

    try:
        bbox_m = draw.textbbox((0, 0), "m", font=font_m)
        m_width = bbox_m[2] - bbox_m[0]
        m_height = bbox_m[3] - bbox_m[1]
        m_offset_y = bbox_m[1]
    except Exception:
        m_width = font_size * 0.75
        m_height = font_size * 0.6
        m_offset_y = 0

    try:
        bbox_dot = draw.textbbox((0, 0), ".", font=font_dot)
        dot_width = bbox_dot[2] - bbox_dot[0]
    except Exception:
        dot_width = font_size * 0.25

    gap = int(6 * scale)
    total_width = m_width + dot_width + gap
    start_x = center_x - total_width // 2
    start_y = center_y - m_height // 2 - m_offset_y

    draw.text((start_x, start_y), "m", fill=WHITE, font=font_m)
    draw.text(
        (start_x + m_width + gap, start_y - int(20 * scale)),
        ".",
        fill=ACCENT_AMBER,
        font=font_dot,
    )


def generate_any_icon(size, output_path):
    """Full bleed navy background with white 'm.' wordmark."""
    img = Image.new("RGB", (size, size), BRAND_NAVY)
    draw = ImageDraw.Draw(img)
    scale = size / 512
    draw_wordmark(draw, size // 2, size // 2, scale)
    img.save(output_path, "PNG", optimize=True)
    print(f"[OK] {output_path} ({size}x{size})")


def generate_maskable_icon(size, output_path):
    """Maskable icon: full bleed navy with wordmark in the 60% safe area.

    The safe area ensures the wordmark survives the circular mask applied
    by Android launchers (maskable icons spec : content must be in central 60%).
    """
    img = Image.new("RGB", (size, size), BRAND_NAVY)
    draw = ImageDraw.Draw(img)
    scale = (size / 512) * 0.6  # 60% safe zone
    draw_wordmark(draw, size // 2, size // 2, scale)
    img.save(output_path, "PNG", optimize=True)
    print(f"[OK] {output_path} ({size}x{size}) maskable")


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    generate_any_icon(192, os.path.join(here, "icon-192.png"))
    generate_any_icon(512, os.path.join(here, "icon-512.png"))
    generate_maskable_icon(192, os.path.join(here, "icon-192-maskable.png"))
    generate_maskable_icon(512, os.path.join(here, "icon-512-maskable.png"))


if __name__ == "__main__":
    main()
