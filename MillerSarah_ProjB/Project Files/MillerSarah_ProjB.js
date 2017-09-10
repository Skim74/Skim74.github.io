//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex shader program
var VSHADER_SOURCE =
  'uniform mat4 u_;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
  //GLOBALS
var floatsPerVertex = 6;	// # of Float32Array elements used for each vertex (x,y,z)position + (r,g,b)color
var currentAngle = 0.0;
var projMatrix = new Matrix4();
nPetals = 9;
var ax = .5;
var starSpin = 1;
// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;
var L = -3.0, R = 3.0, B = -3.0, T = 3.0, N = 0.0, F = 10.0;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting:
	gl.enable(gl.DEPTH_TEST); 
	
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log('Failed to specify the vertex information');
    return;
  }
canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) }; //used for dragging
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)}; //used for dragging
  // Specify the color for clearing <canvas>
  gl.clearColor(0.25, 0.2, 0.25, 1.0);

  // Get the graphics system storage locations of
  // the uniform variables u_ViewMatrix and u_ProjMatrix.
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ViewMatrix || !u_ProjMatrix) { 
    console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
    return;
  }

  // Create a JavaScript matrix to specify the view transformation
  var viewMatrix = new Matrix4();
  // Register the event handler to be called on key press
 document.onkeydown= function(ev){keydown(ev, gl, u_ViewMatrix, viewMatrix); };
	
  // Create the matrix to specify the camera frustum, 
  // and pass it to the u_ProjMatrix uniform in the graphics system
  
  /*
  // REPLACE this orthographic camera matrix:
 projMatrix.setOrtho(-1.0, 1.0, 		// left,right;
  -1.0, 1.0, 					// bottom, top;
  0.0, 2000.0);					// near, far; (always >=0)
//*/
	// with this perspective-camera matrix:
	// (SEE PerspectiveView.js, Chapter 7 of book)

projMatrix.setPerspective(40, canvas.width/canvas.height, 1, 100);
	// Send this matrix to our Vertex and Fragment shaders through the
	// 'uniform' variable u_ProjMatrix:
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  
  
    
  // Model matrix
  var myViewMatrix = new Matrix4();

  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    
    draw(gl, projMatrix, u_ViewMatrix, viewMatrix, u_ProjMatrix);   // Draw the triangles
    
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax = 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = xColr[0];			// red
		gndVerts[j+4] = xColr[1];			// grn
		gndVerts[j+5] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = yColr[0];			// red
		gndVerts[j+4] = yColr[1];			// grn
		gndVerts[j+5] = yColr[2];			// blu
	}
}

