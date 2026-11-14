// Realistikroq yengil avtomobil (sedan / xetchbek / krossover) — kod bilan "lofting":
// har bir uzunlik kesimida yumaloq to'rtburchak kesim (pastki kuzov) + torayib boruvchi oyna kabinasi,
// alohida bo'yalgan tom va ustunlar, disk/shinali g'ildiraklar, arka soyasi, faralar, panjara, ko'zgular, raqamlar.
// Material: yoritilmaydigan (Basic) + vertex rangdagi soya/yorug'lik + burchakka bog'liq (Fresnel) lak aksi.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TYPES = {
	// L — uzunlik, W — kenglik, H — balandlik, wb — g'ildirak bazasi, fo — old osilma, r — g'ildirak radiusi
	sedan: { L: 4.48, W: 1.74, H: 1.48, wb: 2.62, fo: 0.92, r: 0.31, belt: [ 0.98, 0.93 ], hood: 0.9, nose: 0.68, deck: 1.0, tail: 0.86,
		ws: [ 3.32, 2.5 ], roof: [ 2.5, 1.32 ], rw: [ 1.32, 0.62 ] },
	hatch: { L: 3.95, W: 1.72, H: 1.5, wb: 2.5, fo: 0.82, r: 0.3, belt: [ 0.98, 0.95 ], hood: 0.92, nose: 0.7, deck: 1.0, tail: 0.92,
		ws: [ 2.98, 2.2 ], roof: [ 2.2, 0.55 ], rw: [ 0.55, 0.12 ] },
	suv: { L: 4.6, W: 1.85, H: 1.72, wb: 2.71, fo: 0.95, r: 0.36, belt: [ 1.1, 1.05 ], hood: 1.04, nose: 0.82, deck: 1.12, tail: 1.06,
		ws: [ 3.45, 2.7 ], roof: [ 2.7, 0.5 ], rw: [ 0.5, 0.1 ] },
};

const lerp = ( a, b, t ) => a + ( b - a ) * t;
const smooth = ( t ) => t * t * ( 3 - 2 * t );

