import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const BASE = import.meta.env.BASE_URL;

function tex( path, { srgb = false, repeat = 1, aniso = 8 } = {} ) {

	const t = loader.load( BASE + path );
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set( repeat, repeat );
	t.anisotropy = aniso;
	if ( srgb ) t.colorSpace = THREE.SRGBColorSpace;
	return t;

}

export function createMaterials() {

	const m = {};

	// Sayqallangan keramogranit pol (80x80). UV = metr, tekstura 3.2 m ni qoplaydi.
	const fr = 1 / 3.2;
	m.floor = new THREE.MeshPhysicalMaterial( {
		map: tex( 'tex/floor_albedo.jpg', { srgb: true, repeat: fr, aniso: 16 } ),
		roughnessMap: tex( 'tex/floor_rough.jpg', { repeat: fr, aniso: 16 } ),
		normalMap: tex( 'tex/floor_normal.png', { repeat: fr, aniso: 16 } ),
		roughness: 1,
		metalness: 0,
		specularIntensity: 1,
		ior: 1.62,
	} );
	m.floor.normalScale.set( 0.6, 0.6 );

	m.floorPlain = m.floor.clone();

	m.wall = new THREE.MeshStandardMaterial( { color: 0xf3f3f1, roughness: 0.92, metalness: 0 } );
	m.ceiling = new THREE.MeshStandardMaterial( { color: 0xf7f7f5, roughness: 0.95, metalness: 0 } );
	m.plaster = m.wall;

	m.skirting = new THREE.MeshStandardMaterial( { color: 0x101012, roughness: 0.35, metalness: 0.0 } );

	// Qora alyumin profil (vitrina, eshik ramalari)
	m.alu = new THREE.MeshStandardMaterial( { color: 0x1c1d20, roughness: 0.42, metalness: 0.65 } );
	m.steel = new THREE.MeshStandardMaterial( { color: 0xc8c9cc, roughness: 0.22, metalness: 1.0 } );

	// Oyna: real-time uchun ikki qatlam — tonlash (normal blending) + aks (additive).
	m.glassTint = new THREE.MeshBasicMaterial( {
		color: 0x3f5550, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide,
	} );
	m.glassReflect = new THREE.MeshPhysicalMaterial( {
		color: 0x000000, roughness: 0.0, metalness: 0, ior: 1.52, specularIntensity: 1,
		transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
	} );
	// Path tracing uchun haqiqiy shisha
	m.glassPT = new THREE.MeshPhysicalMaterial( {
		color: 0xeef4f1, roughness: 0.0, metalness: 0, transmission: 1, ior: 1.52, thickness: 0.01,
		side: THREE.DoubleSide,
	} );

	// Zina: qora granit
	const gr = 1 / 0.9;
	m.granite = new THREE.MeshPhysicalMaterial( {
		map: tex( 'tex/granite_albedo.jpg', { srgb: true, repeat: gr } ),
		roughnessMap: tex( 'tex/granite_rough.jpg', { repeat: gr } ),
		roughness: 1, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.08,
	} );

	m.railing = new THREE.MeshStandardMaterial( { color: 0x121214, roughness: 0.5, metalness: 0.55 } );

	// Eshik: kulrang eman shpon
	const oak = 1 / 1.2;
	m.oak = new THREE.MeshStandardMaterial( {
		map: tex( 'tex/oak_diff.jpg', { srgb: true, repeat: oak } ),
		normalMap: tex( 'tex/oak_nor_gl.jpg', { repeat: oak } ),
		roughnessMap: tex( 'tex/oak_rough.jpg', { repeat: oak } ),
		color: 0xffffff,
		roughness: 1,
	} );
	m.oak.normalScale.set( 0.4, 0.4 );
	// Rasmdagi eshik — sovuq kulrang eman: teksturani qisman rangsizlantiramiz
	m.oak.onBeforeCompile = ( sh ) => {

		sh.fragmentShader = sh.fragmentShader.replace( '#include <map_fragment>', `#include <map_fragment>
			float g = dot( diffuseColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
			diffuseColor.rgb = mix( vec3( g ) * vec3( 0.97, 0.985, 1.0 ), diffuseColor.rgb, 0.18 ) * 1.12;` );

	};
	m.blackGlass = new THREE.MeshPhysicalMaterial( { color: 0x070708, roughness: 0.05, metalness: 0, clearcoat: 1 } );
	m.blackMetal = new THREE.MeshStandardMaterial( { color: 0x151517, roughness: 0.35, metalness: 0.8 } );
	m.groove = new THREE.MeshStandardMaterial( { color: 0x6f6f6c, roughness: 0.8 } );

	// Radiator — oq bo'yalgan alyumin
	m.radiator = new THREE.MeshPhysicalMaterial( { color: 0xf4f4f2, roughness: 0.32, metalness: 0, clearcoat: 0.3 } );
	m.chrome = new THREE.MeshStandardMaterial( { color: 0xdddddd, roughness: 0.12, metalness: 1 } );

	// Qandil: oltin rang metall + iliq LED
	m.gold = new THREE.MeshPhysicalMaterial( { color: 0xd6ad62, roughness: 0.22, metalness: 1, clearcoat: 0.4 } );
	m.ledWarm = new THREE.MeshStandardMaterial( { color: 0x000000, emissive: 0xffd7a6, emissiveIntensity: 1, roughness: 0.4 } );
	m.ledCool = new THREE.MeshStandardMaterial( { color: 0x000000, emissive: 0xf4f7ff, emissiveIntensity: 1, roughness: 0.4 } );
	m.panelFrame = new THREE.MeshStandardMaterial( { color: 0xeeeeee, roughness: 0.4, metalness: 0.2 } );

	m.socket = new THREE.MeshStandardMaterial( { color: 0xf8f8f8, roughness: 0.35 } );
	m.socketHole = new THREE.MeshStandardMaterial( { color: 0x9a9a9a, roughness: 0.6 } );

	m.paving = new THREE.MeshStandardMaterial( { color: 0x8d8c88, roughness: 0.85 } );

	return m;

}
