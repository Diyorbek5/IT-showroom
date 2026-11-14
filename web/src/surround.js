// Oynadan tashqari ko'rinish — rasmlar (1-qavat 16, 17; 02) bo'yicha:
//  • shimolda: kulrang plitkali hovli, to'q kulrang (gofrirovka) devorli qo'shni bino, devorda tashqi metall zina,
//    eshik va qizil o't o'chirish qutisi; tepasi yashil qurilish to'ri bilan o'ralgan;
//  • g'arbda: piyodalar yo'lagi, binoga burni bilan turgan mashinalar, ko'cha; narida — HDRI daraxtlari.
// Faqat bino ichidan ko'rinadi (tashqaridan — oddiy kulrang maydon). Yoritilmaydigan (Basic) materiallar,
// soya-yorug'lik vertex rangga "pishirilgan": ichki GI/probe'larga bog'liq emas va tez.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, worldUV } from './geo.js';
import { buildCarParts, reflectiveBasic, contactShadowTexture } from './carmodel.js';

const L = new THREE.Vector3( - 0.45, 0.8, 0.4 ).normalize();

function rng( seed ) {

	let s = seed >>> 0;
	return () => ( ( s = ( s * 1664525 + 1013904223 ) >>> 0 ) / 4294967296 );

}

function canvasTex( w, h, draw, repeatM ) {

	const c = document.createElement( 'canvas' );
	c.width = w; c.height = h;
	draw( c.getContext( '2d' ), w, h );
	const t = new THREE.CanvasTexture( c );
	t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.anisotropy = 8;
	if ( repeatM ) t.repeat.set( 1 / repeatM[ 0 ], 1 / repeatM[ 1 ] );
	return t;

}

// geometriyaga yorug'lik/soya ranglarini yozish (normal bo'yicha) + balandlik bo'yicha yengil "AO"
function shade( g, ao = true ) {

	g = g.index ? g.toNonIndexed() : g;
	g.computeVertexNormals();
	const n = g.attributes.normal, p = g.attributes.position;
	const col = new Float32Array( p.count * 3 );
	const v = new THREE.Vector3();
	for ( let i = 0; i < p.count; i ++ ) {

		v.set( n.getX( i ), n.getY( i ), n.getZ( i ) );
		let k = 0.5 + 0.36 * Math.max( 0, v.dot( L ) ) + 0.14 * v.y;
		if ( ao ) k *= 0.82 + 0.18 * Math.min( 1, p.getY( i ) / 1.2 );
		col[ i * 3 ] = col[ i * 3 + 1 ] = col[ i * 3 + 2 ] = k;

	}

	g.setAttribute( 'color', new THREE.BufferAttribute( col, 3 ) );
	return g;

}

class Bin {

	constructor() {

		this.map = new Map();

	}
	add( mat, g, m, { uv = true, ao = true } = {} ) {

		if ( m ) g.applyMatrix4( m );
		if ( uv ) worldUV( g );
		g = shade( g, ao );
		for ( const k of Object.keys( g.attributes ) ) if ( ! [ 'position', 'normal', 'uv', 'color' ].includes( k ) ) g.deleteAttribute( k );
		if ( ! g.attributes.uv ) g.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( g.attributes.position.count * 2 ), 2 ) );
		if ( ! this.map.has( mat ) ) this.map.set( mat, [] );
		this.map.get( mat ).push( g );

	}
	build( name ) {

		const grp = new THREE.Group();
		grp.name = name;
		for ( const [ mat, list ] of this.map ) {

			const mesh = new THREE.Mesh( mergeGeometries( list ), mat );
			mesh.matrixAutoUpdate = false;
			grp.add( mesh );

		}

		return grp;

	}

}

