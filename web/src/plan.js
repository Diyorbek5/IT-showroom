// 1-qavat reja o'lchamlari (metr). X — chapdan o'ngga, Z — rejaning yuqorisidan pastga, Y — balandlik.
// Manba: reference/1-qavat/01-plan-olchamlar.jpg (+ ichki rasmlar). Batafsil: docs/TZ-1-qavat.md

export const H = 3.6; // pol → shift (taxmin, rasmlardan)
export const SLAB = 0.3; // orayopma qalinligi
export const FF = H + SLAB; // qavat balandligi
export const WALL_T = 0.3;

// Xonaning ichki konturi (soat strelkasi bo'yicha)
export const ROOM = [
	[0, 0],
	[7.3, 0],
	[7.3, 5.76],
	[6.5, 6.8],
	[6.5, 8.75],
	[0, 8.75],
];

// Ustunlar (x0..x1, z0..z1)
export const COLUMNS = [
	{ id: 'col-nw', x0: -0.3, x1: 0.75, z0: -0.3, z1: 0.53 },
	{ id: 'col-w', x0: -0.3, x1: 0.75, z0: 3.68, z1: 4.18 },
	{ id: 'col-c', x0: 3.3, x1: 4.3, z0: 3.68, z1: 4.18 },
];

// Oynavand devorlar (vitrina). Oyna tekisligi devor ichida, ichki yuzadan 6 sm tashqarida.
export const GLASS_LINE = -0.06;
export const GLAZING = [
	// Shimoliy vitrina (rejada yuqori devor, 6.55 m)
	{ id: 'north', a: [0.75, GLASS_LINE], b: [7.3, GLASS_LINE], mullions: [1.64, 3.28, 4.92], doors: [] },
	// G'arbiy fasad — 2 ta kirish eshigi (rejada chap devor)
	{ id: 'west-n', a: [GLASS_LINE, 3.68], b: [GLASS_LINE, 0.53], mullions: [0.7, 2.45], transom: 2.45, doors: [{ t0: 0.7, t1: 2.45, h: 2.45 }] },
	{ id: 'west-s', a: [GLASS_LINE, 8.75], b: [GLASS_LINE, 4.18], mullions: [0.8, 2.25, 3.4], transom: 2.45, doors: [{ t0: 0.8, t1: 2.25, h: 2.45 }] },
];

// Zina: janubiy devor bo'ylab, g'arbdan sharqqa ko'tariladi
export const STAIR = {
	x0: 2.37,
	x1: 6.3,
	z0: 7.6,
	z1: 8.75,
	risers: 18,
};
STAIR.rise = FF / STAIR.risers;
STAIR.going = ( STAIR.x1 - STAIR.x0 ) / ( STAIR.risers - 1 );

// Shiftdagi zina teshigi
export const OPENING = { x0: 3.9, x1: 6.3, z0: 7.55, z1: 8.75 };

// Zina ostidagi xona (WC / omborxona) va eshik
export const WC = { x0: 5.44, x1: 6.5, z0: 7.55, z1: 8.75, t: 0.1, door: { x0: 5.58, x1: 6.38, h: 2.05 } };

// Qandillar
export const CHANDELIERS = [
	{ type: 'big', x: 3.0, z: 5.9 },
	{ type: 'mid', x: 1.9, z: 2.1 },
	{ type: 'mid', x: 5.6, z: 1.9 },
];

// Shiftdagi kvadrat LED panellar
export const PANELS = [
	[ 1.75, 0.95 ], [ 3.8, 0.95 ], [ 5.85, 3.05 ],
	[ 3.8, 2.95 ], [ 1.75, 3.6 ], [ 5.85, 5.0 ],
	[ 1.4, 5.0 ], [ 4.75, 6.3 ], [ 1.3, 7.3 ], [ 6.6, 1.0 ],
];

// Radiatorlar: markaz, devor normali yo'nalishi (xonaga), seksiyalar soni
export const RADIATORS = [
	{ x: 3.75, z: 8.75, nx: 0, nz: - 1, n: 10 },
	{ x: 7.3, z: 2.2, nx: - 1, nz: 0, n: 10 },
	{ x: 7.3, z: 5.05, nx: - 1, nz: 0, n: 8 },
];
