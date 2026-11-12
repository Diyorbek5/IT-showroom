import * as THREE from 'three';
import { H, FF, STAIR, OPENING, WC } from './plan.js';
import { Batch, box, beam } from './geo.js';

const V = ( x, y, z ) => new THREE.Vector3( x, y, z );

export function buildStair( mats ) {

	const root = new THREE.Group();
	root.name = 'stair';
	const { x0, z0, z1, risers, rise: r, going: g } = STAIR;
	const steps = risers - 1;
	const b = new Batch();

	// Pog'onalar: oq suvoqli blok (pastki tomoni zinapoya shaklida), qora granit qoplama
	const underside = ( i ) => i * r - 0.18;
	for ( let i = 0; i < steps; i ++ ) {

		const sx = x0 + i * g;
		const top = ( i + 1 ) * r;
		let bot = underside( i );
		if ( bot < 0.15 ) bot = 0;
		b.add( mats.plaster, box( sx, sx + g + 0.001, bot, top - 0.03, z0, z1 ) );
		b.add( mats.granite, box( sx - 0.025, sx + g, top - 0.03, top, z0 - 0.02, z1 ) ); // pog'ona yuzasi
		b.add( mats.granite, box( sx - 0.012, sx, top - r, top - 0.03, z0, z1 ) ); // tik yuza

	}

	// Oxirgi (18-) ko'tarilish — orayopma qirrasi
	b.add( mats.granite, box( STAIR.x1 - 0.012, STAIR.x1, FF - r, FF, z0, z1 ) );
	b.add( mats.granite, box( STAIR.x1, 6.5, FF - 0.04, FF - 0.01, z0 - 0.02, z1 ) );

	root.add( b.build( { name: 'steps' } ) );

	// ---------- Panjara ----------
	root.add( buildRailings( mats ) );

	// ---------- Zina osti xonasi (WC) ----------
	root.add( buildWC( mats ) );

	return root;

}

function pitch( x ) {

	const { x0, rise: r, going: g } = STAIR;
	return r + ( x - x0 ) * r / g;

}

function buildRailings( mats ) {

	const b = new Batch();
	const M = mats.railing;
	const zr = STAIR.z0 + 0.035;
	const HR = 0.92; // tutqich balandligi
	const BR = 0.1; // pastki planka

	const xa = STAIR.x0 + 0.03, xb = STAIR.x1;
	// qiya tutqich va pastki planka
	b.add( M, beam( V( xa, pitch( xa ) + HR, zr ), V( xb, pitch( xb ) + HR, zr ), 0.045, 0.045 ) );
	b.add( M, beam( V( xa, pitch( xa ) + BR, zr ), V( xb, pitch( xb ) + BR, zr ), 0.012, 0.04 ) );
	// boshlang'ich ustuncha
	b.add( M, box( xa - 0.03, xa + 0.03, 0, pitch( xa ) + HR + 0.03, zr - 0.03, zr + 0.03 ) );

	// Balyasinalar (geometrik naqsh: yakka + "zinapoya" juftlik)
	panelPattern( b, M, xa + 0.06, xb - 0.04, ( x ) => pitch( x ) + BR, ( x ) => pitch( x ) + HR, ( x, y0, y1 ) => [ V( x, y0, zr ), V( x, y1, zr ) ], 'x' );

	// 2-qavatdagi to'siq (teshik atrofida)
	const y0 = FF;
	const zn = OPENING.z0 - 0.04;
	const xw = OPENING.x0 - 0.04;
	b.add( M, box( xw - 0.0225, xb + 0.0225, y0 + HR - 0.0225, y0 + HR + 0.0225, zn - 0.0225, zn + 0.0225 ) );
	b.add( M, box( xw, xb, y0 + BR - 0.006, y0 + BR + 0.006, zn - 0.02, zn + 0.02 ) );
	b.add( M, box( xw - 0.0225, xw + 0.0225, y0 + HR - 0.0225, y0 + HR + 0.0225, zn, OPENING.z1 ) );
	b.add( M, box( xw - 0.02, xw + 0.02, y0 + BR - 0.006, y0 + BR + 0.006, zn, OPENING.z1 ) );
	b.add( M, box( xw - 0.03, xw + 0.03, y0, y0 + HR + 0.03, zn - 0.03, zn + 0.03 ) );
	// tayanch ustunchalar (pastki planka polga)
	for ( let x = xw + 0.6; x < xb; x += 0.6 ) b.add( M, box( x - 0.01, x + 0.01, y0, y0 + BR, zn - 0.01, zn + 0.01 ) );
	panelPattern( b, M, xw + 0.06, xb - 0.04, () => y0 + BR, () => y0 + HR, ( x, a, c ) => [ V( x, a, zn ), V( x, c, zn ) ], 'x' );
	panelPattern( b, M, zn + 0.06, OPENING.z1 - 0.04, () => y0 + BR, () => y0 + HR, ( z, a, c ) => [ V( xw, a, z ), V( xw, c, z ) ], 'z' );

	return b.build( { name: 'railing' } );

}

