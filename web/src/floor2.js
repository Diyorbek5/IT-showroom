import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OPENING } from './plan.js';
import { Y2, H2, BEAM_D, ROOF_T, XJ, OUTLINE2, COLS2, GLAZING2, TRANSOMS2, PARTITIONS2, BEAMS2, PANELS2, SPOTS2, RADIATORS2, NOOK2 } from './plan2.js';
import { Batch, box, worldUV } from './geo.js';
import { buildGlazingRun } from './glazing.js';
import { addRadiators } from './fixtures.js';

const V = ( x, y, z ) => new THREE.Vector3( x, y, z );
const TOP = Y2 + H2; // shift plitasi osti
const SK_H = 0.07, SK_T = 0.014;
const DOOR_H = 2.1;

export function buildFloor2( mats, m2 ) {

	const root = new THREE.Group();
	root.name = 'floor2';

	// ---------- Pol: laminat (chap blokda X bo'ylab, o'ng qanotda Z bo'ylab) ----------
	const floors = [];
	{

		const left = new THREE.Shape( [ [ - 0.12, - 0.12 ], [ XJ, - 0.12 ], [ XJ, 8.75 ], [ - 0.12, 8.75 ] ].map( ( [ x, z ] ) => new THREE.Vector2( x, - z ) ) );
		left.holes.push( new THREE.Path( [
			...OPENING.poly.map( ( [ x, z ] ) => new THREE.Vector2( x, - z ) ),
		] ) );
		const right = new THREE.Shape( [ [ XJ, - 0.12 ], [ 23.35, - 0.12 ], [ 23.35, 17.01 ], [ 16.0, 17.01 ], [ 16.0, 8.75 ], [ XJ, 8.75 ] ].map( ( [ x, z ] ) => new THREE.Vector2( x, - z ) ) );
		for ( const [ shape, swap ] of [ [ left, false ], [ right, true ] ] ) {

			const g = new THREE.ShapeGeometry( shape );
			g.rotateX( - Math.PI / 2 );
			g.translate( 0, Y2, 0 );
			worldUV( g );
			if ( swap ) {

				const uv = g.attributes.uv;
				for ( let i = 0; i < uv.count; i ++ ) uv.setXY( i, uv.getY( i ), uv.getX( i ) + 0.37 );

			}

			const mesh = new THREE.Mesh( g, m2.laminate );
			mesh.receiveShadow = true;
			mesh.name = 'floor2';
			root.add( mesh );
			floors.push( mesh );

		}

	}

	// ---------- Devorlar ----------
	const w = new Batch();
	const W = m2.wall;
	const yb = Y2 - 0.3, yt = TOP + ROOF_T;
	w.add( W, box( 23.35, 23.65, yb, yt, - 0.3, 17.31 ) ); // sharqiy devor
	w.add( W, box( - 0.3, 15.7, yb, yt, 8.75, 9.05 ) ); // chap blok janubiy devori
	w.add( W, box( 15.7, 16.0, yb, yt, 8.75, 11.2 ) ); // 2-eshik shu devorda
	w.add( W, box( 15.7, 16.0, yb, yt, 14.95, 17.31 ) );
	for ( const [ x0, x1 ] of [ [ 15.7, 16.4 ], [ 18.75, 20.65 ], [ 22.95, 23.65 ] ] ) w.add( W, box( x0, x1, yb, yt, 17.01, 17.31 ) );
	// oyna ustidagi va ostidagi fasad lentalari
	const band = ( x0, x1, z0, z1 ) => {

		w.add( W, box( x0, x1, yb, Y2, z0, z1 ) );
		w.add( W, box( x0, x1, TOP, yt, z0, z1 ) );

	};

	band( - 0.3, 23.65, - 0.3, 0 );
	band( - 0.3, 0, 0, 2.55 );
	w.add( W, box( - 0.3, 0, yb, yt, 2.55, 8.75 ) ); // g'arbiy devor (oynasiz qism, eshik shu yerda)


	band( 15.7, 16.0, 11.2, 14.95 );
	band( 16.4, 18.75, 17.01, 17.31 );
	band( 20.65, 22.95, 17.01, 17.31 );

	for ( const c of COLS2 ) w.add( W, box( c.x0, c.x1, Y2, TOP, c.z0, c.z1 ) );

	// Ichki devorlar va eshik o'rinlari
	const doors = [];
	for ( const p of PARTITIONS2 ) {

		if ( p.doorsZ ) {

			let z = p.z0;
			for ( const [ d0, d1 ] of p.doorsZ ) {

				w.add( W, box( p.x0, p.x1, Y2, TOP, z, d0 ) );
				w.add( W, box( p.x0, p.x1, Y2 + DOOR_H, TOP, d0, d1 ) );
				addDoorZ( w, m2, { x0: p.x0, x1: p.x1, z0: d0, z1: d1 } );
				z = d1;

			}

			w.add( W, box( p.x0, p.x1, Y2, TOP, z, p.z1 ) );
			continue;

		}

		if ( p.doorZ ) {

			w.add( W, box( p.x0, p.x1, Y2 + DOOR_H, TOP, p.z0, p.z1 ) );
			addDoorZ( w, m2, p );
			continue;

		}

		if ( ! p.doors ) {

			w.add( W, box( p.x0, p.x1, Y2, TOP, p.z0, p.z1 ) );
			continue;

		}

		let x = p.x0;
		for ( const [ d0, d1, type ] of p.doors ) {

			w.add( W, box( x, d0, Y2, TOP, p.z0, p.z1 ) );
			w.add( W, box( d0, d1, Y2 + DOOR_H, TOP, p.z0, p.z1 ) );
			doors.push( { x0: d0, x1: d1, z0: p.z0, z1: p.z1, type } );
			x = d1;

		}

		w.add( W, box( x, p.x1, Y2, TOP, p.z0, p.z1 ) );

	}

	// ---------- Plintus (och yog'och) ----------
	const S = m2.skirting;
	const skx = ( x, z0, z1, side ) => w.add( S, box( x, x + side * SK_T, Y2, Y2 + SK_H, z0, z1 ) );
	const skz = ( z, x0, x1, side ) => w.add( S, box( x0, x1, Y2, Y2 + SK_H, z, z + side * SK_T ) );
	skx( 23.35, 1.0, 3.57, - 1 ); skx( 23.35, 4.56, 9.0, - 1 ); skx( 23.35, 9.95, 11.6, - 1 );
	skx( 23.35, 11.72, 14.95, - 1 ); skx( 23.35, 15.94, 16.45, - 1 );
	skz( 8.75, 0, 1.9, - 1 ); skz( 8.75, 6.5, 16.0, - 1 ); skz( 6.28, 1.9, 3.78, - 1 ); skx( 6.5, 0, 1.93, - 1 ); skx( 6.5, 2.97, 5.18, - 1 ); skx( 6.8, 0, 1.93, 1 ); skx( 6.8, 2.97, 5.18, 1 );
	skz( 3.86, 0.75, 3.3, - 1 ); skz( 3.98, 0.75, 3.3, 1 ); skz( 3.86, 4.3, 4.68, - 1 ); skz( 3.86, 5.72, 6.5, - 1 ); skz( 3.98, 4.3, 4.68, 1 ); skz( 3.98, 5.72, 6.5, 1 );
	skx( 17.6, 11.72, 12.33, - 1 ); skx( 17.6, 13.37, 17.01, - 1 ); skx( 17.72, 11.72, 12.33, 1 ); skx( 17.72, 13.37, 17.01, 1 );
	skz( 5.18, 3.78, 6.5, - 1 ); skz( 5.3, 3.9, 6.8, 1 ); skx( 3.78, 5.18, 6.28, - 1 ); skx( 3.9, 5.3, 6.4, 1 ); skx( 16.0, 8.75, 10.0, 1 ); skx( 16.0, 10.95, 11.2, 1 );
	skz( 8.75, 2.02, 3.78, - 1 ); skx( 2.02, 6.4, 8.75, 1 ); skx( 3.78, 6.4, 8.75, - 1 );
	skx( 0, 4.18, 5.6, 1 ); skx( 0.75, 3.8, 3.68, 1 );
	skx( 0, 4.18, 8.75, 1 ); skx( 0, 2.55, 2.62, 1 ); skx( 0, 3.63, 3.68, 1 ); 
	skx( 16.0, 8.75, 8.94, 1 );
	let sx = 17.6;
	for ( const d of doors.filter( ( q ) => q.x0 > 17 ) ) {

		skz( 11.6, sx, d.x0 - 0.07, - 1 ); skz( 11.72, sx, d.x0 - 0.07, 1 ); sx = d.x1 + 0.07;

	}

	skz( 11.6, sx, 23.35, - 1 ); skz( 11.72, sx, 23.35, 1 );
	skx( 20.53, 11.72, 17.01, - 1 ); skx( 20.65, 11.72, 17.01, 1 );
	for ( const c of COLS2.slice( 2, 7 ) ) {

		if ( c.x0 > 0 && c.z0 > 0 ) {

			skz( c.z0, c.x0 - SK_T, c.x1 + SK_T, - 1 ); skz( c.z1, c.x0 - SK_T, c.x1 + SK_T, 1 );
			skx( c.x0, c.z0, c.z1, - 1 ); skx( c.x1, c.z0, c.z1, 1 );

		} else {

			skz( c.z1, c.x0, c.x1 + SK_T, 1 ); skx( c.x0, 0, c.z1, - 1 ); skx( c.x1, 0, c.z1, 1 );

		}

	}

	// ---------- Eshiklar ----------
	for ( const d of doors ) addDoor( w, m2, d );
	// 2-eshik: to'q rangli metall eshik — o'ng qanot g'arbiy devorida, burchak yonida (belgilangan reja)
	addSurfaceDoorX( w, m2, 10.05, 10.9, 16.0 );

	// Zina teshigi atrofidagi pol qirrasi va ostona chiziqlari
	w.add( m2.threshold, box( XJ - 0.015, XJ + 0.015, Y2, Y2 + 0.004, 1.0, 3.57 ) );
	w.add( m2.threshold, box( 15.55, 16.0, Y2, Y2 + 0.004, 4.56 + 0.0, 4.56 + 0.03 ) );

	// ---------- Radiatorlar, gaz qozon, rozetkalar ----------
	addRadiators( w, m2, RADIATORS2, Y2 );
	addBoiler( w, m2, 7.59, 1.0, 0 ); // rasm 12: qozon ustunning janubiy yuzasida
	for ( const [ x, z, nx, nz ] of [ [ 23.35, 6.0, - 1, 0 ], [ 9.0, 8.75, 0, - 1 ], [ 15.375, 5.4, - 1, 0 ], [ 17.0, 11.72, 0, 1 ], [ 22.6, 11.72, 0, 1 ], [ 19.0, 11.6, 0, - 1 ] ] ) addSocket( w, m2, x, Y2 + 0.32, z, nx, nz );

	root.add( w.build( { name: 'floor2-walls' } ) );

	// ---------- Fasad oynalari ----------
	for ( const run of GLAZING2 ) root.add( buildGlazingRun( run, { ...mats, ...m2 }, { y0: Y2, h: H2, transoms: TRANSOMS2, sash: run.sash } ) );

	// ---------- Shift: qora plita, to'sinlar, panellar, spotlar, kabellar ----------
	const ceil = new THREE.Group();
	ceil.name = 'floor2-ceiling';
	const cs = new THREE.Shape( OUTLINE2.map( ( [ x, z ] ) => new THREE.Vector2( x, z ) ) );
	const cg = new THREE.ShapeGeometry( cs );
	cg.rotateX( Math.PI / 2 );
	cg.translate( 0, TOP, 0 );
	const cm = new THREE.Mesh( cg, m2.ceilingBlack );
	cm.castShadow = true;
	cm.receiveShadow = true;
	ceil.add( cm );
	// tom (tashqi)
	const rg = new THREE.ShapeGeometry( new THREE.Shape( OUTLINE2.map( ( [ x, z ] ) => new THREE.Vector2( x, - z ) ) ) );
	rg.rotateX( - Math.PI / 2 ).translate( 0, TOP + ROOF_T, 0 );
	const roof = new THREE.Mesh( rg, m2.mass );
	roof.castShadow = true;
	ceil.add( roof );

	const cb = new Batch();
	for ( const [ ax, c, s0, s1, bw ] of BEAMS2 ) {

		if ( ax === 'x' ) cb.add( m2.ceilingBlack, box( s0, s1, TOP - BEAM_D, TOP, c - bw / 2, c + bw / 2 ) );
		else cb.add( m2.ceilingBlack, box( c - bw / 2, c + bw / 2, TOP - BEAM_D, TOP, s0, s1 ) );

	}

	const pe = new Batch();
	for ( const [ x, z ] of PANELS2 ) {

		cb.add( m2.panelFrame, new RoundedBoxGeometry( 0.47, 0.035, 0.47, 2, 0.006 ).translate( x, TOP - 0.0175, z ) );
		pe.add( m2.ledCool, new THREE.PlaneGeometry( 0.43, 0.43 ).rotateX( Math.PI / 2 ).translate( x, TOP - 0.0356, z ) );

	}

	for ( const [ x, z ] of SPOTS2 ) {

		cb.add( m2.panelFrame, new THREE.CylinderGeometry( 0.065, 0.065, 0.03, 24 ).translate( x, TOP - 0.015, z ) );
		pe.add( m2.ledCool, new THREE.CircleGeometry( 0.05, 24 ).rotateX( Math.PI / 2 ).translate( x, TOP - 0.0305, z ) );

	}

	addCables( cb, m2 );
	ceil.add( cb.build( { name: 'floor2-beams', castShadow: true } ) );
	ceil.add( pe.build( { name: 'floor2-leds', castShadow: false, receiveShadow: false } ) );

	// Real yorug'lik: panel guruhlari uchun bir nechta katta RectAreaLight
	const lights = [];
	const zones = [ [ 0.6, 3.5, 0.5, 8.4 ], [ 4.1, 7.3, 0.5, 7.0 ], [ 7.9, 15.35, 0.5, 8.4 ], [ 16.4, 22.8, 0.5, 11.2 ], [ 16.0, 18.75, 12, 17 ], [ 20.65, 23.2, 12, 17 ] ];
	for ( const [ x0, x1, z0, z1 ] of zones ) {

		const n = PANELS2.filter( ( [ x, z ] ) => x > x0 && x < x1 && z > z0 && z < z1 ).length * 0.185 + SPOTS2.filter( ( [ x, z ] ) => x > x0 && x < x1 && z > z0 && z < z1 ).length * 0.008;
		const lw = ( x1 - x0 ) * 0.7, ld = ( z1 - z0 ) * 0.7;
		const rl = new THREE.RectAreaLight( 0xf2f5ff, 1, lw, ld );
		rl.position.set( ( x0 + x1 ) / 2, TOP - BEAM_D - 0.02, ( z0 + z1 ) / 2 );
		rl.lookAt( rl.position.x, 0, rl.position.z );
		rl.userData.areaFactor = n / ( lw * ld );
		ceil.add( rl );
		lights.push( rl );

	}

	root.add( ceil );

	// ---------- 1-qavatdagi qo'shni bo'limlar (tashqi hajm, 2-qavat ostida) ----------
	const mass = new Batch();
	mass.add( m2.mass, box( 7.6, 23.65, 0, Y2 - 0.3, - 0.3, 9.05 ) );
	mass.add( m2.mass, box( 15.7, 23.65, 0, Y2 - 0.3, 9.05, 17.31 ) );
	const massGroup = mass.build( { name: 'mass' } );

	root.userData = { ceiling: ceil, floors, lights, mass: massGroup };
	return root;

}

