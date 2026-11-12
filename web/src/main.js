import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';

import { H } from './plan.js';
import { createMaterials } from './materials.js';
import { buildShell } from './building.js';
import { buildStair } from './stair.js';
import { buildFixtures, applyLightLevels } from './fixtures.js';
import { FloorReflection } from './reflection.js';
import { loadSky, setupSky, updateSun, createProbeGrid, bakeGI, captureRoomEnv } from './lighting.js';
import { WalkControls } from './walk.js';

const BASE = import.meta.env.BASE_URL;
const qs = new URLSearchParams( location.search );
// Telefon/planshetlarda avtomatik yengil rejim (?q=high bilan majburan yuqori sifat)
const LOW = qs.get( 'q' ) === 'low' || ( qs.get( 'q' ) !== 'high' && matchMedia( '(pointer: coarse)' ).matches );
const SHOT = qs.has( 'shot' );

// Barcha yorqinliklar HDRI osmonining o'rtacha yorqinligiga nisbatan (osmon = 1)
const params = {
	hdriRotation: 200,
	sunElevation: 30,
	sunScale: 0.5,
	skyIntensity: 1,
	exposure: 0.68,
	panel: 0.9,
	chandelier: 0.25,
	chandelierEmissive: 7,
	panelEmissive: 4,
	lightsOn: true,
	aoIntensity: 2.2,
};

const VIEWS = [
	{ id: 'kirish', name: 'Kirish', pos: [ 0.75, 1.55, 7.6 ], target: [ 6.2, 1.55, 2.4 ] },
	{ id: 'vitrina', name: 'Vitrina', pos: [ 6.15, 1.5, 6.6 ], target: [ 0, 1.55, 2.6 ] },
	{ id: 'zina', name: 'Zina', pos: [ 4.7, 1.3, 4.7 ], target: [ 3.3, 2.3, 8.7 ] },
	{ id: 'burchak', name: 'Burchak', pos: [ 6.4, 1.6, 0.7 ], target: [ 1.0, 1.4, 6.8 ] },
	{ id: 'tepadan', name: 'Tepadan', pos: [ 1.2, 12.5, 11.0 ], target: [ 3.65, 0, 4.4 ] },
];

const $ = ( id ) => document.getElementById( id );
const setLoad = ( p, text ) => {

	$( 'load-bar' ).style.width = Math.round( p * 100 ) + '%';
	$( 'load-step' ).textContent = text;

};

const frame = () => new Promise( ( r ) => requestAnimationFrame( () => r() ) );

