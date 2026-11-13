import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ROOM, COLUMNS, STAIR, WC } from './plan.js';

const R = 0.28; // odam radiusi
const EYE = 1.62;

// Xona ichida yurish (WASD + sichqoncha). To'qnashuv: xona konturi + ustunlar + zina.
export const WALK_EYE = EYE;

export class WalkControls {

	constructor( camera, dom ) {

		this.camera = camera;
		this.plc = new PointerLockControls( camera, dom );
		this.keys = {};
		this.active = false;
		this.vel = new THREE.Vector3();
		this.cfg = {
			poly: ROOM, eye: EYE, start: [ 2.2, 6.2 ],
			blockers: [
				...COLUMNS.map( ( c ) => [ c.x0, c.x1, c.z0, c.z1 ] ),
				[ STAIR.x0 - 0.05, STAIR.xE, STAIR.zTop - 0.15, 8.75 ],
				[ WC.x0, WC.x1, WC.z0, WC.z1 ],
			],
		};
		const down = ( e ) => {

			this.keys[ e.code ] = true;

		};

		const up = ( e ) => {

			this.keys[ e.code ] = false;

		};

		window.addEventListener( 'keydown', down );
		window.addEventListener( 'keyup', up );
		this.plc.addEventListener( 'unlock', () => {

			this.active = false;
			this.onExit && this.onExit();

		} );

	}

	enter() {

		const p = this.camera.position;
		if ( ! this.free( p.x, p.z ) ) p.set( this.cfg.start[ 0 ], this.cfg.eye, this.cfg.start[ 1 ] );
		p.y = this.cfg.eye;
		this.active = true;
		this.plc.lock();

	}

	exit() {

		this.plc.unlock();

	}

	free( x, z ) {

		if ( ! insidePoly( x, z, this.cfg.poly, R ) ) return false;
		for ( const [ x0, x1, z0, z1 ] of this.cfg.blockers ) {

			if ( x > x0 - R && x < x1 + R && z > z0 - R && z < z1 + R ) return false;

		}

		return true;

	}

	update( dt ) {

		if ( ! this.active ) return false;
		const k = this.keys;
		const f = ( k.KeyW || k.ArrowUp ? 1 : 0 ) - ( k.KeyS || k.ArrowDown ? 1 : 0 );
		const s = ( k.KeyD || k.ArrowRight ? 1 : 0 ) - ( k.KeyA || k.ArrowLeft ? 1 : 0 );
		const speed = k.ShiftLeft ? 2.6 : 1.4;
		const fwd = new THREE.Vector3();
		this.camera.getWorldDirection( fwd );
		fwd.y = 0; fwd.normalize();
		const right = new THREE.Vector3( - fwd.z, 0, fwd.x );
		const want = fwd.multiplyScalar( f ).add( right.multiplyScalar( s ) );
		if ( want.lengthSq() > 0 ) want.normalize().multiplyScalar( speed );
		this.vel.lerp( want, Math.min( 1, dt * 10 ) );
		if ( this.vel.lengthSq() < 1e-6 ) return false;
		const p = this.camera.position;
		const nx = p.x + this.vel.x * dt, nz = p.z + this.vel.z * dt;
		if ( this.free( nx, nz ) ) {

			p.x = nx; p.z = nz;

		} else if ( this.free( nx, p.z ) ) {

			p.x = nx;

		} else if ( this.free( p.x, nz ) ) {

			p.z = nz;

		}

		p.y = this.cfg.eye;
		return true;

	}

}

function insidePoly( x, z, poly, margin ) {

	let inside = false;
	for ( let i = 0, j = poly.length - 1; i < poly.length; j = i ++ ) {

		const [ xi, zi ] = poly[ i ], [ xj, zj ] = poly[ j ];
		if ( ( zi > z ) !== ( zj > z ) && x < ( xj - xi ) * ( z - zi ) / ( zj - zi ) + xi ) inside = ! inside;

	}

	if ( ! inside ) return false;
	// chegaradan masofa
	for ( let i = 0, j = poly.length - 1; i < poly.length; j = i ++ ) {

		const [ ax, az ] = poly[ j ], [ bx, bz ] = poly[ i ];
		const dx = bx - ax, dz = bz - az;
		const t = Math.max( 0, Math.min( 1, ( ( x - ax ) * dx + ( z - az ) * dz ) / ( dx * dx + dz * dz ) ) );
		const px = ax + t * dx - x, pz = az + t * dz - z;
		if ( px * px + pz * pz < margin * margin ) return false;

	}

	return true;

}