function addDoor( b, m2, d ) {

	const zc = ( d.z0 + d.z1 ) / 2;
	if ( d.type === 'open' ) {

		// eshiksiz o'tish joyi — faqat oq ramka
		for ( const side of [ - 1, 1 ] ) {

			const zf = side < 0 ? d.z0 : d.z1, t = side * 0.012;
			b.add( m2.pvc, box( d.x0 - 0.06, d.x0, Y2, Y2 + DOOR_H + 0.06, zf, zf + t ) );
			b.add( m2.pvc, box( d.x1, d.x1 + 0.06, Y2, Y2 + DOOR_H + 0.06, zf, zf + t ) );
			b.add( m2.pvc, box( d.x0 - 0.06, d.x1 + 0.06, Y2 + DOOR_H, Y2 + DOOR_H + 0.06, zf, zf + t ) );

		}

		return;

	}

	const lx0 = d.x0 + 0.005, lx1 = d.x1 - 0.005;
	const leafMat = d.type === 'pvc' || d.type === 'white' ? m2.pvc : m2.metalDoor;
	b.add( leafMat, box( lx0, lx1, Y2 + 0.01, Y2 + DOOR_H - 0.005, zc - 0.025, zc + 0.025 ) );
	if ( d.type === 'pvc' ) {

		// katta to'q oyna paneli (rasm 03)
		b.add( m2.darkGlass, box( lx0 + 0.11, lx1 - 0.11, Y2 + 0.95, Y2 + 1.95, zc - 0.027, zc + 0.027 ) );

	}

	for ( const side of [ - 1, 1 ] ) {

		const zf = side < 0 ? d.z0 : d.z1;
		const t = side * 0.012;
		b.add( m2.pvc, box( d.x0 - 0.06, d.x0, Y2, Y2 + DOOR_H + 0.06, zf, zf + t ) );
		b.add( m2.pvc, box( d.x1, d.x1 + 0.06, Y2, Y2 + DOOR_H + 0.06, zf, zf + t ) );
		b.add( m2.pvc, box( d.x0 - 0.06, d.x1 + 0.06, Y2 + DOOR_H, Y2 + DOOR_H + 0.06, zf, zf + t ) );
		// tutqich
		const hx = lx1 - 0.07;
		b.add( m2.chrome, box( hx - 0.12, hx + 0.01, Y2 + 1.0, Y2 + 1.02, zc + side * 0.06, zc + side * 0.075 ) );
		b.add( m2.chrome, box( hx - 0.01, hx + 0.01, Y2 + 0.99, Y2 + 1.03, zc + side * 0.025, zc + side * 0.065 ) );

	}

	b.add( m2.pvc, box( d.x0, d.x0 + 0.01, Y2, Y2 + DOOR_H, d.z0, d.z1 ) );
	b.add( m2.pvc, box( d.x1 - 0.01, d.x1, Y2, Y2 + DOOR_H, d.z0, d.z1 ) );

}

