import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { H, CHANDELIERS, PANELS, RADIATORS } from './plan.js';
import { Batch, box, beam } from './geo.js';

const V = ( x, y, z ) => new THREE.Vector3( x, y, z );

const RING_SETS = {
	big: [
		{ r: 0.62, y: H - 1.2, rx: 1.05, rz: 0.25 },
		{ r: 0.46, y: H - 1.22, rx: - 0.55, rz: 0.45 },
		{ r: 0.3, y: H - 1.3, rx: 0.12, rz: - 0.1 },
	],
	mid: [
		{ r: 0.42, y: H - 0.95, rx: 0.1, rz: 0.0 },
		{ r: 0.32, y: H - 1.07, rx: - 0.16, rz: 0.12 },
		{ r: 0.22, y: H - 1.18, rx: 0.12, rz: - 0.16 },
	],
};

export function buildFixtures( mats, params ) {

	const root = new THREE.Group();
	root.name = 'fixtures';
	const lights = { chandeliers: [], panels: [] };

	// ---------- Qandillar ----------
	const gold = new Batch();
	const leds = [];
	for ( const c of CHANDELIERS ) {

		const set = RING_SETS[ c.type ];
		// shiftdagi qopqoq
		const can = new THREE.CylinderGeometry( 0.13, 0.13, 0.03, 48 );
		can.translate( c.x, H - 0.015, c.z );
		gold.add( mats.gold, can );
		let centerY = 0;
		for ( const ring of set ) {

			const m = new THREE.Matrix4().compose( V( c.x, ring.y, c.z ), new THREE.Quaternion().setFromEuler( new THREE.Euler( ring.rx, 0, ring.rz ) ), V( 1, 1, 1 ) );
			const tg = new THREE.TorusGeometry( ring.r, 0.017, 12, 180 );
			tg.rotateX( Math.PI / 2 );
			gold.add( mats.gold, tg, m );
			const lg = new THREE.TorusGeometry( ring.r - 0.004, 0.009, 8, 180 );
			lg.rotateX( Math.PI / 2 );
			lg.translate( 0, - 0.014, 0 );
			lg.applyMatrix4( m );
			leds.push( lg );
			// kabellar: halqaning eng baland nuqtasidan va ±120°
			const pts = [];
			for ( let k = 0; k < 96; k ++ ) {

				const a = k / 96 * Math.PI * 2;
				pts.push( V( Math.cos( a ) * ring.r, 0.017, Math.sin( a ) * ring.r ).applyMatrix4( m ) );

			}

			let best = 0;
			pts.forEach( ( p, k ) => {

				if ( p.y > pts[ best ].y ) best = k;

			} );
			for ( const off of [ 0, 32, 64 ] ) {

				const p = pts[ ( best + off ) % 96 ];
				const dx = p.x - c.x, dz = p.z - c.z;
				const d = Math.hypot( dx, dz ) || 1;
				const top = V( c.x + dx / d * 0.09, H - 0.03, c.z + dz / d * 0.09 );
				gold.add( mats.steel, beam( top, p, 0.0018, 0.0018, true, 5 ) );

			}

			centerY += ring.y / set.length;

		}

		const pl = new THREE.PointLight( 0xffcf9e, 1, 0, 2 );
		pl.position.set( c.x, centerY - 0.05, c.z );
		pl.userData.kind = 'chandelier';
		root.add( pl );
		lights.chandeliers.push( pl );

	}

	root.add( gold.build( { name: 'chandeliers', castShadow: false } ) );
	const ledBatch = new Batch();
	leds.forEach( ( g ) => ledBatch.add( mats.ledWarm, g ) );
	root.add( ledBatch.build( { name: 'chandelier-led', castShadow: false, receiveShadow: false } ) );

	// ---------- Kvadrat LED panellar ----------
	const pb = new Batch();
	const pe = new Batch();
	for ( const [ x, z ] of PANELS ) {

		pb.add( mats.panelFrame, box( x - 0.17, x + 0.17, H - 0.012, H, z - 0.17, z + 0.17 ) );
		const pg = new THREE.PlaneGeometry( 0.3, 0.3 );
		pg.rotateX( Math.PI / 2 );
		pg.translate( x, H - 0.0125, z );
		pe.add( mats.ledCool, pg );
		const rl = new THREE.RectAreaLight( 0xf2f5ff, 1, 0.3, 0.3 );
		rl.position.set( x, H - 0.015, z );
		rl.lookAt( x, 0, z );
		rl.userData.kind = 'panel';
		root.add( rl );
		lights.panels.push( rl );

	}

	root.add( pb.build( { name: 'panel-frames', castShadow: false } ) );
	root.add( pe.build( { name: 'panels', castShadow: false, receiveShadow: false } ) );

	// ---------- Radiatorlar ----------
	const rb = new Batch();
	addRadiators( rb, mats, RADIATORS );
	root.add( rb.build( { name: 'radiators' } ) );

	// ---------- Rozetkalar ----------
	const sb = new Batch();
	const sockets = [
		{ x: 7.3, z: 3.2, nx: - 1, nz: 0 },
		{ x: 7.3, z: 0.6, nx: - 1, nz: 0 },
		{ x: 1.4, z: 8.75, nx: 0, nz: - 1 },
		{ x: 5.0, z: 8.75, nx: 0, nz: - 1 },
		{ x: 6.9, z: 6.28, nx: - 0.79, nz: - 0.61 },
	];
	for ( const s of sockets ) {

		const theta = Math.atan2( s.nx, s.nz );
		const m = new THREE.Matrix4().compose( V( s.x, 0.32, s.z ), new THREE.Quaternion().setFromAxisAngle( V( 0, 1, 0 ), theta ), V( 1, 1, 1 ) );
		const plate = new RoundedBoxGeometry( 0.082, 0.082, 0.012, 2, 0.006 );
		plate.translate( 0, 0, 0.006 );
		sb.add( mats.socket, plate, m );
		const ring = new THREE.CylinderGeometry( 0.023, 0.023, 0.004, 24 );
		ring.rotateX( Math.PI / 2 );
		ring.translate( 0, 0, 0.0125 );
		sb.add( mats.socketHole, ring, m );

	}

	root.add( sb.build( { name: 'sockets', castShadow: false } ) );

	applyLightLevels( lights, mats, params );
	root.userData.lights = lights;
	return root;

}

