// 2-qavat reja o'lchamlari (metr). Koordinatalar 1-qavat bilan bir xil.
// Manba: reference/2-qavat/01-plan-olchamlar.jpg (+ 02…09 ichki rasmlar). Batafsil: docs/TZ-2-qavat.md
import { FF } from './plan.js';

export const Y2 = FF; // 2-qavat pol sathi (3.90)
export const H2 = 4.0; // pol → shift plitasi (rasmlardan baholandi)
export const BEAM_D = 0.45; // to'sin balandligi
export const ROOF_T = 0.3;
export const XJ = 15.66; // chap blok / o'ng qanot chegarasi (ustunlar o'qi)

// Tashqi kontur (ichki yuzalar), L shakl
export const OUTLINE2 = [
	[ 0, 0 ], [ 23.35, 0 ], [ 23.35, 17.01 ], [ 16.0, 17.01 ], [ 16.0, 8.75 ], [ 0, 8.75 ],
];

// Ustunlar va devordan chiqib turgan pilyastrlar
export const COLS2 = [
	{ x0: - 0.3, x1: 0.75, z0: - 0.3, z1: 0.53 },
	{ x0: - 0.3, x1: 0.75, z0: 3.68, z1: 4.18 },
	{ x0: 3.3, x1: 4.3, z0: 3.68, z1: 4.18 },
	{ x0: 7.3, x1: 7.875, z0: - 0.3, z1: 1.0 },
	{ x0: 7.3, x1: 7.875, z0: 3.57, z1: 4.56 },
	{ x0: 15.375, x1: 15.95, z0: - 0.3, z1: 1.0 },
	{ x0: 15.375, x1: 15.95, z0: 3.57, z1: 4.56 },
	// sharqiy devor pilyastrlari
	{ x0: 23.2, x1: 23.65, z0: - 0.3, z1: 1.0 },
	{ x0: 23.2, x1: 23.65, z0: 3.57, z1: 4.56 },
	{ x0: 23.2, x1: 23.65, z0: 9.0, z1: 9.95 },
	{ x0: 23.2, x1: 23.65, z0: 14.95, z1: 15.94 },
	// o'ng qanot g'arbiy fasadi
	{ x0: 15.7, x1: 16.15, z0: 8.94, z1: 9.93 },
	{ x0: 15.7, x1: 16.15, z0: 14.95, z1: 15.94 },
	// pastki burchaklar
	{ x0: 15.7, x1: 16.4, z0: 16.45, z1: 17.31 },
	{ x0: 22.95, x1: 23.65, z0: 16.45, z1: 17.31 },
];

// Fasad oynalari (oyna chizig'i devor ichida, ichki yuzadan 6 sm tashqarida).
// a → b yo'nalishi shunday tanlanganki, xona lokal +Z tomonda bo'ladi.
const G = - 0.06;
export const GLAZING2 = [
	{ id: 'n1', a: [ 0.75, G ], b: [ 7.3, G ], mullions: [ 1.62, 3.27, 4.92 ], sash: [ 1 ] },
	{ id: 'n2', a: [ 7.875, G ], b: [ 15.375, G ], mullions: [ 1.5, 3.0, 4.5, 6.0 ], sash: [ 2 ] },
	{ id: 'n3', a: [ 15.95, G ], b: [ 23.2, G ], mullions: [ 1.45, 2.9, 4.35, 5.8 ], sash: [ 1, 3 ] },
	// G'arbiy fasad: faqat shimoliy burchakdagi tor oyna (rasm 12): qolgani devor, kichik xona va eshik o'rni
	{ id: 'w1', a: [ G, 1.9 ], b: [ G, 0.53 ], mullions: [ 0.69 ], sash: [] },
	{ id: 'e-w', a: [ 16.0 + G, 14.95 ], b: [ 16.0 + G, 9.93 ], mullions: [ 1.25, 2.5, 3.75 ], sash: [ 1 ] },
	{ id: 's-a', a: [ 18.75, 17.01 - G ], b: [ 16.4, 17.01 - G ], mullions: [ 0.6, 1.75 ], sash: [ 1 ] },
	{ id: 's-b', a: [ 22.95, 17.01 - G ], b: [ 20.65, 17.01 - G ], mullions: [ 0.55, 1.75 ], sash: [ 1 ] },
];
export const TRANSOMS2 = [ 0.9, 3.0 ];

// Zina ro'parasidagi kichik xona (rasm 12: zina teshigi uning devoriga taqaladi)
export const SMALLROOM2 = { x0: 0, x1: 2.0, z0: 5.6, z1: 8.75 };
// Orqadagi kichik ochiq joy (tambur): ichida to'q rangli metall eshik (rasm 12, 13)
export const NOOK2 = { x0: 0, x1: 1.4, z0: 1.9, z1: 3.68, open: [ 2.35, 3.25 ] };

