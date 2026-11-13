import * as THREE from 'three';
import { H, FF, STAIR, OPENING, WC } from './plan.js';
import { Batch, box, beam } from './geo.js';

const V = ( x, y, z ) => new THREE.Vector3( x, y, z );
const T = 0.03; // granit qoplama qalinligi
const SLAB = 0.18; // marsh plitasining qalinligi (pastki zinapoyasimon yuza)

// L shaklidagi zina: asosiy marsh (sharq → g'arb) + maydoncha + shimolga buriluvchi qisqa marsh.
export function buildStair( mats ) {

	const root = new THREE.Group();
	root.name = 'stair';
	const { x0, xL, xE, z0, z1, zTop, risersA, risersB, rise: r, goingA: gA, goingB: gB, hLanding } = STAIR;
	const b = new Batch();

	// ---- Asosiy marsh: i = 0 eng pastki pog'ona (g'arbda, kiraverish tomoni) ----
	for ( let i = 0; i < risersA - 1; i ++ ) {

		const xw = x0 + i * gA; // pog'onaning g'arbiy (old) qirrasi
		const xe = xw + gA;
		const top = ( i + 1 ) * r;
		const bot = Math.max( 0, i * r - SLAB );
		b.add( mats.plaster, box( xw, xe + 0.001, bot, top - T, z0, z1 ) );
		b.add( mats.granite, box( xw - 0.025, xe, top - T, top, z0 - 0.02, z1 ) );
		b.add( mats.granite, box( xw - 0.012, xw, top - r, top - T, z0, z1 ) );

	}

	// ---- Maydoncha (sharq uchida) ----
	b.add( mats.plaster, box( xL - 0.001, xE, hLanding - SLAB - r, hLanding - T, z0, z1 ) );
	b.add( mats.granite, box( xL - 0.025, xE, hLanding - T, hLanding, z0 - 0.02, z1 ) );
	b.add( mats.granite, box( xL - 0.012, xL, hLanding - r, hLanding - T, z0, z1 ) );

	// ---- Shimoliy marsh: maydonchadan 2-qavatga, j = 0 eng pastki ----
	for ( let j = 0; j < risersB - 1; j ++ ) {

		const zs = z0 - j * gB; // pog'onaning janubiy (orqa) qirrasi
		const zn = zs - gB; // old (shimoliy) qirrasi
		const top = hLanding + ( j + 1 ) * r;
		const bot = hLanding + j * r - SLAB;
		b.add( mats.plaster, box( xL, xE, bot, top - T, zn - 0.001, zs ) );
		b.add( mats.granite, box( xL - 0.02, xE, top - T, top, zn - 0.025, zs ) );
		b.add( mats.granite, box( xL, xE, top - r, top - T, zn - 0.012, zn ) );

	}

	// oxirgi ko'tarilish — 2-qavat orayopmasi qirrasi
	b.add( mats.granite, box( xL, xE, FF - r, FF - 0.01, zTop - 0.012, zTop ) );

	// Marsh janubiy devorga mahkamlangan, osti ochiq: devordagi radiator va burchakdagi eshik ko'rinadi (rasm 14)
	// Maydoncha va shimoliy marsh osti ochiq (rasm 10, 11: eshik va radiator shu yerdan ko'rinadi)

	root.add( b.build( { name: 'steps' } ) );
	root.add( buildRailings( mats ) );
	root.add( buildCloset( mats ) );
	return root;

}

const pitchA = ( x ) => STAIR.rise + ( x - STAIR.x0 ) * STAIR.rise / STAIR.goingA;
const pitchB = ( z ) => STAIR.hLanding + STAIR.rise + ( STAIR.z0 - z ) * STAIR.rise / STAIR.goingB;

