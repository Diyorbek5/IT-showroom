// Ichki jihozlar (premium): 1-qavat — ISTEK logotipli devor, 3 o'rinli operatorlar stoykasi, mehmonlar burchagi
// (kichik stol, 2 kreslo, shirinlik va suvlar); 2-qavat — majlislar zali (qanot), dasturchilar joylari (zina chiqishi
// yonida), direktor xonasi (stol, kreslolar, TV, "KUTUBXONA" javonlari).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Batch, box, beam } from './geo.js';

const V = ( x, y, z ) => new THREE.Vector3( x, y, z );

function rng( seed ) {

	let s = seed >>> 0;
	return () => ( ( s = ( s * 1664525 + 1013904223 ) >>> 0 ) / 4294967296 );

}

function canvasTex( w, h, draw, { srgb = true, repeat } = {} ) {

	const c = document.createElement( 'canvas' );
	c.width = w; c.height = h;
	draw( c.getContext( '2d' ), w, h );
	const t = new THREE.CanvasTexture( c );
	if ( srgb ) t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.anisotropy = 8;
	if ( repeat ) t.repeat.set( repeat[ 0 ], repeat[ 1 ] );
	return t;

}

// ---------------- teksturalar ----------------
function woodTex( base, dark, seed, lenM = 2.0 ) {

	return canvasTex( 512, 512, ( g, w, h ) => {

		const R = rng( seed );
		g.fillStyle = base; g.fillRect( 0, 0, w, h );
		for ( let i = 0; i < 260; i ++ ) {

			const y = R() * h, amp = 2 + R() * 10, ph = R() * 6.28, f = 1 + R() * 3;
			g.strokeStyle = `rgba(${dark},${0.08 + R() * 0.22})`;
			g.lineWidth = 0.6 + R() * 2.2;
			g.beginPath();
			for ( let x = 0; x <= w; x += 8 ) {

				const yy = y + Math.sin( x / w * Math.PI * 2 * f + ph ) * amp;
				x === 0 ? g.moveTo( x, yy ) : g.lineTo( x, yy );

			}

			g.stroke();

		}

	}, { repeat: [ 1 / lenM, 1 / lenM ] } );

}

function marbleTex() {

	return canvasTex( 512, 512, ( g, w, h ) => {

		const R = rng( 5 );
		g.fillStyle = '#efeeeb'; g.fillRect( 0, 0, w, h );
		for ( let i = 0; i < 26; i ++ ) {

			let x = R() * w, y = R() * h;
			g.strokeStyle = `rgba(120,120,125,${0.15 + R() * 0.3})`;
			g.lineWidth = 0.6 + R() * 1.6;
			g.beginPath(); g.moveTo( x, y );
			for ( let k = 0; k < 30; k ++ ) {

				x += ( R() - 0.3 ) * 30; y += ( R() - 0.5 ) * 30;
				g.lineTo( x, y );

			}

			g.stroke();

		}

	}, { repeat: [ 1 / 1.2, 1 / 1.2 ] } );

}

function booksTex() {

	// javon qatori: rang-barang kitob muqovalari (0.32 m balandlik × 1 m)
	return canvasTex( 1024, 320, ( g, w, h ) => {

		const R = rng( 12 );
		g.fillStyle = '#1b1612'; g.fillRect( 0, 0, w, h );
		const cols = [ '#7b2d26', '#21384f', '#2f4a36', '#b08a4a', '#e8e1d2', '#4c4f55', '#8c5a3b', '#1d1d1f', '#6d6a8a', '#c5b9a3' ];
		let x = 4;
		while ( x < w - 4 ) {

			const bw = 10 + R() * 26, bh = h * ( 0.62 + R() * 0.3 );
			if ( R() < 0.07 ) {

				x += 30; continue; // bo'sh joy

			}

			const c = cols[ Math.floor( R() * cols.length ) ];
			g.fillStyle = c; g.fillRect( x, h - bh, bw - 1.5, bh );
			g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect( x + 2, h - bh + 6, bw - 6, 3 );
			g.fillStyle = 'rgba(210,180,110,0.55)'; g.fillRect( x + 3, h - bh + bh * 0.2, bw - 8, 2 ); g.fillRect( x + 3, h - bh + bh * 0.75, bw - 8, 2 );
			x += bw;

		}

	}, { repeat: [ 1, 1 / 0.36 ] } );

}