export function buildSurroundings( envTex ) {

	const r = rng( 21 );
	const B = ( o ) => new THREE.MeshBasicMaterial( { vertexColors: true, ...o } );

	// ---------- teksturalar ----------
	const pavers = canvasTex( 512, 512, ( g, w, h ) => {

		g.fillStyle = '#8d8d8b'; g.fillRect( 0, 0, w, h );
		const R = rng( 3 );
		// to'rtburchak plitkalar 20×10 sm, yarim siljitilgan qatorlar
		const pw = 64, ph = 32;
		for ( let y = 0; y < h; y += ph ) for ( let x = - ( ( y / ph ) % 2 ) * pw / 2; x < w; x += pw ) {

			const l = 50 + R() * 12;
			g.fillStyle = `hsl(40,3%,${l}%)`;
			g.fillRect( x + 2, y + 2, pw - 4, ph - 4 );

		}

		for ( let i = 0; i < 9000; i ++ ) {

			g.fillStyle = `rgba(0,0,0,${R() * 0.08})`;
			g.fillRect( R() * w, R() * h, 2, 2 );

		}

	}, [ 1.6, 1.6 ] );
	const asphalt = canvasTex( 512, 512, ( g, w, h ) => {

		g.fillStyle = '#4a4b4d'; g.fillRect( 0, 0, w, h );
		const R = rng( 5 );
		for ( let i = 0; i < 26000; i ++ ) {

			const l = 22 + R() * 22;
			g.fillStyle = `hsla(220,3%,${l}%,0.55)`;
			g.fillRect( R() * w, R() * h, 2, 2 );

		}

	}, [ 4, 4 ] );
	const ribs = canvasTex( 256, 64, ( g, w, h ) => {

		// gofrirovka qilingan metall devor (vertikal qovurg'alar)
		for ( let x = 0; x < w; x ++ ) {

			const t = Math.sin( x / w * Math.PI * 2 * 8 );
			const l = 33 + t * 7;
			g.fillStyle = `hsl(210,4%,${l}%)`;
			g.fillRect( x, 0, 1, h );

		}

	}, [ 1.6, 1.6 ] );
	const netting = canvasTex( 512, 512, ( g, w, h ) => {

		// yashil qurilish to'ri: firuza-yashil, gorizontal/vertikal qoplama bo'laklari va iskala chiziqlari
		g.fillStyle = '#4f9a82'; g.fillRect( 0, 0, w, h );
		const R = rng( 9 );
		for ( let x = 0; x < w; x += 64 ) {

			g.fillStyle = `hsl(160,${26 + R() * 8}%,${42 + R() * 8}%)`;
			g.fillRect( x, 0, 64, h );

		}

		g.fillStyle = 'rgba(20,40,32,0.55)';
		for ( let y = 0; y < h; y += 128 ) g.fillRect( 0, y, w, 5 );
		for ( let x = 0; x < w; x += 160 ) g.fillRect( x, 0, 4, h );
		for ( let i = 0; i < 40000; i ++ ) {

			g.fillStyle = `rgba(255,255,255,${R() * 0.05})`;
			g.fillRect( R() * w, R() * h, 1, 1 );

		}

	}, [ 6, 3 ] );

	const M = {
		pavers: B( { map: pavers } ),
		asphalt: B( { map: asphalt } ),
		curb: B( { color: 0xb4b3ae } ),
		line: B( { color: 0xd9d9d4 } ),
		wallRib: B( { map: ribs } ),
		concrete: B( { color: 0x7a7c7f } ),
		dark: B( { color: 0x3b3d40 } ),
		door: B( { color: 0x55585c } ),
		steel: B( { color: 0x1e1f21 } ),
		red: B( { color: 0xc21f26 } ),
		netting: B( { map: netting } ),
		grass: B( { color: 0x56683f } ),
		rubber: B( { color: 0x151515 } ),
		rim: B( { color: 0xb9bcc0, envMap: envTex, reflectivity: 0.35, combine: THREE.MixOperation } ),
		carGlass: B( { color: 0x0f1113, envMap: envTex, reflectivity: 0.035, combine: THREE.MixOperation } ),
		lamp: B( { color: 0xe6e6e2 } ),
		tail: B( { color: 0x8a1a1c } ),
		plate: B( { color: 0xf2f2f0 } ),
	};

	const b = new Bin();
	const G = ( g, mat, m, o ) => b.add( mat, g, m, o );

	// ---------- yer: hovli plitkasi (shimol), yo'lak (g'arb), parkovka va ko'cha ----------
	G( box( - 3.0, 32, - 0.02, 0, - 13, - 0.3 ), M.pavers ); // shimoliy hovli
	G( box( - 3.0, - 0.3, - 0.02, 0, - 0.3, 22 ), M.pavers ); // g'arbiy yo'lak
	G( box( 23.65, 32, - 0.02, 0, - 0.3, 22 ), M.pavers );
	G( box( - 9.0, - 3.0, - 0.03, - 0.01, - 13, 22 ), M.asphalt ); // parkovka
	G( box( - 16.5, - 9.0, - 0.03, - 0.01, - 30, 40 ), M.asphalt ); // ko'cha
	G( box( - 3.15, - 3.0, 0, 0.14, - 13, 22 ), M.curb );
	G( box( - 16.65, - 16.5, 0, 0.14, - 30, 40 ), M.curb );
	G( box( - 22, - 16.65, - 0.02, 0.12, - 30, 40 ), M.pavers ); // narigi yo'lak
	G( box( - 40, - 22, - 0.02, 0.1, - 30, 40 ), M.grass );
	// parkovka chiziqlari va ko'cha o'rta chizig'i
	for ( let z = - 12.4; z <= 21.5; z += 2.6 ) G( box( - 8.6, - 3.4, 0, 0.004, z - 0.05, z + 0.05 ), M.line );
	for ( let z = - 30; z < 40; z += 6 ) G( box( - 12.82, - 12.68, 0, 0.004, z, z + 3 ), M.line );

	// ---------- shimoldagi qo'shni bino ----------
	const NZ = - 13; // devor yuzasi
	G( box( - 3, 34, 0, 4.4, NZ - 14, NZ ), M.wallRib ); // 1-qavat: gofrirovka devor
	G( box( - 3, 34, 4.4, 4.7, NZ - 14, NZ + 0.25 ), M.concrete ); // terrasa qirrasi
	// devor ustida qurilish maydoni to'sig'i — yashil to'r (rasm 16: to'r ustidan osmon ko'rinadi)
	G( box( - 3, 34, 4.7, 7.6, NZ - 0.9, NZ - 0.8 ), M.netting );
	for ( let x = - 3; x <= 34; x += 2.5 ) G( box( x, x + 0.06, 4.7, 7.7, NZ - 0.96, NZ - 0.9 ), M.dark );
	// panjara (terrasa chetida)
	for ( let x = - 3; x <= 34; x += 1.5 ) G( box( x, x + 0.04, 4.7, 5.75, NZ + 0.15, NZ + 0.2 ), M.steel );
	G( box( - 3, 34, 5.72, 5.77, NZ + 0.13, NZ + 0.22 ), M.steel );
	// eshiklar va qizil quti
	G( box( 13.6, 14.6, 0, 2.15, NZ, NZ + 0.05 ), M.door );
	G( box( 22.0, 23.0, 0, 2.15, NZ, NZ + 0.05 ), M.door );
	G( box( 2.2, 3.0, 0.15, 1.15, NZ, NZ + 0.25 ), M.red );
	// tashqi metall zina: sharqdan (pastda) g'arbga (tepada) ko'tariladi
	{

		const xb = 12.6, xt = 6.2, steps = 22, w = 1.0;
		const zr = NZ + 0.1, zf = zr + w;
		const run = ( xb - xt ) / steps, rise = 4.4 / steps;
		for ( let i = 0; i < steps; i ++ ) {

			const x = xb - ( i + 1 ) * run, y = ( i + 1 ) * rise;
			G( box( x, x + run + 0.02, y - 0.04, y, zr, zf ), M.steel );

		}

		// kosoura (yon to'sin) va panjara
		const a = new THREE.Vector3( xb, 0, zf ), c = new THREE.Vector3( xt, 4.4, zf );
		const len = a.distanceTo( c ), ang = Math.atan2( 4.4, xb - xt );
		for ( const [ yo, th ] of [ [ - 0.12, 0.2 ], [ 0.95, 0.05 ] ] ) {

			const g = new THREE.BoxGeometry( len, th, 0.05 );
			const m = new THREE.Matrix4().makeRotationZ( - ang ).setPosition( ( xb + xt ) / 2, 2.2 + yo, zf + 0.02 );
			G( g, M.steel, m, { uv: false } );

		}

		for ( let i = 0; i <= steps; i += 3 ) {

			const x = xb - i * run, y = i * rise;
			G( box( x - 0.02, x + 0.02, y, y + 0.95, zf, zf + 0.04 ), M.steel );

		}

		G( box( xt - 1.4, xt, 4.36, 4.42, zr, zf ), M.steel ); // yuqori maydoncha

	}

	// ---------- uzoqdagi ko'p qavatli uylar (2-qavat rasm 02) ----------
	const facade = canvasTex( 256, 256, ( g, w, h ) => {

		g.fillStyle = '#b9a58c'; g.fillRect( 0, 0, w, h );
		for ( let y = 0; y < h; y += 64 ) for ( let x = 0; x < w; x += 64 ) {

			g.fillStyle = '#3c4148'; g.fillRect( x + 14, y + 14, 36, 34 );
			g.fillStyle = '#a8957d'; g.fillRect( x + 8, y + 50, 48, 6 );

		}

	}, [ 3.2, 3.0 ] );
	M.facade = B( { map: facade } );
	for ( const [ x0, x1, z0, z1, h ] of [ [ - 12, 14, - 112, - 100, 30 ], [ 18, 44, - 98, - 86, 24 ], [ - 42, - 22, - 92, - 72, 33 ] ] ) G( box( x0, x1, 0, h, z0, z1 ), M.facade, null, { ao: false } );

	// ---------- mashinalar (binoga burni bilan) — carmodel.js ----------
	const parts = { sedan: buildCarParts( 'sedan' ), hatch: buildCarParts( 'hatch' ), suv: buildCarParts( 'suv' ) };
	const CM = {
		glass: reflectiveBasic( 0x07080a, envTex, 0.03, 0.22 ),
		chrome: reflectiveBasic( 0xc4c7cb, envTex, 0.3, 0.6 ),
		lamp: reflectiveBasic( 0xbfc4c9, envTex, 0.35, 0.7 ),
		red: reflectiveBasic( 0x7c1216, envTex, 0.1, 0.5 ),
		dark: B( { color: 0x101113 } ),
		tire: B( { color: 0x1c1c1d } ),
		hub: B( { color: 0x0c0c0d, side: THREE.DoubleSide } ),
		plate: B( { color: 0xeeeeec } ),
		shadow: new THREE.MeshBasicMaterial( { color: 0x000000, map: contactShadowTexture(), transparent: true, opacity: 0.7, depthWrite: false } ),
	};
	const paintCols = [ 0xe9eaea, 0xe9eaea, 0xdcdcd7, 0xa9adb2, 0xa9adb2, 0x5e6268, 0x0d0e10, 0x0d0e10, 0x1b2536 ];
	const paintMats = paintCols.map( ( c ) => reflectiveBasic( c, envTex, 0.03, 0.32 ) );
	const pick = () => {

		const t = r();
		return t < 0.5 ? 'sedan' : t < 0.72 ? 'hatch' : 'suv';

	};

	const addCar = ( x, z, rotY, type, paint ) => {

		const P = parts[ type ];
		const m = new THREE.Matrix4().makeRotationY( rotY ).setPosition( x, 0, z );
		const o = { uv: false, ao: false };
		G( P.paint.clone(), paint, m.clone(), o );
		G( P.glass.clone(), CM.glass, m.clone(), o );
		G( P.tire.clone(), CM.tire, m.clone(), o );
		G( P.rim.clone(), CM.chrome, m.clone(), o );
		G( P.hub.clone(), CM.hub, m.clone(), o );
		G( P.lamp.clone(), CM.lamp, m.clone(), o );
		G( P.red.clone(), CM.red, m.clone(), o );
		G( P.dark.clone(), CM.dark, m.clone(), o );
		G( P.plate.clone(), CM.plate, m.clone(), o );
		G( P.chrome.clone(), CM.chrome, m.clone(), o );
		const sh = new THREE.PlaneGeometry( P.L + 0.5, P.W + 0.45 ).rotateX( - Math.PI / 2 ).translate( P.L / 2, 0.012, 0 );
		G( sh, CM.shadow, m.clone(), { uv: false, ao: false } );

	};

	// g'arbiy parkovka: old tomoni binoga (+x), bordyurdan ~0.5 m
	for ( let z = - 11.1; z < 21; z += 2.6 ) {

		if ( r() < 0.15 ) continue;
		const type = pick();
		const L = parts[ type ].L;
		addCar( - 3.55 - L - r() * 0.25, z + ( r() - 0.5 ) * 0.2, ( r() - 0.5 ) * 0.04, type, paintMats[ Math.floor( r() * paintMats.length ) ] );

	}

	// ko'chada turgan / harakatdagi bir nechta mashina
	addCar( - 10.4, - 2, Math.PI / 2, 'sedan', paintMats[ 6 ] );
	addCar( - 14.8, 11, - Math.PI / 2, 'suv', paintMats[ 0 ] );
	addCar( - 10.4, 27, Math.PI / 2, 'hatch', paintMats[ 3 ] );

	return b.build( 'surroundings' );

}