function buildRailings( mats ) {

	const b = new Batch();
	const M = mats.railing;
	const { x0, xL, xE, z0, z1, zTop, hLanding } = STAIR;
	const HR = 0.92, BR = 0.1;
	const zr = z0 + 0.035; // asosiy marsh panjarasi — shimoliy (ochiq) tomonda
	const xr = xL + 0.035; // shimoliy marsh panjarasi — g'arbiy (ochiq) tomonda

	// Asosiy marsh: pastki uchdan (g'arb) maydonchagacha
	const xa = x0 + 0.03, xb = xL;
	b.add( M, beam( V( xa, pitchA( xa ) + HR, zr ), V( xb, pitchA( xb ) + HR, zr ), 0.045, 0.045 ) );
	b.add( M, beam( V( xa, pitchA( xa ) + BR, zr ), V( xb, pitchA( xb ) + BR, zr ), 0.012, 0.04 ) );
	b.add( M, box( xa - 0.03, xa + 0.03, 0, pitchA( xa ) + HR + 0.03, zr - 0.03, zr + 0.03 ) );
	panelPattern( b, M, xa + 0.06, xb - 0.04, ( x ) => pitchA( x ) + BR, ( x ) => pitchA( x ) + HR, ( x, a, c ) => [ V( x, a, zr ), V( x, c, zr ) ] );

	// Maydoncha burchagidagi ustuncha
	b.add( M, box( xL - 0.03, xL + 0.03, hLanding, hLanding + HR + 0.03, zr - 0.03, zr + 0.03 ) );

	// Shimoliy marsh: g'arbiy ochiq tomoni bo'ylab, maydonchadan 2-qavatgacha
	const za = z0 + 0.035, zb = zTop;
	b.add( M, beam( V( xr, pitchB( za ) + HR, za ), V( xr, pitchB( zb ) + HR, zb ), 0.045, 0.045 ) );
	b.add( M, beam( V( xr, pitchB( za ) + BR, za ), V( xr, pitchB( zb ) + BR, zb ), 0.012, 0.04 ) );
	panelPattern( b, M, zb + 0.04, za - 0.06, ( z ) => pitchB( z ) + BR, ( z ) => pitchB( z ) + HR, ( z, a, c ) => [ V( xr, a, z ), V( xr, c, z ) ] );

	// ---- 2-qavat: teshik atrofidagi to'siq (chiqish tomoni — shimol — ochiq) ----
	const y0 = FF;
	const xw = OPENING.x0 - 0.04; // g'arbiy uch
	const zn = z0 - 0.04; // shimoliy qirra (x xw…xr)
	const xe = xE + 0.04; // sharqiy qirra (2-qavatda bu yerda devor yo'q)
	// shimoliy marshning g'arbiy qirrasi davomi (x = xr, z zTop…zn)
	b.add( M, box( xr - 0.0225, xr + 0.0225, y0 + HR - 0.0225, y0 + HR + 0.0225, zTop - 0.0225, zn + 0.0225 ) );
	b.add( M, box( xr - 0.02, xr + 0.02, y0 + BR - 0.006, y0 + BR + 0.006, zTop, zn ) );
	b.add( M, box( xr - 0.03, xr + 0.03, y0, y0 + HR + 0.03, zTop - 0.03, zTop + 0.03 ) );
	panelPattern( b, M, zTop + 0.06, zn - 0.06, () => y0 + BR, () => y0 + HR, ( z, a, c ) => [ V( xr, a, z ), V( xr, c, z ) ] );
	// shimoliy qirra (maydonchadan g'arbga, asosiy marsh ustida)
	b.add( M, box( xw - 0.0225, xr + 0.0225, y0 + HR - 0.0225, y0 + HR + 0.0225, zn - 0.0225, zn + 0.0225 ) );
	b.add( M, box( xw, xr, y0 + BR - 0.006, y0 + BR + 0.006, zn - 0.02, zn + 0.02 ) );
	b.add( M, box( xr - 0.03, xr + 0.03, y0, y0 + HR + 0.03, zn - 0.03, zn + 0.03 ) );
	b.add( M, box( xw - 0.03, xw + 0.03, y0, y0 + HR + 0.03, zn - 0.03, zn + 0.03 ) );
	for ( let x = xw + 0.6; x < xr; x += 0.6 ) b.add( M, box( x - 0.01, x + 0.01, y0, y0 + BR, zn - 0.01, zn + 0.01 ) );
	panelPattern( b, M, xw + 0.06, xr - 0.06, () => y0 + BR, () => y0 + HR, ( x, a, c ) => [ V( x, a, zn ), V( x, c, zn ) ] );
	// g'arbiy uch
	b.add( M, box( xw - 0.0225, xw + 0.0225, y0 + HR - 0.0225, y0 + HR + 0.0225, zn, z1 ) );
	b.add( M, box( xw - 0.02, xw + 0.02, y0 + BR - 0.006, y0 + BR + 0.006, zn, z1 ) );
	panelPattern( b, M, zn + 0.06, z1 - 0.04, () => y0 + BR, () => y0 + HR, ( z, a, c ) => [ V( xw, a, z ), V( xw, c, z ) ] );
	// sharqiy qirra (teshik bo'ylab, 2-qavat zalidan)
	b.add( M, box( xe - 0.0225, xe + 0.0225, y0 + HR - 0.0225, y0 + HR + 0.0225, zTop - 0.0225, z1 ) );
	b.add( M, box( xe - 0.02, xe + 0.02, y0 + BR - 0.006, y0 + BR + 0.006, zTop, z1 ) );
	b.add( M, box( xe - 0.03, xe + 0.03, y0, y0 + HR + 0.03, zTop - 0.03, zTop + 0.03 ) );
	for ( let z = zTop + 0.6; z < z1; z += 0.6 ) b.add( M, box( xe - 0.01, xe + 0.01, y0, y0 + BR, z - 0.01, z + 0.01 ) );
	panelPattern( b, M, zTop + 0.06, z1 - 0.04, () => y0 + BR, () => y0 + HR, ( z, a, c ) => [ V( xe, a, z ), V( xe, c, z ) ] );

	return b.build( { name: 'railing' } );

}