function initVertexBuffers(gl) {
//==============================================================================

	// make our 'forest' of triangular-shaped trees:
  forestVerts = new Float32Array([
    // 3 Vertex coordinates (x,y,z) and 3 colors (r,g,b)
     0.0,  0.5,  -0.4,  	0.1,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  	0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  	1.0,  0.4,  0.4, 
   
     0.5,  0.4,  -0.2,  	1.0,  0.0,  1.0, // The middle yellow one
    -0.5,  0.4,  -0.2,  	1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  	1.0,  1.0,  0.4, 

     0.0,  0.5,   0.0,  	0.1,  0.7,  1.0,  // The front blue one 
    -0.5, -0.5,   0.0,  	0.0,  0.9,  1.0,
     0.5, -0.5,   0.0,  	1.0,  0.9,  0.4,
     //n = 9
     //FLOWER
     //Center
     0.0, 0.0, -0.1, 		0.0, 0.0, 0.0,		//0
     0.0, -0.3, 0.0, 		0.4, 0.2, 0.4,		//1
     -0.29, -0.09, 0.0,		0.5, 0.3, 0.2,		//2
     -0.18,0.24, 0.0, 		0.3, 0.3, 0.15,		//3
     0.18, 0.24, 0.0, 		0.4, 0.2, 0.3,		//4
     0.29, -0.09, 0.0, 		0.3, 0.2, 0.3,		//5
     0.0, -0.3, 0.0, 		0.3, 0.2, 0.1,		//6==1
     
     //Petal1
     0.2, 0.3, 0.0, 		.96, 0.23, 0.22,		//0 (n=35)
     0.07, 0.0, 0.0, 		.96, 0.23, 0.92,		//1
     0.0, 0.3, 0.0, 		.99, 0.50, 0.10,		//2
     -0.07, 0.0, 0.0, 		.96, 0.23, 0.72,		//3
     -0.2, 0.3, 0.0, 		1.0, 0.2, 0.0,		//4
     //Petal2
     0.2, 0.0, 0.0, 		.99, 0.20, 0.10,		//0 (n=40)
     0.1, 0.3, 0.0, 		0.9, 0.7, 0.2,		//1
     0.0, 0.0, 0.0, 		.99, 0.50, 0.10,		//2
     -0.1, 0.3, 0.0, 		0.9, 0.4, 0.3,		//3
     -0.2, 0.0, 0.0, 		.99, 0.20, 0.10,		//4
     //PetalTip
     0.1, 0.0, 0.0, 		0.9, 0.7, 0.2,
     0.0, 0.2, 0.0, 		0.9, 0.9, 0.0,
     -0.1, 0.0, 0.0, 		0.9, 0.4, 0.3,
     //n = 27
     
     //AXES
    0.0,  0.0,  0.0, 		1.0,  1.0,  1.0,	// X axis line (origin: gray)
    1.3,  0.0,  0.0, 		1.0,  0.0,  0.0,	//  (endpoint: red)
    
    0.0,  0.0,  0.0, 		1.3,  1.3,  1.3,	// Z axis line (origin:white)
    0.0,  0.0,  1.3, 		0.0,  0.3,  1.0,	// (endpoint: blue)
		 
    0.0,  0.0,  0.0,     	1.0,  1.0,  1.0,	// Y axis line (origin: white)
    0.0,  1.3,  0.0, 		0.0,  1.0,  0.0,	//(endpoint: green)

    


    //DIAMOND		 
    -0.1, -0.1, -0.1, 		0.7,0.6,0.5, //1 //Diamond thing lower
     0.0,   0.0,  0.0, 		0.0,0.0,0.0, //2
     0.1,  -0.1, -0.1, 		1.0,1.0,0.3, //3
     0.0,   0.1, -0.1, 		0.3,1.0,1.0, //4
     0.0,   0.0,  0.0, 		0.0,0.0,0.0, //5
     -0.1, -0.1, -0.1, 		1.0,1.0,1.0, //6
     
      -0.1, -0.1, -0.1, 	0.7,0.6,0.5, //1 //Diamond thing upper
     0.0,   0.0,  -0.20, 	1.0,1.0,1.0, //2
     0.1,  -0.1, -0.1, 		1.0,1.0,0.3, //3
     0.0,   0.1, -0.1, 		0.3,1.0,1.0, //4
     0.0,   0.0,  -0.20,	1.0,1.0,1.0, //5
     -0.1, -0.1, -0.1, 		1.0,1.0,1.0, //6
     
     //STAR
     0.0, 0.0, -0.1, 		1.0, 1.0, 1.0,		//0Cent
     0.0, -0.3, 0.0, 		1.0, 0.0, 0.0,		//PT1
     -0.1, -0.09, 0.0, 		0.3, 0.2, 0.3,		//IN1
     -0.29, -0.09, 0.0,		0.9, 0.3, 0.0,		//PT2
     -0.13, 0.05, 0.0,		0.3, 0.2, 0.3,		//IN2
     -0.18,0.24, 0.0, 		1.5, 1.3, 0.2,		//PT3
     0.0, 0.13, 0.0, 		0.3, 0.2, 0.3,		//IN3
     0.18, 0.24, 0.0, 		0.0, 0.9, 0.3,		//PT4
     0.15, 0.05, 0.0, 		0.3, 0.2, 0.3,		//IN4
     0.29, -0.09, 0.0, 		0.1, 0.2, 0.9,		//PT5
     0.1, -0.09, 0.0, 		0.3, 0.2, 0.3,		//IN5
     0.0, -0.3, 0.0, 		1.0, 0.0, 0.0,		//6==1
     
     //cube
     	// +x face: RED
     1.0, -1.0, -1.0, 		1.0, 0.0, 0.0,	// Node 3
     1.0,  1.0, -1.0, 		1.0, 0.0, 0.0,	// Node 2
     1.0,  1.0,  1.0, 	  1.0, 0.0, 0.0,  // Node 4
     
     1.0,  1.0,  1.0, 	  1.0, 0.1, 0.1,	// Node 4
     1.0, -1.0,  1.0, 	  1.0, 0.1, 0.1,	// Node 7
     1.0, -1.0, -1.0, 	  1.0, 0.1, 0.1,	// Node 3

		// +y face: GREEN
    -1.0,  1.0, -1.0, 	  0.0, 1.0, 0.0,	// Node 1
    -1.0,  1.0,  1.0, 	  0.0, 1.0, 0.0,	// Node 5
     1.0,  1.0,  1.0, 	  0.0, 1.0, 0.0,	// Node 4

     1.0,  1.0,  1.0, 	  0.1, 1.0, 0.1,	// Node 4
     1.0,  1.0, -1.0, 	  0.1, 1.0, 0.1,	// Node 2 
    -1.0,  1.0, -1.0, 	  0.1, 1.0, 0.1,	// Node 1

		// +z face: BLUE
    -1.0,  1.0,  1.0, 	  0.0, 0.0, 1.0,	// Node 5
    -1.0, -1.0,  1.0, 	  0.0, 0.0, 1.0,	// Node 6
     1.0, -1.0,  1.0, 	  0.0, 0.0, 1.0,	// Node 7

     1.0, -1.0,  1.0, 	  0.1, 0.1, 1.0,	// Node 7
     1.0,  1.0,  1.0, 	  0.1, 0.1, 1.0,	// Node 4
    -1.0,  1.0,  1.0,	  0.1, 0.1, 1.0,	// Node 5

		// -x face: CYAN
    -1.0, -1.0,  1.0, 	  0.0, 1.0, 1.0,	// Node 6	
    -1.0,  1.0,  1.0, 	  0.0, 1.0, 1.0,	// Node 5 
    -1.0,  1.0, -1.0, 	  0.0, 1.0, 1.0,	// Node 1
    
    -1.0,  1.0, -1.0, 	  0.1, 1.0, 1.0,	// Node 1
    -1.0, -1.0, -1.0, 	  0.1, 1.0, 1.0,	// Node 0  
    -1.0, -1.0,  1.0, 	  0.1, 1.0, 1.0,	// Node 6  
    
		// -y face: MAGENTA
     1.0, -1.0, -1.0, 	  1.0, 0.0, 1.0,	// Node 3
     1.0, -1.0,  1.0, 	  1.0, 0.0, 1.0,	// Node 7
    -1.0, -1.0,  1.0, 	  1.0, 0.0, 1.0,	// Node 6

    -1.0, -1.0,  1.0, 	  1.0, 0.1, 1.0,	// Node 6
    -1.0, -1.0, -1.0, 	  1.0, 0.1, 1.0,	// Node 0
     1.0, -1.0, -1.0, 	  1.0, 0.1, 1.0,	// Node 3

     // -z face: YELLOW
     1.0,  1.0, -1.0, 	  1.0, 1.0, 0.0,	// Node 2
     1.0, -1.0, -1.0, 	  1.0, 1.0, 0.0,	// Node 3
    -1.0, -1.0, -1.0, 	  1.0, 1.0, 0.0,	// Node 0		

    -1.0, -1.0, -1.0, 	  1.0, 1.0, 0.1,	// Node 0
    -1.0,  1.0, -1.0, 	  1.0, 1.0, 0.1,	// Node 1
     1.0,  1.0, -1.0, 	  1.0, 1.0, 0.1,	// Node 2
     
  ]);
  

  makeGroundGrid();

	// How much space to store all the shapes in one array?
	// (no 'var' means this is a global variable)
  mySiz = forestVerts.length + gndVerts.length;

	// How many vertices total?
  var nn = mySiz / floatsPerVertex;
    console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

	// Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	forestStart = 0;							// we store the forest first.
  for(i=0,j=0; j< forestVerts.length; i++,j++) {
  	verticesColors[i] = forestVerts[j];
		} 
	gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		verticesColors[i] = gndVerts[j];
		}

  
  // Create a vertex buffer object (VBO)
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  return mySiz/floatsPerVertex;	// return # of vertices
}

