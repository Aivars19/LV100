

    function distance(p1,p2){
        return Math.sqrt( (p1.x - p2.x) * (p1.x - p2.x) +
                    (p1.y - p2.y) * (p1.y - p2.y) +
                    (p1.z - p2.z) * (p1.z - p2.z)); 
        
    }
    

    // ***************************************
    // **** HELPER                        ****
    // ***************************************
    function info(msg){
        infobox.innerHTML = msg;
        infobox.style.backgroundColor = "gray";
    }
    function warning(msg){
        infobox.innerHTML = msg;
        infobox.style.backgroundColor = "orange";
    }
    
	function infot(msg){
        if (!this.start) this.start = new Date().getTime();
        var now = new Date().getTime();
        console.log("LOG: " + msg + " ... " + (now - this.start) + " ms ");
        this.start = now;
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        //camera.position.set(-400,200,200);
        camera.lookAt(new THREE.Vector3(0,0,0));
        camera.updateProjectionMatrix();
        
        renderer.setSize( window.innerWidth, window.innerHeight );
        render();
    }
    window.addEventListener('resize', onWindowResize);

    function animate() {
        requestAnimationFrame( animate );
        controls.update();
    }
    function render() {
        renderer.render( scene, camera );
    }
    
    function init() { 
        
        camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 500 );
        camera.position.set(0,50,-50);
        camera.lookAt(new THREE.Vector3(0,0,0));
        
        renderer = new THREE.WebGLRenderer( { antialias: true } ); 
        renderer.setPixelRatio( window.devicePixelRatio ); 
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.getElementById( 'container' ).appendChild( renderer.domElement );
        
        // SCENE INIT
        scene = new THREE.Scene();

        // CONTROLS
        controls = new THREE.OrbitAndPanControls(camera, renderer.domElement, scene);
		
		controls.addEventListener( 'change', render );
        controls.minDistance = 5.0;
        controls.maxDistance = 50.0;
        
        //scene.add( new THREE.HemisphereLight( 0xffffff, 0xffffff, 1.0 ));
        
        makeWhiteBall();
        //makeControlPlane();

        onWindowResize();
		setTimeout(drawCells, 500);
    }

    function makeWhiteBall(){
        // this adds octahedrongeometry in midlle position (just to know that graph is there even if you see nothing)
        scene.add(new THREE.Mesh(
            new THREE.OctahedronGeometry(0.5,2),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, wireframe: true, opacity: 0.3 })));
    }
    function makeControlPlane(){
        // this allows to see graph 
        var planeMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(100,100,30,30),
            new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, wireframe: true, opacity: 0.3 }));
        planeMesh.rotation.x = Math.PI / 2;
        scene.add(planeMesh);
        controls.world = planeMesh;
    }


    // ***************************************
    // **** ACTION                      ******
    // ***************************************
    
    
    // ***************************************
    // **** STEP 2 DRAWING              ******
    // ***************************************
    
    var camera, scene, sceneaisles, renderer, stats;
    var controls;
    var projector;
    //var cells = new THREE.Object3D(); // for ray tracing
    var fillMeshes = [];
    var transportMeshes = [];
                 
    init();
    render();
    animate();

    warning("load data...");
    
    // DATA PROCESSOR
	function drawCells()
	{
		if (!this.cnt) this.cnt = 0;
		this.cnt++;
		if (!celldata.ready) {
			infot("Data not loaded yet ");
			
			if (this.cnt > 2) throw "NO DATA ARRIVED";
			setTimeout(drawCells, 1000);
			
			return;
		}
		
		buildBoxBuffer();
		drawBox();
		need_render = true;
		render();
	}

    
    Object.size = function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
    };
    
    function makePlane(bufarr, elem, x,y,z, sizex, sizey, sizez){
        // insert into buffer 2 triangles, 3 vertices, xyz, total 18 coordinates
        // makePlane2(bufarr, elem, x, y+sizey, z, x,y,z, x+sizex, y+sizey, z+sizez);
        makePlane3(bufarr, elem * 18, [x, y+sizey, z], [x,y,z], [x+sizex, y+sizey, z+sizez]);
    }

    function makePlane3(bufarr, elem, v0, v1, v2){
        // insert into buffer 2 triangles, 3 vertices, xyz, total 18 coordinates, 
        // .. when given one triangle 0,1,2 vertices. vertice is 3-element array [x,y,z
        for (var dim = 0; dim<3; dim++)
        {
            bufarr[elem + 0 + 0 + dim ] = v0[dim];
            bufarr[elem + 0 + 3 + dim ] = v1[dim];
            bufarr[elem + 0 + 6 + dim ] = v2[dim];
            bufarr[elem + 9 + 0 + dim ] = v1[dim];
            bufarr[elem + 9 + 3 + dim ] = v0[dim]+((v1[dim]+v2[dim])/2-v0[dim])*2;
            bufarr[elem + 9 + 6 + dim ] = v2[dim];
        }
    }    

    function makeCube(bufarr, elem, pos, size){
        // pos and size are array [x,y,z] type
        
        // cube has 8 vertices !
        // coordinate for vertice
        //      (v >> d) & 1 ... is this dim "on" of "off". 
        // 
        //        6 -- 7
        //     z  | 2 -- 3
        //      \ 4 |  5 |
        //          0 -- 1   ->x
        function getv(v) {
            return [
                pos[0] + size[0] * ( (v>>0) & 1 ),
                pos[1] + size[1] * ( (v>>1) & 1 ),
                pos[2] + size[2] * ( (v>>2) & 1 )
                ];
        }
        makePlane3(bufarr, elem + 18 * 0, getv(3), getv(1), getv(2));
        makePlane3(bufarr, elem + 18 * 1, getv(7), getv(5), getv(3));
        makePlane3(bufarr, elem + 18 * 2, getv(6), getv(4), getv(7));
        makePlane3(bufarr, elem + 18 * 3, getv(2), getv(0), getv(6));
        makePlane3(bufarr, elem + 18 * 4, getv(3), getv(2), getv(7));
        makePlane3(bufarr, elem + 18 * 5, getv(0), getv(1), getv(4));
    }    
    
    // box filler making
    var boxbuff = new THREE.BufferGeometry(); // holds all boxes during session (draw once)
                                              // each triangle has 9 entries. 
                                              // each cube has 108 entries. 
                                              // locationindex * 108 is buffer index
    var boxmesh = null;
    
    function buildBoxBuffer() {
        var i = 0; 
        var N = Object.size(celldata);
        var vertices = new Float32Array(N * 108); // 108 entries per cube
		
		var xycoef = 100.0 / (celldata.MAXX - celldata.MINX); // aim to have 100 units wide graph
		var vcoef = 20.0 / (celldata.MAXV - celldata.MINV); // aim to have 50 units hi graph
		
		celldata.forEach( function(cell, i) {
            var size = [xycoef, cell.v * vcoef, xycoef];
            var pos = [-xycoef * (cell.x - celldata.MINX), 0.0, + xycoef * (cell.y - celldata.MINY)];
            cell.num = i;
			makeCube(vertices, cell.num * 108, pos, size);
		});
        boxbuff.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) ); 
    }
	    
    function drawBox() {
		
        var N = celldata.length;

        if (boxmesh) scene.remove(boxmesh);
        
        // CREATE KEYS. based on COLORBY selection 
        var contentkeysdict = {}; // these are unique coloring keys
		celldata.forEach(cell => contentkeysdict[cell.v] = 1);
        
        var contentkeysarr = [];
        for (var k in contentkeysdict) contentkeysarr.push(k);
        
        contentkeysarr.sort( function(a,b){ 
            var fa = parseFloat(a);
            var fb = parseFloat(b);
            if (fa-fb != 0) return fa-fb;
            if (a>b) return 1; 
            if (a<b) return -1; 
            return 0;}); 
        for (var i = 0; i< contentkeysarr.length; i++) contentkeysdict[contentkeysarr[i]] = i;

        var mat = makeBoxMaterial(contentkeysarr);

        // PRINT TEXTURE TEST CHART
        //var mat = makeBoxMaterial(['a', 'b', 'sdfsdf', 'asdfsdf', 'āsdf']);
        //var testGeo = new THREE.PlaneGeometry(40,40);
        //scene.add(new THREE.Mesh(testGeo, mat));

        var uvs = new Float32Array(N * 72);  // two triangles, 3 vertices, xy for each vertice
        celldata.forEach(cell => 
        {
            mat.getUVS12(uvs, cell.num * 72, contentkeysdict[cell.v]);
		});
		
        boxbuff.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );        

		var material = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true
		});

        boxmesh = new THREE.Mesh( boxbuff, mat );
        boxmesh.position.x += 50;
        boxmesh.position.z -= 50;
        scene.add(boxmesh);
    }
    

    function makeBoxMaterial(arr) {
        // returns tiled texture to use with mesh
        // function .getUVS('key') returns array size 12 with triangle coordinates for tile. 
        
        var N = arr.length;
        var X = parseInt(Math.sqrt(N))+1;
        var sizex = 128; 
        var sizey = 128;
        if (X > 32) { sizex = 64; sizey = 64; };
        var bgcolor = '#8f8';
        var color = '#000';
        infot('box started ');
        var canvas1 = document.createElement('canvas');
        canvas1.height = sizey * X;
        canvas1.width = sizex * X;
        
        var context1 = canvas1.getContext('2d');
        context1.textAlign = 'left';

        //context1.fillStyle = '#DDD';
        //context1.fillRect(0, 0, canvas1.width, canvas1.height);

        // LOOP 2 - FILLER RECTANGLES
        for (var i = 0; i<arr.length; i++){
            var posx = i % X;
            var posy = i / X | 0;
            
            if (arr[i]==0 
                || arr[i]=="" 
                || arr[i]=="#N/A") 
            {
                context1.fillStyle = "hsla(0, 0%, 70%, 0.7)";
                context1.fillRect(sizex * posx + 0, sizey * posy + 0, sizex, sizey);
                continue; // no background if this is empty value. 
                
            }


            context1.fillStyle = '#DDD';
            context1.fillRect(sizex * posx + 0, sizey * posy + 0, sizex, sizey);
            //context1.fillRect(0, 0, canvas1.width, canvas1.height);

            context1.fillStyle = getHSL(arr,i);
            context1.fillRect(sizex * posx + 2, sizey * posy + 2, sizex-4, sizey-4);
        }
        // LOOP 3 -- TEXT
        context1.fillStyle = color;
        
        for (var i = 0; i<arr.length; i++){
            var posx = i % X;
            var posy = i / X | 0;
            var font = sizex / 4;
            context1.font = "Bold "+font+"px Verdana";
            //context1.fillText("", sizex * posx + 2, sizey * posy + sizey - 4 ); // colorby

            var actw = context1.measureText(arr[i]).width;
            if (actw > sizey - 2) font = font / actw * (sizey - 2);
            if (font > 8) {
                context1.font = "Bold "+font+"px Verdana";
                context1.fillText(arr[i], sizex * posx + 2, sizey * posy + font);
            } else {
                font = 8;
                context1.font = "Bold "+font+"px Verdana";
                wrapText(context1,arr[i],sizex * posx + 2, sizey * posy + font,sizey,font*1.5);
            }

        }        var texture1 = new THREE.Texture(canvas1); 
        texture1.anisotropy = 8;
        texture1.needsUpdate = true;
        var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide, transparent: true } );

        material1.getUVS12 = function (uvs, start, idx) {
            // adds 12 entries for the requested tile with idx. (triangles for plane skin)
            // uvs - float32array for buffer mesh
            // start - position in array where to start (12 entries, 6 times)
            // idx - tile index, corresponds to arr position
            var posx = idx % X;
            var posy = idx / X | 0;
            var uvs12 = [
                (posx + 0) / X  ,  1.0-  (posy + 0) / X, // 3
                (posx + 0) / X  ,  1.0-  (posy + 1) / X, // 0
                (posx + 1) / X  ,  1.0-  (posy + 0) / X, // 2
                
                (posx + 0) / X  ,  1.0-  (posy + 1) / X, // 0
                (posx + 1) / X  ,  1.0-  (posy + 1) / X, // 1
                (posx + 1) / X  ,  1.0-  (posy + 0) / X, // 2
            ];
            for (var p = 0; p<6; p++)
            for (var i = 0; i<uvs12.length; i++)
            {
                uvs[start+p*12+i] = uvs12[i];
            }
        }
        var PRINT_TEST_CHART = 0; // turn on or off texture "test chart" printing 
        if (!this.testchart_z) this.testchart_z = 0;
        if (PRINT_TEST_CHART)
        {
            this.testchart_z += 25;
            var testchart_mesh = new THREE.Mesh(new THREE.PlaneGeometry(40,40), material1);
            testchart_mesh.position.z = this.testchart_z;
            scene.add(testchart_mesh);
        }
        return material1;
    }
    
    
    function getHSL(contentkeys, i){
        var hue = 1.0 * i / contentkeys.length;
        var light = 50.0;
        var isproportional = true;
        if (isproportional)
        {
            // light-based coloring, proportional to value
            hue = 0.3; // green - human eye most sensitive to shades of green
            if ((contentkeys[contentkeys.length-2] - contentkeys[1]) > 0)
                light = 10 + 60.0 * (contentkeys[i] - contentkeys[1]) / (contentkeys[contentkeys.length-2] - contentkeys[1]);
            if (light < 10) light = 10;
            hue = 0.5 - (0.4 * light / 100);
        }
        else // hue based coloring, just rainbow
        {
            if ((contentkeys[contentkeys.length-2] - contentkeys[1]) > 0)
                hue = 0.7 - 0.7 * (contentkeys[i] - contentkeys[1]) / (contentkeys[contentkeys.length-2] - contentkeys[1]);
        }
        
        return "hsl(" + Math.round(360.0 * hue * 10 )/10 + ", 50%, "+light+"%)";
    }
