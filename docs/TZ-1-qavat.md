# TZ — IT Showroom, 1-qavat (3D realistik model, Three.js)

> Holat: **QORALAMA v0.1** — faqat o'lchamli reja (01-plan-olchamlar.jpg) tahlil qilingan.
> Ichki ko'rinish rasmlari kelgach TZ to'ldiriladi.

## 1. Maqsad
1-qavat interyerining brauzerda ishlaydigan, maksimal realistik 3D modelini yaratish:
- Three.js (WebGL2), PBR materiallar, HDRI yoritish, real o'lchamlar (1 birlik = 1 metr).
- Erkin aylanib ko'rish (orbit) + ichkarida yurish rejimi (first-person, WASD).
- Tayyor kamera nuqtalari (kirish, vitrina, zina, markaziy ustun).

## 2. Chizma tahlili (1-qavat)

Koordinatalar: **X** — chapdan o'ngga (chap ichki devor = 0), **Z** — yuqoridan pastga (yuqori devor = 0).
Masshtab chizmadan tekshirildi: ~72 px = 1 m (7.30, 6.55, 8.75 o'lchamlari o'zaro mos keladi).

### 2.1 Berilgan o'lchamlar (chizmadagi raqamlar)
| O'lcham | Qiymat | Izoh |
|---|---|---|
| Umumiy ichki kenglik | 7.30 m | chap devor → o'ng devor |
| Ustunlar orasi (yuqori) | 6.55 m | chap-yuqori ustundan o'ng devorgacha |
| Umumiy chuqurlik | 8.75 m | yuqori devor → pastki devor |
| Chap devor bo'ylab | 3.15 m | yuqori-chap ustun → chap-o'rta ustun |
| O'ng devor bo'ylab | 2.60 m | yuqori-o'ng ustun → o'ng-o'rta ustun |
| O'ng devor (pastda) | 1.20 m | o'ng-o'rta ustun → qiya burchak boshi |
| O'rta qator | 2.55 + 1.00 + 3.00 | chap ustun → markaziy ustun → o'ng devor |
| Markaziy ustun | 1.00 × 0.50 m | xona o'rtasida, alohida turgan |
| Pastki qator | 2.37 + 3.07 m | chap devor → zina bloki → eshik |

### 2.2 Chizmadan o'lchab olingan (taxminiy, ±5 sm)
| Element | X (m) | Z (m) | O'lcham |
|---|---|---|---|
| Ustun yuqori-chap | 0 … 0.75 | 0 … 0.53 | xonaga 0.75 chiqqan |
| Ustun chap-o'rta | 0 … 0.75 | 3.68 … 4.18 | 0.75 × 0.50 |
| Ustun markaziy | 3.30 … 4.30 | 3.68 … 4.18 | 1.00 × 0.50 |
| Ustun yuqori-o'ng | devor ichida | 0 … 0.97 | |
| Ustun o'ng-o'rta | devor ichida | 3.57 … 4.55 | |
| Qiya burchak (fasad) | 7.30 → ~6.50 | 5.75 → ~6.80 | ~45°, uzunligi ~1.3 m |
| O'ng-pastki devor | ~6.50 | 6.80 … 8.75 | |
| Kirish eshigi (2 tabaqali) | chap devor | ~6.50 … 7.95 | ~1.45 m, tashqariga ochiladi |
| Zina bloki | 2.37 … 5.44 | ~7.55 … 8.75 | 3.07 × 1.20 m, marshi o'ngga |
| Zina oldi to'siq/devor | 2.37 … 5.44 | ~7.55 | yupqa (parapet yoki devor) |
| Ichki eshik (1 tabaqali) | 5.44 … ~6.40 | ~7.55 | ~0.9 m, xona tomonga ochiladi |
| Pastki tashqi ustunlar | chap burchak va 3.3…4.3 | 8.75 dan tashqarida | |

### 2.3 Devor/oyna turlari (chizmadagi chiziqlarga ko'ra)
- **Yuqori devor** (ustunlar orasida, 6.55 m) — ikki chiziq → katta vitrina oynasi (taxmin).
- **O'ng devor** (2.60 m va 1.20 m qismlari) — uch chiziq → oyna (vitrina).
- **Qiya burchak** — oyna (vitrina).
- **Chap devor** — g'isht/beton devor, pastda kirish eshigi.
- **Pastki devor** — g'isht/beton devor.

## 3. Aniqlanishi kerak bo'lgan savollar
1. Shift balandligi (pol → shift)? Osma shift bormi?
2. Devor qalinligi (tashqi / ichki)?
3. Yuqori va o'ng tomon to'liq oyna (vitrina)mi? Oyna pastki/yuqori balandligi?
4. Zina 2-qavatga chiqadimi yoki podvalga tushadimi? Zina pastida (5.44…6.50) xona — WC/ombor?
5. Kirish eshigi — oyna eshikmi yoki metall?
6. Pol materiali, devor rangi, yoritgichlar, mebel (vitrinalar, stollar, TV/ekranlar, kassa) — ichki rasmlardan olinadi.

## 4. Texnik yechim (reja)
- **Stek:** Vite + Three.js (so'nggi barqaror versiya), GitHub Pages / statik hosting.
- **Geometriya:** reja koordinatalari bitta `plan.js` konfiguratsiyada → devorlar, oyna teshiklari, ustunlar, zina kod orqali quriladi (o'lcham o'zgarsa — faqat raqam o'zgaradi).
- **Realizm:**
  - `MeshPhysicalMaterial` (oyna — transmission, metall — roughness/metalness, pol — kafel/laminat teksturalari, normal/roughness map).
  - HDRI muhit (RGBELoader), ACES Filmic tone mapping, sRGB.
  - Yumshoq soyalar (PCFSoft), RectAreaLight (shift panellar), SpotLight (track chiroqlar).
  - SSAO / N8AO, Bloom (ekranlar va chiroqlar), SMAA anti-aliasing.
  - Statik yoritish uchun lightmap "bake" (keyingi bosqich, sifat uchun).
- **Boshqaruv:** Orbit + First-person (PointerLock + to'qnashuv), mobil uchun sensor boshqaruv.
- **Unumdorlik:** instancing, KTX2 teksturalar, 60 FPS maqsad (o'rta noutbuk).

## 5. Bosqichlar
1. ✅ Reja tahlili (ushbu hujjat).
2. ⏳ Ichki ko'rinish rasmlarini qabul qilish va tahlil (materiallar, mebel, yoritish).
3. TZ ni yakunlash (v1.0).
4. Bino qobig'i: pol, devorlar, ustunlar, oynalar, eshiklar, zina, shift.
5. Materiallar + yoritish + post-processing.
6. Mebel va IT jihozlar (rasmlar asosida).
7. Kamera nuqtalari, UI, optimizatsiya, deploy.