var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25;
var lookX = 0, lookY = 0, lookZ = 0;
var xAng = 0;
// Global vars for Eye position. 

// Global Variable -- default rotation angle rate (degrees/second)
var ANGLE_STEP = 10.0;

function keydown(ev, gl, u_ViewMatrix, viewMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

    if(ev.keyCode == 39) { // The right arrow key was pressed
      if (xAng>=0) {
	lookZ += (Math.sqrt(1-(Math.sin(toRadians((90-xAng)))*Math.sin(toRadians((90-xAng))))))/5;
	g_EyeZ += (Math.sqrt(1-(Math.sin(toRadians((90-xAng)))*Math.sin(toRadians((90-xAng))))))/5;
	g_EyeX += (Math.sin(toRadians((90-xAng))))/10;
	lookX += (Math.sin(toRadians((90-xAng))))/10;
	}
      else {
	var nxAng = -xAng;
	lookX += (Math.sqrt(1-(Math.sin(toRadians((nxAng)))*Math.sin(toRadians((nxAng))))))/10;
	g_EyeX += (Math.sqrt(1-(Math.sin(toRadians((nxAng)))*Math.sin(toRadians((nxAng))))))/10;
	g_EyeZ -= (Math.sin(toRadians((nxAng))))/5;
	lookZ -= (Math.sin(toRadians((nxAng))))/5;
      }
    } else 
    if (ev.keyCode == 37) { // The left arrow key was pressed
	//lookX -= 0.1;		// INCREASED for perspective camera)
	//g_EyeX -= 0.1
	lookZ += (Math.sqrt(1-(Math.sin(toRadians((90-xAng)))*Math.sin(toRadians((90-xAng))))))/5;
	g_EyeZ += (Math.sqrt(1-(Math.sin(toRadians((90-xAng)))*Math.sin(toRadians((90-xAng))))))/5;
	g_EyeX -= (Math.sin(toRadians((90-xAng))))/10;
	lookX -= (Math.sin(toRadians((90-xAng))))/10;
    }
    else 
    if (ev.keyCode == 38) { // The up arrow key was pressed
	//g_EyeZ -= 0.1;		// INCREASED for perspective camera)
	lookZ -= (Math.sqrt(1-(Math.sin(toRadians(xAng))*Math.sin(toRadians(xAng)))))/10;
	g_EyeZ -= (Math.sqrt(1-(Math.sin(toRadians(xAng))*Math.sin(toRadians(xAng)))))/10;
	g_EyeX += (Math.sin(toRadians(xAng)))/5;
	lookX += (Math.sin(toRadians(xAng)))/5;
	//console.log(xAng, g_EyeX, g_EyeZ, Math.sin(toRadians(xAng)));
	
    }
    else 
    if (ev.keyCode == 40) { // The down arrow key was pressed
	lookZ += (Math.sqrt(1-(Math.sin(toRadians(xAng))*Math.sin(toRadians(xAng)))))/10;
	g_EyeZ += (Math.sqrt(1-(Math.sin(toRadians(xAng))*Math.sin(toRadians(xAng)))))/10;
	g_EyeX -= (Math.sin(toRadians(xAng)))/5;
	lookX -= (Math.sin(toRadians(xAng)))/5;
    }
    else 
    if (ev.keyCode == 65) { // The a key was pressed
	lookX -= 0.2;		// INCREASED for perspective camera)
	xAng--;
    }
    else 
    if (ev.keyCode == 68) { // The d key was pressed
	lookX += 0.2;
	xAng++;
	//console.log(xAng, g_EyeX, g_EyeZ, Math.sin(xAng));
    }
    else 
    if (ev.keyCode == 83) { // The s key was pressed
	lookY -= 0.2;		// INCREASED for perspective camera)
	
    }
    else 
    if (ev.keyCode == 87) { // The w key was pressed
	lookY += 0.2;
    }
    else 
    if (ev.keyCode == 80) { // The p key was pressed
	nPetals++;
	ax = 0;
    }
    else 
    if (ev.keyCode == 79) { // The p key was pressed
	nPetals--;
    }
    else 
    if (ev.keyCode == 32) { // The space bar was pressed
	if (starSpin == 1) {
	  starSpin = 0;
	}
	else {
	  starSpin = 1;
	}
    }
    //Frustum
    else 
    if (ev.keyCode == 49) { // The 1 key was pressed
	L-=.03;
    }
    else 
    if (ev.keyCode == 50) { // The 2 key was pressed
	L+=.03;
    }
    else 
    if (ev.keyCode == 51) { // The 3 key was pressed
	R-=.03;
    }
    else 
    if (ev.keyCode == 52) { // The 4 key was pressed
	R+=.03;
	
    }
    else 
    if (ev.keyCode == 53) { // The 5 key was pressed
	B-=0.5;
	
    }
    else 
    if (ev.keyCode == 54) { // The 6 key was pressed
	B+=0.4;
    }
    else 
    if (ev.keyCode == 55) { // The 7 key was pressed
	T-=.04;
	
    }
    else 
    if (ev.keyCode == 56) { // The 8 key was pressed
	T+=.04;
	
    }
    else 
    if (ev.keyCode == 82) { // The R key was pressed
	N-=1;
	
    }
    if (ev.keyCode == 84) { // The T key was pressed
	N+=1;
	
    }
    else 
    if (ev.keyCode == 89) { // The Y key was pressed
	F-=1;
	
    }
    else 
    if (ev.keyCode == 85) { // The U key was pressed
	F+=1;
	
    }

    else { return; } // Prevent the unnecessary drawing
}

