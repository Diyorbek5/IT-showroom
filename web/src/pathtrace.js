import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';

// "Foto sifat" rejimi: GPU path tracing — haqiqiy global yoritish, akslar, shisha o'tkazuvchanligi.
export async function enterPathTracing( { renderer, scene, camera, mats, sky, skyObjs, grids, params, existing } ) {

	const saved = {
		env: scene.environment,
		envRot: scene.environmentRotation.clone(),
		bg: scene.background,
		envInt: scene.environmentIntensity,
		toneExp: renderer.toneMappingExposure,
		hidden: [],
		glassMats: [],
	};

	// Real-time uchun ishlatilgan "hiyla"larni olib tashlaymiz
	const hide = ( o ) => {

		if ( o.visible ) {

			o.visible = false; saved.hidden.push( o );

		}

	};

	hide( skyObjs.ground );
	grids.forEach( ( g ) => scene.remove( g ) );
	scene.traverse( ( o ) => {

		if ( o.userData.isGlassReflect ) hide( o );
		if ( o.userData.isGlass ) {

			saved.glassMats.push( [ o, o.material ] );
			o.material = mats.glassPT;

		}

	} );

	scene.environment = sky.texture;
	scene.background = sky.texture;
	scene.environmentRotation.copy( scene.backgroundRotation );
	scene.environmentIntensity = params.skyIntensity;

	const tracer = existing || new WebGLPathTracer( renderer );
	tracer.bounces = 7;
	tracer.transmissiveBounces = 6;
	tracer.filterGlossyFactor = 0.4;
	tracer.minSamples = 2;
	tracer.renderDelay = 0;
	tracer.fadeDuration = 300;
	tracer.tiles.set( 2, 2 );
	tracer.renderScale = Math.min( 1, 1.5 / renderer.getPixelRatio() );
	tracer.multipleImportanceSampling = true;
	tracer.rasterizeScene = true;
	tracer.setScene( scene, camera );

	return {
		tracer,
		exit() {

			for ( const o of saved.hidden ) o.visible = true;
			for ( const [ o, m ] of saved.glassMats ) o.material = m;
			grids.forEach( ( g ) => scene.add( g ) );
			scene.environment = saved.env;
			scene.environmentRotation.copy( saved.envRot );
			scene.background = saved.bg;
			scene.environmentIntensity = saved.envInt;
			renderer.toneMappingExposure = saved.toneExp;

		},
	};

}