function screenTex( kind, seed ) {

	return canvasTex( 512, 300, ( g, w, h ) => {

		const R = rng( seed );
		if ( kind === 'code' ) {

			g.fillStyle = '#1e1f26'; g.fillRect( 0, 0, w, h );
			g.fillStyle = '#16171c'; g.fillRect( 0, 0, 90, h );
			g.fillStyle = '#2a2c35'; g.fillRect( 0, 0, w, 18 );
			const cs = [ '#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff', '#d0d0d8', '#ffcb6b' ];
			for ( let y = 28; y < h - 8; y += 11 ) {

				let x = 100 + Math.floor( R() * 4 ) * 16;
				const n = 1 + Math.floor( R() * 5 );
				for ( let k = 0; k < n; k ++ ) {

					const lw = 14 + R() * 60;
					g.fillStyle = cs[ Math.floor( R() * cs.length ) ];
					g.fillRect( x, y, lw, 5 );
					x += lw + 7;

				}

			}

			for ( let y = 28; y < h; y += 14 ) {

				g.fillStyle = '#4a4d5a'; g.fillRect( 10, y, 50 + R() * 20, 4 );

			}

		} else if ( kind === 'crm' ) {

			g.fillStyle = '#f2f4f7'; g.fillRect( 0, 0, w, h );
			g.fillStyle = '#1f3a5f'; g.fillRect( 0, 0, w, 26 );
			g.fillStyle = '#ffffff'; g.font = 'bold 14px sans-serif'; g.fillText( 'ISTEK CRM', 12, 18 );
			g.fillStyle = '#e1e6ee'; g.fillRect( 0, 26, 110, h );
			for ( let y = 44; y < h - 10; y += 22 ) {

				g.fillStyle = y % 44 ? '#ffffff' : '#f7f9fb'; g.fillRect( 120, y, w - 130, 20 );
				g.fillStyle = '#9aa6b5'; g.fillRect( 130, y + 7, 80 + R() * 60, 5 ); g.fillRect( 300, y + 7, 40 + R() * 40, 5 );
				g.fillStyle = R() < 0.5 ? '#3fb37f' : '#f0a43a'; g.fillRect( w - 70, y + 5, 50, 10 );

			}

		} else {

			// TV: kompaniya taqdimoti / dashboard
			const gr = g.createLinearGradient( 0, 0, w, h );
			gr.addColorStop( 0, '#0e1a2b' ); gr.addColorStop( 1, '#1d3557' );
			g.fillStyle = gr; g.fillRect( 0, 0, w, h );
			g.fillStyle = '#ffffff'; g.font = 'bold 54px sans-serif'; g.fillText( 'ISTEK', 34, 92 );
			g.fillStyle = '#9fb7d6'; g.font = '18px sans-serif'; g.fillText( 'IT Showroom · Q4 natijalar', 36, 124 );
			const bars = [ 0.45, 0.62, 0.55, 0.78, 0.7, 0.92 ];
			bars.forEach( ( b, i ) => {

				g.fillStyle = i === 5 ? '#4cc9f0' : '#4361ee';
				g.fillRect( 40 + i * 44, h - 30 - b * 120, 30, b * 120 );

			} );
			g.strokeStyle = '#f72585'; g.lineWidth = 3; g.beginPath();
			for ( let i = 0; i < 7; i ++ ) {

				const x = 330 + i * 26, y = h - 60 - Math.sin( i * 0.9 ) * 30 - i * 10;
				i ? g.lineTo( x, y ) : g.moveTo( x, y );

			}

			g.stroke();

		}

	}, { repeat: [ 1, 1 ] } );

}

function logoTex( text, sub ) {

	return canvasTex( 2048, 512, ( g, w, h ) => {

		g.clearRect( 0, 0, w, h );
		g.fillStyle = '#ffffff';
		g.textAlign = 'center'; g.textBaseline = 'middle';
		const fs = Math.min( 300, Math.floor( 1700 / ( text.length * 0.78 ) ) );
		g.font = `900 ${fs}px "Helvetica Neue", Arial, "DejaVu Sans", sans-serif`;
		if ( 'letterSpacing' in g ) g.letterSpacing = `${Math.round( fs * 0.13 )}px`;
		g.fillText( text, w / 2, sub ? h * 0.42 : h * 0.5, w * 0.94 );
		if ( sub ) {

			g.font = '500 64px "Helvetica Neue", Arial, "DejaVu Sans", sans-serif';
			if ( 'letterSpacing' in g ) g.letterSpacing = '26px';
			g.fillText( sub, w / 2, h * 0.86 );

		}

	}, { repeat: [ 1, 1 ] } );

}

