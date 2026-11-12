import * as THREE from 'three';
import { H, FF, WALL_T, ROOM, COLUMNS, GLAZING, OPENING, STAIR } from './plan.js';
import { Batch, box, worldUV } from './geo.js';

const SK_H = 0.08; // plintus balandligi
const SK_T = 0.012;

export function buildShell( mats ) {

	const root = new THREE.Group();
	root.name = 'shell';

	// ---------- Pol ----------
	const fpts = [ [ - 0.12, - 0.12 ], [ 7.3, - 0.12 ], [ 7.3, 5.76 ], [ 6.5, 6.8 ], [ 6.5, 8.75 ], [ - 0.12, 8.75 ] ];
	const fshape = new THREE.Shape( fpts.map( ( [ x, z ] ) => new THREE.Vector2( x, - z ) ) );
	const fgeo = new THREE.ShapeGeometry( fshape );
	fgeo.rotateX( - Math.PI / 2 );
	worldUV( fgeo );
	const floor = new THREE.Mesh( fgeo, mats.floor );
	floor.receiveShadow = true;
	floor.name = 'floor';
	root.add( floor );

	// ---------- Devorlar, ustunlar, plintus ----------
	const solid = new Batch();
	const W = mats.wall;
	const top = FF - 0.01; // 2-qavat poli bilan z-fighting bo'lmasin
	// Sharqiy devor (shimoldan qiya burchakkacha)
	solid.add( W, box( 7.3, 7.3 + WALL_T, 0, top, - WALL_T, 5.76 ) );
	// Qiya burchak
	{

		const a = new THREE.Vector2( 7.3, 5.76 ), b = new THREE.Vector2( 6.5, 6.8 );
		const d = b.clone().sub( a );
		const len = d.length();
		const g = new THREE.BoxGeometry( len + 0.36, top, WALL_T );
		const ang = Math.atan2( - d.y, d.x );
		g.rotateY( ang );
		const n = new THREE.Vector2( d.y, - d.x ).normalize(); // tashqariga
		const mid = a.clone().add( b ).multiplyScalar( 0.5 ).add( n.clone().multiplyScalar( WALL_T / 2 ) );
		g.translate( mid.x, top / 2, mid.y );
		solid.add( W, g );

	}

	solid.add( W, box( 6.5, 6.5 + WALL_T, 0, top, 6.8, 8.75 + WALL_T ) );
	solid.add( W, box( - WALL_T, 6.5 + WALL_T, 0, top, 8.75, 8.75 + WALL_T ) );

	for ( const c of COLUMNS ) solid.add( W, box( c.x0, c.x1, 0, H, c.z0, c.z1 ) );

	// Vitrina ustidagi orayopma qirrasi (fasad lentasi)
	solid.add( W, box( - WALL_T, 7.3 + WALL_T, H, top, - WALL_T, 0 ) );
	solid.add( W, box( - WALL_T, 0, H, top, - WALL_T, 8.75 ) );

	// Plintus (qora)
	const S = mats.skirting;
	const skX = ( x, z0, z1, side ) => solid.add( S, box( x, x + side * SK_T, 0, SK_H, z0, z1 ) );
	const skZ = ( z, x0, x1, side ) => solid.add( S, box( x0, x1, 0, SK_H, z, z + side * SK_T ) );
	skX( 7.3, 0, 5.76, - 1 );
	skX( 6.5, 6.8, 7.55, - 1 );
	skZ( 8.75, 0, 5.44, - 1 );
	{

		// qiya burchak plintusi
		const a = new THREE.Vector2( 7.3, 5.76 ), b = new THREE.Vector2( 6.5, 6.8 );
		const d = b.clone().sub( a );
		const g = new THREE.BoxGeometry( d.length(), SK_H, SK_T );
		g.rotateY( Math.atan2( - d.y, d.x ) );
		const n = new THREE.Vector2( - d.y, d.x ).normalize(); // ichkariga
		const mid = a.clone().add( b ).multiplyScalar( 0.5 ).add( n.multiplyScalar( SK_T / 2 ) );
		g.translate( mid.x, SK_H / 2, mid.y );
		solid.add( S, g );

	}

	// ustun plintuslari
	const colSk = ( c, faces ) => {

		const e = SK_T;
		if ( faces.includes( 'e' ) ) solid.add( S, box( c.x1, c.x1 + e, 0, SK_H, Math.max( c.z0, GLASS0 ) - ( faces.includes( 'n' ) ? e : 0 ), c.z1 + ( faces.includes( 's' ) ? e : 0 ) ) );
		if ( faces.includes( 'w' ) ) solid.add( S, box( c.x0 - e, c.x0, 0, SK_H, c.z0 - e, c.z1 + e ) );
		if ( faces.includes( 'n' ) ) solid.add( S, box( Math.max( c.x0, GLASS0 ), c.x1, 0, SK_H, c.z0 - e, c.z0 ) );
		if ( faces.includes( 's' ) ) solid.add( S, box( Math.max( c.x0, GLASS0 ), c.x1, 0, SK_H, c.z1, c.z1 + e ) );

	};

	colSk( COLUMNS[ 0 ], [ 'e', 's' ] );
	colSk( COLUMNS[ 1 ], [ 'e', 'n', 's' ] );
	colSk( COLUMNS[ 2 ], [ 'e', 'w', 'n', 's' ] );

	root.add( solid.build( { name: 'walls' } ) );

	// ---------- Vitrinalar ----------
	for ( const run of GLAZING ) root.add( buildGlazing( run, mats ) );

	// ---------- Shift (zina teshigi bilan) ----------
	const ceil = new THREE.Group();
	ceil.name = 'ceiling';
	const cshape = new THREE.Shape( [ [ - 0.12, - 0.12 ], [ 7.3, - 0.12 ], ...ROOM.slice( 2 ), [ - 0.12, 8.75 ] ].map( ( [ x, z ] ) => new THREE.Vector2( x, z ) ) );
	const hole = new THREE.Path( [
		new THREE.Vector2( OPENING.x0, OPENING.z0 ), new THREE.Vector2( OPENING.x0, OPENING.z1 ),
		new THREE.Vector2( OPENING.x1, OPENING.z1 ), new THREE.Vector2( OPENING.x1, OPENING.z0 ),
	] );
	cshape.holes.push( hole );
	const cgeo = new THREE.ShapeGeometry( cshape );
	cgeo.rotateX( Math.PI / 2 );
	cgeo.translate( 0, H, 0 );
	const ceilMesh = new THREE.Mesh( cgeo, mats.ceiling );
	ceilMesh.receiveShadow = true;
	ceilMesh.castShadow = true;
	ceil.add( ceilMesh );

	// Teshik qirralari
	const edges = new Batch();
	edges.add( mats.ceiling, box( OPENING.x0, OPENING.x1, H, FF - 0.01, OPENING.z0 - 0.05, OPENING.z0 ) );
	edges.add( mats.ceiling, box( OPENING.x0 - 0.05, OPENING.x0, H, FF - 0.01, OPENING.z0 - 0.05, OPENING.z1 ) );
	edges.add( mats.ceiling, box( OPENING.x1, OPENING.x1 + 0.05, H, FF - 0.01, OPENING.z0, OPENING.z1 ) );
	ceil.add( edges.build( { name: 'slab-edges' } ) );


	root.add( ceil );
	root.userData.ceiling = ceil;
	root.userData.floor = floor;
	return root;

}

