/* inspired by OrbitAndControls 
    2014,2020
    
    usage: 
        var controls = new THREE.OrbitAndPanControls(camera, domElement, scene);
        controls.addEventListener( 'change', render );

    features:    
        - control camera and world with mouse or touch
        - left mouse button = rotate horizontal / vertical
        - right mouse button = pan
        - scroll wheel = dolly in/out
        - touch one finger = rotate horizontal / vertical
        - touch two finger = smart multi control
            - pan
            - dolly
            - rotate horizontal 
        - dolly is targeting touch/click direction (not center)
*/

THREE.Utils = {
    cameraLookAt: function(camera, d) {
        var v = new THREE.Vector3( 0, 0, -1 );
        v.applyQuaternion( camera.quaternion );
        v.setLength(d);
        v.add(camera.position);
        return v;
    }
};

THREE.OrbitAndPanControls = function ( object, domElement) {

    function printPosition(txt, pos) {
        if (!pos) console.log(txt);
        else console.log(txt + ' x' + pos.x.toString() + ' y ' + pos.y.toString() + ' z' + pos.z.toString());
    }

	var camera = object;
    var element = document.body;
    if ( domElement && domElement != document) element = domElement;
    
    // API 
    this.targetDistance = camera.position.length();
    
	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	////////////
	// internals
	var scope = this;

	var lastPosition = new THREE.Vector3();

	var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_MULTI : 4, DEVICE_ORIENTATION : 5 };
	var state = STATE.NONE;

    var mouseXY = new THREE.Vector2();  // mouse "previous" position
    var touchXY0 = new THREE.Vector2(); // two finger touch - start xy0
    var touchXY1 = new THREE.Vector2(); // two finger touch - start xy1
    var touchXY = new THREE.Vector2(); // two finger touch - start- middle point
    
    var touchAlpha, touchBeta, touchGamma;
    var orientation = false;
    
    var cameraposition = null; 
    var lookatposition = null;
    var controlposition = null;

    lookatposition = THREE.Utils.cameraLookAt(camera,10);
    
    // raycaster
    var raycaster = new THREE.Raycaster();
    raycaster.near = 5.0;
    raycaster.far = 250.0;

	var changeEvent = { type: 'change' };

    this.update = function() {

        if ( lastPosition.distanceTo( camera.position ) > 0 ) {
			this.dispatchEvent( changeEvent );
			lastPosition.copy( camera.position );
        }
    };

    function getPoint( XY , camera ) {
        var x = ( XY.x / element.clientWidth ) * 2 - 1;
        var y = - ( XY.y / element.clientHeight ) * 2 + 1;
        var vector = new THREE.Vector3( x, y, 0.5 );
        vector.unproject( camera );
        vector.sub(camera.position);
        vector.setLength(scope.targetDistance);
        vector.add(camera.position);
        return vector;
    }                

    this.panVector = function (endXY, startXY) {
        // from screen pan (x,y) calculate world pan (vector3)
        var deltaXY = new THREE.Vector2().subVectors(endXY, startXY);
                
        var v = new THREE.Vector3(); // world pan for distance x,y
        var vFOV = camera.fov * Math.PI / 180;        // convert vertical fov to radians
        var pxSize = 2 * Math.tan( vFOV / 2 ) * scope.targetDistance / element.clientHeight; // pxsize at offset distance

		var te = camera.matrix.elements;
		
		var xOffset = new THREE.Vector3( te[0], te[1], te[2] ).setLength( - pxSize * deltaXY.x );
		var yOffset = new THREE.Vector3( te[4], te[5], te[6] ).setLength( pxSize * deltaXY.y );

        v.add(xOffset);
        v.add(yOffset);
		return v;
	};
    this.rotateTo = function (deltaH, deltaV, center, point) {
        // return world rotation vector
        // center - center of rotation
        // point - point that needs to rotate
        // returns vector (point.add(v)) is place where point needs to be
        // deltaH, deltaV - radians to make rotation
        
        var radius = center.distanceTo(point);
        if (radius == 0) return;
        var angleV = Math.asin((point.y - center.y)/radius);
        var angleH = Math.atan2((point.x - center.x),(point.z - center.z));
        angleV += deltaV;
        angleH += deltaH;
        angleV = Math.max( -Math.PI * 0.5 + 0.001, Math.min( Math.PI * 0.5 - 0.001, angleV ) );
        
        var offset = new THREE.Vector3();
        offset.x =  Math.cos( angleV ) * Math.sin( angleH );
        offset.y =  Math.sin( angleV );
		offset.z =  Math.cos( angleV ) * Math.cos( angleH );
        offset.setLength(radius);
        offset.add(center);
        
        return offset;
	};

	function onMouseDown( event ) {

		event.preventDefault();

        switch(event.button) {
            case 0: state = STATE.ROTATE; break;
            case 2: state = STATE.PAN; break;
        }
        if (state != STATE.NONE) {
        
            mouseXY.set( event.clientX, event.clientY );

            cameraposition = camera.position.clone();
            controlposition = getPoint( mouseXY, camera );
            lookatposition = THREE.Utils.cameraLookAt(camera, scope.targetDistance);
            
            element.addEventListener( 'mousemove', onMouseMove, false );
            element.addEventListener( 'mouseup', onMouseUp, false );
        }
	}

	function onMouseMove( event ) {

		event.preventDefault();

		var endXY = new THREE.Vector2( event.clientX, event.clientY );

        switch (state){
            case STATE.ROTATE:
                var deltaXY = endXY.clone().sub(mouseXY);
                var deltaH = -deltaXY.x / element.clientWidth * Math.PI * 2;
                var deltaV = deltaXY.y / element.clientHeight * Math.PI;

                var newcameraposition = scope.rotateTo( deltaH, deltaV, lookatposition, cameraposition);
                camera.position.copy( newcameraposition );
                camera.lookAt(lookatposition);
                
                break;
                
            case STATE.PAN:
                
                var v = scope.panVector(endXY, mouseXY);
                camera.position.copy( cameraposition.clone().add(v));
                camera.lookAt( lookatposition.clone().add(v));
                break;
		}
        
	}

	function onMouseUp() {

        element.removeEventListener( 'mousemove', onMouseMove, false );
		element.removeEventListener( 'mouseup', onMouseUp, false );

		state = STATE.NONE;

	}

	function onWheel( event ) {
		if ( state != STATE.NONE ) return;

        mouseXY.set( event.clientX, event.clientY );
        controlposition = getPoint( mouseXY, camera );
        lookatposition = THREE.Utils.cameraLookAt(camera, scope.targetDistance);

        printPosition('camera', camera.position);
        printPosition('control', controlposition);
        printPosition('lookat', lookatposition);

		var delta = event.deltaY;

        var direction = (delta > 0) ? -1.0 : 1.0;
        var newDist = Math.pow( 0.90, direction );

		camera.position.copy( camera.position.clone().lerp( controlposition,  1.0 - newDist ));
	}
	
	function touchstart( event ) {

		if ( scope.enabled === false ) { return; }

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate
				
				state = STATE.TOUCH_ROTATE;

                touchXY0.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                touchXY = touchXY0.clone();
                setstart();
				break;

			case 2:	// two-fingered touch: dolly
				
                state = STATE.TOUCH_MULTI;
                
                touchXY0.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                touchXY1.set( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY);
                touchXY = touchXY0.clone().lerp(touchXY1,0.5);
                setstart();
 
				break;
            
			default:
				state = STATE.NONE;
		}
        
	}
    function setstart()
    {
        cameraposition = camera.position.clone();
        controlposition = getPoint( touchXY, camera );
        lookatposition = THREE.Utils.cameraLookAt(camera, scope.targetDistance);
    }
    
	function touchmove( event ) {

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate
				if ( state !== STATE.TOUCH_ROTATE ) { return; }
                
                var endXY = new THREE.Vector2( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                
                var deltaXY = endXY.clone().sub(touchXY0);
                var deltaH = -deltaXY.x / element.clientWidth * Math.PI * 2;
                var deltaV = deltaXY.y / element.clientHeight * Math.PI;

                var newcameraposition = scope.rotateTo( deltaH, deltaV, lookatposition, cameraposition);

                camera.position.copy( newcameraposition );
                camera.lookAt(lookatposition);
                
                break;

			case 2: // two-fingered touch: dolly
                if ( state !== STATE.TOUCH_MULTI ) { return; }
                
                var endXY0 = new THREE.Vector2( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
                var endXY1 = new THREE.Vector2( event.touches[ 1 ].pageX, event.touches[ 1 ].pageY );
                var endXY = endXY0.clone().lerp(endXY1,0.5); 

                // rotate
                var angle0 = Math.atan2(touchXY0.x-touchXY1.x, touchXY0.y-touchXY1.y);
                var angle1 = Math.atan2(  endXY0.x-  endXY1.x,   endXY0.y-  endXY1.y);

                var newcameraposition = scope.rotateTo( angle0-angle1, 0, controlposition, cameraposition);
                var newlookatposition = scope.rotateTo( angle0-angle1, 0, controlposition, lookatposition);

                // pan 
                var v = scope.panVector(endXY, touchXY);
                newcameraposition.add(v);
                newlookatposition.add(v);

                // zoom
                var d0 = touchXY0.distanceTo(touchXY1); 
                var d1 = endXY0.distanceTo(endXY1);     
                newcameraposition.lerp(controlposition, 1.0 - d0/d1);
                newlookatposition.lerp(controlposition, 1.0 - d0/d1);
                
                camera.position.copy(newcameraposition);
                camera.lookAt(newlookatposition);
                
                break;

		}

	}

	function touchend( /* event */ ) {

		if ( scope.enabled === false ) { return; }

		state = STATE.NONE;
	}

	element.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	element.addEventListener( 'mousedown', onMouseDown, false );
	element.addEventListener( 'wheel', onWheel, false );

	element.addEventListener( 'touchstart', touchstart, false );
	element.addEventListener( 'touchend', touchend, false );
	element.addEventListener( 'touchmove', touchmove, false );

};

THREE.OrbitAndPanControls.prototype = Object.create( THREE.EventDispatcher.prototype );
