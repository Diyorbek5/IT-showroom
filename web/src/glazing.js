import * as THREE from 'three';
import { Batch, box } from './geo.js';

// Umumiy vitrina qatori: a → b bo'ylab, xona lokal +Z tomonda.
// opts: y0 (pol sathi), h (balandlik), transoms (y lar), sash (ochiladigan tavaqa bo'lgan oraliqlar indeksi)
export function buildGlazingRun( run, mats, { y0 = 0, h = 3.6, transoms = [], sash = [] } = {} ) {

	const a = new THREE.Vector3( run.a[ 0 ], 0, run.a[ 1 ] );
	const b = new THREE.Vector3( run.b[ 0 ], 0, run.b[ 1 ] );
	const dir = b.clone().sub( a );
	const L = dir.length();
	const theta = Math.atan2( - dir.z, dir.x );
	const batch = new Batch();
	const F = mats.alu;
	const fw = 0.055, fd = 0.12;
	const B = ( u0, u1, ya, yb, w0, w1, m = F ) => batch.add( m, box( u0, u1, ya, yb, w0, w1 ) );

	B( 0, L, 0, 0.07, - fd / 2, fd / 2 );
	B( 0, L, h - 0.06, h, - fd / 2, fd / 2 );
	B( 0, fw, 0, h, - fd / 2, fd / 2 );
	B( L - fw, L, 0, h, - fd / 2, fd / 2 );
	for ( const u of run.mullions ) B( u - fw / 2, u + fw / 2, 0, h, - fd / 2, fd / 2 );
	for ( const t of transoms ) B( 0, L, t - fw / 2, t + fw / 2, - fd / 2, fd / 2 );

	// Ochiladigan tavaqalar (ichki rama + tutqich)
	const edges = [ 0, ...run.mullions, L ];
	const ta = transoms[ 0 ] ?? 0.9, tb = transoms[ 1 ] ?? h - 0.6;
	for ( const i of sash ) {

		if ( i >= edges.length - 1 ) continue;
		const u0 = edges[ i ] + fw / 2 + 0.005, u1 = edges[ i + 1 ] - fw / 2 - 0.005;
		const ya = ta + fw / 2 + 0.005, yb = tb - fw / 2 - 0.005;
		const s = 0.065, w0 = 0.01, w1 = 0.075;
		B( u0, u1, ya, ya + s, w0, w1 );
		B( u0, u1, yb - s, yb, w0, w1 );
		B( u0, u0 + s, ya, yb, w0, w1 );
		B( u1 - s, u1, ya, yb, w0, w1 );
		// tutqich
		const hu = u1 - 0.035, hy = ( ya + yb ) / 2;
		B( hu - 0.012, hu + 0.012, hy - 0.04, hy + 0.04, w1, w1 + 0.02, mats.blackMetal );
		B( hu - 0.008, hu + 0.008, hy - 0.11, hy, w1 + 0.015, w1 + 0.03, mats.blackMetal );

	}

	const g = new THREE.Group();
	g.name = 'glazing-' + run.id;
	g.add( batch.build( { name: 'frames' } ) );
	const pg = new THREE.PlaneGeometry( L, h - 0.12 );
	pg.translate( L / 2, h / 2, 0 );
	const tint = new THREE.Mesh( pg, mats.glassTint );
	tint.userData.isGlass = true;
	tint.renderOrder = 2;
	const refl = new THREE.Mesh( pg, mats.glassReflect );
	refl.userData.isGlassReflect = true;
	refl.renderOrder = 3;
	g.add( tint, refl );
	g.position.set( a.x, y0, a.z );
	g.rotation.y = theta;
	return g;

}