export function buildCarParts( type = 'sedan' ) {

	const P = TYPES[ type ];
	const { L, W, H, r } = P;
	const hw0 = W / 2;
	const yB = 0.2; // pastki qirra (sill)
	const NX = 44;

	// plan ko'rinishida burchaklar yumaloq (oldi kattaroq radius)
	const halfW = ( x ) => {

		const rf = 0.55, rr = 0.42;
		if ( x > L - rf ) {

			const d = ( x - ( L - rf ) ) / rf;
			return hw0 - rf * 0.55 * ( 1 - Math.sqrt( Math.max( 0, 1 - d * d ) ) );

		}

		if ( x < rr ) {

			const d = ( rr - x ) / rr;
			return hw0 - rr * 0.5 * ( 1 - Math.sqrt( Math.max( 0, 1 - d * d ) ) );

		}

		return hw0;

	};

	// beltline (deraza osti chizig'i) — orqaga qarab biroz ko'tariladi
	const belt = ( x ) => lerp( P.belt[ 1 ], P.belt[ 0 ], 1 - x / L );
	// pastki kuzovning yuqori yuzasi: kapot (old), beltline (o'rta), bagaj (orqa)
	const bodyTop = ( x ) => {

		const wsBase = P.ws[ 0 ], rwBase = P.rw[ 1 ];
		if ( x >= wsBase ) {

			const t = ( x - wsBase ) / ( L - wsBase );
			return lerp( P.hood, P.nose, smooth( Math.min( 1, t * 1.05 ) ) ) - 0.05 * t * t;

		}

		if ( x <= rwBase ) {

			const t = x / Math.max( 0.01, rwBase );
			return lerp( P.tail, P.deck, smooth( t ) );

		}

		return belt( x );

	};
	// oyna kabinasining yuqori chizig'i
	const roofLine = ( x ) => {

		const [ a0, a1 ] = P.ws, [ b0, b1 ] = P.roof, [ c0, c1 ] = P.rw;
		if ( x > a0 || x < c1 ) return - 1;
		if ( x >= a1 ) return lerp( belt( x ), H, smooth( ( a0 - x ) / ( a0 - a1 ) ) * 0.98 + 0.02 * ( ( a0 - x ) / ( a0 - a1 ) ) );
		if ( x >= b1 ) return H - 0.015 * Math.pow( ( x - ( a1 + b1 ) / 2 ) / ( ( a1 - b1 ) / 2 ), 2 );
		return lerp( belt( x ), H, smooth( ( x - c1 ) / ( c0 - c1 ) ) );

	};

	// --- pastki kuzov: yumaloq to'rtburchak kesim (yelkasi radiusi rs, pasti rb) ---
	const sectionPts = ( x ) => {

		const hw = halfW( x ), yT = bodyTop( x );
		const rs = Math.min( 0.16, ( yT - yB ) * 0.35 ), rb = 0.07;
		const pts = [];
		const arc = ( cz, cy, rad, a0, a1, n ) => {

			for ( let i = 0; i <= n; i ++ ) {

				const a = lerp( a0, a1, i / n );
				pts.push( [ cz + Math.cos( a ) * rad, cy + Math.sin( a ) * rad ] );

			}

		};

		// o'ng tomondan (z+) yuqoriga, tepadan chapga, pastga
		arc( hw - rb, yB + rb, rb, - Math.PI / 2, 0, 3 );
		arc( hw - rs, yT - rs, rs, 0, Math.PI / 2, 8 );
		arc( - hw + rs, yT - rs, rs, Math.PI / 2, Math.PI, 8 );
		arc( - hw + rb, yB + rb, rb, Math.PI, Math.PI * 1.5, 3 );
		return pts;

	};

	const loft = ( xs, secFn, closed = true, capEnds = true ) => {

		const pos = [], idx = [];
		let nPer = 0;
		for ( const x of xs ) {

			const s = secFn( x );
			nPer = s.length;
			for ( const [ z, y ] of s ) pos.push( x, y, z );

		}

		const rings = xs.length;
		for ( let i = 0; i < rings - 1; i ++ ) for ( let j = 0; j < ( closed ? nPer : nPer - 1 ); j ++ ) {

			const a = i * nPer + j, b = i * nPer + ( j + 1 ) % nPer, c = a + nPer, d = b + nPer;
			idx.push( a, c, b, b, c, d );

		}

		if ( capEnds ) for ( const [ ri, flip ] of [ [ 0, true ], [ rings - 1, false ] ] ) {

			const base = ri * nPer;
			let cx = 0, cy = 0, cz = 0;
			for ( let j = 0; j < nPer; j ++ ) {

				cx += pos[ ( base + j ) * 3 ]; cy += pos[ ( base + j ) * 3 + 1 ]; cz += pos[ ( base + j ) * 3 + 2 ];

			}

			const ci = pos.length / 3;
			pos.push( cx / nPer, cy / nPer, cz / nPer );
			for ( let j = 0; j < nPer; j ++ ) {

				const a = base + j, b = base + ( j + 1 ) % nPer;
				if ( flip ) idx.push( ci, b, a ); else idx.push( ci, a, b );

			}

		}

		const g = new THREE.BufferGeometry();
		g.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
		g.setIndex( idx );
		g.computeVertexNormals();
		return g;

	};

	const xs = [];
	for ( let i = 0; i <= NX; i ++ ) {

		const t = i / NX;
		xs.push( 0.015 + ( L - 0.03 ) * ( 0.5 - 0.5 * Math.cos( t * Math.PI ) ) ); // uchlarida zichroq

	}

	const body = loft( xs, sectionPts );

	// --- oyna kabinasi: beltline'dan tomgacha, yuqoriga torayadi (tumblehome) ---
	const gxs = [];
	const ga = P.rw[ 1 ] + 0.02, gb = P.ws[ 0 ] - 0.02;
	for ( let i = 0; i <= 30; i ++ ) gxs.push( lerp( ga, gb, i / 30 ) );
	const ghSection = ( x ) => {

		const hw = halfW( x ) - 0.035, yb = belt( x ) - 0.02;
		const yt = Math.max( yb + 0.01, roofLine( x ) );
		const top = hw - 0.2 - 0.04 * ( H - 1.4 );
		const rt = Math.min( 0.12, ( yt - yb ) * 0.5 );
		const pts = [];
		const n = 6;
		pts.push( [ hw, yb ] );
		for ( let i = 0; i <= n; i ++ ) {

			const a = ( i / n ) * Math.PI / 2;
			pts.push( [ top - rt + Math.cos( a ) * rt + ( hw - top ) * 0 , yt - rt + Math.sin( a ) * rt ] );

		}

		for ( let i = 0; i <= n; i ++ ) {

			const a = Math.PI / 2 + ( i / n ) * Math.PI / 2;
			pts.push( [ - top + rt + Math.cos( a ) * rt, yt - rt + Math.sin( a ) * rt ] );

		}

		pts.push( [ - hw, yb ] );
		return pts;

	};

	const glass = loft( gxs, ghSection, true, true );

	// tom paneli: kabina tepasidan biroz yuqori, oyna chetlaridan ichkarida
	const rxs = [];
	const r0 = P.roof[ 1 ] + 0.02, r1 = P.roof[ 0 ] - 0.02;
	for ( let i = 0; i <= 16; i ++ ) rxs.push( lerp( r0, r1, i / 16 ) );
	const roof = loft( rxs, ( x ) => {

		const hw = halfW( x ) - 0.035;
		const top = hw - 0.2 - 0.04 * ( H - 1.4 );
		const yt = roofLine( x ) + 0.006;
		const pts = [];
		for ( let i = 0; i <= 8; i ++ ) {

			const z = lerp( top + 0.005, - top - 0.005, i / 8 );
			pts.push( [ z, yt - 0.035 * Math.pow( z / top, 6 ) ] );

		}

		return pts;

	}, false, false );

	// ustunlar (B va C) — kabina yon yuzasida bo'yalgan tasmalar
	const pillars = [];
	const sideAt = ( x, y ) => {

		// kabina yon yuzasining (yb..yt) chiziqli taxmini
		const hw = halfW( x ) - 0.035, yb = belt( x ) - 0.02, yt = roofLine( x );
		const top = hw - 0.2 - 0.04 * ( H - 1.4 );
		const t = THREE.MathUtils.clamp( ( y - yb ) / Math.max( 0.01, yt - yb ), 0, 1 );
		return lerp( hw, top, t * t ) + 0.006;

	};

	const pillarStrip = ( x0, x1, y0, y1, side ) => {

		const pos = [];
		const n = 6;
		for ( let i = 0; i <= n; i ++ ) {

			const y = lerp( y0, y1, i / n );
			for ( const x of [ x0, x1 ] ) pos.push( x, y, side * sideAt( x, y ) );

		}

		const idx = [];
		for ( let i = 0; i < n; i ++ ) {

			const a = i * 2;
			if ( side > 0 ) idx.push( a, a + 1, a + 2, a + 1, a + 3, a + 2 ); else idx.push( a, a + 2, a + 1, a + 1, a + 2, a + 3 );

		}

		const g = new THREE.BufferGeometry();
		g.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
		g.setIndex( idx );
		g.computeVertexNormals();
		return g;

	};

	const bx = lerp( P.roof[ 0 ], P.roof[ 1 ], 0.52 );
	for ( const s of [ - 1, 1 ] ) {

		pillars.push( pillarStrip( bx - 0.05, bx + 0.05, belt( bx ) - 0.02, roofLine( bx ) - 0.01, s ) );
		if ( type === 'sedan' ) pillars.push( pillarStrip( P.rw[ 0 ] - 0.05, P.rw[ 0 ] + 0.2, belt( P.rw[ 0 ] ), roofLine( P.rw[ 0 ] + 0.1 ) - 0.02, s ) );
		else pillars.push( pillarStrip( P.rw[ 1 ] + 0.06, P.rw[ 1 ] + 0.34, belt( P.rw[ 1 ] + 0.2 ), roofLine( P.rw[ 1 ] + 0.2 ) - 0.02, s ) );

	}

	// --- g'ildiraklar ---
	const xr = L - P.fo - P.wb, xf = L - P.fo;
	const tire = [], rim = [], arch = [], hub = [], archLip = [];
	for ( const wx of [ xr, xf ] ) for ( const s of [ - 1, 1 ] ) {

		const zc = s * ( hw0 - 0.1 );
		// shina: yumaloq yon devorli (lathe profil)
		const tp = [ [ 0.66, - 0.1 ], [ 0.88, - 0.106 ], [ 0.97, - 0.092 ], [ 1.0, - 0.055 ], [ 1.0, 0.055 ], [ 0.97, 0.092 ], [ 0.88, 0.106 ], [ 0.66, 0.1 ] ];
		tire.push( new THREE.LatheGeometry( tp.map( ( [ a, b ] ) => new THREE.Vector2( a * r, b ) ), 30 ).rotateX( Math.PI / 2 ).translate( wx, r, zc ) );
		// arka cheti (kuzov rangida) — g'ildirak ustida bo'rtib turgan yarim halqa
		archLip.push( new THREE.TorusGeometry( r + 0.07, 0.026, 6, 22, Math.PI ).translate( wx, r, s * ( hw0 - 0.012 ) ) );
		// disk: kumush halqa + 5 ta parra + markaz qopqog'i; ichi qorong'i
		const zf = zc + s * 0.104;
		hub.push( new THREE.CircleGeometry( r * 0.68, 24 ).rotateY( s > 0 ? 0 : Math.PI ).translate( wx, r, zf - s * 0.004 ) );
		rim.push( new THREE.TorusGeometry( r * 0.66, 0.022, 6, 28 ).translate( wx, r, zf ) );
		for ( let k = 0; k < 5; k ++ ) {

			const a = k / 5 * Math.PI * 2 + 0.3;
			const sp = new THREE.BoxGeometry( r * 0.62, 0.045, 0.02 ).translate( r * 0.31, 0, 0 ).rotateZ( a );
			rim.push( sp.translate( wx, r, zf ) );

		}

		rim.push( new THREE.CylinderGeometry( 0.05, 0.05, 0.03, 16 ).rotateX( Math.PI / 2 ).translate( wx, r, zf + s * 0.005 ) );
		// arka: g'ildirak ustidagi qorong'i yarim halqa (kuzov yon yuzasida)
		const ag = new THREE.RingGeometry( r + 0.015, r + 0.075, 24, 1, 0, Math.PI );
		if ( s < 0 ) ag.rotateY( Math.PI );
		arch.push( ag.translate( wx, r, s * ( hw0 + 0.004 ) ) );

	}

	// --- old/orqa detallar ---
	const lamp = [], dark = [], red = [], plate = [], chrome = [], mirrorPaint = [], drl = [];
	const front = L, ny = P.nose;
	for ( const s of [ - 1, 1 ] ) {

		lamp.push( new THREE.BoxGeometry( 0.05, 0.1, 0.4 ).rotateY( s * 0.42 ).translate( front - 0.1, ny - 0.07, s * ( hw0 - 0.34 ) ) );
		// fara ichidagi linzalar va kunduzgi chiroq chizig'i
		for ( const k of [ - 0.09, 0.07 ] ) dark.push( new THREE.CylinderGeometry( 0.032, 0.032, 0.02, 14 ).rotateZ( Math.PI / 2 ).rotateY( s * 0.42 ).translate( front - 0.075 - Math.abs( k ) * 0.35 * ( k * s > 0 ? 1 : - 1 ), ny - 0.07, s * ( hw0 - 0.34 ) + k ) );
		drl.push( new THREE.BoxGeometry( 0.02, 0.014, 0.34 ).rotateY( s * 0.42 ).translate( front - 0.07, ny - 0.13, s * ( hw0 - 0.35 ) ) );
		// tuman chiroqlari
		lamp.push( new THREE.CylinderGeometry( 0.042, 0.042, 0.03, 14 ).rotateZ( Math.PI / 2 ).translate( front - 0.03, yB + 0.18, s * ( hw0 - 0.24 ) ) );
		red.push( new THREE.BoxGeometry( 0.05, 0.11, 0.42 ).rotateY( - s * 0.35 ).translate( 0.06, P.tail - 0.1, s * ( hw0 - 0.32 ) ) );
		// ko'zgular
		const mx = P.ws[ 0 ] - 0.18, my = belt( mx ) + 0.06;
		mirrorPaint.push( new THREE.BoxGeometry( 0.16, 0.11, 0.2 ).translate( mx, my, s * ( hw0 + 0.06 ) ) );
		dark.push( new THREE.BoxGeometry( 0.02, 0.09, 0.17 ).translate( mx - 0.08, my, s * ( hw0 + 0.06 ) ) );
		// eshik tutqichlari va eshik chiziqlari
		for ( const dx of [ lerp( P.roof[ 0 ], P.roof[ 1 ], 0.1 ), lerp( P.roof[ 0 ], P.roof[ 1 ], 0.85 ) ] ) chrome.push( new THREE.BoxGeometry( 0.16, 0.025, 0.02 ).translate( dx, belt( dx ) - 0.1, s * ( hw0 + 0.002 ) ) );
		for ( const dx of [ P.ws[ 0 ] - 0.05, bx, P.roof[ 1 ] - 0.05 ] ) dark.push( new THREE.BoxGeometry( 0.006, belt( dx ) - yB - 0.12, 0.006 ).translate( dx, ( belt( dx ) + yB ) / 2, s * ( hw0 + 0.001 ) ) );

	}

	// deraza atrofidagi qora hoshiya: beltline bo'ylab va tom ostida (kabina yon yuzasida)
	const sideStrip = ( x0, x1, yFn, h, side, n = 14 ) => {

		const pos = [], idx = [];
		for ( let i = 0; i <= n; i ++ ) {

			const x = lerp( x0, x1, i / n ), y = yFn( x );
			pos.push( x, y, side * ( sideAt( x, y ) + 0.002 ), x, y + h, side * ( sideAt( x, y + h ) + 0.002 ) );

		}

		for ( let i = 0; i < n; i ++ ) {

			const a = i * 2;
			if ( side > 0 ) idx.push( a, a + 2, a + 1, a + 1, a + 2, a + 3 ); else idx.push( a, a + 1, a + 2, a + 1, a + 3, a + 2 );

		}

		const g = new THREE.BufferGeometry();
		g.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
		g.setIndex( idx );
		g.computeVertexNormals();
		return g;

	};

	for ( const s of [ - 1, 1 ] ) {

		dark.push( sideStrip( P.rw[ 1 ] + 0.08, P.ws[ 0 ] - 0.06, ( x ) => belt( x ) - 0.02, 0.035, s ) );
		dark.push( sideStrip( P.roof[ 1 ] + 0.02, P.roof[ 0 ] - 0.02, ( x ) => roofLine( x ) - 0.05, 0.03, s ) );
		if ( type === 'suv' ) {

			// tom relslari va pastki qora qoplama (krossover)
			const top = hw0 - 0.035 - 0.2 - 0.04 * ( H - 1.4 );
			dark.push( new THREE.BoxGeometry( P.roof[ 0 ] - P.roof[ 1 ] - 0.1, 0.03, 0.035 ).translate( ( P.roof[ 0 ] + P.roof[ 1 ] ) / 2, H + 0.05, s * ( top - 0.06 ) ) );
			for ( const lx of [ P.roof[ 1 ] + 0.1, P.roof[ 0 ] - 0.1 ] ) dark.push( new THREE.BoxGeometry( 0.06, 0.06, 0.04 ).translate( lx, H + 0.025, s * ( top - 0.06 ) ) );
			dark.push( new THREE.BoxGeometry( P.wb - 2 * r - 0.25, 0.13, 0.02 ).translate( L - P.fo - P.wb / 2, yB + 0.07, s * ( hw0 + 0.003 ) ) );

		}

	}

	// panjara, pastki havo olgich, raqamlar
	dark.push( new THREE.BoxGeometry( 0.06, 0.13, 0.78 ).translate( front - 0.03, ny - 0.12, 0 ) );
	dark.push( new THREE.BoxGeometry( 0.06, 0.1, 1.1 ).translate( front - 0.05, yB + 0.14, 0 ) );
	chrome.push( new THREE.BoxGeometry( 0.065, 0.018, 0.8 ).translate( front - 0.03, ny - 0.045, 0 ) );
	for ( const dy of [ 0.09, 0.13, 0.17 ] ) chrome.push( new THREE.BoxGeometry( 0.064, 0.007, 0.74 ).translate( front - 0.03, ny - dy, 0 ) );
	// old oyna yuvgichlari
	for ( const s2 of [ - 1, 1 ] ) dark.push( new THREE.BoxGeometry( 0.02, 0.012, 0.52 ).rotateY( 0.12 * s2 ).translate( P.ws[ 0 ] - 0.08, belt( P.ws[ 0 ] ) + 0.035, s2 * 0.3 - 0.05 ) );
	plate.push( new THREE.BoxGeometry( 0.02, 0.11, 0.52 ).translate( front + 0.005, yB + 0.3, 0 ) );
	plate.push( new THREE.BoxGeometry( 0.02, 0.11, 0.52 ).translate( - 0.005, yB + 0.42, 0 ) );
	dark.push( new THREE.BoxGeometry( 0.05, 0.09, 1.2 ).translate( 0.02, yB + 0.16, 0 ) );

	// uchburchaklarni tashqariga qaratish (kuzov qavariq — markazga nisbatan)
	const ctr = new THREE.Vector3( L / 2, 0.6, 0 );
	const orient = ( g ) => {

		g = g.index ? g.toNonIndexed() : g;
		const p = g.attributes.position;
		const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Vector3();
		for ( let i = 0; i < p.count; i += 3 ) {

			A.fromBufferAttribute( p, i ); B.fromBufferAttribute( p, i + 1 ); C.fromBufferAttribute( p, i + 2 );
			n.subVectors( C, B ).cross( new THREE.Vector3().subVectors( A, B ) );
			c.copy( A ).add( B ).add( C ).multiplyScalar( 1 / 3 ).sub( ctr );
			if ( n.dot( c ) < 0 ) {

				p.setXYZ( i + 1, C.x, C.y, C.z ); p.setXYZ( i + 2, B.x, B.y, B.z );

			}

		}

		g.computeVertexNormals();
		return g;

	};

	const M = ( arr ) => mergeGeometries( arr.map( ( g ) => g.index ? g.toNonIndexed() : g ).map( ( g ) => {

		for ( const k of Object.keys( g.attributes ) ) if ( k !== 'position' && k !== 'normal' ) g.deleteAttribute( k );
		return g;

	} ) );

	return {
		paint: M( [ orient( body ), orient( roof ), ...pillars.map( orient ), ...mirrorPaint, ...archLip ] ),
		drl: M( drl ),
		glass: M( [ orient( glass ) ] ),
		tire: M( tire ), rim: M( rim ), hub: M( [ ...hub, ...arch ] ),
		lamp: M( lamp ), red: M( red ), dark: M( dark ), plate: M( plate ), chrome: M( chrome ),
		L, W,
	};

}

