"""Sayt hajmini kamaytirish: HDRI va teksturalarni yengillashtiradi.

- hdri/park_parking_1k.hdr  — yoritish uchun (GI, quyosh, akslar), 1.6 MB
- hdri/park_parking_bg.jpg  — oynadan ko'rinadigan fon, 2048x1024 JPEG (osmon = 1 birlikda, /BG_SCALE)
- laminat teksturalari 1024 px, eshik teksturalari 512 px

Ishlatish:  python3 tools/optimize_assets.py /yo'l/park_parking_2k.hdr
"""
import os
import sys
import numpy as np
from PIL import Image

PUB = os.path.join(os.path.dirname(__file__), '..', 'public')
BG_SCALE = 4.0  # JPEG da saqlanadigan maksimal yorqinlik (osmon o'rtachasi = 1)


def read_hdr(path):
    data = open(path, 'rb').read()
    pos = 0
    while True:
        end = data.index(b'\n', pos)
        line = data[pos:end]
        pos = end + 1
        if line.startswith(b'-Y') or line.startswith(b'+Y'):
            parts = line.split()
            H, W = int(parts[1]), int(parts[3])
            break
    out = np.zeros((H, W, 4), np.uint8)
    buf = np.frombuffer(data, np.uint8)
    for y in range(H):
        assert buf[pos] == 2 and buf[pos + 1] == 2, 'faqat yangi RLE formati'
        pos += 4
        for c in range(4):
            x = 0
            while x < W:
                n = int(buf[pos]); pos += 1
                if n > 128:
                    n -= 128
                    out[y, x:x + n, c] = buf[pos]; pos += 1
                else:
                    out[y, x:x + n, c] = buf[pos:pos + n]; pos += n
                x += n
    e = out[..., 3].astype(np.int32)
    f = np.where(e > 0, np.ldexp(1.0, e - 136), 0.0).astype(np.float32)
    rgb = out[..., :3].astype(np.float32) * f[..., None]
    return rgb


def sky_avg(rgb):
    H, W, _ = rgb.shape
    lat = (0.5 - (np.arange(H) + 0.5) / H) * np.pi
    cw = np.cos(lat)[:, None]
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    m = (lat > 0.05)[:, None]
    w = cw * m
    return float((np.minimum(lum, 50) * w).sum() / (w.sum() * W))


def to_srgb(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)


def main(src):
    rgb = read_hdr(src)
    k = 1.0 / sky_avg(rgb)
    print('skyAvg', 1 / k)
    bg = to_srgb(rgb * k / BG_SCALE)
    Image.fromarray((bg * 255 + 0.5).astype(np.uint8)).save(os.path.join(PUB, 'hdri', 'park_parking_bg.jpg'), quality=86, optimize=True, progressive=True)

    tex = os.path.join(PUB, 'tex')
    for name, size, q in [('laminate_albedo.jpg', 1024, 88), ('laminate_rough.jpg', 1024, 85), ('laminate_normal.jpg', 1024, 92),
                          ('oak_diff.jpg', 512, 86), ('oak_rough.jpg', 512, 85), ('oak_nor_gl.jpg', 512, 90)]:
        p = os.path.join(tex, name)
        im = Image.open(p)
        if im.size[0] > size:
            im = im.resize((size, size), Image.LANCZOS)
            im.save(p, quality=q, optimize=True)
    print('ok')


if __name__ == '__main__':
    main(sys.argv[1])