function draw(gl, projMatrix, u_ViewMatrix, viewMatrix, u_ProjMatrix) {
//==============================================================================
  //resize(gl);
  // Clear <canvas> color AND DEPTH buffer
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // LEFT VIEW
 gl.viewport(0, 0, gl.drawingBufferWidth/2,gl.drawingBufferHeight);
 var vpAspect = (gl.drawingBufferWidth/2) /(gl.drawingBufferHeight);// On-screen aspect ratio for// this camera: width/height.
 projMatrix.setPerspective(40, (gl.drawingBufferWidth/2)/gl.drawingBufferHeight, 1, 100);
	// Send this matrix to our Vertex and Fragment shaders through the
	// 'uniform' variable u_ProjMatrix:
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  // Set the matrix to be used for to set the camera view
  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, lookX, lookY, lookZ, 0, 1, 0);

  // Pass the view projection matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  // Draw the scene:
  drawMyScene(gl, projMatrix, u_ViewMatrix, viewMatrix, u_ProjMatrix);
	
 
  // RIGHT VIEW
  //SET VIEWPORT
  gl.viewport(gl.drawingBufferWidth/2, 0, gl.drawingBufferWidth/2,gl.drawingBufferHeight);
  vpAspect =(gl.drawingBufferWidth/2) /(gl.drawingBufferHeight);	// this camera: width/height.

   
   projMatrix.setOrtho(L, R, B, T, N, F); //LRBTNF
  

  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  
   viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, lookX, lookY, lookZ,  0, 1, 0);


  //gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements); 
  // Draw the scene:
  drawMyScene(gl, projMatrix, u_ViewMatrix, viewMatrix, u_ProjMatrix);
    
    
}

