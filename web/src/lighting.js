import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import { LightProbeGridWebGL } from 'three/addons/lighting/LightProbeGridWebGL.js';
import { H } from './plan.js';

// Diffuz IBL ni probe-grid mavjud bo'lsa o'chiramiz (aks holda yorug'lik ikki marta hisoblanadi).
const chunk = THREE.ShaderChunk.lights_fragment_maps;
THREE.ShaderChunk.lights_fragment_maps = chunk.replace(
	'iblIrradiance += getIBLIrradiance( geometryNormal );',
	'#if NUM_LIGHT_PROBE_GRIDS == 0\n\t\t\tiblIrradiance += getIBLIrradiance( geometryNormal );\n\t\t\t#endif'
);

const D2R = Math.PI / 180;

// HDRI ni yuklab, quyoshni ajratib olamiz: yo'nalish, yoritilganlik (lux-ekvivalent) va
// quyosh piksellarini kesib tashlangan osmon (fon va env uchun).
export async function loadSky( url, { rotation = 0 } = {} ) {

	const loader = new HDRLoader().setDataType( THREE.FloatType );
	let tex;
	if ( url.endsWith( '.txt' ) ) {

		// Artifact versiyasi: .hdr fayl base64 matn sifatida yetkaziladi
		const b64 = ( await ( await fetch( url ) ).text() ).trim();
		const bin = atob( b64 );
		const bytes = new Uint8Array( bin.length );
		for ( let i = 0; i < bin.length; i ++ ) bytes[ i ] = bin.charCodeAt( i );
		const d = loader.parse( bytes.buffer );
		tex = new THREE.DataTexture( d.data, d.width, d.height, THREE.RGBAFormat, d.type );
		tex.colorSpace = THREE.LinearSRGBColorSpace;
		tex.minFilter = tex.magFilter = THREE.LinearFilter;
		tex.generateMipmaps = false;
		tex.flipY = true;
		tex.needsUpdate = true;

	} else {

		tex = await loader.loadAsync( url );

	}

	tex.mapping = THREE.EquirectangularReflectionMapping;
	const { width: W, height: Hh, data } = tex.image;

	// Yorqinlik statistikasi
	const lum = ( i ) => 0.2126 * data[ i ] + 0.7152 * data[ i + 1 ] + 0.0722 * data[ i + 2 ];
	let max = 0;
	let skyAvg = 0, skyW = 0;
	for ( let y = 0; y < Hh; y ++ ) {

		const lat = ( 0.5 - ( y + 0.5 ) / Hh ) * Math.PI;
		const cw = Math.cos( lat );
		for ( let x = 0; x < W; x ++ ) {

			const i = ( y * W + x ) * 4;
			const l = lum( i );
			if ( l > max ) max = l;
			if ( lat > 0.05 ) {

				skyAvg += Math.min( l, 50 ) * cw; skyW += cw;

			}

		}

	}

	skyAvg /= skyW;
	const thresh = Math.max( skyAvg * 20, max * 0.02 );
	const E = new THREE.Vector3();
	const dir = new THREE.Vector3();
	const dOmega = ( 2 * Math.PI / W ) * ( Math.PI / Hh );
	for ( let y = 0; y < Hh; y ++ ) {

		const lat = ( 0.5 - ( y + 0.5 ) / Hh ) * Math.PI;
		const cw = Math.cos( lat );
		for ( let x = 0; x < W; x ++ ) {

			const i = ( y * W + x ) * 4;
			const l = lum( i );
			if ( l < thresh ) continue;
			const w = dOmega * cw;
			const ex = ( data[ i ] - thresh ) * w, ey = ( data[ i + 1 ] - thresh ) * w, ez = ( data[ i + 2 ] - thresh ) * w;
			E.x += Math.max( 0, ex ); E.y += Math.max( 0, ey ); E.z += Math.max( 0, ez );
			const phi = ( ( x + 0.5 ) / W - 0.5 ) * 2 * Math.PI;
			const d = new THREE.Vector3( Math.cos( phi ) * cw, Math.sin( lat ), Math.sin( phi ) * cw );
			dir.addScaledVector( d, ( l - thresh ) * w );
			// quyoshni olib tashlaymiz
			const s = thresh / l;
			data[ i ] *= s; data[ i + 1 ] *= s; data[ i + 2 ] *= s;

		}

	}

	dir.normalize();
	tex.needsUpdate = true;
	const sunLum = 0.2126 * E.x + 0.7152 * E.y + 0.0722 * E.z;

	return { texture: tex, sunDir0: dir, sunE: E, sunLum, skyAvg, rotation };

}