// Fresnel bilan lak/oyna aksi: MeshBasic + envMap (Mix), aks kuchi burchakka qarab rMin…rMax
export function reflectiveBasic( color, envTex, rMin, rMax, extra = {} ) {

	const m = new THREE.MeshBasicMaterial( { color, vertexColors: true, envMap: envTex, combine: THREE.MixOperation, reflectivity: rMax, ...extra } );
	m.onBeforeCompile = ( sh ) => {

		sh.vertexShader = sh.vertexShader
			.replace( '#include <common>', '#include <common>\nvarying float vFres;' )
			.replace( '#include <envmap_vertex>', '#include <envmap_vertex>\n#ifdef USE_ENVMAP\nvFres = pow( 1.0 - clamp( dot( - cameraToVertex, worldNormal ), 0.0, 1.0 ), 4.0 );\n#endif' );
		sh.fragmentShader = sh.fragmentShader
			.replace( '#include <common>', `#include <common>\nvarying float vFres;` )
			.replace( '#include <envmap_fragment>', `float fresR = ${rMin.toFixed( 3 )} + ( ${rMax.toFixed( 3 )} - ${rMin.toFixed( 3 )} ) * vFres;\n` + THREE.ShaderChunk.envmap_fragment.replaceAll( 'reflectivity', 'fresR' ).replace( '#ifdef ENVMAP_BLENDING_MULTIPLY', 'envColor.rgb = min( envColor.rgb, vec3( 0.85 ) ); // HDR osmon aksi kuchli bo\'lmasin\n\t#ifdef ENVMAP_BLENDING_MULTIPLY' ) );

	};

	m.customProgramCacheKey = () => `fres-${rMin}-${rMax}`;
	return m;

}

// Mashina ostidagi yumshoq soya (kontakt soyasi)
export function contactShadowTexture() {

	const c = document.createElement( 'canvas' );
	c.width = 128; c.height = 64;
	const g = c.getContext( '2d' );
	const grd = g.createRadialGradient( 64, 32, 4, 64, 32, 62 );
	grd.addColorStop( 0, 'rgba(0,0,0,0.85)' );
	grd.addColorStop( 0.55, 'rgba(0,0,0,0.55)' );
	grd.addColorStop( 1, 'rgba(0,0,0,0)' );
	g.fillStyle = grd;
	g.save();
	g.scale( 1, 1 );
	g.fillRect( 0, 0, 128, 64 );
	g.restore();
	const t = new THREE.CanvasTexture( c );
	return t;

}