// Balyasina naqshi: har 4-chi joyda ikki qator ustuncha + ichida kichik to'rtburchak
function panelPattern( b, M, s0, s1, yLo, yHi, pts ) {

	const step = 0.115;
	const n = Math.floor( ( s1 - s0 ) / step );
	if ( n < 0 ) return;
	const off = ( s1 - s0 - n * step ) / 2;
	for ( let k = 0; k <= n; k ++ ) {

		const s = s0 + off + k * step;
		const lo = yLo( s ), hi = yHi( s );
		const [ a, c ] = pts( s, lo, hi );
		b.add( M, beam( a, c, 0.016, 0.016 ) );
		if ( k % 4 === 2 && k < n ) {

			const s2 = s + 0.045;
			const lo2 = yLo( s2 ), hi2 = yHi( s2 );
			const [ a2, c2 ] = pts( s2, lo2, hi2 );
			b.add( M, beam( a2, c2, 0.016, 0.016 ) );
			for ( const f of [ 0.32, 0.47, 0.62, 0.77 ] ) {

				const [ p1 ] = pts( s, lo + ( hi - lo ) * f, 0 );
				const [ p2 ] = pts( s2, lo2 + ( hi2 - lo2 ) * f, 0 );
				b.add( M, beam( p1, p2, 0.012, 0.012 ) );

			}

		}

	}

}

// Janubiy devordagi eshik (maydoncha ostida) va uning orqasidagi kichik xona
function buildCloset( mats ) {

	const { x0, x1, z0, z1, t, door } = WC;
	const b = new Batch();
	b.add( mats.wall, box( x0 - t, x1 + 0.3, 0, FF - 0.01, z1, z1 + 0.3 ) );
	b.add( mats.wall, box( x1, x1 + 0.3, 0, FF - 0.01, z0 + 0.3, z1 ) );
	b.add( mats.wall, box( x0 - t, x0, 0, FF - 0.01, z0 + 0.3, z1 ) );
	b.add( mats.ceiling, box( x0, x1, H, H + 0.05, z0 + 0.3, z1 ) );
	b.add( mats.skirting, box( x0, x1, 0, 0.08, z1 - 0.012, z1 ) );
	b.add( mats.skirting, box( x1 - 0.012, x1, 0, 0.08, z0 + 0.3, z1 ) );
	b.add( mats.skirting, box( x0, x0 + 0.012, 0, 0.08, z0 + 0.3, z1 ) );
	b.add( mats.skirting, box( x0, door.x0 - 0.07, 0, 0.08, z0 + 0.3, z0 + 0.312 ) );
	b.add( mats.skirting, box( door.x1 + 0.07, x1, 0, 0.08, z0 + 0.3, z0 + 0.312 ) );
	b.add( mats.ledCool, new THREE.PlaneGeometry( 0.3, 0.3 ).rotateX( Math.PI / 2 ).translate( ( x0 + x1 ) / 2, H - 0.003, ( z0 + z1 ) / 2 + 0.15 ) );

	// ---------- Eshik (kulrang eman, qora shisha chiziq) — xonaga qaragan yuza z0 da ----------
	const dz = z0;
	const lx0 = door.x0 + 0.005, lx1 = door.x1 - 0.005;
	b.add( mats.oak, box( lx0, lx1, 0.01, door.h - 0.005, dz + 0.01, dz + 0.05 ) );
	const aw = 0.07, at = 0.012;
	b.add( mats.oak, box( door.x0 - aw, door.x0, 0, door.h + aw, dz - at, dz ) );
	b.add( mats.oak, box( door.x1, door.x1 + aw, 0, door.h + aw, dz - at, dz ) );
	b.add( mats.oak, box( door.x0 - aw, door.x1 + aw, door.h, door.h + aw, dz - at, dz ) );
	b.add( mats.oak, box( door.x0, door.x0 + 0.005, 0, door.h, dz, z0 + 0.3 ) );
	b.add( mats.oak, box( door.x1 - 0.005, door.x1, 0, door.h, dz, z0 + 0.3 ) );
	b.add( mats.oak, box( door.x0, door.x1, door.h, door.h + 0.005, dz, z0 + 0.3 ) );
	for ( const y of [ 0.38, 0.72, 1.06, 1.74 ] ) b.add( mats.groove, box( lx0 + 0.09, lx1 - 0.09, y, y + 0.004, dz + 0.0085, dz + 0.0105 ) );
	b.add( mats.blackGlass, box( lx0 + 0.09, lx1 - 0.09, 1.4, 1.46, dz + 0.007, dz + 0.0105 ) );
	const hx = lx1 - 0.075;
	b.add( mats.blackMetal, new THREE.CylinderGeometry( 0.026, 0.026, 0.012, 24 ).rotateX( Math.PI / 2 ).translate( hx, 1.0, dz + 0.004 ) );
	b.add( mats.blackMetal, beam( V( hx, 1.0, dz + 0.004 ), V( hx, 1.0, dz - 0.055 ), 0.009, 0.009, true ) );
	b.add( mats.blackMetal, box( hx - 0.13, hx, 0.99, 1.012, dz - 0.068, dz - 0.05 ) );
	b.add( mats.blackMetal, new THREE.CylinderGeometry( 0.02, 0.02, 0.01, 20 ).rotateX( Math.PI / 2 ).translate( hx, 0.86, dz + 0.004 ) );

	return b.build( { name: 'closet' } );

}
