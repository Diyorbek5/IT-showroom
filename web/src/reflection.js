import * as THREE from 'three';

// Sayqallangan pol uchun planar aks (Reflector g'oyasi asosida),
// lekin MeshPhysicalMaterial ichiga ulanadi: aks PBR Fresnel orqali qo'shiladi,
// g'adir-budurlikka qarab mip-blur qilinadi.
export class FloorReflection {

	constructor( floorMesh, { resolution = 0.5 } = {} ) {

		this.mesh = floorMesh;
		this.resolution = resolution;
		this.enabled = true;
		this.rt = new THREE.WebGLRenderTarget( 2, 2, {
			type: THREE.HalfFloatType,
			generateMipmaps: true,
			minFilter: THREE.LinearMipmapLinearFilter,
			magFilter: THREE.LinearFilter,
			samples: 0,
		} );
		this.textureMatrix = new THREE.Matrix4();
		this.virtualCamera = new THREE.PerspectiveCamera();
		this.uniforms = {
			tReflect: { value: this.rt.texture },
			reflMatrix: { value: this.textureMatrix },
			reflStrength: { value: 1 },
			reflLodScale: { value: 7.0 },
		};

		const mat = floorMesh.material;
		mat.onBeforeCompile = ( shader ) => {

			Object.assign( shader.uniforms, this.uniforms );
			shader.vertexShader = shader.vertexShader
				.replace( '#include <common>', '#include <common>\nuniform mat4 reflMatrix;\nvarying vec4 vReflUv;' )
				.replace( '#include <project_vertex>', '#include <project_vertex>\nvReflUv = reflMatrix * modelMatrix * vec4( transformed, 1.0 );' );
			shader.fragmentShader = shader.fragmentShader
				.replace( '#include <common>', '#include <common>\nuniform sampler2D tReflect;\nuniform float reflStrength;\nuniform float reflLodScale;\nvarying vec4 vReflUv;' )
				.replace( '#include <lights_fragment_maps>', `#include <lights_fragment_maps>
				{
					vec2 ruv = vReflUv.xy / vReflUv.w;
					ruv += ( normal.xy - geometryNormal.xy ) * 0.06;
					float lod = clamp( material.roughness * reflLodScale + 0.4, 0.0, 8.0 );
					vec3 refl = textureLod( tReflect, ruv, lod ).rgb;
					// yon chekkalarda (ekran tashqarisida) env xaritaga qaytamiz
					vec2 e = smoothstep( vec2( 0.0 ), vec2( 0.03 ), ruv ) * smoothstep( vec2( 1.0 ), vec2( 0.97 ), ruv );
					float k = e.x * e.y * reflStrength;
					radiance = mix( radiance, refl, k );
				}` );

		};

		mat.customProgramCacheKey = () => 'floor-reflection';

	}

	setSize( w, h ) {

		this.rt.setSize( Math.max( 2, Math.floor( w * this.resolution ) ), Math.max( 2, Math.floor( h * this.resolution ) ) );

	}

	update( renderer, scene, camera ) {

		if ( ! this.enabled ) return;
		const vc = this.virtualCamera;
		const normal = new THREE.Vector3( 0, 1, 0 );
		const pos = new THREE.Vector3( 0, 0, 0 );
		const camPos = new THREE.Vector3().setFromMatrixPosition( camera.matrixWorld );
		if ( camPos.y <= 0.001 ) return;

		const view = pos.clone().sub( camPos );
		view.reflect( normal ).negate().add( pos );
		const rot = new THREE.Matrix4().extractRotation( camera.matrixWorld );
		const look = new THREE.Vector3( 0, 0, - 1 ).applyMatrix4( rot ).add( camPos );
		const target = pos.clone().sub( look ).reflect( normal ).negate().add( pos );

		vc.position.copy( view );
		vc.up.set( 0, 1, 0 ).applyMatrix4( rot ).reflect( normal );
		vc.lookAt( target );
		vc.far = camera.far;
		vc.near = camera.near;
		vc.updateMatrixWorld();
		vc.projectionMatrix.copy( camera.projectionMatrix );

		this.textureMatrix.set( 0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1 );
		this.textureMatrix.multiply( vc.projectionMatrix ).multiply( vc.matrixWorldInverse );

		// Oblique near plane — pol ostidagi narsalar kesiladi
		const plane = new THREE.Plane().setFromNormalAndCoplanarPoint( normal, pos ).applyMatrix4( vc.matrixWorldInverse );
		const clip = new THREE.Vector4( plane.normal.x, plane.normal.y, plane.normal.z, plane.constant );
		const pm = vc.projectionMatrix;
		const q = new THREE.Vector4(
			( Math.sign( clip.x ) + pm.elements[ 8 ] ) / pm.elements[ 0 ],
			( Math.sign( clip.y ) + pm.elements[ 9 ] ) / pm.elements[ 5 ],
			- 1.0,
			( 1.0 + pm.elements[ 10 ] ) / pm.elements[ 14 ]
		);
		clip.multiplyScalar( 2.0 / clip.dot( q ) );
		pm.elements[ 2 ] = clip.x;
		pm.elements[ 6 ] = clip.y;
		pm.elements[ 10 ] = clip.z + 1.0 - 0.003;
		pm.elements[ 14 ] = clip.w;
		vc.projectionMatrixInverse.copy( pm ).invert();

		const prevTarget = renderer.getRenderTarget();
		const prevXr = renderer.xr.enabled;
		const prevShadow = renderer.shadowMap.autoUpdate;
		renderer.xr.enabled = false;
		renderer.shadowMap.autoUpdate = false;
		this.mesh.visible = false;
		renderer.setRenderTarget( this.rt );
		renderer.clear();
		renderer.render( scene, vc );
		this.mesh.visible = true;
		renderer.setRenderTarget( prevTarget );
		renderer.xr.enabled = prevXr;
		renderer.shadowMap.autoUpdate = prevShadow;

	}

}