// Balyasina naqshi: har 4-chi joyda ikki qator ustuncha + ichida kichik to'rtburchak
function panelPattern( b, M, s0, s1, yLo, yHi, pts, axis ) {

	const step = 0.115;
	const n = Math.floor( ( s1 - s0 ) / step );
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
			// to'rtburchak: ikki gorizontal pog'ona
			for ( const f of [ 0.32, 0.47, 0.62, 0.77 ] ) {

				const y1 = lo + ( hi - lo ) * f;
				const y2 = lo2 + ( hi2 - lo2 ) * f;
				const [ p1 ] = pts( s, y1, y1 );
				const [ p2 ] = pts( s2, y2, y2 );
				b.add( M, beam( p1, p2, 0.012, 0.012 ) );

			}

		}

	}

}

function buildWC( mats ) {

	const { x0, x1, z0, t, door } = WC;
	const { rise: r, going: g } = STAIR;
	const b = new Batch();

	// Old devor: pastki qirrasi zinapoya ostiga mos (zinapoyasimon)
	const pts = [ [ x0, 0 ], [ door.x0, 0 ], [ door.x0, door.h ], [ door.x1, door.h ], [ door.x1, 0 ], [ x1, 0 ], [ x1, H ], [ STAIR.x1, H ] ];
	for ( let i = STAIR.risers - 2; i >= 0; i -- ) {

		const sx = STAIR.x0 + i * g;
		const y = Math.max( 0, i * r - 0.18 );
		const xr = sx + g;
		if ( xr <= x0 ) break;
		pts.push( [ Math.min( xr, STAIR.x1 ), y ] );
		pts.push( [ Math.max( sx, x0 ), y ] );

	}

	const shape = new THREE.Shape( pts.map( ( [ x, y ] ) => new THREE.Vector2( x, y ) ) );
	const eg = new THREE.ExtrudeGeometry( shape, { depth: t, bevelEnabled: false } );
	eg.translate( 0, 0, z0 );
	b.add( mats.wall, eg );

	// Yon devor (x = x0)
	const yi = Math.floor( ( x0 - STAIR.x0 ) / g );
	b.add( mats.wall, box( x0, x0 + t, 0, yi * r - 0.18, z0 + t, WC.z1 ) );
	// Plintus
	b.add( mats.skirting, box( x0 - 0.012, door.x0 - 0.07, 0, 0.08, z0 - 0.012, z0 ) );
	b.add( mats.skirting, box( door.x1 + 0.07, x1, 0, 0.08, z0 - 0.012, z0 ) );
	b.add( mats.skirting, box( x0 - 0.012, x0, 0, 0.08, z0, WC.z1 ) );

	// ---------- Eshik (kulrang eman, qora shisha chiziq) ----------
	const dz = z0 - 0.0; // xona tomoni
	const lx0 = door.x0 + 0.005, lx1 = door.x1 - 0.005;
	b.add( mats.oak, box( lx0, lx1, 0.01, door.h - 0.005, dz + 0.01, dz + 0.05 ) );
	// Kesakilar (nalichnik)
	const aw = 0.07, at = 0.012;
	b.add( mats.oak, box( door.x0 - aw, door.x0, 0, door.h + aw, dz - at, dz ) );
	b.add( mats.oak, box( door.x1, door.x1 + aw, 0, door.h + aw, dz - at, dz ) );
	b.add( mats.oak, box( door.x0 - aw, door.x1 + aw, door.h, door.h + aw, dz - at, dz ) );
	b.add( mats.oak, box( door.x0, door.x0 + 0.005, 0, door.h, dz, z0 + t ) );
	b.add( mats.oak, box( door.x1 - 0.005, door.x1, 0, door.h, dz, z0 + t ) );
	// Gorizontal ariqchalar va qora shisha chiziq
	for ( const y of [ 0.38, 0.72, 1.06, 1.74 ] ) b.add( mats.groove, box( lx0 + 0.09, lx1 - 0.09, y, y + 0.004, dz + 0.0085, dz + 0.0105 ) );
	b.add( mats.blackGlass, box( lx0 + 0.09, lx1 - 0.09, 1.4, 1.46, dz + 0.007, dz + 0.0105 ) );
	// Tutqich (qora)
	const hx = lx1 - 0.075;
	const ros = new THREE.CylinderGeometry( 0.026, 0.026, 0.012, 24 );
	ros.rotateX( Math.PI / 2 );
	ros.translate( hx, 1.0, dz + 0.004 );
	b.add( mats.blackMetal, ros );
	b.add( mats.blackMetal, beam( V( hx, 1.0, dz + 0.004 ), V( hx, 1.0, dz - 0.055 ), 0.009, 0.009, true ) );
	b.add( mats.blackMetal, box( hx - 0.13, hx, 0.99, 1.012, dz - 0.068, dz - 0.05 ) );
	const keyhole = new THREE.CylinderGeometry( 0.02, 0.02, 0.01, 20 );
	keyhole.rotateX( Math.PI / 2 );
	keyhole.translate( hx, 0.86, dz + 0.004 );
	b.add( mats.blackMetal, keyhole );

	return b.build( { name: 'wc' } );

}
