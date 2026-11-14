// Chizmadagi o'lchamlar (reference/*/01-plan-olchamlar.jpg) — 3D modelda CAD uslubidagi o'lcham chiziqlari.
// Alohida "overlay" sahnada chiziladi: path tracer, GI, aks va soyalarga ta'sir qilmaydi.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { Y2 } from './plan2.js';

// [ axis, a, b, at ] — axis 'x': x a→b, z = at;  axis 'z': z a→b, x = at
const DIMS = {
	1: [
		[ 'x', 0.75, 7.3, 0.75 ], // 6.55
		[ 'x', 0, 7.3, 1.3 ], // 7.30
		[ 'z', 0.53, 3.68, 0.45 ], // 3.15
		[ 'z', 0, 8.75, 1.6 ], // 8.75
		[ 'z', 0.97, 3.57, 6.95 ], // 2.60
		[ 'z', 4.56, 5.76, 6.95 ], // 1.20
		[ 'x', 0.75, 3.3, 3.4 ], [ 'x', 3.3, 4.3, 3.4 ], [ 'x', 4.3, 7.3, 3.4 ], // 2.55 · 1.00 · 3.00
		[ 'z', 3.68, 4.18, 3.0 ], // 0.50
		[ 'x', 0, 2.37, 7.3 ], [ 'x', 2.37, 5.44, 7.3 ], // 2.37 · 3.07
	],
	2: [
		[ 'x', 0.75, 7.3, 0.35 ], [ 'x', 7.875, 15.375, 0.35 ], [ 'x', 15.95, 23.35, 0.35 ], // 6.55 · 7.50 · 7.40
		[ 'x', 0, 23.35, 1.35 ], // 23.35
		[ 'z', 0.53, 3.68, 0.45 ], [ 'z', 4.15, 8.75, 0.45 ], // 3.15 · 4.60
		[ 'z', 0, 8.75, 1.15 ], // 8.75
		[ 'x', 0.75, 3.3, 3.4 ], [ 'x', 4.3, 7.3, 3.4 ], // 2.55 · 3.00
		[ 'z', 0.97, 3.57, 7.6 ], // 2.60 (ichki ustun)
		[ 'x', 7.875, 15.375, 4.1 ], // 7.50
		[ 'z', 0.97, 3.57, 16.35 ], [ 'z', 4.56, 8.96, 16.35 ], [ 'z', 9.0, 17.01, 16.75 ], // 2.60 · 4.40 · 8.01
		[ 'x', 0, 16.0, 8.3 ], // 16.00
		[ 'z', 0, 17.01, 22.9 ], // 17.01
		[ 'x', 16.45, 23.35, 16.7 ], // 6.90
	],
};

const COLOR = 0xff3b30;

function label( text ) {

	const fs = 64, pad = 22;
	const c = document.createElement( 'canvas' );
	const g = c.getContext( '2d' );
	g.font = `600 ${fs}px system-ui, -apple-system, "Segoe UI", sans-serif`;
	const tw = Math.ceil( g.measureText( text ).width );
	c.width = tw + pad * 2;
	c.height = fs + pad * 1.2;
	g.font = `600 ${fs}px system-ui, -apple-system, "Segoe UI", sans-serif`;
	const r = c.height / 2;
	g.fillStyle = 'rgba(255,255,255,0.94)';
	g.strokeStyle = '#ff3b30';
	g.lineWidth = 6;
	g.beginPath();
	g.roundRect( 3, 3, c.width - 6, c.height - 6, r - 3 );
	g.fill();
	g.stroke();
	g.fillStyle = '#c4161c';
	g.textAlign = 'center';
	g.textBaseline = 'middle';
	g.fillText( text, c.width / 2, c.height / 2 + 3 );
	const t = new THREE.CanvasTexture( c );
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 4;
	const m = new THREE.SpriteMaterial( { map: t, depthTest: false, depthWrite: false, toneMapped: false, sizeAttenuation: false } );
	const s = new THREE.Sprite( m );
	const h = 0.034;
	s.scale.set( h * c.width / c.height, h, 1 );
	s.renderOrder = 11;
	return s;

}

export function buildDimensions() {

	const scene = new THREE.Scene();
	const lineMat = new LineMaterial( {
		color: COLOR, linewidth: 2.2, depthTest: false, depthWrite: false, toneMapped: false, transparent: true,
	} );
	const groups = {};
	for ( const f of [ 1, 2 ] ) {

		const y = ( f === 1 ? 0 : Y2 ) + 0.04;
		const pos = [];
		const grp = new THREE.Group();
		grp.name = 'dims-' + f;
		const seg = ( a, b ) => pos.push( a.x, a.y, a.z, b.x, b.y, b.z );
		for ( const [ axis, a, b, at ] of DIMS[ f ] ) {

			const P = ( u, w ) => axis === 'x' ? new THREE.Vector3( u, y, at + w ) : new THREE.Vector3( at + w, y, u );
			seg( P( a, 0 ), P( b, 0 ) );
			for ( const u of [ a, b ] ) {

				seg( P( u, - 0.14 ), P( u, 0.14 ) ); // chetki chiziq
				seg( P( u - 0.12, - 0.12 ), P( u + 0.12, 0.12 ) ); // CAD qiya belgisi

			}

			const s = label( Math.abs( b - a ).toFixed( 2 ) );
			s.position.copy( P( ( a + b ) / 2, 0 ) );
			s.position.y += 0.02;
			grp.add( s );

		}

		const geo = new LineSegmentsGeometry().setPositions( pos );
		const lines = new LineSegments2( geo, lineMat );
		lines.renderOrder = 10;
		grp.add( lines );
		grp.visible = false;
		scene.add( grp );
		groups[ f ] = grp;

	}

	return {
		scene,
		visible: true,
		show( floor ) {

			for ( const f of [ 1, 2 ] ) groups[ f ].visible = this.visible && f === floor;

		},
		render( renderer, camera ) {

			if ( ! this.visible ) return;
			renderer.getDrawingBufferSize( lineMat.resolution );
			const ac = renderer.autoClear;
			renderer.autoClear = false;
			renderer.setRenderTarget( null );
			renderer.render( scene, camera );
			renderer.autoClear = ac;

		},
	};

}