async function main() {

	// ---------- Renderer ----------
	const renderer = new THREE.WebGLRenderer( { antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: qs.has( 'shot' ) } );
	const dpr = LOW ? Math.min( window.devicePixelRatio, 1.25 ) : Math.min( window.devicePixelRatio, 1.5 );
	renderer.setPixelRatio( dpr );
	renderer.setSize( innerWidth, innerHeight );
	renderer.toneMapping = THREE.NeutralToneMapping;
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	renderer.shadowMap.autoUpdate = false;
	$( 'app' ).appendChild( renderer.domElement );
	RectAreaLightUniformsLib.init();

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera( 62, innerWidth / innerHeight, 0.03, 300 );

	// ---------- Model ----------
	setLoad( 0.1, 'Materiallar…' );
	const mats = createMaterials();
	const shell = buildShell( mats );
	const stair = buildStair( mats );
	const fixtures = buildFixtures( mats, params );
	scene.add( shell, stair, fixtures );
	const ceilingGroup = shell.userData.ceiling;
	const floor = shell.userData.floor;
	const lights = fixtures.userData.lights;

	// Shiftga tegishli ob'ektlar (tepadan ko'rinishda yashiriladi)
	const overhead = [ ceilingGroup, ...fixtures.children.filter( ( o ) => /chandelier|panel/.test( o.name ) ), ...stair.children.filter( ( o ) => false ) ];

	const reflection = new FloorReflection( floor, { resolution: 0.5 } );

	// ---------- Osmon / quyosh ----------
	setLoad( 0.25, 'Ko\'cha HDRI yuklanmoqda (6.8 MB)…' );
	console.log( 'model built' );
	const sky = await loadSky( BASE + 'hdri/park_parking_2k.hdr' );
	// Barcha birliklarni osmon = 1 ga normallashtiramiz
	{

		const d = sky.texture.image.data;
		const k = 1 / sky.skyAvg;
		for ( let i = 0; i < d.length; i += 4 ) {

			d[ i ] *= k; d[ i + 1 ] *= k; d[ i + 2 ] *= k;

		}

		sky.texture.needsUpdate = true;
		sky.sunE.multiplyScalar( k );
		sky.sunLum *= k;

	}

	if ( qs.has( 'rot' ) ) params.hdriRotation = + qs.get( 'rot' );
	if ( qs.has( 'el' ) ) params.sunElevation = + qs.get( 'el' );
	if ( qs.has( 'exp' ) ) params.exposure = + qs.get( 'exp' );

	const skyObjs = setupSky( scene, renderer, sky, params );
	renderer.toneMappingExposure = params.exposure;

	// ---------- GI bake ----------
	setLoad( 0.55, 'Yorug\'lik hisoblanmoqda (GI)…' );
	await frame();
	renderer.shadowMap.needsUpdate = true;
	reflection.uniforms.reflStrength.value = 0;
	const grids = createProbeGrid();
	const t0 = performance.now();
	if ( LOW ) skyObjs.sun.shadow.mapSize.set( 1024, 1024 );
	bakeGI( renderer, scene, grids, LOW ? { bounces: 1, cubemapSize: 8 } : { bounces: 2, cubemapSize: 16 } );
	console.log( 'bake done', Math.round( performance.now() - t0 ) );
	setLoad( 0.8, 'Akslar tayyorlanmoqda…' );
	await frame();
	scene.environment = captureRoomEnv( renderer, scene, new THREE.Vector3( 3.6, 1.5, 5.0 ), LOW ? 64 : 256 );
	scene.environmentRotation.set( 0, 0, 0 );
	reflection.uniforms.reflStrength.value = 1;
	console.log( 'GI bake ms', Math.round( performance.now() - t0 ) );

	// ---------- Post-processing ----------
	const composer = new EffectComposer( renderer, new THREE.WebGLRenderTarget( innerWidth * dpr, innerHeight * dpr, { type: THREE.HalfFloatType } ) );
	const n8 = new N8AOPass( scene, camera, innerWidth * dpr, innerHeight * dpr );
	n8.configuration.aoRadius = 0.9;
	n8.configuration.distanceFalloff = 0.6;
	n8.configuration.intensity = params.aoIntensity;
	n8.configuration.halfRes = false; // n8ao halfRes MRT three r187 bilan mos emas
	n8.configuration.depthAwareUpsampling = true;
	n8.configuration.gammaCorrection = false;
	n8.configuration.transparencyAware = false;
	n8.setQualityMode( LOW ? 'Low' : 'Medium' );
	composer.addPass( n8 );
	const bloom = new UnrealBloomPass( new THREE.Vector2( innerWidth, innerHeight ), 0.12, 0.3, 5 );
	composer.addPass( bloom );
	composer.addPass( new OutputPass() );
	const smaa = new SMAAPass();
	composer.addPass( smaa );

	// ---------- Boshqaruv ----------
	const orbit = new OrbitControls( camera, renderer.domElement );
	orbit.enableDamping = true;
	orbit.dampingFactor = 0.08;
	orbit.rotateSpeed = 0.55;
	orbit.maxDistance = 22;
	orbit.minDistance = 0.3;
	orbit.maxPolarAngle = Math.PI * 0.92;

	const walk = new WalkControls( camera, renderer.domElement );

	let anim = null;
	function goTo( v, instant = false ) {

		const from = { p: camera.position.clone(), t: orbit.target.clone() };
		const to = { p: new THREE.Vector3( ...v.pos ), t: new THREE.Vector3( ...v.target ) };
		if ( instant ) {

			camera.position.copy( to.p ); orbit.target.copy( to.t ); orbit.update();
			return;

		}

		anim = { from, to, t: 0 };
		document.querySelectorAll( '#views button' ).forEach( ( b ) => b.setAttribute( 'aria-pressed', b.dataset.id === v.id ? 'true' : 'false' ) );

	}

	const vbox = $( 'views' );
	for ( const v of VIEWS ) {

		const b = document.createElement( 'button' );
		b.type = 'button';
		b.textContent = v.name;
		b.dataset.id = v.id;
		b.setAttribute( 'aria-pressed', 'false' );
		b.onclick = () => {

			if ( walk.active ) walk.exit();
			goTo( v );
			try {

				history.replaceState( null, '', '#' + v.id );

			} catch ( e ) { /* sandbox */ }

		};

		vbox.appendChild( b );

	}

	const start = VIEWS.find( ( v ) => '#' + v.id === location.hash ) || ( qs.get( 'view' ) && VIEWS.find( ( v ) => v.id === qs.get( 'view' ) ) ) || VIEWS[ 0 ];
	goTo( start, true );
	vbox.querySelector( `[data-id="${start.id}"]` ).setAttribute( 'aria-pressed', 'true' );

	// ---------- Rejim tugmalari ----------
	$( 'btn-walk' ).onclick = () => {

		if ( pt.active ) togglePT( false );
		walk.enter();
		$( 'help' ).hidden = false;
		setTimeout( () => {

			$( 'help' ).hidden = true;

		}, 3500 );

	};

	walk.onExit = () => {

		$( 'help' ).hidden = true;
		const dir = new THREE.Vector3();
		camera.getWorldDirection( dir );
		orbit.target.copy( camera.position ).addScaledVector( dir, 1.5 );
		orbit.update();

	};

	$( 'btn-light' ).onclick = () => {

		params.lightsOn = ! params.lightsOn;
		$( 'btn-light' ).setAttribute( 'aria-pressed', String( params.lightsOn ) );
		applyLightLevels( lights, mats, params );
		pt.active && pt.tracer.updateLights();
		pt.active && pt.tracer.updateMaterials();

	};

	// ---------- Path tracing (foto sifat) ----------
	const pt = { active: false, tracer: null, loading: false };
	async function togglePT( on ) {

		if ( on === pt.active || pt.loading ) return;
		const btn = $( 'btn-pt' );
		if ( on ) {

			pt.loading = true;
			btn.disabled = true;
			status( 'Path tracer tayyorlanmoqda…' );
			await frame();
			try {

				const { enterPathTracing } = await import( './pathtrace.js' );
				pt.ctx = await enterPathTracing( { renderer, scene, camera, mats, sky, skyObjs, grids, params, existing: pt.tracer } );

			} catch ( e ) {

				console.error( e );
				pt.loading = false;
				btn.disabled = false;
				status( 'Foto sifat rejimi bu qurilmada ishlamadi' );
				return;

			}

			pt.tracer = pt.ctx.tracer;
			pt.active = true;
			pt.loading = false;
			btn.disabled = false;
			btn.setAttribute( 'aria-pressed', 'true' );

		} else {

			pt.ctx.exit();
			pt.active = false;
			btn.setAttribute( 'aria-pressed', 'false' );
			status( null );

		}

	}

	$( 'btn-pt' ).onclick = () => togglePT( ! pt.active );

	function status( text ) {

		const s = $( 'status' );
		s.hidden = ! text;
		if ( text ) s.textContent = text;

	}

	// ---------- O'lcham ----------
	function resize() {

		const w = innerWidth, h = innerHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize( w, h );
		composer.setSize( w, h );
		n8.setSize( w * dpr, h * dpr );
		reflection.setSize( w * dpr, h * dpr );
		pt.active && pt.tracer.updateCamera();

	}

	addEventListener( 'resize', resize );
	resize();

	// ---------- Tepadan (maket) ko'rinishi uchun ---------
	const outsideBg = new THREE.Color( 0x24262a );
	const hemi = new THREE.HemisphereLight( 0xffffff, 0x5a5c60, 1.6 );
	hemi.visible = false;
	scene.add( hemi );
	const mapGround = new THREE.Mesh( new THREE.CircleGeometry( 16, 64 ).rotateX( - Math.PI / 2 ), new THREE.MeshStandardMaterial( { color: 0x3a3c41, roughness: 1 } ) );
	mapGround.position.set( 3.65, - 0.02, 4.4 );
	mapGround.receiveShadow = true;
	mapGround.visible = false;
	scene.add( mapGround );

	// ---------- Kadr sikli ----------
	const clock = new THREE.Clock();
	let lastCam = new THREE.Matrix4();
	function tick() {

		const dt = Math.min( clock.getDelta(), 0.05 );
		if ( anim ) {

			anim.t = Math.min( 1, anim.t + dt / 1.4 );
			const e = anim.t < 0.5 ? 4 * anim.t ** 3 : 1 - ( - 2 * anim.t + 2 ) ** 3 / 2;
			camera.position.lerpVectors( anim.from.p, anim.to.p, e );
			orbit.target.lerpVectors( anim.from.t, anim.to.t, e );
			if ( anim.t >= 1 ) anim = null;

		}

		if ( walk.active ) walk.update( dt );
		else orbit.update();

		// Tepadan qaralganda shift va unga osilganlar yashiriladi
		const outside = camera.position.y > H - 0.02 || camera.position.x < - 0.2 || camera.position.z < - 0.2 || camera.position.x > 7.4 || camera.position.z > 8.9;
		for ( const o of overhead ) o.visible = ! outside;
		skyObjs.ground.visible = ! outside;
		mapGround.visible = outside;
		hemi.visible = outside;
		scene.background = outside ? outsideBg : sky.texture;

		if ( pt.active ) {

			camera.updateMatrixWorld();
			if ( ! lastCam.equals( camera.matrixWorld ) ) {

				pt.tracer.updateCamera();
				lastCam.copy( camera.matrixWorld );

			}

			pt.tracer.renderSample();
			status( `Foto sifat · ${Math.floor( pt.tracer.samples )} namuna` );

		} else {

			reflection.update( renderer, scene, camera );
			composer.render( dt );

		}

		if ( ! SHOT ) requestAnimationFrame( tick );

	}

	setLoad( 1, 'Tayyor' );
	await frame();
	tick();
	const loader = $( 'loader' );
	loader.style.opacity = '0';
	setTimeout( () => loader.remove(), 700 );
	window.__ready = true;
	window.__app = { pt, bloom, n8, composer, renderFrames: ( n = 1 ) => {

		for ( let i = 0; i < n; i ++ ) tick();
		return renderer.domElement.toDataURL( 'image/png' );

	}, renderer, scene, camera, params, sky, skyObjs, mats, lights, orbit, goTo, VIEWS, togglePT };

}

main().catch( ( e ) => {

	console.error( e );
	$( 'load-step' ).textContent = 'Xatolik: ' + e.message + '. Brauzer WebGL2 ni qo\'llab-quvvatlashini tekshiring.';

} );