// z bo'ylab ketgan devordagi eshik (tavaqa x o'qiga perpendikulyar)
function addDoorZ( b, m2, p ) {

	const xc = ( p.x0 + p.x1 ) / 2;
	const z0 = p.z0, z1 = p.z1;
	const lz0 = z0 + 0.005, lz1 = z1 - 0.005;
	b.add( m2.pvc, box( xc - 0.025, xc + 0.025, Y2 + 0.01, Y2 + DOOR_H - 0.005, lz0, lz1 ) );
	b.add( m2.darkGlass, box( xc - 0.027, xc + 0.027, Y2 + 0.95, Y2 + 1.95, lz0 + 0.11, lz1 - 0.11 ) );
	for ( const side of [ - 1, 1 ] ) {

		const xf = side < 0 ? p.x0 : p.x1, t = side * 0.012;
		b.add( m2.pvc, box( xf, xf + t, Y2, Y2 + DOOR_H + 0.06, z0 - 0.06, z0 ) );
		b.add( m2.pvc, box( xf, xf + t, Y2, Y2 + DOOR_H + 0.06, z1, z1 + 0.06 ) );
		b.add( m2.pvc, box( xf, xf + t, Y2 + DOOR_H, Y2 + DOOR_H + 0.06, z0 - 0.06, z1 + 0.06 ) );
		b.add( m2.chrome, box( xc + side * 0.06, xc + side * 0.075, Y2 + 1.0, Y2 + 1.02, lz1 - 0.19, lz1 - 0.06 ) );

	}

	b.add( m2.pvc, box( p.x0, p.x1, Y2, Y2 + DOOR_H, z0, z0 + 0.01 ) );
	b.add( m2.pvc, box( p.x0, p.x1, Y2, Y2 + DOOR_H, z1 - 0.01, z1 ) );

}

