import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Batch, box } from './geo.js';

// Bino atrofi (tashqaridan / tepadan qaraganda): yo'lka, avtoturargoh, ko'cha, maysazor, daraxtlar, qo'shni binolar.
// Teksturalar brauzerda chiziladi — qo'shimcha fayl yuklanmaydi.

function canvasTex( size, draw, repeat ) {

	const c = document.createElement( 'canvas' );
	c.width = c.height = size;
	const g = c.getContext( '2d' );
	draw( g, size );
	const t = new THREE.CanvasTexture( c );
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set( repeat, repeat );
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;

}

function rng( seed ) {

	let a = seed;
	return () => {

		a |= 0; a = a + 0x6D2B79F5 | 0;
		let t = Math.imul( a ^ a >>> 15, 1 | a );
		t = t + Math.imul( t ^ t >>> 7, 61 | t ) ^ t;
		return ( ( t ^ t >>> 14 ) >>> 0 ) / 4294967296;

	};

}

function speckle( g, s, base, n, spread, r ) {

	g.fillStyle = base;
	g.fillRect( 0, 0, s, s );
	for ( let i = 0; i < n; i ++ ) {

		const v = ( r() - 0.5 ) * spread;
		g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs( v )})`;
		g.fillRect( r() * s, r() * s, 1 + r() * 2, 1 + r() * 2 );

	}

}

function siteMaterials() {

	const r = rng( 5 );
	const m = {};
	m.asphalt = new THREE.MeshStandardMaterial( {
		map: canvasTex( 512, ( g, s ) => speckle( g, s, '#46484b', 9000, 0.35, r ), 1 / 6 ), roughness: 0.95,
	} );
	m.paving = new THREE.MeshStandardMaterial( {
		map: canvasTex( 512, ( g, s ) => {

			speckle( g, s, '#b9b5ac', 3000, 0.12, r );
			g.strokeStyle = 'rgba(70,66,60,0.55)';
			g.lineWidth = 3;
			const n = 8;
			for ( let i = 0; i <= n; i ++ ) {

				g.beginPath(); g.moveTo( i * s / n, 0 ); g.lineTo( i * s / n, s ); g.stroke();
				g.beginPath(); g.moveTo( 0, i * s / n ); g.lineTo( s, i * s / n ); g.stroke();

			}

		}, 1 / 3.2 ), roughness: 0.9,
	} );
	m.grass = new THREE.MeshStandardMaterial( {
		map: canvasTex( 512, ( g, s ) => {

			g.fillStyle = '#3e5530';
			g.fillRect( 0, 0, s, s );
			for ( let i = 0; i < 30000; i ++ ) {

				const h = 70 + r() * 35, l = 16 + r() * 20;
				g.fillStyle = `hsla(${h},${22 + r() * 18}%,${l}%,0.75)`;
				g.fillRect( r() * s, r() * s, 1, 2 + r() * 3 );

			}

		}, 1 / 5 ), roughness: 1,
	} );
	m.curb = new THREE.MeshStandardMaterial( { color: 0xc9c6bf, roughness: 0.85 } );
	m.line = new THREE.MeshStandardMaterial( { color: 0xf2f2ee, roughness: 0.7 } );
	m.trunk = new THREE.MeshStandardMaterial( { color: 0x5a4636, roughness: 1 } );
	m.leaf = [ 0x2f4a24, 0x3a5629, 0x2a4220, 0x445e2e ].map( ( c ) => new THREE.MeshStandardMaterial( { color: c, roughness: 0.95 } ) );
	m.carGlass = new THREE.MeshPhysicalMaterial( { color: 0x111518, roughness: 0.05, metalness: 0.2, clearcoat: 1 } );
	m.tire = new THREE.MeshStandardMaterial( { color: 0x161616, roughness: 0.85 } );
	m.rim = new THREE.MeshStandardMaterial( { color: 0xb8bcc0, roughness: 0.3, metalness: 1 } );
	m.carPaint = [ 0xf3f3f1, 0xf3f3f1, 0xd9dcdf, 0x9ea3a8, 0x1c1d20, 0x26354d, 0x7d1d1d, 0xe8e6df ].map( ( c ) => new THREE.MeshPhysicalMaterial( { color: c, roughness: 0.3, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.08 } ) );
	m.light = new THREE.MeshStandardMaterial( { color: 0xffffff, emissive: 0xfff2d8, emissiveIntensity: 0.4 } );
	m.facade = [ 0xe7e2d8, 0xd8d6d0, 0xcfc6b6, 0xe9e9e6 ].map( ( c ) => new THREE.MeshStandardMaterial( {
		color: c, roughness: 0.9,
		map: canvasTex( 256, ( g, s ) => {

			g.fillStyle = '#ffffff';
			g.fillRect( 0, 0, s, s );
			g.fillStyle = '#5d6670';
			for ( let y = 0; y < 4; y ++ ) for ( let x = 0; x < 4; x ++ ) g.fillRect( x * s / 4 + 10, y * s / 4 + 14, s / 4 - 20, s / 4 - 30 );

		}, 1 / 12 ),
	} ) );
	m.roof = new THREE.MeshStandardMaterial( { color: 0x8c8a86, roughness: 0.95 } );
	return m;

}

function addCar( b, m, x, z, rotY, paint ) {

	const M = new THREE.Matrix4().makeRotationY( rotY ).setPosition( x, 0, z );
	const L = 4.5, W = 1.8;
	b.add( paint, new RoundedBoxGeometry( L, 0.72, W, 3, 0.18 ).translate( 0, 0.66, 0 ), M );
	b.add( paint, new RoundedBoxGeometry( 2.5, 0.62, W - 0.16, 3, 0.2 ).translate( - 0.25, 1.2, 0 ), M );
	b.add( m.carGlass, new RoundedBoxGeometry( 2.35, 0.48, W - 0.12, 2, 0.16 ).translate( - 0.25, 1.22, 0 ), M );
	for ( const sx of [ - 1.45, 1.4 ] ) for ( const sz of [ - 1, 1 ] ) {

		b.add( m.tire, new THREE.CylinderGeometry( 0.34, 0.34, 0.24, 18 ).rotateX( Math.PI / 2 ).translate( sx, 0.34, sz * ( W / 2 - 0.08 ) ), M );
		b.add( m.rim, new THREE.CylinderGeometry( 0.2, 0.2, 0.25, 12 ).rotateX( Math.PI / 2 ).translate( sx, 0.34, sz * ( W / 2 - 0.07 ) ), M );

	}

	b.add( m.light, box( L / 2 - 0.02, L / 2 + 0.01, 0.7, 0.82, - W / 2 + 0.15, - W / 2 + 0.45 ), M );
	b.add( m.light, box( L / 2 - 0.02, L / 2 + 0.01, 0.7, 0.82, W / 2 - 0.45, W / 2 - 0.15 ), M );

}

function addTree( b, m, x, z, r, s ) {

	const h = 2.2 + r() * 1.4;
	b.add( m.trunk, new THREE.CylinderGeometry( 0.12 * s, 0.18 * s, h, 8 ).translate( x, h / 2, z ) );
	const n = 3 + Math.floor( r() * 3 );
	for ( let i = 0; i < n; i ++ ) {

		const rad = ( 1.2 + r() * 1.0 ) * s;
		const g = new THREE.SphereGeometry( rad, 18, 12 );
		const p = g.attributes.position;
		const ph = r() * 6.28;
		for ( let k = 0; k < p.count; k ++ ) {

			// silliq "barg to'dasi" shakli: past chastotali to'lqinlar
			const x = p.getX( k ), y = p.getY( k ), z = p.getZ( k );
			const f = 1 + 0.12 * Math.sin( x * 2.3 + ph ) * Math.cos( z * 2.1 - ph ) + 0.06 * Math.sin( y * 4.0 + ph );
			p.setXYZ( k, x * f, y * f * 0.85, z * f );

		}

		g.computeVertexNormals();
		g.translate( x + ( r() - 0.5 ) * 1.6 * s, h + rad * 0.55 + r() * 1.2 * s, z + ( r() - 0.5 ) * 1.6 * s );
		b.add( m.leaf[ Math.floor( r() * m.leaf.length ) ], g );

	}

}

export function buildSite() {

	const m = siteMaterials();
	const r = rng( 21 );
	const b = new Batch();
	const y0 = - 0.035; // bino poli (y = 0) ostida — z-fighting bo'lmaydi
	const slab = ( mat, x0, x1, z0, z1, y = y0, t = 0.02 ) => b.add( mat, box( x0, x1, y - t, y, z0, z1 ) );

	// Umumiy yer: maysazor
	slab( m.grass, - 70, 95, - 60, 75, y0 - 0.02 );

	// Bino atrofidagi yo'lka (3 m)
	slab( m.paving, - 3.6, 26.9, - 3.6, 9.4, y0 + 0.012 );
	slab( m.paving, 12.4, 26.9, 9.4, 20.6, y0 + 0.012 );
	slab( m.paving, - 3.6, 12.4, 9.4, 13.0, y0 + 0.012 );
	// Hovli (L shaklining ichki burchagi): plitka + kichik maysa
	slab( m.paving, - 3.6, 12.4, 13.0, 20.6, y0 + 0.008 );
	slab( m.grass, 1.0, 10.5, 15.0, 19.0, y0 + 0.02 );

	// G'arb (vitrina tomoni): avtoturargoh + ko'cha
	slab( m.asphalt, - 22, - 3.6, - 16, 26 );
	slab( m.asphalt, - 34, - 22, - 60, 75 ); // ko'cha
	slab( m.paving, - 37.5, - 34, - 60, 75, y0 + 0.012 ); // narigi yo'lka
	// Shimol: avtoturargoh
	slab( m.asphalt, - 3.6, 30, - 16, - 3.6 );

	// Bordyurlar
	const curb = ( x0, x1, z0, z1 ) => b.add( m.curb, box( x0, x1, y0, 0.12, z0, z1 ) );
	curb( - 3.75, - 3.6, - 3.6, 20.6 );
	curb( - 3.6, 26.9, - 3.75, - 3.6 );
	curb( - 22.15, - 22, - 60, 75 );
	curb( - 34, - 33.85, - 60, 75 );

	// Turargoh chiziqlari va mashinalar — g'arb (ikki qator, burun binoga qarab)
	const paint = () => m.carPaint[ Math.floor( r() * m.carPaint.length ) ];
	for ( let z = - 14; z <= 23.4; z += 2.6 ) {

		b.add( m.line, box( - 9.0, - 3.9, y0, y0 + 0.004, z - 0.06, z + 0.06 ) );
		b.add( m.line, box( - 21.6, - 16.5, y0, y0 + 0.004, z - 0.06, z + 0.06 ) );
		if ( z < 23.4 ) {

			if ( r() < 0.72 ) addCar( b, m, - 6.5 + ( r() - 0.5 ) * 0.3, z + 1.3, ( r() - 0.5 ) * 0.04, paint() );
			if ( r() < 0.6 ) addCar( b, m, - 19.0 + ( r() - 0.5 ) * 0.3, z + 1.3, Math.PI + ( r() - 0.5 ) * 0.04, paint() );

		}

	}

	// Shimoliy turargoh (mashinalar binoga perpendikulyar)
	for ( let x = - 2.6; x <= 28.4; x += 2.6 ) {

		b.add( m.line, box( x - 0.06, x + 0.06, y0, y0 + 0.004, - 9.0, - 4.0 ) );
		if ( x < 28.4 && r() < 0.65 ) addCar( b, m, x + 1.3, - 6.5 + ( r() - 0.5 ) * 0.3, Math.PI / 2 + ( r() - 0.5 ) * 0.04, paint() );

	}

	// Ko'chadagi chiziqlar va harakatdagi mashinalar
	for ( let z = - 58; z < 74; z += 6 ) b.add( m.line, box( - 28.1, - 27.9, y0, y0 + 0.004, z, z + 3 ) );
	for ( const [ z, dir ] of [ [ - 30, 1 ], [ 5, - 1 ], [ 38, 1 ], [ - 8, - 1 ] ] ) addCar( b, m, dir > 0 ? - 30.5 : - 25.5, z, dir > 0 ? Math.PI / 2 : - Math.PI / 2, paint() );

	// Daraxtlar: ko'cha bo'yida, sharq va janubdagi maysazorda
	for ( let z = - 55; z < 72; z += 7 + r() * 3 ) addTree( b, m, - 36 + ( r() - 0.5 ), z, r, 1 + r() * 0.3 );
	for ( let z = - 12; z < 26; z += 6 + r() * 2 ) addTree( b, m, - 1.9 - 0.2, z < - 3 ? z - 1 : z, r, 0.7 );
	for ( let i = 0; i < 28; i ++ ) {

		const x = 29 + r() * 40, z = - 40 + r() * 100;
		addTree( b, m, x, z, r, 0.9 + r() * 0.6 );

	}

	for ( let i = 0; i < 18; i ++ ) {

		const x = - 15 + r() * 45, z = 24 + r() * 40;
		if ( x < 30 ) addTree( b, m, x, z, r, 0.9 + r() * 0.6 );

	}

	addTree( b, m, 3.5, 17.0, r, 0.8 );
	addTree( b, m, 8.0, 16.5, r, 0.7 );

	// Qo'shni binolar (uzoqda)
	const bld = ( x0, x1, z0, z1, h, k ) => {

		b.add( m.facade[ k % m.facade.length ], box( x0, x1, 0, h, z0, z1 ) );
		b.add( m.roof, box( x0 - 0.2, x1 + 0.2, h, h + 0.4, z0 - 0.2, z1 + 0.2 ) );

	};

	bld( - 70, - 44, - 40, - 12, 15, 0 );
	bld( - 70, - 46, - 2, 26, 21, 1 );
	bld( - 68, - 45, 36, 62, 12, 2 );
	bld( - 2, 24, - 52, - 30, 18, 3 );
	bld( 32, 50, - 55, - 32, 27, 1 );
	bld( 45, 70, 40, 62, 15, 0 );

	const g = b.build( { name: 'site', castShadow: false, receiveShadow: true } );
	g.name = 'site';
	return g;

}