// Yoritgichlar yorqinligini HDRI birliklarida sozlash.
// Real vaqtda RectAreaLight'lar o'chiq (juda og'ir) — panel yorug'ligi GI probe'lar orqali keladi;
// ular faqat "Foto sifat" (path tracing) rejimida yoqiladi. Yorug'lik soni o'zgarmasligi uchun
// chiroqlar visible bilan emas, intensity bilan o'chiriladi (shader qayta kompilyatsiya bo'lmaydi).
export function applyLightLevels( lights, mats, p ) {

	const on = p.lightsOn ? 1 : 0;
	const area = !! p.areaLights;
	for ( const l of lights.panels ) {

		l.intensity = p.panel * on;
		l.visible = area;

	}

	for ( const l of lights.chandeliers ) {

		l.intensity = p.chandelier * on;
		l.visible = true;

	}

	// 2-qavat panel guruhlari (6 ta katta yorug'lik) — kamera 2-qavatda bo'lganda real vaqtda ham yoqiladi
	for ( const l of lights.floor2 || [] ) {

		l.intensity = p.panel * l.userData.areaFactor * on;
		l.visible = area || !! p.floor2Live;

	}

	mats.ledCool.emissiveIntensity = p.panelEmissive * on;
	mats.ledWarm.emissiveIntensity = p.chandelierEmissive * on;

}

export function addRadiators( rb, mats, list, y0 = 0 ) {

	for ( const r of list ) {

		const theta = Math.atan2( r.nx, r.nz );
		const m = new THREE.Matrix4().compose( V( r.x + r.nx * 0.065, y0, r.z + r.nz * 0.065 ), new THREE.Quaternion().setFromAxisAngle( V( 0, 1, 0 ), theta ), V( 1, 1, 1 ) );
		const len = r.n * 0.08;
		for ( let k = 0; k < r.n; k ++ ) {

			const sx = - len / 2 + 0.04 + k * 0.08;
			const s = new RoundedBoxGeometry( 0.072, 0.56, 0.08, 2, 0.012 );
			s.translate( sx, 0.42, 0 );
			rb.add( mats.radiator, s, m );
			// orqa kollektor (ko'rinmas, lekin soyani to'g'ri beradi)

		}

		const hdr = ( y ) => {

			const g = new THREE.CylinderGeometry( 0.018, 0.018, len, 12 );
			g.rotateZ( Math.PI / 2 );
			g.translate( 0, y, - 0.02 );
			return g;

		};

		rb.add( mats.radiator, hdr( 0.18 ), m );
		rb.add( mats.radiator, hdr( 0.66 ), m );
		// quvurlar va kranlar
		for ( const side of [ - 1, 1 ] ) {

			const px = side * ( len / 2 + 0.035 );
			const pipe = new THREE.CylinderGeometry( 0.011, 0.011, 0.19, 12 );
			pipe.translate( px, 0.095, - 0.02 );
			rb.add( mats.radiator, pipe, m );
			const elbow = new THREE.CylinderGeometry( 0.011, 0.011, 0.05, 12 );
			elbow.rotateZ( Math.PI / 2 );
			elbow.translate( px - side * 0.022, 0.18, - 0.02 );
			rb.add( mats.radiator, elbow, m );
			const valve = new THREE.CylinderGeometry( 0.016, 0.016, 0.04, 16 );
			valve.translate( px, 0.15, - 0.02 );
			rb.add( mats.chrome, valve, m );

		}

	}

}