const GLASS0 = - 0.06;

// Bitta oynavand devor qatorini quradi: a → b bo'ylab, xona chap tomonda emas — ichki normal +localZ.
function buildGlazing( run, mats ) {

	const a = new THREE.Vector3( run.a[ 0 ], 0, run.a[ 1 ] );
	const b = new THREE.Vector3( run.b[ 0 ], 0, run.b[ 1 ] );
	const dir = b.clone().sub( a );
	const L = dir.length();
	const theta = Math.atan2( - dir.z, dir.x );

	const batch = new Batch();
	const F = mats.alu;
	const fw = 0.055; // profil kengligi
	const fd = 0.12; // profil chuqurligi
	const ht = H;

	// Lokal koordinatada: u = 0..L (X), y, w (Z, + xona tomoni). Oyna w=0.
	const B = ( u0, u1, y0, y1, w0, w1 ) => batch.add( F, box( u0, u1, y0, y1, w0, w1 ) );
	B( 0, L, 0, 0.06, - fd / 2, fd / 2 ); // pastki
	B( 0, L, ht - 0.06, ht, - fd / 2, fd / 2 ); // yuqori
	for ( const u of [ 0, L ] ) B( u - ( u ? fw : 0 ), u + ( u ? 0 : fw ), 0, ht, - fd / 2, fd / 2 );
	for ( const u of run.mullions ) B( u - fw / 2, u + fw / 2, 0, ht, - fd / 2, fd / 2 );

	if ( run.transom ) {

		B( 0, L, run.transom - fw / 2, run.transom + fw / 2, - fd / 2, fd / 2 );

	}

	// Eshiklar (2 tabaqali, oynali, qora rama)
	for ( const d of run.doors ) {

		const dw = d.t1 - d.t0;
		const leaf = ( dw - fw ) / 2;
		const sw = 0.075; // tabaqa ramasi
		for ( let k = 0; k < 2; k ++ ) {

			const u0 = d.t0 + fw / 2 + k * leaf + 0.004;
			const u1 = u0 + leaf - 0.008;
			const y0 = 0.065, y1 = d.h - fw / 2 - 0.004;
			B( u0, u0 + sw, y0, y1, - 0.03, 0.03 );
			B( u1 - sw, u1, y0, y1, - 0.03, 0.03 );
			B( u0, u1, y0, y0 + 0.11, - 0.03, 0.03 );
			B( u0, u1, y1 - sw, y1, - 0.03, 0.03 );
			// Vertikal tutqichlar (ikki tomonda)
			const hu = k === 0 ? u1 - 0.07 : u0 + 0.07;
			for ( const side of [ - 1, 1 ] ) {

				const wOff = side * 0.075;
				batch.add( mats.steel, cyl( hu, 0.95, 1.75, wOff, 0.014 ) );
				batch.add( mats.steel, cylZ( hu, 1.05, side * 0.03, side * 0.075, 0.008 ) );
				batch.add( mats.steel, cylZ( hu, 1.65, side * 0.03, side * 0.075, 0.008 ) );

			}

		}

	}

	const g = new THREE.Group();
	g.name = 'glazing-' + run.id;
	const frames = batch.build( { name: 'frames' } );
	g.add( frames );

	// Oyna paneli
	const pg = new THREE.PlaneGeometry( L, ht - 0.12 );
	pg.translate( L / 2, ht / 2, 0 );
	const tint = new THREE.Mesh( pg, mats.glassTint );
	tint.name = 'glass';
	tint.userData.isGlass = true;
	tint.castShadow = false;
	tint.renderOrder = 2;
	const refl = new THREE.Mesh( pg, mats.glassReflect );
	refl.userData.isGlassReflect = true;
	refl.renderOrder = 3;
	g.add( tint, refl );

	g.position.copy( a );
	g.rotation.y = theta;
	return g;

}

function cyl( u, y0, y1, w, r ) {

	const g = new THREE.CylinderGeometry( r, r, y1 - y0, 12 );
	g.translate( u, ( y0 + y1 ) / 2, w );
	return g;

}

function cylZ( u, y, w0, w1, r ) {

	const g = new THREE.CylinderGeometry( r, r, Math.abs( w1 - w0 ), 10 );
	g.rotateX( Math.PI / 2 );
	g.translate( u, y, ( w0 + w1 ) / 2 );
	return g;

}

export { STAIR };