// ---------------- materiallar ----------------
export function createFurnitureMaterials() {

	const m = {};
	m.walnut = new THREE.MeshStandardMaterial( { map: woodTex( '#5b3a26', '30,18,10', 3 ), roughness: 0.45 } );
	m.oak = new THREE.MeshStandardMaterial( { map: woodTex( '#b79068', '90,60,35', 4 ), roughness: 0.5 } );
	m.white = new THREE.MeshPhysicalMaterial( { color: 0xf3f1ec, roughness: 0.28, clearcoat: 0.4, clearcoatRoughness: 0.2 } );
	m.marble = new THREE.MeshPhysicalMaterial( { map: marbleTex(), roughness: 0.12, clearcoat: 0.8, clearcoatRoughness: 0.05 } );
	m.black = new THREE.MeshStandardMaterial( { color: 0x151517, roughness: 0.38, metalness: 0.75 } );
	m.matteBlack = new THREE.MeshStandardMaterial( { color: 0x1a1a1c, roughness: 0.7 } );
	m.brass = new THREE.MeshStandardMaterial( { color: 0xc9a25a, roughness: 0.25, metalness: 1 } );
	m.chrome = new THREE.MeshStandardMaterial( { color: 0xe2e2e2, roughness: 0.1, metalness: 1 } );
	m.cognac = new THREE.MeshPhysicalMaterial( { color: 0x8a4f2b, roughness: 0.5, sheen: 0.4, sheenColor: 0xd9a57a, sheenRoughness: 0.5 } );
	m.leather = new THREE.MeshPhysicalMaterial( { color: 0x1c1c1e, roughness: 0.45, sheen: 0.3, sheenColor: 0x777777 } );
	m.fabric = new THREE.MeshStandardMaterial( { color: 0x5b5f66, roughness: 0.95 } );
	m.mesh = new THREE.MeshStandardMaterial( { color: 0x232427, roughness: 0.85 } );
	m.felt = new THREE.MeshStandardMaterial( { color: 0x3d5148, roughness: 1 } ); // akustik to'siq
	m.screenOff = new THREE.MeshPhysicalMaterial( { color: 0x08090b, roughness: 0.15, clearcoat: 1 } );
	m.plant = new THREE.MeshStandardMaterial( { color: 0x3f6d34, roughness: 0.6, side: THREE.DoubleSide } );
	m.plant2 = new THREE.MeshStandardMaterial( { color: 0x2f5a2a, roughness: 0.6, side: THREE.DoubleSide } );
	m.soil = new THREE.MeshStandardMaterial( { color: 0x2b2118, roughness: 1 } );
	m.ceramic = new THREE.MeshPhysicalMaterial( { color: 0xe9e6df, roughness: 0.35, clearcoat: 0.5 } );
	m.rug = new THREE.MeshStandardMaterial( { map: canvasTex( 256, 256, ( g, w, h ) => {

		const R = rng( 8 );
		g.fillStyle = '#6b6862'; g.fillRect( 0, 0, w, h );
		for ( let i = 0; i < 9000; i ++ ) {

			g.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect( R() * w, R() * h, 2, 2 );

		}

	}, { repeat: [ 1, 1 ] } ), roughness: 1 } );
	m.books = new THREE.MeshStandardMaterial( { map: booksTex(), roughness: 0.8 } );
	m.water = new THREE.MeshPhysicalMaterial( { color: 0xbfe2f2, roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1 } );
	m.cap = new THREE.MeshStandardMaterial( { color: 0x1f6fc2, roughness: 0.4 } );
	m.glass = new THREE.MeshPhysicalMaterial( { color: 0xe9f3f6, roughness: 0.03, transparent: true, opacity: 0.35, clearcoat: 1 } );
	m.sweets = [ 0xc0392b, 0xf1c40f, 0x8e44ad, 0x27ae60, 0xe67e22, 0x6d3b1e ].map( ( c ) => new THREE.MeshPhysicalMaterial( { color: c, roughness: 0.3, clearcoat: 0.6 } ) );
	const scr = ( t, k = 0.9 ) => new THREE.MeshStandardMaterial( { color: 0x000000, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: k, roughness: 0.2 } );
	m.scrCode = [ 1, 2, 3, 4 ].map( ( s ) => scr( screenTex( 'code', s ), 0.55 ) );
	m.scrCrm = [ 5, 6, 7 ].map( ( s ) => scr( screenTex( 'crm', s ), 0.45 ) );
	m.scrTv = scr( screenTex( 'tv', 9 ), 0.7 );
	m.scrTv.userData.sharedEnv = false;
	return m;

}

// ---------------- jihoz yasovchilar (mahalliy koordinatada; old tomon = +z) ----------------
function place( x, y, z, rotY ) {

	return new THREE.Matrix4().makeRotationY( rotY ).setPosition( x, y, z );

}

function officeChair( b, M, m ) {

	// 5 nurli tayanch, gaz ustun, o'rindiq, to'r suyanchiq, qo'ltiqlar
	for ( let k = 0; k < 5; k ++ ) {

		const a = k / 5 * Math.PI * 2;
		b.add( M.black, beam( V( 0, 0.07, 0 ), V( Math.cos( a ) * 0.32, 0.05, Math.sin( a ) * 0.32 ), 0.022, 0.022, true, 6 ), m.clone() );
		b.add( M.matteBlack, new THREE.SphereGeometry( 0.028, 8, 6 ).translate( Math.cos( a ) * 0.32, 0.028, Math.sin( a ) * 0.32 ), m.clone() );

	}

	b.add( M.chrome, new THREE.CylinderGeometry( 0.025, 0.03, 0.34, 12 ).translate( 0, 0.24, 0 ), m.clone() );
	b.add( M.fabric, new RoundedBoxGeometry( 0.5, 0.08, 0.48, 3, 0.03 ).translate( 0, 0.46, 0.02 ), m.clone() );
	b.add( M.mesh, new RoundedBoxGeometry( 0.46, 0.58, 0.05, 3, 0.03 ).rotateX( 0.12 ).translate( 0, 0.83, - 0.22 ), m.clone() );
	b.add( M.black, box( - 0.03, 0.03, 0.46, 0.62, - 0.27, - 0.23 ), m.clone() );
	for ( const s of [ - 1, 1 ] ) {

		b.add( M.black, box( s * 0.27 - 0.015, s * 0.27 + 0.015, 0.48, 0.66, - 0.02, 0.02 ), m.clone() );
		b.add( M.matteBlack, new RoundedBoxGeometry( 0.06, 0.03, 0.26, 2, 0.01 ).translate( s * 0.27, 0.67, 0.02 ), m.clone() );

	}

}

