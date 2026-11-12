import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Dunyoviy (metr) box-mapping UV — teksturalar cho'zilmasligi uchun.
export function worldUV( geom ) {

	const p = geom.attributes.position;
	const n = geom.attributes.normal;
	const uv = new Float32Array( p.count * 2 );
	for ( let i = 0; i < p.count; i ++ ) {

		const ax = Math.abs( n.getX( i ) ), ay = Math.abs( n.getY( i ) ), az = Math.abs( n.getZ( i ) );
		let u, v;
		if ( ax >= ay && ax >= az ) {

			u = p.getZ( i ); v = p.getY( i );

		} else if ( ay >= az ) {

			u = p.getX( i ); v = p.getZ( i );

		} else {

			u = p.getX( i ); v = p.getY( i );

		}

		uv[ i * 2 ] = u; uv[ i * 2 + 1 ] = v;

	}

	geom.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ) );
	return geom;

}

export function box( x0, x1, y0, y1, z0, z1 ) {

	const g = new THREE.BoxGeometry( Math.abs( x1 - x0 ), Math.abs( y1 - y0 ), Math.abs( z1 - z0 ) );
	g.translate( ( x0 + x1 ) / 2, ( y0 + y1 ) / 2, ( z0 + z1 ) / 2 );
	return g;

}

// Ikki nuqta orasida yo'naltirilgan to'rtburchak profil (tutqich, kabel va h.k.)
export function beam( a, b, w, h = w, round = false, seg = 8 ) {

	const dir = new THREE.Vector3().subVectors( b, a );
	const len = dir.length();
	const g = round ? new THREE.CylinderGeometry( w, w, len, seg, 1 ) : new THREE.BoxGeometry( w, len, h );
	const q = new THREE.Quaternion().setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), dir.normalize() );
	g.applyQuaternion( q );
	const mid = new THREE.Vector3().addVectors( a, b ).multiplyScalar( 0.5 );
	g.translate( mid.x, mid.y, mid.z );
	return g;

}

// Materiallar bo'yicha geometriyalarni yig'ib, bitta mesh qilib birlashtiradi (draw call kam).
export class Batch {

	constructor() {

		this.map = new Map();

	}

	add( material, geom, matrix ) {

		if ( matrix ) geom.applyMatrix4( matrix );
		if ( ! this.map.has( material ) ) this.map.set( material, [] );
		this.map.get( material ).push( geom );
		return geom;

	}

	build( { castShadow = true, receiveShadow = true, uv = true, name = '' } = {} ) {

		const group = new THREE.Group();
		group.name = name;
		for ( const [ mat, geoms ] of this.map ) {

			const prepared = geoms.map( ( g ) => {

				let gg = g.index ? g.toNonIndexed() : g;
				if ( uv ) worldUV( gg );
				for ( const k of Object.keys( gg.attributes ) ) if ( ! [ 'position', 'normal', 'uv' ].includes( k ) ) gg.deleteAttribute( k );
				if ( ! gg.attributes.uv ) worldUV( gg );
				return gg;

			} );
			const merged = mergeGeometries( prepared, false );
			const mesh = new THREE.Mesh( merged, mat );
			mesh.castShadow = castShadow;
			mesh.receiveShadow = receiveShadow;
			mesh.name = name + ':' + ( mat.name || mat.type );
			group.add( mesh );

		}

		return group;

	}

}
