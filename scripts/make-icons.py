#!/usr/bin/env python3
"""Gera os ícones do PWA (assets/icons). Rode: python3 scripts/make-icons.py  (precisa de Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'icons'
OUT.mkdir(parents=True, exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
BG_TOP, BG_BOTTOM, GOLD = (139, 92, 246), (75, 47, 160), (245, 197, 66)


def icon(size, maskable=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    grad = Image.new('RGBA', (size, size))
    gd = ImageDraw.Draw(grad)
    for y in range(size):  # degradê vertical roxo
        k = y / size
        gd.line([(0, y), (size, y)], fill=tuple(int(BG_TOP[i] * (1 - k) + BG_BOTTOM[i] * k) for i in range(3)) + (255,))
    mask = Image.new('L', (size, size), 0)
    md = ImageDraw.Draw(mask)
    if maskable:  # ícone "maskable" ocupa o quadrado todo (o sistema recorta)
        md.rectangle([0, 0, size, size], fill=255)
    else:
        md.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * .22), fill=255)
    img.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(img)
    pad = int(size * (.2 if maskable else .07))
    if not maskable:
        d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=int(size * .17), outline=GOLD, width=max(2, size // 40))
    font = ImageFont.truetype(FONT, int(size * (.32 if maskable else .4)))
    text = '{ }'
    box = d.textbbox((0, 0), text, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    d.text(((size - w) / 2 - box[0], (size - h) / 2 - box[1]), text, font=font, fill=GOLD)
    return img


for s in (192, 512):
    icon(s).save(OUT / f'icon-{s}.png')
icon(512, maskable=True).save(OUT / 'icon-maskable-512.png')
icon(48).save(OUT.parent.parent / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print('ícones gerados em', OUT)