// Devor yuzasidagi metall eshik (x = const devor, sharqqa qaragan)
function addSurfaceDoorX( b, m2, z0, z1, x ) {

	b.add( m2.metalDoor, box( x, x + 0.02, Y2, Y2 + DOOR_H + 0.05, z0 - 0.05, z1 + 0.05 ) );
	b.add( m2.metalDoor, box( x + 0.02, x + 0.045, Y2 + 0.005, Y2 + DOOR_H, z0, z1 ) );
	for ( let y = 0.3; y < DOOR_H - 0.1; y += 0.16 ) b.add( m2.blackMetal, box( x + 0.044, x + 0.047, Y2 + y, Y2 + y + 0.006, z0 + 0.06, z1 - 0.06 ) );
	b.add( m2.chrome, box( x + 0.08, x + 0.1, Y2 + 1.0, Y2 + 1.02, z1 - 0.16, z1 - 0.04 ) );

}

function addBoiler( b, m2, x, z, rotY = - Math.PI / 2 ) {

	const m = new THREE.Matrix4().makeRotationY( rotY ).setPosition( x, Y2, z );
	b.add( m2.boiler, new RoundedBoxGeometry( 0.42, 0.72, 0.3, 3, 0.03 ).translate( 0, 1.75, 0.16 ), m );
	b.add( m2.boilerGrey, box( - 0.17, 0.17, 1.4, 1.43, 0.04, 0.29 ), m );
	b.add( m2.darkGlass, box( - 0.08, 0.08, 1.62, 1.68, 0.305, 0.312 ), m );
	for ( let i = 0; i < 4; i ++ ) {

		const px = - 0.12 + i * 0.08;
		b.add( m2.radiator, new THREE.CylinderGeometry( 0.011, 0.011, 0.45, 10 ).translate( px, 1.17, 0.1 ), m );
		b.add( m2.chrome, new THREE.CylinderGeometry( 0.016, 0.016, 0.05, 12 ).translate( px, 1.3, 0.1 ), m );

	}

	// tutun quvuri va vertikal quvurlar
	b.add( m2.radiator, new THREE.CylinderGeometry( 0.05, 0.05, H2 - 2.11 - BEAM_D, 20 ).translate( 0, 2.11 + ( H2 - 2.11 - BEAM_D ) / 2, 0.16 ), m );
	b.add( m2.radiator, new THREE.CylinderGeometry( 0.013, 0.013, 1.0, 10 ).translate( 0.18, 0.5, 0.06 ), m );
	b.add( m2.radiator, new THREE.CylinderGeometry( 0.013, 0.013, 1.0, 10 ).translate( 0.24, 0.5, 0.06 ), m );

}

