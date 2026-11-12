import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';

import { H } from './plan.js';
import { Y2, H2, OUTLINE2, COLS2, PARTITIONS2 } from './plan2.js';
import { createMaterials, createMaterials2, setEnvMap } from './materials.js';
import { buildFloor2 } from './floor2.js';
import { buildShell } from './building.js';
import { buildStair } from './stair.js';
import { buildFixtures, applyLightLevels } from './fixtures.js';
import { FloorReflection } from './reflection.js';
import { loadSky, loadBackground, setupSky, createProbeGrid, bakeGIProgressive, captureRoomEnv } from './lighting.js';
import { WalkControls } from './walk.js';

const BASE = import.meta.env.BASE_URL;
const qs = new URLSearchParams( location.search );
// Telefon/planshetlarda avtomatik yengil rejim (?q=high bilan majburan yuqori sifat)
const LOW = qs.get( 'q' ) === 'low' || ( qs.get( 'q' ) !== 'high' && matchMedia( '(pointer: coarse)' ).matches );
// Telefon (yengil) rejimi: post-effektlarsiz, pol aksisiz, GI bake'siz (cubemap yoritish), past o'lcham
const LITE = LOW;
const SHOT = qs.has( 'shot' );

// Barcha yorqinliklar HDRI osmonining o'rtacha yorqinligiga nisbatan (osmon = 1)
const params = {
	hdriRotation: 200,
	sunElevation: 30,
	sunScale: 0.5,
	skyIntensity: 1,
	exposure: 0.68,
	exposure2: 1.15, // 2-qavat: qora shift, kamroq qaytgan yorug'lik — fotograflar kabi ekspozitsiya oshiriladi
	panel: 0.9,
	chandelier: 0.25,
	chandelierEmissive: 7,
	panelEmissive: 4,
	lightsOn: true,
	aoIntensity: 2.2,
};

const VIEWS = [
	{ floor: 1, id: 'kirish', name: 'Kirish', pos: [ 0.75, 1.55, 7.6 ], target: [ 6.2, 1.55, 2.4 ] },
	{ floor: 1, id: 'vitrina', name: 'Vitrina', pos: [ 6.15, 1.5, 6.6 ], target: [ 0, 1.55, 2.6 ] },
	{ floor: 1, id: 'zina', name: 'Zina', pos: [ 4.7, 1.3, 4.7 ], target: [ 3.3, 2.3, 8.7 ] },
	{ floor: 1, id: 'burchak', name: 'Burchak', pos: [ 6.4, 1.6, 0.7 ], target: [ 1.0, 1.4, 6.8 ] },
	{ floor: 1, id: 'tepadan', name: 'Tepadan', pos: [ 1.2, 12.5, 11.0 ], target: [ 3.65, 0, 4.4 ] },
	{ floor: 2, id: 'zal', name: 'Zal', pos: [ 13.8, 3.9 + 1.6, 7.9 ], target: [ 2.0, 3.9 + 1.2, 3.0 ] },
	{ floor: 2, id: 'qanot', name: 'Qanot', pos: [ 19.6, 3.9 + 1.6, 11.1 ], target: [ 19.4, 3.9 + 1.45, 0.5 ] },
	{ floor: 2, id: 'ustunlar', name: 'Ustunlar', pos: [ 22.4, 3.9 + 1.65, 1.3 ], target: [ 12.0, 3.9 + 1.0, 7.5 ] },
	{ floor: 2, id: 'ofis', name: 'Ofis xona', pos: [ 17.4, 3.9 + 1.55, 12.1 ], target: [ 17.4, 3.9 + 1.4, 17.0 ] },
	{ floor: 2, id: 'zina2', name: 'Zina', pos: [ 8.3, 3.9 + 1.55, 2.1 ], target: [ 0.4, 3.9 + 1.2, 5.9 ] },
	{ floor: 2, id: 'tepadan2', name: 'Tepadan', pos: [ 5.5, 3.9 + 15.5, 22.5 ], target: [ 11.7, 3.9, 8.0 ] },
];

const FLOOR_INFO = {
	1: '7.30 × 8.75 m · shift 3.60 m · ~62 m²',
	2: '23.35 × 17.01 m · shift 4.00 m · ~200 m²',
};

const $ = ( id ) => document.getElementById( id );
const setLoad = ( p, text ) => {

	$( 'load-bar' ).style.width = Math.round( p * 100 ) + '%';
	$( 'load-step' ).textContent = text;

};