function drawMyScene(myGL, projMatrix, myu_ViewMatrix, myViewMatrix, u_ProjMatrix) {
//===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.
//DRAW AXES
pushMatrix(myViewMatrix);
myViewMatrix.translate(0.0,-0.3,0);
myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
myGL.drawArrays(myGL.LINES,29,6);
myViewMatrix = popMatrix();
  
//DRAW ABSTRACT SHAPE  
  pushMatrix(myViewMatrix);
  myViewMatrix.translate(-1.0,0.0,-2.5);
  //myViewMatrix.scale(3,3,3);
  //myViewMatrix.rotate(90,1,0,0);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
   myGL.drawArrays(myGL.TRIANGLE_STRIP, forestStart/floatsPerVertex, 9);	
  
  
  myViewMatrix = popMatrix();
  
  
  //DRAW DIAMOND THING
  pushMatrix(myViewMatrix);
  myViewMatrix.translate(-2.0,-0.5,0.5);
  myViewMatrix.scale(3,3,3);
  myViewMatrix.rotate(90,1,0,0);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP, 35, 6); //diamond1
  myGL.drawArrays(myGL.TRIANGLE_STRIP, 41, 6); //diamond2
  
  myViewMatrix = popMatrix();
  //END DIAMONDS//
  
  //DRAW STAR
   pushMatrix(myViewMatrix);
  myViewMatrix.translate(-2.0,1.0,-1.5);
  myViewMatrix.rotate(currentAngle*4*starSpin, 0,1,0);
  myViewMatrix.scale(3,3,3);
  //MOUSE DRAGG
   var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
  myViewMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
  //////
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_FAN, 47, 12); //SIDE A
  myViewMatrix.rotate(180,0,1,0);
   //myViewMatrix.rotate(-72,0,0,1);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_FAN, 47, 12); //SIDE B
  myViewMatrix = popMatrix();
  //END STAR//
  
  //CUBE STACK//
  pushMatrix(myViewMatrix);
  myViewMatrix.translate(2.0,-0.3,-3.5);
  myViewMatrix.scale(.2,.2,.2);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, 59, 36); //Box1
  
  myViewMatrix.translate(0.0,1.8,0);
  myViewMatrix.rotate(-45,0,1,0);
  myViewMatrix.scale(.8,.8,.8);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, 59, 36); //Box2
  
  myViewMatrix.translate(0.0,1.8,0);
  myViewMatrix.rotate(180,0,1,0);
  myViewMatrix.scale(.8,.8,.8);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, 59, 36); //Box3
  
  myViewMatrix.translate(0.0,1.8,0);
  myViewMatrix.rotate(35,0,1,0);
  myViewMatrix.rotate(90,1,0,0);
  
  myViewMatrix.scale(.8,.8,.8);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, 59, 36); //Box4
  myViewMatrix = popMatrix();
  //END STACK//
  
  
  
  //DRAW GRID
  pushMatrix(myViewMatrix);
   // Rotate to make a new set of 'world' drawing axes: 
 // old one had "+y points upwards", but
  myViewMatrix.rotate(-90.0, 1,0,0);	// new one has "+z points upwards",
 // made by rotating -90 deg on +x-axis.