function addSocket( b, m2, x, y, z, nx, nz ) {

	const m = new THREE.Matrix4().makeRotationY( Math.atan2( nx, nz ) ).setPosition( x, y, z );
	b.add( m2.socket, new RoundedBoxGeometry( 0.082, 0.082, 0.012, 2, 0.006 ).translate( 0, 0, 0.006 ), m );
	b.add( m2.socketHole, new THREE.CylinderGeometry( 0.023, 0.023, 0.004, 20 ).rotateX( Math.PI / 2 ).translate( 0, 0, 0.0125 ), m );

}

// Shift bo'ylab ochiq qora kabellar: panel qatorlari orasida osilib turadi, to'sinlar ostidan aylanib o'tadi.
function addCables( b, m2 ) {

	const zBeams = BEAMS2.filter( ( q ) => q[ 0 ] === 'z' );
	const xBeams = BEAMS2.filter( ( q ) => q[ 0 ] === 'x' );
	const rows = new Map();
	for ( const [ x, z ] of PANELS2 ) {

		const key = Math.round( z * 10 );
		if ( ! rows.has( key ) ) rows.set( key, [] );
		rows.get( key ).push( [ x, z ] );

	}

	const rand = mulberry( 11 );
	for ( const pts of rows.values() ) {

		if ( pts.length < 2 ) continue;
		pts.sort( ( a, c ) => a[ 0 ] - c[ 0 ] );
		const z = pts[ 0 ][ 1 ] + 0.3;
		const path = [];
		for ( let i = 0; i < pts.length; i ++ ) {

			const x = pts[ i ][ 0 ];
			path.push( V( x, TOP - 0.04, z ) );
			if ( i === pts.length - 1 ) break;
			const xn = pts[ i + 1 ][ 0 ];
			const crossing = zBeams.filter( ( q ) => q[ 1 ] > x && q[ 1 ] < xn && z > q[ 2 ] && z < q[ 3 ] );
			if ( crossing.length ) {

				for ( const q of crossing ) {

					const bx = q[ 1 ], hw = q[ 4 ] / 2;
					path.push( V( bx - hw - 0.12, TOP - BEAM_D * 0.6, z + ( rand() - 0.5 ) * 0.05 ) );
					path.push( V( bx - hw + 0.02, TOP - BEAM_D - 0.03, z ) );
					path.push( V( bx + hw - 0.02, TOP - BEAM_D - 0.03, z ) );
					path.push( V( bx + hw + 0.12, TOP - BEAM_D * 0.6, z + ( rand() - 0.5 ) * 0.05 ) );

				}

			} else {

				const sag = 0.08 + rand() * 0.12;
				path.push( V( ( x + xn ) / 2, TOP - 0.04 - sag, z + ( rand() - 0.5 ) * 0.1 ) );

			}

		}

		const curve = new THREE.CatmullRomCurve3( path, false, 'centripetal' );
		b.add( m2.cable, new THREE.TubeGeometry( curve, path.length * 10, 0.0055, 5, false ) );

	}

	// O'ng qanot: spot qatorlari bo'ylab
	const srows = new Map();
	for ( const [ x, z ] of SPOTS2 ) {

		const key = Math.round( x * 10 );
		if ( ! srows.has( key ) ) srows.set( key, [] );
		srows.get( key ).push( [ x, z ] );

	}

	for ( const pts of srows.values() ) {

		pts.sort( ( a, c ) => a[ 1 ] - c[ 1 ] );
		const x = pts[ 0 ][ 0 ] + 0.2;
		const path = [];
		for ( let i = 0; i < pts.length; i ++ ) {

			const z = pts[ i ][ 1 ];
			path.push( V( x, TOP - 0.03, z ) );
			if ( i === pts.length - 1 ) break;
			const zn = pts[ i + 1 ][ 1 ];
			const crossing = xBeams.filter( ( q ) => q[ 1 ] > z && q[ 1 ] < zn && x > q[ 2 ] && x < q[ 3 ] );
			if ( crossing.length ) {

				for ( const q of crossing ) {

					const bz = q[ 1 ], hw = q[ 4 ] / 2;
					path.push( V( x, TOP - BEAM_D * 0.6, bz - hw - 0.12 ) );
					path.push( V( x, TOP - BEAM_D - 0.03, bz - hw + 0.02 ) );
					path.push( V( x, TOP - BEAM_D - 0.03, bz + hw - 0.02 ) );
					path.push( V( x, TOP - BEAM_D * 0.6, bz + hw + 0.12 ) );

				}

			} else {

				path.push( V( x + ( rand() - 0.5 ) * 0.06, TOP - 0.06 - rand() * 0.08, ( z + zn ) / 2 ) );

			}

		}

		b.add( m2.cable, new THREE.TubeGeometry( new THREE.CatmullRomCurve3( path, false, 'centripetal' ), path.length * 10, 0.0055, 5, false ) );

	}

}

function mulberry( a ) {

	return () => {

		a |= 0; a = a + 0x6D2B79F5 | 0;
		let t = Math.imul( a ^ a >>> 15, 1 | a );
		t = t + Math.imul( t ^ t >>> 7, 61 | t ) ^ t;
		return ( ( t ^ t >>> 14 ) >>> 0 ) / 4294967296;

	};

}