const frame = () => new Promise( ( r ) => requestAnimationFrame( () => r() ) );

async function main() {

	// ---------- Renderer ----------
	const renderer = new THREE.WebGLRenderer( { antialias: LITE, powerPreference: 'high-performance', preserveDrawingBuffer: qs.has( 'shot' ) } );
	const dpr = LITE ? Math.min( window.devicePixelRatio, 1.0 ) : Math.min( window.devicePixelRatio, 1.5 );
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
	const lights = fixtures.userData.lights;
	const m2 = createMaterials2( mats );
	const floor2 = buildFloor2( mats, m2 );
	lights.floor2 = floor2.userData.lights;
	applyLightLevels( lights, mats, params );
	scene.add( shell, stair, fixtures, floor2, floor2.userData.mass );
	const ceilingGroup = shell.userData.ceiling;
	const floor = shell.userData.floor;

	// Shiftga tegishli ob'ektlar (tepadan ko'rinishda yashiriladi)
	const overhead = [ ceilingGroup, ...fixtures.children.filter( ( o ) => /chandelier|panel/.test( o.name ) ), ...stair.children.filter( ( o ) => false ) ];

	const reflection = new FloorReflection( floor, { resolution: 0.35 } );

	// ---------- Osmon / quyosh ----------
	setLoad( 0.25, 'Ko\'cha manzarasi yuklanmoqda…' );
	console.log( 'model built' );
	const [ sky, bgTex ] = await Promise.all( [ loadSky( BASE + 'hdri/park_parking_1k.hdr' ), loadBackground( BASE + 'hdri/park_parking_bg.jpg' ) ] );
	sky.bg = bgTex;
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

	// GI va akslarni hisoblashda to'liq HDR osmon ishlatiladi (JPEG fonda quyosh atrofi kesilgan)
	const bgIntensity = scene.backgroundIntensity;
	function hdrBackground( on ) {

		if ( scene.background && scene.background.isColor ) return;
		scene.background = on ? sky.texture : sky.bg;
		scene.backgroundIntensity = on ? params.skyIntensity : bgIntensity;

	}

	// ---------- GI bake (bosqichma-bosqich, sahifa qotmaydi) ----------
	setLoad( 0.4, 'Yorug\'lik hisoblanmoqda…' );
	await frame();
	renderer.shadowMap.needsUpdate = true;
	const grids = LITE ? [] : createProbeGrid();
	if ( LITE ) liteMaterials();
	const t0 = performance.now();
	if ( LOW ) skyObjs.sun.shadow.mapSize.set( 2048, 2048 );
	const bakeOpts = {
		bounces: LOW ? 1 : 2, cubemapSize: LOW ? 8 : 16, chunk: LOW ? 8 : 24,
		// Panel chiroqlari (RectAreaLight) faqat GI hisoblanayotganda yoqiladi: ularning yorug'ligi
		// probe'larga "pishiriladi", real vaqtda esa og'ir hisob qilinmaydi.
		before: () => {

			reflection.uniforms.reflStrength.value = 0;
			hdrBackground( true );
			params.areaLights = true;
			applyLightLevels( lights, mats, params );

		},
		after: () => {

			reflection.uniforms.reflStrength.value = 1;
			hdrBackground( false );
			params.areaLights = false;
			applyLightLevels( lights, mats, params );

		},
	};
	if ( ! LITE ) await bakeGIProgressive( renderer, scene, grids, { ...bakeOpts, onProgress: ( f ) => setLoad( 0.4 + f * 0.45, `Yorug'lik hisoblanmoqda… ${Math.round( f * 100 )}%` ) } );
	console.log( 'bake done', Math.round( performance.now() - t0 ) );
	setLoad( 0.88, 'Akslar tayyorlanmoqda…' );
	await frame();
	reflection.uniforms.reflStrength.value = 0;
	hdrBackground( true );
	const envSize = LITE ? 64 : 128;
	const p1 = new THREE.Vector3( 3.6, 1.5, 5.0 ), p2 = new THREE.Vector3( 11.0, Y2 + 1.7, 3.2 );
	if ( LITE ) {

		// GI o'rniga: xona cubemap'i 2 marta (ikkinchisi birinchisining yorug'ligi bilan) — devorlardan qaytgan yorug'lik
		params.areaLights = true;
		applyLightLevels( lights, mats, params );
		for ( let it = 0; it < 2; it ++ ) {

			const e1 = captureRoomEnv( renderer, scene, p1, envSize, true );
			const e2 = captureRoomEnv( renderer, scene, p2, envSize, true );
			scene.environment = e1;
			setEnvMap( m2, e2 );

		}

		params.areaLights = false;
		applyLightLevels( lights, mats, params );

	} else {

		scene.environment = captureRoomEnv( renderer, scene, p1, envSize );
		setEnvMap( m2, captureRoomEnv( renderer, scene, p2, envSize ) );

	}

	scene.environmentRotation.set( 0, 0, 0 );
	hdrBackground( false );
	if ( LITE ) {

		// Cubemap yoritishidagi yashil tusni (daraxtlar) neytral yumshoq to'ldiruvchi bilan muvozanatlash
		scene.environmentIntensity = 0.7;
		for ( const m of Object.values( m2 ) ) if ( m.isMeshStandardMaterial ) m.envMapIntensity = 0.7;
		scene.add( new THREE.HemisphereLight( 0xfdfcf8, 0xb9b2a6, 0.55 ) );
		params.exposure2 = 1.4;

	}

	reflection.uniforms.reflStrength.value = 1;
	console.log( 'GI bake ms', Math.round( performance.now() - t0 ) );

	// Chiroqlar almashtirilganda GI fonda qayta hisoblanadi
	let rebaking = false;
	async function rebakeGI() {

		if ( rebaking || LITE ) return;
		rebaking = true;
		await bakeGIProgressive( renderer, scene, grids, { ...bakeOpts, onProgress: () => invalidate() } );
		rebaking = false;
		invalidate();

	}

	// ---------- Post-processing ----------
	let composer = null, n8 = null, bloom = null;
	if ( ! LITE ) {

		composer = new EffectComposer( renderer, new THREE.WebGLRenderTarget( innerWidth * dpr, innerHeight * dpr, { type: THREE.HalfFloatType } ) );
		n8 = new N8AOPass( scene, camera, innerWidth * dpr, innerHeight * dpr );
		n8.configuration.aoRadius = 0.9;
		n8.configuration.distanceFalloff = 0.6;
		n8.configuration.intensity = params.aoIntensity;
		n8.configuration.halfRes = false; // n8ao halfRes MRT three r187 bilan mos emas
		n8.configuration.depthAwareUpsampling = true;
		n8.configuration.gammaCorrection = false;
		n8.configuration.transparencyAware = false;
		n8.setQualityMode( 'Medium' );
		composer.addPass( n8 );
		bloom = new UnrealBloomPass( new THREE.Vector2( innerWidth, innerHeight ), 0.12, 0.3, 5 );
		composer.addPass( bloom );
		composer.addPass( new OutputPass() );
		composer.addPass( new SMAAPass() );

	}

	// Telefon rejimi: yengil materiallar (clearcoat yo'q, oyna aksi qatlami yo'q, pol aksi yo'q)
	function liteMaterials() {

		for ( const set of [ mats, m2 ] ) for ( const m of Object.values( set ) ) {

			if ( m.isMeshPhysicalMaterial && m.clearcoat > 0 ) {

				m.clearcoat = 0; m.needsUpdate = true;

			}

		}

		scene.traverse( ( o ) => {

			if ( o.userData.isGlassReflect ) o.visible = false;

		} );
		reflection.enabled = false;
		reflection.uniforms.reflStrength.value = 0;

	}


	// ---------- Boshqaruv ----------
	const orbit = new OrbitControls( camera, renderer.domElement );
	orbit.enableDamping = true;
	orbit.dampingFactor = 0.08;
	orbit.rotateSpeed = 0.55;
	orbit.maxDistance = 45;
	orbit.minDistance = 0.3;
	orbit.maxPolarAngle = Math.PI * 0.92;

	const walk = new WalkControls( camera, renderer.domElement );

	let anim = null;
	function goTo( v, instant = false ) {

		const from = { p: camera.position.clone(), t: orbit.target.clone() };
		const to = { p: new THREE.Vector3( ...v.pos ), t: new THREE.Vector3( ...v.target ) };
		if ( instant ) {

			anim = null;
			camera.position.copy( to.p ); orbit.target.copy( to.t ); orbit.update();
			return;

		}

		anim = { from, to, t: 0 };
		document.querySelectorAll( '#views button' ).forEach( ( b ) => b.setAttribute( 'aria-pressed', b.dataset.id === v.id ? 'true' : 'false' ) );

	}

	const vbox = $( 'views' );
	let activeFloor = 1;
	function renderViews() {

		vbox.replaceChildren();
		for ( const v of VIEWS.filter( ( q ) => q.floor === activeFloor ) ) {

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

	}

	const WALK_CFG = {
		1: walk.cfg,
		2: {
			poly: OUTLINE2, eye: Y2 + 1.62, start: [ 12, 5.5 ],
			blockers: [
				...COLS2.map( ( c ) => [ c.x0, c.x1, c.z0, c.z1 ] ),
				...PARTITIONS2.slice( 0, 1 ).map( ( c ) => [ c.x0, c.x1, c.z0, c.z1 ] ),
				[ 16.0, 23.35, 11.6, 17.01 ],
				[ 2.55, 4.95, 7.45, 8.75 ],
				[ 0, 2.0, 5.6, 8.75 ],
				[ 0, 1.4, 1.78, 3.8 ],
			],
		},
	};

	function setFloor( f, view ) {

		activeFloor = f;
		walk.cfg = WALK_CFG[ f ];
		document.querySelectorAll( '#floors button' ).forEach( ( b ) => b.setAttribute( 'aria-pressed', String( + b.dataset.floor === f ) ) );
		$( 'floor-dims' ).textContent = FLOOR_INFO[ f ];
		renderViews();
		const v = view || VIEWS.find( ( q ) => q.floor === f );
		if ( v ) {

			goTo( v );
			vbox.querySelector( `[data-id="${v.id}"]` )?.setAttribute( 'aria-pressed', 'true' );

		}

	}

	document.querySelectorAll( '#floors button' ).forEach( ( b ) => {

		b.onclick = () => {

			if ( walk.active ) walk.exit();
			setFloor( + b.dataset.floor );

		};

	} );

	const start = VIEWS.find( ( v ) => '#' + v.id === location.hash ) || ( qs.get( 'view' ) && VIEWS.find( ( v ) => v.id === qs.get( 'view' ) ) ) || VIEWS[ 0 ];
	activeFloor = start.floor;
	walk.cfg = WALK_CFG[ start.floor ];
	$( 'floor-dims' ).textContent = FLOOR_INFO[ start.floor ];
	document.querySelectorAll( '#floors button' ).forEach( ( b ) => b.setAttribute( 'aria-pressed', String( + b.dataset.floor === start.floor ) ) );
	renderViews();
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
		invalidate();
		if ( ! pt.active ) rebakeGI();

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
				params.areaLights = true;
				applyLightLevels( lights, mats, params );
				pt.ctx = await enterPathTracing( { renderer, scene, camera, mats, sky, skyObjs, grids, params, existing: pt.tracer } );

			} catch ( e ) {

				console.error( e );
				params.areaLights = false;
				applyLightLevels( lights, mats, params );
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
			params.areaLights = false;
			applyLightLevels( lights, mats, params );
			invalidate();
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

	// ---------- O'lcham va moslashuvchan sifat ----------
	// scale — ekran o'lchamiga nisbatan render o'lchami. Sekin qurilmada avtomatik kamayadi.
	let scale = 1;
	function resize() {

		const w = innerWidth, h = innerHeight;
		const pr = dpr * scale;
		camera.aspect = w / h;
		camera.fov = w < h ? 80 : 62; // telefon (vertikal ekran) — kengroq ko'rinish
		camera.updateProjectionMatrix();
		renderer.setPixelRatio( pr );
		renderer.setSize( w, h );
		if ( composer ) {

			composer.setPixelRatio( pr );
			composer.setSize( w, h );
			n8.setSize( w * pr, h * pr );
			reflection.setSize( w * pr, h * pr );

		}
		pt.active && pt.tracer.updateCamera();
		invalidate();

	}

	// Faqat o'zgarish bo'lganda chizamiz (kamera, animatsiya, chiroq...). Tinch turganda GPU dam oladi.
	let dirty = 3;
	function invalidate( n = 2 ) {

		dirty = Math.max( dirty, n );

	}

	orbit.addEventListener( 'change', () => invalidate() );
	walk.plc.addEventListener( 'change', () => invalidate() );

	addEventListener( 'resize', resize );
	resize();

	// ---------- Tepadan (maket) ko'rinishi uchun ---------
	const outsideBg = new THREE.Color( 0x24262a );
	const hemi = new THREE.HemisphereLight( 0xffffff, 0x5a5c60, 1.6 );
	hemi.visible = false;
	scene.add( hemi );
	const mapGround = new THREE.Mesh( new THREE.CircleGeometry( 26, 72 ).rotateX( - Math.PI / 2 ), new THREE.MeshStandardMaterial( { color: 0x3a3c41, roughness: 1 } ) );
	mapGround.position.set( 11.7, - 0.02, 8.5 );
	mapGround.receiveShadow = true;
	mapGround.visible = false;
	scene.add( mapGround );

	// Kadr vaqtiga qarab render o'lchamini sozlash (uzluksiz harakat paytida)
	const perf = { last: 0, acc: 0, n: 0, cool: 0 };
	function adapt() {

		const now = performance.now();
		if ( perf.last ) {

			perf.acc += now - perf.last; perf.n ++;

		}

		perf.last = now;
		if ( perf.n < 20 || now < perf.cool || SHOT ) return;
		const avg = perf.acc / perf.n;
		perf.acc = 0; perf.n = 0;
		let ns = scale;
		if ( avg > 26 && scale > 0.5 ) ns = Math.max( 0.5, scale * 0.8 );
		else if ( avg < 15 && scale < 1 ) ns = Math.min( 1, scale * 1.15 );
		if ( ns !== scale ) {

			scale = ns;
			perf.cool = now + 1500;
			resize();

		}

	}

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

		if ( anim ) invalidate();
		if ( walk.active ) {

			if ( walk.update( dt ) ) invalidate();

		} else if ( orbit.update() ) invalidate();

		// Kamera qaysi qavat ichida? Tashqarida (tepadan) bo'lsa — kesim (maket) ko'rinishi
		const cp = camera.position;
		const in1 = cp.y < H && cp.x > - 0.2 && cp.x < 7.4 && cp.z > - 0.2 && cp.z < 8.9;
		const in2 = cp.y > Y2 && cp.y < Y2 + H2 && cp.x > - 0.2 && cp.x < 23.5 && cp.z > - 0.2 && ( cp.z < 8.9 || ( cp.x > 15.8 && cp.z < 17.2 ) );
		const outside = ! in1 && ! in2;
		const cut1 = outside && activeFloor === 1;
		for ( const o of overhead ) o.visible = ! cut1;
		floor2.visible = ! cut1;
		floor2.userData.ceiling.visible = ! outside;
		skyObjs.ground.visible = ! outside && cp.y < H + 0.1;
		skyObjs.ground2.visible = ! outside && cp.y >= H + 0.1;
		mapGround.visible = outside;
		hemi.visible = outside;
		scene.background = outside ? outsideBg : sky.bg;
		reflection.enabled = ! LITE && cp.y < H;
		if ( !! params.floor2Live !== ( in2 && ! LITE ) ) {

			params.floor2Live = in2 && ! LITE;
			applyLightLevels( lights, mats, params );

		}
		const expT = ( cp.y > Y2 - 0.2 && ! cut1 ) ? params.exposure2 : params.exposure;
		const de = expT - renderer.toneMappingExposure;
		if ( Math.abs( de ) > 0.002 ) {

			renderer.toneMappingExposure += de * ( SHOT ? 1 : Math.min( 1, dt * 4 ) );
			invalidate();

		}

		if ( pt.active ) {

			camera.updateMatrixWorld();
			if ( ! lastCam.equals( camera.matrixWorld ) ) {

				pt.tracer.updateCamera();
				lastCam.copy( camera.matrixWorld );

			}

			pt.tracer.renderSample();
			status( `Foto sifat · ${Math.floor( pt.tracer.samples )} namuna` );

		} else if ( dirty > 0 || SHOT ) {

			dirty --;
			if ( reflection.enabled ) {

				const f2 = floor2.visible;
				floor2.visible = false;
				reflection.update( renderer, scene, camera );
				floor2.visible = f2;

			}
			if ( composer ) composer.render( dt );
			else renderer.render( scene, camera );
			adapt();

		} else {

			perf.last = 0;

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
	window.__app = { invalidate, pt, bloom, n8, composer, renderFrames: ( n = 1 ) => {

		for ( let i = 0; i < n; i ++ ) tick();
		return renderer.domElement.toDataURL( 'image/png' );

	}, renderer, scene, camera, params, sky, skyObjs, mats, lights, orbit, goTo, VIEWS, togglePT, setFloor, floor2, m2 };

}

main().catch( ( e ) => {

	console.error( e );
	$( 'load-step' ).textContent = 'Xatolik: ' + e.message + '. Brauzer WebGL2 ni qo\'llab-quvvatlashini tekshiring.';

} );