function execChair( b, M, m ) {

	officeChair( b, M, m );
	// baland charm suyanchiq
	b.add( M.leather, new RoundedBoxGeometry( 0.52, 0.86, 0.1, 4, 0.05 ).rotateX( 0.1 ).translate( 0, 0.98, - 0.25 ), m.clone() );
	b.add( M.leather, new RoundedBoxGeometry( 0.54, 0.1, 0.52, 4, 0.04 ).translate( 0, 0.5, 0.02 ), m.clone() );

}

function meetingChair( b, M, m ) {

	// konsol (cantilever) xrom oyoq, charm o'rindiq va suyanchiq
	for ( const s of [ - 1, 1 ] ) {

		const x = s * 0.21;
		b.add( M.chrome, beam( V( x, 0.012, 0.22 ), V( x, 0.012, - 0.2 ), 0.011, 0.011, true, 8 ), m.clone() );
		b.add( M.chrome, beam( V( x, 0.012, 0.22 ), V( x, 0.42, 0.2 ), 0.011, 0.011, true, 8 ), m.clone() );
		b.add( M.chrome, beam( V( x, 0.42, 0.2 ), V( x, 0.44, - 0.2 ), 0.011, 0.011, true, 8 ), m.clone() );
		b.add( M.chrome, beam( V( x, 0.44, - 0.2 ), V( x, 0.86, - 0.25 ), 0.011, 0.011, true, 8 ), m.clone() );

	}

	b.add( M.leather, new RoundedBoxGeometry( 0.48, 0.07, 0.46, 3, 0.03 ).translate( 0, 0.47, 0 ), m.clone() );
	b.add( M.leather, new RoundedBoxGeometry( 0.48, 0.42, 0.06, 3, 0.03 ).rotateX( 0.1 ).translate( 0, 0.7, - 0.23 ), m.clone() );

}

function loungeChair( b, M, m ) {

	// premium kreslo: konyak charm, yong'oq oyoqlar, latun uchlar
	for ( const [ x, z ] of [ [ - 0.3, 0.28 ], [ 0.3, 0.28 ], [ - 0.3, - 0.28 ], [ 0.3, - 0.28 ] ] ) {

		b.add( M.walnut, new THREE.CylinderGeometry( 0.022, 0.016, 0.2, 10 ).translate( x, 0.1, z ), m.clone() );
		b.add( M.brass, new THREE.CylinderGeometry( 0.017, 0.017, 0.02, 10 ).translate( x, 0.01, z ), m.clone() );

	}

	b.add( M.walnut, new RoundedBoxGeometry( 0.74, 0.06, 0.66, 3, 0.02 ).translate( 0, 0.22, 0 ), m.clone() );
	b.add( M.cognac, new RoundedBoxGeometry( 0.66, 0.14, 0.6, 4, 0.05 ).translate( 0, 0.32, 0.02 ), m.clone() );
	b.add( M.cognac, new RoundedBoxGeometry( 0.74, 0.5, 0.14, 4, 0.06 ).rotateX( - 0.18 ).translate( 0, 0.56, - 0.28 ), m.clone() );
	for ( const s of [ - 1, 1 ] ) b.add( M.cognac, new RoundedBoxGeometry( 0.1, 0.3, 0.62, 3, 0.04 ).translate( s * 0.34, 0.42, 0 ), m.clone() );

}

function plant( b, M, m, h = 1.6, seed = 1 ) {

	const R = rng( seed );
	b.add( M.ceramic, new THREE.CylinderGeometry( 0.2, 0.16, 0.42, 20 ).translate( 0, 0.21, 0 ), m.clone() );
	b.add( M.soil, new THREE.CylinderGeometry( 0.185, 0.185, 0.02, 20 ).translate( 0, 0.41, 0 ), m.clone() );
	for ( let i = 0; i < 26; i ++ ) {

		const a = R() * Math.PI * 2, t = 0.25 + R() * 0.75;
		const top = V( Math.cos( a ) * 0.32 * t, 0.42 + h * ( 0.35 + 0.65 * t ), Math.sin( a ) * 0.32 * t );
		b.add( M.black, beam( V( 0, 0.42, 0 ), top, 0.006, 0.006, true, 4 ), m.clone() );
		const leaf = new THREE.SphereGeometry( 1, 8, 6 ).scale( 0.07, 0.015, 0.2 ).rotateX( - 0.6 ).rotateY( a + Math.PI / 2 ).translate( top.x, top.y, top.z );
		b.add( i % 2 ? M.plant : M.plant2, leaf, m.clone() );

	}

}