// Ichki devorlar: [x0, x1, z0, z1] (balandligi to'liq)
export const PARTITIONS2 = [
	{ x0: 0, x1: 2.0, z0: 5.6, z1: 5.72, doors: [ [ 0.35, 1.15, 'white' ] ] }, // kichik xona shimoliy devori
	{ x0: 1.88, x1: 2.0, z0: 5.72, z1: 8.75 }, // kichik xona sharqiy devori (zina shu devorga taqaladi)
	{ x0: 0, x1: 1.4, z0: 1.78, z1: 1.9 }, // tambur shimoliy devori
	{ x0: 0.75, x1: 1.4, z0: 3.68, z1: 3.8 }, // tambur janubiy devori (ustungacha)
	{ x0: 15.375, x1: 15.55, z0: 4.56, z1: 8.75 }, // chap blok va o'ng qanot orasidagi devor
	{ x0: 16.0, x1: 23.35, z0: 11.6, z1: 11.72, doors: [ [ 17.25, 18.15, 'pvc' ], [ 19.25, 20.05, 'white' ], [ 21.2, 22.1, 'pvc' ] ] },
	{ x0: 18.75, x1: 18.87, z0: 11.72, z1: 17.01 },
	{ x0: 20.53, x1: 20.65, z0: 11.72, z1: 17.01 },
];

// Shiftdagi to'sinlar: o'q bo'yicha [axis, koordinata, boshlanish, tugash, kenglik]
export const BEAMS2 = [
	[ 'x', 4.07, 0, 23.35, 0.5 ],
	[ 'x', 0.15, 0, 23.35, 0.45 ],
	[ 'x', 8.6, 0, 16.0, 0.4 ],
	[ 'x', 9.43, 16.0, 23.35, 0.5 ],
	[ 'x', 15.45, 16.0, 23.35, 0.5 ],
	[ 'z', 3.8, 0, 8.75, 0.45 ],
	[ 'z', 7.59, 0, 8.75, 0.5 ],
	[ 'z', 15.66, 0, 17.01, 0.5 ],
	[ 'z', 0.2, 0, 8.75, 0.4 ],
	[ 'z', 23.15, 0, 17.01, 0.4 ],
];

// Kvadrat LED panellar (0.45 m) — chap blok va xonalar
export const PANELS2 = ( () => {

	const out = [];
	const bayX = [ [ 0.6, 3.5 ], [ 4.1, 7.3 ], [ 7.9, 15.35 ] ];
	const bayZ = [ [ 0.5, 3.8 ], [ 4.35, 8.4 ] ];
	for ( const [ xa, xb ] of bayX ) for ( const [ za, zb ] of bayZ ) {

		const nx = Math.max( 1, Math.round( ( xb - xa ) / 2.0 ) );
		const nz = Math.max( 1, Math.round( ( zb - za ) / 2.0 ) );
		for ( let i = 0; i < nx; i ++ ) for ( let k = 0; k < nz; k ++ ) {

			const x = xa + ( i + 0.5 ) * ( xb - xa ) / nx;
			const z = za + ( k + 0.5 ) * ( zb - za ) / nz;
			if ( x > 2.2 && x < 5.2 && z > 7.2 ) continue; // zina teshigi ustida emas
			if ( x < 2.1 && z > 5.5 ) continue; // kichik xona
			if ( x < 1.5 && z > 1.7 && z < 3.9 ) continue; // tambur
			out.push( [ x, z ] );

		}

	}

	// ofis xonalari (rasm 08/09: 4 tadan panel)
	for ( const [ xa, xb ] of [ [ 16.0, 18.75 ], [ 20.65, 23.2 ] ] ) {

		for ( const fx of [ 0.3, 0.7 ] ) for ( const z of [ 13.1, 15.9 ] ) out.push( [ xa + ( xb - xa ) * fx, z ] );

	}

	return out;

} )();

// Mayda yumaloq spotlar — o'ng qanot zali
export const SPOTS2 = ( () => {

	const out = [];
	for ( const [ za, zb ] of [ [ 0.5, 3.8 ], [ 4.4, 9.1 ], [ 9.8, 11.3 ] ] ) {

		const nz = Math.max( 1, Math.round( ( zb - za ) / 1.4 ) );
		for ( let k = 0; k < nz; k ++ ) for ( let i = 0; i < 5; i ++ ) out.push( [ 16.55 + i * 1.5, za + ( k + 0.5 ) * ( zb - za ) / nz ] );

	}

	return out;

} )();

export const RADIATORS2 = [
	{ x: 9.6, z: 8.75, nx: 0, nz: - 1, n: 10 },
	{ x: 12.8, z: 8.75, nx: 0, nz: - 1, n: 10 },
	{ x: 15.375, z: 6.6, nx: - 1, nz: 0, n: 10 },
	{ x: 23.35, z: 6.8, nx: - 1, nz: 0, n: 10 },
	{ x: 17.4, z: 11.72, nx: 0, nz: 1, n: 8 },
	{ x: 21.9, z: 11.72, nx: 0, nz: 1, n: 8 },
];
