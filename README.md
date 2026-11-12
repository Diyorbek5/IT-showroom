# IT Showroom — realistik 3D model

Binoning qavatma-qavat realistik 3D modeli (Three.js). Hozircha **1-qavat** tayyor.

- Texnik topshiriq: [`docs/TZ-1-qavat.md`](docs/TZ-1-qavat.md)
- Manba chizma va rasmlar: [`reference/1-qavat/`](reference/1-qavat/)
- 3D ilova: [`web/`](web/)

## Ishga tushirish

```bash
cd web
npm install
npm run dev
```

Brauzerda `http://localhost:5173` ni oching. Statik build: `npm run build` (`web/dist`).

## Boshqaruv
- **Sichqoncha / barmoq:** aylantirish, yaqinlashtirish.
- **Ko'rinishlar** (pastda): Kirish, Vitrina, Zina, Burchak, Tepadan.
- **Ichida yurish:** `W A S D`, sichqoncha bilan qarash, `Shift` — tezroq, `Esc` — chiqish.
- **Chiroqlar:** qandil va LED panellarni yoqish/o'chirish.
- **Foto sifat:** GPU path tracing. Kamera to'xtab tursa, tasvir bir necha soniyada fotorealistik bo'ladi.

## Manbalar
- HDRI: [Poly Haven — Park Parking](https://polyhaven.com/a/park_parking) (CC0)
- Eshik teksturasi: [Poly Haven — Washed Grey Oak Veneer](https://polyhaven.com/a/washed_grey_oak_veneer) (CC0)
- Pol va granit teksturalari: `web/tools/gen_textures.py` (protsedural)