function monitor( b, S, M, m, mat, w = 0.6, h = 0.36 ) {

	b.add( M.black, box( - 0.12, 0.12, 0, 0.012, - 0.09, 0.09 ), m.clone() );
	b.add( M.black, box( - 0.02, 0.02, 0, 0.32, - 0.05, - 0.02 ), m.clone() );
	b.add( M.matteBlack, new RoundedBoxGeometry( w + 0.02, h + 0.02, 0.025, 2, 0.006 ).translate( 0, 0.36, 0 ), m.clone() );
	S.add( mat, new THREE.PlaneGeometry( w, h ).translate( 0, 0.36, 0.0135 ), m.clone() );

}

// ================== 1-qavat ==================
export function buildFurniture1( M ) {

	const b = new Batch(), S = new Batch(), T = new Batch();
	const P = ( x, z, r, y = 0 ) => place( x, y, z, r );

	// ---- ISTEK logotipli devor (sharqiy devor, kiraverishdan ro'parada) ----
	const wx = 7.3; // devor yuzasi
	b.add( M.matteBlack, box( wx - 0.02, wx, 0.95, 3.45, 1.15, 5.05 ) );
	for ( let z = 1.18; z < 5.03; z += 0.065 ) b.add( M.walnut, box( wx - 0.055, wx - 0.02, 0.95, 3.45, z, z + 0.04 ) );
	b.add( M.brass, box( wx - 0.06, wx - 0.02, 0.93, 0.95, 1.15, 5.05 ) );
	b.add( M.brass, box( wx - 0.06, wx - 0.02, 3.45, 3.47, 1.15, 5.05 ) );
	// yorug'lik chiqaradigan harflar (logotip) — devor oldida, yupqa panel ustida
	const logo = new THREE.MeshStandardMaterial( { color: 0x000000, emissive: 0xfff4e0, emissiveMap: logoTex( 'ISTEK', 'IT SHOWROOM' ), emissiveIntensity: 2.2, alphaMap: logoTex( 'ISTEK', 'IT SHOWROOM' ), transparent: true, alphaTest: 0.4 } );
	const lg = new THREE.PlaneGeometry( 2.9, 0.725 ).rotateY( - Math.PI / 2 ).translate( wx - 0.075, 2.35, 3.1 );
	const logoMesh = new THREE.Mesh( lg, logo );
	logoMesh.name = 'istek-logo';

	// ---- operatorlar stoykasi (3 o'rin): mijozlar g'arbdan keladi, operatorlar sharq tomonda o'tiradi ----
	const cx0 = 5.25, cz0 = 1.45, cz1 = 4.75;
	b.add( M.white, box( cx0, cx0 + 0.42, 1.06, 1.1, cz0, cz1 ) ); // baland peshtaxta
	for ( let z = cz0 + 0.02; z < cz1 - 0.03; z += 0.06 ) b.add( M.walnut, box( cx0 - 0.03, cx0, 0.08, 1.06, z, z + 0.04 ) ); // old yog'och reykalar
	b.add( M.matteBlack, box( cx0, cx0 + 0.04, 0.0, 1.06, cz0, cz1 ) );
	b.add( M.brass, box( cx0 - 0.035, cx0, 0.06, 0.08, cz0, cz1 ) );
	for ( const z of [ cz0, cz1 - 0.04 ] ) b.add( M.white, box( cx0, cx0 + 1.2, 0, 1.1, z, z + 0.04 ) );
	b.add( M.white, box( cx0 + 0.04, cx0 + 1.2, 0.72, 0.75, cz0, cz1 ) ); // operatorlar ish stoli
	const seats = [ 2.0, 3.1, 4.2 ];
	seats.forEach( ( z, i ) => {

		monitor( b, S, M, P( cx0 + 0.32, z, Math.PI / 2, 0.75 ), M.scrCrm[ i ] );
		b.add( M.matteBlack, box( cx0 + 0.52, cx0 + 0.66, 0.75, 0.765, z - 0.22, z + 0.22 ) ); // klaviatura
		officeChair( b, M, P( cx0 + 1.42, z, - Math.PI / 2 ) );

	} );

	// ---- mehmonlar burchagi: kichik marmar stol, 2 premium kreslo, shirinlik va suvlar ----
	const gx = 3.6, gz = 1.4;
	T.add( M.rug, box( gx - 1.25, gx + 1.25, 0.002, 0.012, gz - 0.85, gz + 0.85 ) );
	b.add( M.brass, new THREE.CylinderGeometry( 0.05, 0.16, 0.48, 24 ).translate( gx, 0.24, gz ) );
	b.add( M.brass, new THREE.CylinderGeometry( 0.2, 0.2, 0.015, 32 ).translate( gx, 0.0075, gz ) );
	b.add( M.marble, new THREE.CylinderGeometry( 0.36, 0.36, 0.035, 48 ).translate( gx, 0.5, gz ) );
	loungeChair( b, M, P( gx - 0.82, gz + 0.05, Math.PI / 2 - 0.35 ) );
	loungeChair( b, M, P( gx + 0.82, gz + 0.05, - Math.PI / 2 + 0.35 ) );
	// patnis: shirinliklar (piyola) va suv shishalari, stakanlar
	const ty = 0.5175;
	b.add( M.walnut, new THREE.CylinderGeometry( 0.17, 0.17, 0.012, 32 ).translate( gx + 0.06, ty + 0.006, gz - 0.05 ) );
	b.add( M.ceramic, new THREE.SphereGeometry( 0.09, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2 ).scale( 1, 0.55, 1 ).translate( gx + 0.06, ty + 0.06, gz - 0.05 ) );
	const R = rng( 44 );
	for ( let i = 0; i < 16; i ++ ) {

		const a = R() * Math.PI * 2, d = R() * 0.055;
		b.add( M.sweets[ i % M.sweets.length ], new THREE.SphereGeometry( 0.016, 10, 8 ).scale( 1, 0.7, 1.4 ).rotateY( R() * 3 ).translate( gx + 0.06 + Math.cos( a ) * d, ty + 0.035 + R() * 0.02, gz - 0.05 + Math.sin( a ) * d ) );

	}

	for ( const [ dx, dz ] of [ [ - 0.2, 0.12 ], [ - 0.12, 0.2 ] ] ) {

		b.add( M.water, new THREE.CylinderGeometry( 0.033, 0.033, 0.2, 16 ).translate( gx + dx, ty + 0.1, gz + dz ) );
		b.add( M.water, new THREE.CylinderGeometry( 0.012, 0.033, 0.05, 16 ).translate( gx + dx, ty + 0.225, gz + dz ) );
		b.add( M.cap, new THREE.CylinderGeometry( 0.014, 0.014, 0.022, 12 ).translate( gx + dx, ty + 0.26, gz + dz ) );

	}

	for ( const [ dx, dz ] of [ [ 0.2, 0.14 ], [ 0.08, 0.22 ] ] ) b.add( M.glass, new THREE.CylinderGeometry( 0.034, 0.028, 0.1, 16, 1, true ).translate( gx + dx, ty + 0.05, gz + dz ) );

	// ---- o'simliklar ----
	plant( b, M, P( 1.15, 0.95, 0 ), 1.5, 1 );
	plant( b, M, P( 6.85, 0.55, 0 ), 1.7, 2 );
	plant( b, M, P( 6.75, 5.4, 0 ), 1.3, 3 );
	plant( b, M, P( 0.6, 8.3, 0 ), 1.6, 4 );

	const g = new THREE.Group();
	g.name = 'furniture-1';
	g.add( b.build( { name: 'furn1' } ), S.build( { name: 'furn1-screens', uv: false, castShadow: false } ), T.build( { name: 'furn1-rug', castShadow: false } ), logoMesh );
	return g;

}

