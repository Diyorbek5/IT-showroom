"""Procedural PBR textures for the showroom.

floor_*   : polished light-grey porcelain tiles, 80x80 cm, 4x4 tiles per texture (3.2 m)
granite_* : polished black granite (stair treads / risers)

Run:  python3 tools/gen_textures.py  (writes into public/tex)
"""
import os
import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'tex')
rng = np.random.default_rng(7)


def smooth_noise(size, cells, seed):
    """Bicubic-upsampled value noise (tileable)."""
    r = np.random.default_rng(seed)
    g = r.random((cells, cells)).astype(np.float32)
    g = np.tile(g, (3, 3))
    im = Image.fromarray((g * 65535).astype(np.uint16).astype(np.int32), mode='I')
    im = im.resize((size * 3, size * 3), Image.BICUBIC)
    a = np.asarray(im, dtype=np.float32)[size:2 * size, size:2 * size] / 65535.0
    return a


def fbm(size, base_cells, octaves, seed, gain=0.5):
    acc = np.zeros((size, size), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        cells = base_cells * (2 ** o)
        if cells > size // 2:
            break
        acc += amp * smooth_noise(size, cells, seed + o * 101)
        tot += amp
        amp *= gain
    return acc / tot


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def floor_textures(px=2048, tiles=4):
    tp = px // tiles  # pixels per tile
    albedo = np.zeros((px, px, 3), np.float32)
    rough = np.zeros((px, px), np.float32)
    height = np.zeros((px, px), np.float32)

    yy, xx = np.mgrid[0:tp, 0:tp].astype(np.float32) / tp
    base = np.array([0.905, 0.900, 0.885], np.float32)  # linear-ish light warm grey
    vein_col = np.array([0.62, 0.62, 0.63], np.float32)

    for ty in range(tiles):
        for tx in range(tiles):
            s = int(rng.integers(0, 10_000))
            warp1 = fbm(tp, 3, 5, s)
            warp2 = fbm(tp, 4, 5, s + 7)
            cloud = fbm(tp, 2, 5, s + 13)
            mask = fbm(tp, 2, 3, s + 19)
            th = rng.uniform(0, np.pi)
            u = xx * np.cos(th) + yy * np.sin(th)
            v = -xx * np.sin(th) + yy * np.cos(th)
            freq = rng.uniform(4.0, 7.0)
            # main soft veins
            p = u * freq + warp1 * 3.2 + warp2 * 1.4
            d = np.abs(np.sin(p * np.pi))
            veins = (1 - smoothstep(0.0, 0.05, d)) * smoothstep(0.35, 0.75, mask)
            # secondary hairline veins
            p2 = v * freq * 1.7 + warp2 * 4.0
            d2 = np.abs(np.sin(p2 * np.pi))
            hair = (1 - smoothstep(0.0, 0.018, d2)) * smoothstep(0.55, 0.85, 1 - mask) * 0.6
            # broad cloudy haze
            haze = smoothstep(0.3, 0.9, cloud) * 0.06
            tone = rng.uniform(-0.012, 0.012)
            t = np.zeros((tp, tp, 3), np.float32)
            col = base + tone
            k = np.clip(veins * 0.55 + hair * 0.35, 0, 1)[..., None]
            t[:] = col
            t = t * (1 - haze[..., None]) + (col * 0.93) * haze[..., None]
            t = t * (1 - k) + vein_col * k
            albedo[ty * tp:(ty + 1) * tp, tx * tp:(tx + 1) * tp] = t
            rough[ty * tp:(ty + 1) * tp, tx * tp:(tx + 1) * tp] = 0.055 + 0.03 * fbm(tp, 8, 3, s + 31)

    # grout + tiny bevel (px units). 3px grout ~ 4.7 mm
    coord = np.arange(px)
    edge = np.minimum(coord % tp, tp - 1 - (coord % tp)).astype(np.float32)
    ex = edge[None, :].repeat(px, 0)
    ey = edge[:, None].repeat(px, 1)
    e = np.minimum(ex, ey)
    grout = (e < 1.5).astype(np.float32)
    bevel = smoothstep(1.5, 4.0, e)
    grout_col = np.array([0.66, 0.655, 0.64], np.float32)
    albedo = albedo * (1 - grout[..., None]) + grout_col * grout[..., None]
    rough = rough * (1 - grout) + 0.75 * grout
    rough = np.maximum(rough, (1 - bevel) * 0.25)
    height = bevel * 1.0 - grout * 0.6

    # normal from height
    gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * 0.5
    gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * 0.5
    strength = 1.2
    n = np.stack([-gx * strength, gy * strength, np.ones_like(gx)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)

    srgb = np.where(albedo <= 0.0031308, albedo * 12.92, 1.055 * np.power(np.clip(albedo, 0, 1), 1 / 2.4) - 0.055)
    # albedo values above are authored as sRGB-perceptual; store directly
    Image.fromarray((np.clip(albedo, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'floor_albedo.jpg'), quality=92)
    Image.fromarray((np.clip(rough, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'floor_rough.jpg'), quality=92)
    Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8)).save(os.path.join(OUT, 'floor_normal.png'), optimize=True)
    del srgb


def granite_textures(px=1024):
    base = fbm(px, 4, 6, 900)
    specks = rng.random((px, px)).astype(np.float32)
    big = smooth_noise(px, 160, 901)
    col = np.full((px, px, 3), 0.075, np.float32)
    col += (base[..., None] - 0.5) * 0.05
    white = (specks > 0.9935).astype(np.float32)
    grey = ((big > 0.78) & (specks > 0.6)).astype(np.float32)
    col = col * (1 - grey[..., None]) + np.array([0.16, 0.16, 0.17]) * grey[..., None]
    col = col * (1 - white[..., None]) + np.array([0.55, 0.55, 0.56]) * white[..., None]
    Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'granite_albedo.jpg'), quality=90)
    r = 0.12 + 0.08 * fbm(px, 6, 4, 950)
    Image.fromarray((np.clip(r, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'granite_rough.jpg'), quality=90)


def laminate_textures(src_path, px=2048, meters=2.4):
    """Och kulrang-bej eman laminat: 1.2 x 0.2 m taxtalar, siljitilgan choklar."""
    from PIL import ImageFilter
    src = Image.open(src_path).convert('L')
    S = src.size[0]
    a = np.asarray(src, np.float32) / 255.0
    blur = np.asarray(src.filter(ImageFilter.GaussianBlur(24)), np.float32) / 255.0
    detail = a - blur  # faqat tola (grain)
    ppm = px / meters
    pw, ph = int(round(1.2 * ppm)), int(round(0.2 * ppm))
    rows = int(round(meters / 0.2))
    albedo = np.zeros((px, px, 3), np.float32)
    rough = np.zeros((px, px), np.float32)
    height = np.ones((px, px), np.float32)
    base = np.array([0.80, 0.765, 0.708], np.float32)
    for r in range(rows):
        y0, y1 = int(round(r * px / rows)), int(round((r + 1) * px / rows))
        ph = y1 - y0
        off = int(rng.integers(0, pw))
        for k in range(int(np.ceil(px / pw))):
            sx = int(rng.integers(0, S))
            sy = int(rng.integers(0, S - ph))
            cols = (np.arange(pw) + sx) % S
            crop = detail[sy:sy + ph][:, cols]
            seed = int(rng.integers(0, 99999))
            yy, xx = np.mgrid[0:ph, 0:pw].astype(np.float32)
            w = np.resize(fbm(256, 3, 4, seed)[:ph, :], (ph, pw))
            cath = np.sin((yy / ph * 3.0 + np.sin(xx / pw * np.pi * rng.uniform(1, 3)) * 1.2 + w * 2.0) * np.pi * 2)
            tone = rng.uniform(-0.035, 0.035)
            warmth = rng.uniform(-0.015, 0.015)
            g = crop * 1.35 + cath * 0.018
            plank = np.empty((ph, pw, 3), np.float32)
            for c in range(3):
                plank[..., c] = base[c] + tone + g + (warmth if c == 0 else -warmth if c == 2 else 0)
            e = np.minimum(np.minimum(xx, pw - 1 - xx), np.minimum(yy, ph - 1 - yy))
            bev = smoothstep(0.0, 3.0, e)
            plank *= (0.82 + 0.18 * bev)[..., None]
            xs = (off + k * pw + np.arange(pw)) % px
            albedo[y0:y1][:, xs] = plank
            rough[y0:y1][:, xs] = 0.36 + crop * 1.2 + (1 - bev) * 0.25
            height[y0:y1][:, xs] = bev - np.clip(crop, -1, 0) * 3
    gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * 0.5
    gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * 0.5
    n = np.stack([-gx * 1.5, gy * 1.5, np.ones_like(gx)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    Image.fromarray((np.clip(albedo, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'laminate_albedo.jpg'), quality=90)
    Image.fromarray((np.clip(rough, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'laminate_rough.jpg'), quality=90)
    Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8)).save(os.path.join(OUT, 'laminate_normal.jpg'), quality=92)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    floor_textures()
    granite_textures()
    import sys
    if len(sys.argv) > 1:
        laminate_textures(sys.argv[1])
    print('ok')