export function setupSky( scene, renderer, sky, params ) {

	const rot = params.hdriRotation * D2R;
	scene.background = sky.texture;
	scene.backgroundRotation.set( 0, rot, 0 );
	scene.backgroundIntensity = params.skyIntensity;

	// Yerga proyeksiyalangan fon — oynadan tashqaridagi asfalt/daraxtlar to'g'ri masshtabda
	const mkGround = ( h, cx, cz, name ) => {

		const g = new GroundedSkybox( sky.texture, h, 70, 96 );
		g.position.set( cx, h - 0.03, cz );
		g.rotation.y = rot;
		g.material.depthWrite = false;
		g.renderOrder = - 10;
		g.name = name;
		g.material.color.setScalar( params.skyIntensity );
		scene.add( g );
		return g;

	};

	// 1-qavat ko'z balandligi uchun va 2-qavat (balandroq) uchun alohida proyeksiya
	const ground = mkGround( 2.2, 3.6, 4.4, 'grounded-skybox' );
	const ground2 = mkGround( 5.6, 11.7, 8.5, 'grounded-skybox-2' );
	ground2.visible = false;

	// Quyosh (yo'naltirilgan yorug'lik, soyalar bilan)
	const sun = new THREE.DirectionalLight( 0xffffff, 1 );
	sun.castShadow = true;
	sun.shadow.mapSize.set( 4096, 4096 );
	const sc = sun.shadow.camera;
	sc.left = - 16; sc.right = 16; sc.top = 16; sc.bottom = - 16; sc.near = 0.5; sc.far = 90;
	sun.shadow.bias = - 0.0002;
	sun.shadow.normalBias = 0.02;
	sun.shadow.radius = 3;
	sun.target.position.set( 11.7, 3, 8.5 );
	scene.add( sun, sun.target );

	const c = new THREE.Color( sky.sunE.x, sky.sunE.y, sky.sunE.z );
	const m = Math.max( c.r, c.g, c.b ) || 1;
	sun.color.setRGB( c.r / m, c.g / m, c.b / m );

	const out = { ground, ground2, sun };
	updateSun( out, sky, params );
	return out;

}

export function updateSun( sk, sky, params ) {

	const rot = params.hdriRotation * D2R;
	const d = sky.sunDir0.clone().applyEuler( new THREE.Euler( 0, rot, 0 ) );
	// balandlikni boshqarish (rasmlardagi kabi past quyosh, uzun yorug' dog'lar)
	const az = Math.atan2( d.z, d.x );
	const el = params.sunElevation * D2R;
	const dd = new THREE.Vector3( Math.cos( az ) * Math.cos( el ), Math.sin( el ), Math.sin( az ) * Math.cos( el ) );
	sk.sun.position.copy( sk.sun.target.position ).addScaledVector( dd, 40 );
	sk.sun.intensity = sky.sunLum * params.sunScale;
	sk.sun.visible = params.sunScale > 0;

}

// Diffuz GI: xona bo'ylab SH probe-grid (2 marta qaytish) + aks uchun xona cubemap'i
export function createProbeGrid() {

	// Probe markazlari ustunlar ichiga tushmasligi uchun hajm tanlandi (TZ ga qarang)
	const gx0 = 0.3, gx1 = 7.3, gz0 = 0, gz1 = 8.75;
	const grid = new LightProbeGridWebGL( gx1 - gx0, H, gz1 - gz0, 7, 3, 9 );
	grid.position.set( ( gx0 + gx1 ) / 2, H / 2, ( gz0 + gz1 ) / 2 );
	grid.name = 'probe-grid';

	// 2-qavat: chap blok, o'ng qanot zali, ofis xonalari
	const Y2 = H + 0.3, H2 = 4.0;
	const mk = ( x0, x1, z0, z1, nx, ny, nz, name ) => {

		const g = new LightProbeGridWebGL( x1 - x0, H2, z1 - z0, nx, ny, nz );
		g.position.set( ( x0 + x1 ) / 2, Y2 + H2 / 2, ( z0 + z1 ) / 2 );
		g.name = name;
		return g;

	};

	return [
		grid,
		mk( 0.3, 15.66, 0, 8.75, 10, 3, 6, 'probe-grid-2a' ),
		mk( 15.66, 23.35, 0, 11.6, 5, 3, 8, 'probe-grid-2b' ),
		mk( 16.0, 23.35, 11.72, 17.01, 5, 2, 3, 'probe-grid-2c' ),
	];

}

export function bakeGI( renderer, scene, grids, { bounces = 2, cubemapSize = 16 } = {} ) {

	const env = scene.environment;
	scene.environment = null;
	for ( const g of grids ) {

		if ( ! g.parent ) scene.add( g );

	}

	for ( const g of grids ) g.bake( renderer, scene, { cubemapSize, near: 0.02, far: 80, bounces } );
	scene.environment = env;

}

export function captureRoomEnv( renderer, scene, pos, size = 256 ) {

	const rt = new THREE.WebGLCubeRenderTarget( size, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } );
	const cam = new THREE.CubeCamera( 0.02, 100, rt );
	cam.position.copy( pos );
	scene.add( cam );
	const env = scene.environment;
	scene.environment = null;
	cam.update( renderer, scene );
	scene.environment = env;
	scene.remove( cam );
	const pmrem = new THREE.PMREMGenerator( renderer );
	const out = pmrem.fromCubemap( rt.texture ).texture;
	pmrem.dispose();
	rt.dispose();
	return out;

}