// ================== 2-qavat ==================
export function buildFurniture2( M, Y2 ) {

	const b = new Batch(), S = new Batch(), T = new Batch(), U = new Batch();
	const P = ( x, z, r, y = Y2 ) => place( x, y, z, r );

	// ---- majlislar zali (qanot, janubiy qism): uzun stol, 13 stul, devorda TV ----
	const tx0 = 18.95, tx1 = 20.45, tz0 = 8.7, tz1 = 14.7;
	b.add( M.walnut, box( tx0, tx1, Y2 + 0.72, Y2 + 0.76, tz0, tz1 ) );
	b.add( M.marble, box( tx0 + 0.25, tx1 - 0.25, Y2 + 0.76, Y2 + 0.765, tz0 + 0.4, tz1 - 0.4 ) ); // markaziy marmar yo'lak
	for ( const z of [ tz0 + 0.6, ( tz0 + tz1 ) / 2, tz1 - 0.6 ] ) {

		b.add( M.black, box( ( tx0 + tx1 ) / 2 - 0.45, ( tx0 + tx1 ) / 2 + 0.45, Y2 + 0.66, Y2 + 0.72, z - 0.04, z + 0.04 ) );
		b.add( M.black, box( ( tx0 + tx1 ) / 2 - 0.04, ( tx0 + tx1 ) / 2 + 0.04, Y2, Y2 + 0.66, z - 0.04, z + 0.04 ) );
		b.add( M.black, box( ( tx0 + tx1 ) / 2 - 0.4, ( tx0 + tx1 ) / 2 + 0.4, Y2, Y2 + 0.03, z - 0.05, z + 0.05 ) );

	}

	for ( let i = 0; i < 6; i ++ ) {

		const z = tz0 + 0.55 + i * 0.98;
		meetingChair( b, M, P( tx0 - 0.42, z, Math.PI / 2 ) );
		meetingChair( b, M, P( tx1 + 0.42, z, - Math.PI / 2 ) );
		// stoldagi bloknot va stakan
		for ( const [ xx, s ] of [ [ tx0 + 0.32, 1 ], [ tx1 - 0.32, - 1 ] ] ) {

			b.add( M.white, box( xx - 0.1, xx + 0.1, Y2 + 0.76, Y2 + 0.768, z - 0.14, z + 0.14 ) );
			b.add( M.glass, new THREE.CylinderGeometry( 0.032, 0.028, 0.1, 14, 1, true ).translate( xx + s * 0.18, Y2 + 0.81, z + 0.2 ) );

		}

	}

	meetingChair( b, M, P( ( tx0 + tx1 ) / 2, tz0 - 0.45, 0 ) );
	// stol ustidagi chiziqli osma chiroq
	U.add( M.black, box( 19.65, 19.75, Y2 + 2.55, Y2 + 2.62, tz0 + 0.6, tz1 - 0.6 ) );
	for ( const z of [ tz0 + 1, tz1 - 1 ] ) U.add( M.black, beam( V( 19.7, Y2 + 2.62, z ), V( 19.7, Y2 + 3.55, z ), 0.003, 0.003, true, 4 ) );
	const lineLed = new THREE.MeshStandardMaterial( { color: 0x000000, emissive: 0xfff2dc, emissiveIntensity: 3 } );
	S.add( lineLed, new THREE.PlaneGeometry( 0.06, tz1 - tz0 - 1.3 ).rotateX( Math.PI / 2 ).translate( 19.7, Y2 + 2.548, ( tz0 + tz1 ) / 2 ) );
	// TV (janubiy devorda, eshikdan chapda) va tagidagi tumba
	const tvz = 17.01 - 0.04;
	b.add( M.matteBlack, box( 18.55, 20.85, Y2 + 1.2, Y2 + 2.5, tvz - 0.035, tvz ) );
	S.add( M.scrTv, new THREE.PlaneGeometry( 2.24, 1.24 ).rotateY( Math.PI ).translate( 19.7, Y2 + 1.85, tvz - 0.036 ) );
	b.add( M.walnut, box( 18.3, 21.1, Y2 + 0.12, Y2 + 0.56, 16.55, 17.0 ) );
	b.add( M.black, box( 18.3, 21.1, Y2, Y2 + 0.12, 16.6, 16.95 ) );
	plant( b, M, P( 16.6, 16.4, 0 ), 1.6, 5 );
	plant( b, M, P( 22.9, 9.6, 0 ), 1.4, 6 );

	// ---- dasturchilar joylari (zina chiqishi yonida, chap blok janubi): 2 qator × 4 o'rin ----
	const dx0 = 8.0, dw = 1.4, dzA = 6.2, dzM = 6.95, dzB = 7.7;
	for ( let i = 0; i < 4; i ++ ) {

		const x0 = dx0 + i * dw, xc = x0 + dw / 2;
		b.add( M.oak, box( x0 + 0.01, x0 + dw - 0.01, Y2 + 0.72, Y2 + 0.75, dzA, dzB ) );
		// dual monitor + klaviatura har ikki tomonda
		for ( const [ zz, rot, side ] of [ [ dzM - 0.12, Math.PI, - 1 ], [ dzM + 0.12, 0, 1 ] ] ) {

			for ( const k of [ - 0.31, 0.31 ] ) monitor( b, S, M, P( xc + k, zz, rot + ( side < 0 ? - k * 0.25 : k * 0.25 ), Y2 + 0.75 ), M.scrCode[ ( i + ( k > 0 ? 1 : 0 ) + ( side > 0 ? 2 : 0 ) ) % 4 ], 0.54, 0.31 );
			b.add( M.matteBlack, box( xc - 0.22, xc + 0.22, Y2 + 0.75, Y2 + 0.765, zz + side * 0.42 - 0.07, zz + side * 0.42 + 0.07 ) );
			b.add( M.matteBlack, new RoundedBoxGeometry( 0.06, 0.03, 0.1, 2, 0.01 ).translate( xc + 0.3, Y2 + 0.765, zz + side * 0.42 ) );
			officeChair( b, M, P( xc, zz + side * 1.05, side < 0 ? 0 : Math.PI ) );

		}

	}

	// stollar ostidagi qora metall rama va o'rtadagi akustik to'siq
	for ( let i = 0; i <= 4; i ++ ) {

		const x = dx0 + i * dw;
		b.add( M.black, box( x - 0.02, x + 0.02, Y2, Y2 + 0.72, dzA + 0.05, dzA + 0.09 ) );
		b.add( M.black, box( x - 0.02, x + 0.02, Y2, Y2 + 0.72, dzB - 0.09, dzB - 0.05 ) );
		b.add( M.black, box( x - 0.02, x + 0.02, Y2 + 0.68, Y2 + 0.72, dzA + 0.05, dzB - 0.05 ) );

	}

	b.add( M.felt, box( dx0 + 0.02, dx0 + 4 * dw - 0.02, Y2 + 0.75, Y2 + 1.15, dzM - 0.02, dzM + 0.02 ) );
	plant( b, M, P( 13.95, 8.3, 0 ), 1.5, 7 );
	plant( b, M, P( 7.6, 8.35, 0 ), 1.3, 8 );

	// ---- direktor xonasi (ofis): yong'oq stol, charm kreslo, 2 mehmon kreslo, TV, kutubxona ----
	const ox = 3.05, oz = 1.85;
	T.add( M.rug, box( ox - 1.6, ox + 1.4, Y2 + 0.002, Y2 + 0.012, oz - 1.15, oz + 1.15 ) );
	b.add( M.walnut, box( ox - 0.5, ox + 0.5, Y2 + 0.72, Y2 + 0.77, oz - 1.0, oz + 1.0 ) );
	b.add( M.walnut, box( ox + 0.36, ox + 0.42, Y2, Y2 + 0.72, oz - 0.96, oz + 0.96 ) ); // old panel
	for ( const z of [ oz - 0.96, oz + 0.9 ] ) b.add( M.walnut, box( ox - 0.46, ox + 0.42, Y2, Y2 + 0.72, z, z + 0.06 ) );
	b.add( M.brass, box( ox + 0.42, ox + 0.43, Y2 + 0.1, Y2 + 0.12, oz - 0.96, oz + 0.96 ) );
	monitor( b, S, M, P( ox - 0.1, oz + 0.35, - Math.PI / 2 + 0.3, Y2 + 0.77 ), M.scrCrm[ 2 ], 0.62, 0.36 );
	b.add( M.matteBlack, box( ox - 0.12, ox + 0.12, Y2 + 0.77, Y2 + 0.78, oz - 0.5, oz - 0.1 ) ); // yozuv to'plami
	b.add( M.brass, new THREE.CylinderGeometry( 0.05, 0.07, 0.02, 20 ).translate( ox + 0.1, Y2 + 0.78, oz - 0.75 ) );
	b.add( M.brass, beam( V( ox + 0.1, Y2 + 0.79, oz - 0.75 ), V( ox + 0.1, Y2 + 1.12, oz - 0.75 ), 0.008, 0.008, true, 6 ) );
	b.add( M.white, new THREE.CylinderGeometry( 0.06, 0.1, 0.12, 20, 1, true ).translate( ox + 0.1, Y2 + 1.15, oz - 0.75 ) ); // stol chirog'i
	execChair( b, M, P( ox - 0.95, oz, Math.PI / 2 ) );
	loungeChair( b, M, P( ox + 1.25, oz - 0.45, - Math.PI / 2 ) );
	loungeChair( b, M, P( ox + 1.25, oz + 0.45, - Math.PI / 2 ) );
	// TV: sharqiy devorda (eshik yonida) — direktorga qaragan
	const tvx = 6.5 - 0.04;
	b.add( M.matteBlack, box( tvx - 0.035, tvx, Y2 + 1.25, Y2 + 2.1, 0.32, 1.82 ) );
	S.add( M.scrTv, new THREE.PlaneGeometry( 1.46, 0.81 ).rotateY( - Math.PI / 2 ).translate( tvx - 0.036, Y2 + 1.675, 1.07 ) );
	// kutubxona: janubiy devor bo'ylab yong'oq javonlar (radiatordan o'ngda) va ustida "KUTUBXONA" yozuvi
	const sx0 = 1.75, sx1 = 3.28, sz = 3.86, sd = 0.36, sh = 2.5;
	b.add( M.walnut, box( sx0, sx1, Y2, Y2 + sh, sz - 0.02, sz ) );
	for ( const x of [ sx0, ( sx0 + sx1 ) / 2 - 0.015, sx1 - 0.03 ] ) b.add( M.walnut, box( x, x + 0.03, Y2, Y2 + sh, sz - sd, sz ) );
	for ( let k = 0; k <= 6; k ++ ) b.add( M.walnut, box( sx0, sx1, Y2 + 0.08 + k * 0.4, Y2 + 0.11 + k * 0.4, sz - sd, sz ) );
	for ( let k = 0; k < 6; k ++ ) T.add( M.books, box( sx0 + 0.03, sx1 - 0.03, Y2 + 0.11 + k * 0.4, Y2 + 0.11 + k * 0.4 + 0.3, sz - sd + 0.06, sz - 0.04 ) );
	const libMat = new THREE.MeshStandardMaterial( { color: 0xc9a25a, metalness: 1, roughness: 0.3, alphaMap: logoTex( 'KUTUBXONA' ), transparent: true, alphaTest: 0.4 } );
	const libSign = new THREE.Mesh( new THREE.PlaneGeometry( 1.5, 0.375 ).translate( ( sx0 + sx1 ) / 2, Y2 + sh + 0.32, sz - 0.03 ).rotateY( 0 ), libMat );
	libSign.geometry.rotateY( Math.PI ); // yuz shimolga (xonaga)
	libSign.geometry.translate( 2 * ( sx0 + sx1 ) / 2, 0, 2 * ( sz - 0.03 ) );
	plant( b, M, P( 1.05, 0.95, 0 ), 1.5, 9 );

	const g = new THREE.Group();
	g.name = 'furniture-2';
	g.add( b.build( { name: 'furn2' } ), S.build( { name: 'furn2-screens', uv: false, castShadow: false } ), T.build( { name: 'furn2-soft', castShadow: false } ), U.build( { name: 'furn2-pendant' } ), libSign );
	g.userData.mats = [ libMat, lineLed ];
	return g;

}