// Move those new drawing axes to the 
 // bottom of the trees: 
	myViewMatrix.translate(0.0, 0.0, -0.6);	
	myViewMatrix.scale(0.4, 0.4,0.4);		// shrink the drawing axes //for nicer-looking ground-plane, and
  // Pass the modified view matrix to our shaders:
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  
  // Now, using these drawing axes, draw our ground plane: 
  myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  	gndStart/floatsPerVertex,	// start at this vertex number, and
  	gndVerts.length/floatsPerVertex);		// draw this many vertices
  myViewMatrix = popMatrix();
  //END GRID
  
  
 //DRAW FLOWER
 //Flower rotation speed variables
  var aSpeed1=[1, -.075, .67, .38, -.6, 1, -.075, .67, .38, -.6, .7, .33, -.087, .048, -1.0, 1, -.075, .67, .38, -.6];
  var aSpeed2=[.7, .33, -.087, .048, -1.0, 1, -.075, .67, .38, -.6, .4, -.9, .87, .058, -.7, .7, .33, -.087, .048, -1.0];
  var aSpeed3=[.4, -.9, .87, .058, -.7, .7, .33, -.087, .048, -1.0, 1, -.075, .67, .38, -.6, 1, -.075, .67, .38, -.6, .7];
  

 //CENTER OF FLOWER
  myViewMatrix.translate(5.0,0.4,-1.5);
  myViewMatrix.rotate(currentAngle*4+30,1,-1,0);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_FAN, 9, 7); //Center
  
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myViewMatrix.rotate(180,0,1,0);
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_FAN, 9, 7); //Center2
  
  
  //PETALS
  
  var j = 0
  for (var i = 0;i<nPetals;i++) {
    if (j>=19) {
      j = 0;
    }
    myViewMatrix.rotate(360/nPetals,0,0,1);
    pushMatrix(myViewMatrix);
     
    myViewMatrix.translate(0,0.20,0);
    myViewMatrix.rotate(currentAngle*aSpeed1[j],1,0,0);
  
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP, 16, 5); //petal part a
    
    myViewMatrix.translate(0,0.3,0);
    myViewMatrix.rotate(aSpeed2[j]*currentAngle,1,0,0); //middle rotation
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP, 21, 5); //petal b
    
    myViewMatrix.translate(0,0.3,0);
    myViewMatrix.rotate(aSpeed3[j]*currentAngle,1,0,0); 
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 26, 3); //petal c
    if (i == 5) {
      pushMatrix(myViewMatrix);
      myViewMatrix.scale(ax,ax,ax); 
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
      myGL.drawArrays(myGL.LINES,27,8);
      myViewMatrix = popMatrix();
    }
    

    myViewMatrix = popMatrix();
    j++;
     
  }
  

 


}

var g_last = Date.now();
function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  if(angle >   75.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle <  0.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

 function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	xMdragTot = 0.0;
	yMdragTot = 0.0;
}

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  var x = (xp - canvas.width/2)  / (canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /(canvas.height/2);
  isDrag = true;											// set our mouse-dragging flag
  xMclik = x;													// record where mouse-dragging began
  yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
  if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  var x = (xp - canvas.width/2)  /(canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /(canvas.height/2);
  xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x;													// Make next drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {

  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  var x = (xp - canvas.width/2)  /  (canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /(canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  isDrag = false;											// CLEAR our mouse-dragging flag, and
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};

function toRadians (angle) {
  return angle * (Math.PI / 180);
}