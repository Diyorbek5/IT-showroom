# TZ — IT Showroom, 1-qavat (realistik 3D model, Three.js)

> Holat: **v1.0**. Asos: o'lchamli reja (`reference/1-qavat/01-plan-olchamlar.jpg`) va 4 ta ichki ko'rinish rasmi (`02…05-interyer.jpg`).
> Ikkalasi bir-biriga zid bo'lgan joylarda **o'lchamlar rejadan**, **materiallar va uslub rasmlardan** olindi (7-bo'lim).

## 1. Maqsad
1-qavat interyerining brauzerda ishlaydigan, iloji boricha realistik 3D modeli:
- Three.js (WebGL2), real o'lchamlar (1 birlik = 1 m), PBR materiallar.
- Real vaqt rejimi (aylanib ko'rish va ichida yurish) va **"Foto sifat"** rejimi (GPU path tracing).
- Tayyor ko'rinishlar rasmlardagi kamera burchaklariga mos: Kirish, Vitrina, Zina, Burchak, Tepadan (maket).

## 2. Reja tahlili

Koordinatalar: **X** — chapdan o'ngga (chap ichki devor = 0), **Z** — rejada yuqoridan pastga (yuqori devor = 0), **Y** — balandlik.
Masshtab chizmadan tekshirildi: ~72 px = 1 m. Berilgan 7.30, 6.55 va 8.75 o'lchamlari bir-biriga mos keladi.

### 2.1 Berilgan o'lchamlar
| O'lcham | Qiymat | Izoh |
|---|---|---|
| Umumiy ichki kenglik | 7.30 m | chap devor → o'ng devor |
| Ustunlar orasi (yuqori) | 6.55 m | chap-yuqori ustun → o'ng devor |
| Umumiy chuqurlik | 8.75 m | yuqori devor → pastki devor |
| Chap devor bo'ylab | 3.15 m | chap-yuqori ustun → chap-o'rta ustun |
| O'ng devor bo'ylab | 2.60 m + 1.20 m | o'ng-o'rta ustungacha, keyin qiya burchakkacha |
| O'rta qator | 2.55 + 1.00 + 3.00 m | chap ustun → markaziy ustun → o'ng devor |
| Markaziy ustun | 1.00 × 0.50 m | xona o'rtasida, alohida turgan |
| Pastki qator | 2.37 + 3.07 m | chap devor → zina bloki → eshik |

### 2.2 Modeldagi koordinatalar (`web/src/plan.js`)
| Element | X (m) | Z (m) | Izoh |
|---|---|---|---|
| Xona konturi | (0,0) → (7.30,0) → (7.30,5.76) → (6.50,6.80) → (6.50,8.75) → (0,8.75) | | qiya burchak bilan |
| Ustun chap-yuqori | 0 … 0.75 | 0 … 0.53 | ikki vitrina tutashgan joyda |
| Ustun chap-o'rta | 0 … 0.75 | 3.68 … 4.18 | fasaddagi ikki eshik orasida |
| Ustun markaziy | 3.30 … 4.30 | 3.68 … 4.18 | |
| Zina | 2.37 … 6.30 | 7.60 … 8.75 | 18 ko'tarilish × 21.7 sm, 17 pog'ona × 23.1 sm |
| Shiftdagi zina teshigi | 3.90 … 6.30 | 7.55 … 8.75 | 2-qavatda panjara bilan o'ralgan |
| Zina osti xonasi | 5.44 … 6.50 | 7.55 … 8.75 | eshik 0.80 × 2.05 m |
| Kirish eshigi 1 | fasad (x = 0) | 0.53 + 0.70 … 2.45 | 2 tabaqali, rasmdan qo'shildi |
| Kirish eshigi 2 | fasad (x = 0) | 6.50 … 7.95 | 2 tabaqali, rejada bor |

## 3. Ichki rasmlar tahlili

| Element | Rasmda ko'ringani | Modelda |
|---|---|---|
| Pol | sayqallangan och kulrang keramogranit, mayin marmar tomirlari, ingichka choklar, kuchli akslar | 80×80 sm plitka (protsedural tekstura), planar aks + PBR |
| Devor va shift | oq, mat bo'yoq | oq PBR, g'adir-budurlik 0.92 |
| Plintus | qora, ~8 sm, ustunlar atrofida ham | qora, 8 sm × 1.2 sm |
| Vitrina | poldan shiftgacha oyna, qora alyumin profil | 5.5 sm profil, oyna aks + tus |
| Kirish eshiklari | 2 tabaqali oynali eshiklar, vertikal tutqichlar | ikkala fasad oralig'ida |
| Ustunlar | oq to'rtburchak, qora plintus | rejadagi o'lchamlarda |
| Zina | qora granit pog'onalar, oq zinapoyasimon pastki qism, qora geometrik panjara | xuddi shunday: yakka balyasinalar + "to'rtburchakli" juftliklar |
| Zina osti eshigi | och kulrang eman, gorizontal chiziqlar, qora shisha lenta, qora tutqich | xuddi shunday |
| Qandillar | oltin rangli LED halqalar (3 ta halqa, turli burchakda) | 1 ta katta (zina oldida) + 2 ta o'rta |
| Shift chiroqlari | kvadrat LED panellar | 10 ta 30×30 sm panel + RectAreaLight |
| Radiatorlar | oq seksiyali alyumin | 3 ta (zina ostida, o'ng devorda) |
| Rozetkalar | oq, pol yaqinida | 5 ta |

## 4. Texnik yechim
- **Stek:** Vite + Three.js r187, `three-gpu-pathtracer` (foto rejim), `n8ao` (ambient occlusion).
- **Geometriya:** hamma narsa `plan.js` dagi raqamlardan kod orqali quriladi. O'lcham o'zgarsa, faqat raqam o'zgartiriladi.
  Draw call kam bo'lishi uchun bir xil materialli geometriyalar birlashtiriladi.
- **Yoritish (real vaqt):**
  - Ko'cha HDRI (Poly Haven `park_parking`, CC0). Quyosh HDRI'dan avtomatik ajratiladi: yo'nalish va yoritilganlik `DirectionalLight` ga o'tadi, osmondan esa kesib tashlanadi (yorug'lik ikki marta hisoblanmasin).
  - Oynalardan tashqarisi `GroundedSkybox`, ya'ni HDRI yerga proyeksiyalanadi va asfalt hamda daraxtlar to'g'ri masshtabda ko'rinadi.
  - **GI:** `LightProbeGridWebGL`, 7×3×9 SH probe, 2 marta qaytish. Probe markazlari ustunlar ichiga tushmasligi uchun maxsus tanlangan.
  - Akslar: xona markazidan olingan cubemap (PMREM) va polda alohida planar aks (g'adir-budurlikka qarab xiralashadi).
  - LED panellar `RectAreaLight`, qandillar `PointLight` va emissive halqalar.
- **Post-processing:** N8AO, Bloom, Neutral tone mapping, SMAA.
- **Foto sifat:** `WebGLPathTracer`: haqiqiy GI, yumshoq soyalar, shisha o'tkazuvchanligi. Kamera to'xtaganda tasvir aniqlashib boradi.
- **Boshqaruv:** Orbit (sichqoncha va sensor), "Ichida yurish" (WASD, xona devorlari va ustunlar bilan to'qnashuv).

## 5. Ishga tushirish
```bash
cd web && npm install && npm run dev      # http://localhost:5173
npm run build                              # web/dist — statik sayt
```
Diagnostika uchun URL parametrlari: `?q=low` (kuchsiz GPU), `?view=zina`, `?exp=0.7`, `?rot=200` (HDRI burilishi), `?el=30` (quyosh balandligi).

## 6. Bosqichlar
1. ✅ Reja tahlili.
2. ✅ Ichki rasmlar tahlili va TZ v1.0.
3. ✅ Bino qobig'i: pol, devorlar, ustunlar, vitrina, eshiklar, zina, shift, 2-qavat teshigi.
4. ✅ Materiallar, yoritish, GI, akslar, post-processing.
5. ✅ Qandillar, panellar, radiatorlar, eshik, rozetkalar.
6. ⏳ IT showroom jihozlari (vitrinalar, stollar, ekranlar, kassa). Dizayn bo'yicha rasm yoki ko'rsatma kerak.
7. ⏳ 2-qavat (rasmlar kutilmoqda).

## 7. Qabul qilingan farazlar (tasdiqlash kerak)
1. **Shift balandligi 3.60 m.** Rasmdagi fasad eshiklari va 3.15 m oraliq nisbatidan baholandi.
2. **O'ng (sharqiy) devor va qiya burchak — g'isht devor.** Rejada uch chiziq bilan (oyna kabi) chizilgan, lekin rasmlarda oq devor va radiatorlar ko'rinadi. Shuning uchun devor qilindi; `plan.js` dan oynaga o'zgartirish oson.
3. **Fasadda 2 ta eshik.** Rejada faqat pastki eshik bor, rasmda esa ikkala oraliqda ham eshik ko'rinadi.
4. **Zina (yangilandi):** bitta to'g'ri marsh, janubiy devor bo'ylab **sharqdan g'arbga** ko'tariladi (6.30 m dan 2.60 m gacha), 2-qavatga kichik xona ro'parasida chiqadi. Bu 2-qavatning haqiqiy rasmlaridan aniqlandi; 1-qavat rasmlari taxminiy edi. Zinaning yuqori uchi ostida kichik omborxona bor (x 2.37…4.10), eshigi shimolga qaragan.
5. Plitka o'lchami 80×80 sm (rasmda 60×120 ham bo'lishi mumkin).
6. Oyna tashqarisidagi manzara — vaqtinchalik HDRI. Haqiqiy ko'cha surati bo'lsa, almashtiriladi.
